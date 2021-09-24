const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const expressPlayground = require('graphql-playground-middleware-express').default;
const express = require('express');
const http = require('http');
const { readFileSync } = require('fs');
const { PubSub } = require('graphql-subscriptions');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { makeExecutableSchema } = require("@graphql-tools/schema");

const typeDefs = readFileSync('./typeDefs.graphql', 'utf8');
const resolvers = require('./resolvers');

const { MongoClient } = require('mongodb');
require('dotenv').config();

// 동기처리 함수를 거치지 않을 시
// You must `await server.start()` before calling `server.applyMiddleware()`
// 에러가 발생하므로 순차적으로 처리해야함
(async function startApolloServer() {
    // 익스프레스 앱 생성
    const app = express();
    // httpServer로 app 다시 생성
    const httpServer = http.createServer(app);
    // 데이터베이스 인스턴스 생성
    const MONGO_DB = process.env.DB_HOST;

    // subscription 엔진 생성
    const pubsub = new PubSub();

    // 몽고디비 클라이언트 인스턴스 생성
    const client = await MongoClient.connect(
        MONGO_DB,
        { useNewUrlParser: true, useUnifiedTopology: true }
    );
    const db = client.db();

    // 스키마 정보 합치기
    const schema = makeExecutableSchema({ typeDefs, resolvers });

    // 아폴로 서버 생성자에 타입정의, 리졸버, 컨텍스트(모든 요청에 들어가는 인자)를
    // 전달해서 서버 인스턴스 생성.
    const server = new ApolloServer({
        schema,
        // 컨텍스트 : 모든 요청에 들어가는 인자 ex) db정보, subscription 엔진 등
        context: async ({ req, connection }) => {
            const githubToken = req ? req.headers.authorization : connection.context.Authorization;
            const currentUser = await db.collection('users').findOne({ githubToken });
            return { db, currentUser, pubsub };
        },
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            subscriptionServer.close();
                        }
                    };
                }
            }
        ],
    });

    // 홈 라우트 생성
    app.get('/', (req, res) => res.end('Welcome to PhotoShare API'));
    app.get('/playground', expressPlayground({endpoint: '/graphql'}));

    // 서버구동
    await server.start();

    // 미들웨어가 같은 경로에 마운트되도록 한다.
    server.applyMiddleware({
        app,
        paht: '/'
    });

    const subscriptionServer = SubscriptionServer.create(
        { schema, execute, subscribe },
        { server: httpServer, path: server.graphqlPath }
    );

    // 서버 구동 수정
    await new Promise(resolve => httpServer.listen({ port: 4000 }, resolve));
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
})();