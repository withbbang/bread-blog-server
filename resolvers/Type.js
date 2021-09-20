const { GraphQLScalarType } = require('graphql');
const metaData = require('../metaData');

module.exports = {
    Photo: {
        url: parent => 'http://www.newsthevoice.com/news/photo/202009/14648_15275_4946.jpg',
        postedBy: parent => {
            return metaData.users.find(u => u.githubLogin === parent.githubUser)
        },
        taggedUsers: parent => metaData.tags
                                .filter(tag => tag.photoID === parent.id)
                                .map(tag => tag.userID)
                                .map(userID => metaData.users.find(u => u.githubLogin === userID))
    },
    User: {
        postedPhotos: parent => {
            return metaData.photos.filter(p => p.githubUser === parent.githubLogin)
        },
        inPhotos: parent => metaData.tags
                                .filter(tag => tag.userID === parent.id)
                                .map(tag => tag.photoID)
                                .map(photoID => metaData.photos.find(p => p.id === photoID))
    },
    DateTime: new GraphQLScalarType({
        name: 'DateTime',
        description: 'A valid date time value.',
        parseValue: value => new Date(value),
        serialize: value => new Date(value).toISOString(),
        parseLiteral: ast => ast.value
    })
}