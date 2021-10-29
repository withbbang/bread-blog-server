module.exports = {
  newPhoto: {
    subscribe: (parent, args, { pubsub }) =>
      pubsub.asyncIterator("photo-added"),
  },
  newUser: {
    subscribe: (parent, args, { currentUser, pubsub }) =>
      pubsub.asyncIterator("user-added"),
  },
  test: {
    subscribe: (parent, args, { currentUser, pubsub }) =>
      // "test"라는 이름의 이벤트 대기
      pubsub.asyncIterator("test"),
  },
};
