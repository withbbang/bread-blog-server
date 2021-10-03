module.exports = {
  newPhoto: {
    subscribe: (parent, args, { pubsub }) => pubsub.asyncIterator("photo-added"),
  },
  newUser: {
    subscribe: (parent, args, { currentUser, pubsub }) => pubsub.asyncIterator("user-added"),
  },
  test: {
    subscribe: (parent, args, { currentUser, pubsub }) => pubsub.asyncIterator("test"),
  },
};
