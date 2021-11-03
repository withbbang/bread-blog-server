const { sendKakao } = require("../kakao");

module.exports = {
  totalPhotos: async (parent, args, { db }) =>
    await db.collection("photos").estimatedDocumentCount(),
  allPhotos: async (parent, args, { db }) =>
    await db.collection("photos").find().toArray(),
  totalUsers: async (parent, args, { db }) =>
    await db.collection("users").estimatedDocumentCount(),
  allUsers: async (parent, args, { db }) =>
    await db.collection("users").find().toArray(),
  me: (parent, args, { currentUser, pubsub }) => {
    // subscribe 호출 publish 첫번째 인자값으로 이벤트 함수명, 두번째 인자값으로 콜백함수
    pubsub.publish("test", {
      test: async () => {
        await sendKakao();
        return "test";
      },
    });
    return currentUser;
  },
  test: (parent, args, { db, pubsub }) => {
    pubsub.publish("test", {
      test: "test",
    });
    return "test";
  },
};
