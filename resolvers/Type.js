const { GraphQLScalarType } = require("graphql");
const metaData = require("../metaData");

// 하위는 타입에 정의되어 있는 필드 중 특별히 걸러야하는 부분을 함수로 거침
// parent 인자값은 여기 Type으로 재지정된 곳만 가질 수 있다. 다른 기본 쿼리(Query, Mutation, Subscription)은 undefined
// parent 인자값은 해당 함수를 품고 있는 객체를 가리킴. ex) postedBy 함수의 parent 인자값은 Photo을 가리킨다.
module.exports = {
  Photo: {
    id: (parent) => parent.id || parent._id,
    url: (parent) => "http://www.newsthevoice.com/news/photo/202009/14648_15275_4946.jpg",
    postedBy: (parent, args, { db }) => db.collection("users").findOne({ githubLogin: parent.userID }),
    // taggedUsers: parent => metaData.tags
    //     .filter(tag => tag.photoID === parent.id)
    //     .map(tag => tag.userID)
    //     .map(userID => metaData.users.find(u => u.githubLogin === userID))
  },
  User: {
    postedPhotos: (parent) => {
      return metaData.photos.filter((p) => p.githubUser === parent.githubLogin);
    },
    inPhotos: (parent) =>
      metaData.tags
        .filter((tag) => tag.userID === parent.id)
        .map((tag) => tag.photoID)
        .map((photoID) => metaData.photos.find((p) => p.id === photoID)),
  },
  DateTime: new GraphQLScalarType({
    name: "DateTime",
    description: "A valid date time value.",
    parseValue: (value) => new Date(value),
    serialize: (value) => new Date(value).toISOString(),
    parseLiteral: (ast) => ast.value,
  }),
};
