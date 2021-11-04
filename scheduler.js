const { ObjectId } = require("bson");
const cron = require("node-cron");

const initTodayVisitor = (db) =>
  cron.schedule("0 0 0 * * *", async () => {
    const _id = ObjectId("61828d63ddc15fe451b47b91");
    await db.collection("visitors").updateOne(
      { _id },
      {
        $set: { todayCount: 0 },
      },
    );
  }).start;

module.exports = {
  initTodayVisitor,
};
