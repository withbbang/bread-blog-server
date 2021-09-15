const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const expressPlayground = require('graphql-playground-middleware-express').default;
const express = require('express');
const http = require('http');

const { GraphQLScalarType } = require('graphql');

// 메타 데이터. -> 디비 생성 전 임시 데이터.
let _id = 0;
let photos = [
    {
        id: '0',
        name: 'fucking shit',
        description: 'fucking shit like love',
        category: 'ACTION',
        githubUser: 'Bread',
        created: "3-28-1977"
    },
    {
        id: '1',
        name: 'fucking bitch',
        description: 'fucking bitch like love',
        category: 'SELFIE',
        githubUser: 'Youngsun',
        created: "1-2-1985"
    },
    {
        id: '2',
        name: 'fucking sucking',
        description: 'fucking sucking like love',
        category: 'LANDSCAPE',
        githubUser: 'Youngsun',
        created: "2018-04-15T19:09:57.308Z"
    }
];
let users = [
    {
        githubLogin: 'Bread',
        name: 'Bread Kim'
    },
    {
        githubLogin: 'Youngsun',
        name: 'Youngsun Kim'
    },
    {
        githubLogin: 'KYS',
        name: 'Kim Young sun'
    }
];
let tags = [
    {photoID: '1', userID: 'Bread'},
    {photoID: '2', userID: 'Youngsun'},
    {photoID: '2', userID: 'KYS'},
    {photoID: '2', userID: 'Bread'}
]

const typeDefs = `
    scalar DateTime
    enum PhotoCategory{
        SELFIE
        PORTRAIT
        ACTION
        LANDSCAPE
        GRAPHIC
    }

    type User{
        githubLogin: ID!
        name: String
        avatar: String
        postedPhotos: [Photo!]!
        inPhotos: [Photo!]!
    }

    type Photo{
        id: ID!
        url: String!
        name: String!
        description: String
        category: PhotoCategory!
        postedBy: User!
        taggedUsers: [User!]!
        created: DateTime!
    }

    input PostPhotoInput{
        name: String!
        category: PhotoCategory = PORTRAIT
        description: String
    }

    type Query{
        totalPhotos: Int!
        allPhotos: [Photo!]!
        allUsers: [User!]!
    }

    type Mutation{
        postPhoto(input: PostPhotoInput!): Photo!
    }
`

// 리졸버
// 0) 실제 데이터를 가공해서 보내주는 객체.
// 1) 루트쿼리 Query, Mutation, Subscription 내부는 쿼리에 대한 반환값들을 함수 실행문으로 정의.
// 2) 타입정의 내부 필드들은 특별히 따로 함수 실행문으로 리턴할 수 있다. ex) Photo 타입의 url 필드.
// 3) parent 인자값은 해당 함수를 품고 있는 객체를 가리킴. ex) postPhoto 함수의 parent 인자값은 Mutation을 가리킨다.
const resolvers = {
    Query: {
        totalPhotos: () => photos.length,
        allPhotos: () => photos,
        allUsers: () => users
    },
    Mutation: {
        postPhoto(parent, args){
            let newPhoto = {
                id: _id++,
                ...args.input,
                created: new Date()
            }
            photos.push(newPhoto)
            return newPhoto
        }
    },
    Photo: {
        url: parent => 'http://www.newsthevoice.com/news/photo/202009/14648_15275_4946.jpg',
        postedBy: parent => {
            return users.find(u => u.githubLogin === parent.githubUser)
        },
        taggedUsers: parent => tags
                                .filter(tag => tag.photoID === parent.id)
                                .map(tag => tag.userID)
                                .map(userID => users.find(u => u.githubLogin === userID))
    },
    User: {
        postedPhotos: parent => {
            return photos.filter(p => p.githubUser === parent.githubLogin)
        },
        inPhotos: parent => tags
                                .filter(tag => tag.userID === parent.id)
                                .map(tag => tag.photoID)
                                .map(photoID => photos.find(p => p.id === photoID))
    },
    DateTime: new GraphQLScalarType({
        name: 'DateTime',
        description: 'A valid date time value.',
        parseValue: value => new Date(value),
        serialize: value => new Date(value).toISOString(),
        parseLiteral: ast => ast.value
    })
}

// 동기처리 함수를 거치지 않을 시
// You must `await server.start()` before calling `server.applyMiddleware()`
// 에러가 발생하므로 순차적으로 처리해야함
async function startApolloServer() {
    // 3. 익스프레스 앱 생성
    const app = express();
    // 3-1. httpServer로 app 다시 생성
    const httpServer = http.createServer(app);

    // 4. 아폴로 서버 생성자에 타입정의, 리졸버를 전달해서 서버 인스턴스 생성.
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    })

    // 5. 홈 라우트 생성
    app.get('/', (req, res) => res.end('Welcome to PhotoShare API'));
    app.get('/playground', expressPlayground({endpoint: '/graphql'}));

    // 6. 서버구동
    await server.start();

    // 7. 미들웨어가 같은 경로에 마운트되도록 한다.
    server.applyMiddleware({
        app,
        paht: '/'
    });

    // 8. 서버 구동 수정
    await new Promise(resolve => httpServer.listen({ port: 4000 }, resolve));
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

startApolloServer();