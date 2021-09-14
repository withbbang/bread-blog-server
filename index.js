const { ApolloServer } = require('apollo-server');

const typeDefs = `
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
    }

    type Photo{
        id: ID!
        url: String!
        name: String!
        description: String
        category: PhotoCategory!
        postedBy: User!
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

let _id = 0;
let photos = [
    {
        id: '0',
        name: 'fucking shit',
        description: 'fucking shit like love',
        category: 'ACTION',
        githubUser: 'Bread'
    },
    {
        id: '1',
        name: 'fucking bitch',
        description: 'fucking bitch like love',
        category: 'SELFIE',
        githubUser: 'Youngsun'
    },
    {
        id: '2',
        name: 'fucking sucking',
        description: 'fucking sucking like love',
        category: 'LANDSCAPE',
        githubUser: 'Youngsun'
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
]

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
                ...args.input
            }
            photos.push(newPhoto)
            return newPhoto
        }
    },
    Photo: {
        url: parent => 'http://www.newsthevoice.com/news/photo/202009/14648_15275_4946.jpg',
        postedBy: parent => {
            return users.find(u => u.githubLogin === parent.githubUser)
        }
    },
    User: {
        postedPhotos: parent => {
            return photos.filter(p => p.githubUser === parent.githubLogin)
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers
})

server
    .listen()
    .then(({url}) => console.log(`GraphQL Service running on ${url}`))