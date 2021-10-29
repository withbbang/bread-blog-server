const { sendKakao } = require("../kakao");

module.exports = {
  totalPhotos: (parent, args, { db }) =>
    db.collection("photos").estimatedDocumentCount(),
  allPhotos: (parent, args, { db }) => db.collection("photos").find().toArray(),
  totalUsers: (parent, args, { db }) =>
    db.collection("users").estimatedDocumentCount(),
  allUsers: (parent, args, { db }) => db.collection("users").find().toArray(),
  me: (parent, args, { currentUser, pubsub }) => {
    // subscribe 호출 publish 첫번째 인자값으로 이벤트 함수명, 두번째 인자값으로 콜백함수
    pubsub.publish("test", {
      test: async () => {
        console.log("visited?");
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
