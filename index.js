const { ApolloServer } = require("apollo-server-express");
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core");
const expressPlayground =
  require("graphql-playground-middleware-express").default;
const express = require("express");
const https = require("https");
const cors = require("cors");
const { readFileSync } = require("fs");
const { PubSub } = require("graphql-subscriptions");
const { execute, subscribe } = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { createComplexityLimitRule } = require("graphql-validation-complexity");
const { graphqlUploadExpress } = require("graphql-upload");
const cookieParser = require("cookie-parser");
const path = require("path");

const { decodeToken } = require("./lib");
const { initTodayVisitor } = require("./scheduler");
const typeDefs = readFileSync("./typeDefs.graphql", "utf8");
const resolvers = require("./resolvers");

const { MongoClient } = require("mongodb");
const env = require("./env");
const port = 4000;

// 동기처리 함수를 거치지 않을 시
// You must `await server.start()` before calling `server.applyMiddleware()`
// 에러가 발생하므로 순차적으로 처리해야함
(async function startApolloServer() {
  const corsOption = {
    /**
     * cors 통신 할 때 쿠키가 전달될 수 있도록 설정하는 옵션값들
     * 응답 헤더의 Access-Control-Allow-Origin 값을 *로의 설정을 막고
     * 특정 주소로 설정함에 따라 통신도 하고 cookie 전달도 할 수 있게 함
     */
    origin:
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://withbbang.github.io",
    credentials: true,
  };

  // 익스프레스 앱 생성
  const app = express();

  app.use(graphqlUploadExpress());
  app.use(cookieParser());
  app.use(cors(corsOption));

  // httpServer로 app 다시 생성
  const httpServer = https.createServer(app);

  // 몽고디비 호스트 정보
  const MONGO_DB = process.env.DB_HOST;

  // subscription 엔진 생성
  const pubsub = new PubSub();

  // 몽고디비 클라이언트 인스턴스 생성
  const client = await MongoClient.connect(MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db();

  // 오늘 방문자수 초기화
  initTodayVisitor(db);

  // 스키마 정보 합치기
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // 아폴로 서버 생성자에 타입정의, 리졸버, 컨텍스트(모든 요청에 들어가는 인자)를
  // 전달해서 서버 인스턴스 생성.
  const server = new ApolloServer({
    schema,
    validationRules: [
      // 쿼리 코스트 계산 함수 -> 첫번째 인자값은 최대 쿼리 코스트 제한. 초과하면 에러.
      createComplexityLimitRule(100000, {
        onCost: (cost) => console.log("query cost: ", cost),
      }),
    ],
    // 컨텍스트 : 모든 요청에 들어가는 인자 ex) db정보, subscription 엔진 등
    context: async ({ req, connection }) => {
      console.log(req);
      const token = req
        ? req.headers.authorization
        : connection.context.Authorization;
      const cookies = req.cookies && req.cookies;
      if (token !== "null" && token) {
        const currentUser = await db
          .collection("users")
          .findOne(decodeToken(token));
        return { db, currentUser, cookies, pubsub };
      } else return { db, cookies, pubsub };
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
  });

  // 홈 라우트 생성
  app.get("/", (req, res) => res.end("Welcome to Bread-Blog API"));
  app.get("/playground", expressPlayground({ endpoint: "/graphql" }));

  // 서버구동
  await server.start();

  // 미들웨어가 같은 경로에 마운트되도록 한다.
  server.applyMiddleware({
    app,
    path: "/graphql",
    cors: corsOption,
  });

  // app.use(
  //   "/img/photos",
  //   express.static(path.join(__dirname, "assets", "photos")),
  // );

  // ws용 subscription server 인스턴스 생성
  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      // ***************매우 중요***************
      // http 요청과 ws 요청은 다르게 동작하므로
      // ws요청 context는 onConnect에서 전달해야한다!!
      async onConnect(connectionParams, WebSocket, ConnectionContext) {
        // Apollo docs 확인하고 ws를 통해 auth 전달하는 법 구현
        if (connectionParams.authorization) {
          const currentUser = await db
            .collection("users")
            .findOne(decodeToken(connectionParams.authorization));
          return { currentUser, pubsub };
        } else {
          return { pubsub };
        }
      },
    },
    { server: httpServer },
    // path를 추가할 경우 ws 요청이 www.domain.com/path 로 감
    // { server: httpServer, path: server.graphqlPath },
  );

  // 서버 구동 수정
  await new Promise((resolve) =>
    httpServer.listen(
      { port: process.env.PORT || port, cors: corsOption },
      resolve,
    ),
  );
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
})();
