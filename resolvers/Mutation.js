const {
  authorizeWithGithub,
  uploadS3,
  deleteS3,
  sendMail,
  generateSecret,
  generateAccessToken,
  generateRefreshToken,
} = require("../lib");
const fetch = require("node-fetch");
const { confirmRequest } = require("../middleware/confirmRequest");
const path = require("path");
const { ObjectId } = require("bson");

module.exports = {
  async testRequest(parent, args, { currentUser, db, pubsub }) {
    try {
      const { name } = currentUser;
      return `confirmRequest works well. result is ${name}`;
    } catch (err) {
      console.log(err);
      return err;
    }
  },

  async createUser(parent, args, { db, pubsub }) {
    try {
      const {
        input: { email, name },
      } = args;
      const user = await db.collection("users").findOne({ email });

      if (user) throw new Error(`Already Exists ${email} User!`);

      const _user = {
        email,
        name,
        isAdmin: "N",
        created: new Date(),
      };

      await db.collection("users").insertOne(_user);

      return _user;
    } catch (err) {
      console.log(err);
      return err;
    }
  },

  async tempDeleteUser(parent, args, { db, pubsub }) {
    try {
      const { email } = args;

      const user = await db.collection("users").findOne({ email });

      if (!user) throw new Error(`Can't not find ${email} User`);

      const { deletedCount } = await db
        .collection("users")
        .deleteOne({ email });

      return deletedCount;
    } catch (err) {
      console.log(err);
      return err;
    }
  },

  async tempUpdateUser(parent, args, { db, pubsub }) {
    try {
      const {
        input: { id, avatar },
      } = args;
      const _id = ObjectId(id);
      const result = await db
        .collection("users")
        .updateOne({ _id }, { $set: { isAdmin: "Y", avatar } });

      return result.modifiedCount;
    } catch (err) {
      console.log(err);
      return err;
    }
  },

  async requestLogin(parent, args, { db, pubsub }) {
    try {
      const { email } = args;
      const user = await db.collection("users").findOne({ email });

      if (!user) throw new Error(`Can't Find ${email} User`);

      const secretWord = generateSecret();
      await db
        .collection("users")
        .updateOne({ email }, { $set: { loginSecret: secretWord } });

      await sendMail(email, secretWord);

      return {
        name: user.name,
        email,
        avatar: user.avatar,
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  },

  async confirmLogin(parent, args, { db, pubsub }) {
    try {
      const {
        input: { email, secretWord },
      } = args;
      const user = await db.collection("users").findOne({ email });

      console.log(user._id);
      const token = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      if (user.loginSecret === secretWord) {
        await db
          .collection("users")
          .updateOne({ email }, { $set: { loginSecret: "" } });
        return {
          token,
          refreshToken,
        };
      } else {
        throw new Error("Wrong Secret Words");
      }
    } catch (err) {
      console.log(err);
      return err;
    }
  },

  async postPhoto(parent, args, { db, currentUser, pubsub }) {
    try {
      // 1. 컨텍스트에 사용자가 존재하지 않으면 에러
      if (!currentUser)
        throw new Error("Only an authorized user can post a photo");

      const { name, category, description } = args.input;
      const { filename, createReadStream } = await args.input.file;
      const ext = path.extname(filename);
      const stream = createReadStream();

      const fileName = `${Date.now()}_${name}${ext}`;

      const url = await uploadS3(stream, fileName);

      // 2. 현재 사용자의 id와 사진을 저장.
      const newPhoto = {
        name: fileName,
        url,
        description,
        category,
        userID: currentUser.githubLogin,
        created: new Date(),
      };

      // 3. 데이터베이스에 새로운 사진을 넣고, 반환되는 id 값을 받는다.
      await db.collection("photos").insertOne(newPhoto);

      pubsub.publish("photo-added", { newPhoto });

      return newPhoto;
    } catch (e) {
      console.log(e);
    }
  },

  async deletePhoto(parent, { id }, { db, currentUser, pubsub }) {
    try {
      if (!currentUser)
        throw new Error("Only an authorized user can delete a photo");

      const _id = ObjectId(id);
      const { name } = await db.collection("photos").findOne({ _id });

      await db.collection("photos").deleteOne({ _id });
      await deleteS3(name);

      return `Delete ${name} success`;
    } catch (e) {
      console.log(e);
    }
  },

  async githubAuth(parent, { code }, { db }) {
    try {
      // 1. 깃헙에서 데이터를 받아 온다.
      let { message, access_token, avatar_url, login, name } =
        await authorizeWithGithub({
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          code,
        });

      // 2. 메세지 있을 시 오류
      if (message) {
        throw new Error(message);
      }

      // 3. 결과 값을 하나의 객체 안에 담는다.
      let latestUserInfo = {
        name,
        githubLogin: login,
        githubToken: access_token,
        avatar: avatar_url,
      };

      // 4. 데이터를 새로 추가하거나 이미 있는 데이터를 업데이트 한다.
      await db
        .collection("users")
        .replaceOne({ githubLogin: login }, latestUserInfo, { upsert: true });
      const user = await db.collection("users").findOne({ githubLogin: login });

      // 5. 사용자 데이터와 토큰을 반환한다.
      return { user, token: access_token };
    } catch (e) {
      console.log(e);
    }
  },

  async addFakeUsers(parent, { count }, { db, currentUser, pubsub }) {
    try {
      // 컨텍스트에 사용자가 존재하지 않으면 에러
      if (!currentUser)
        throw new Error("Only an authorized user can add fake users");

      const { results } = await fetch(
        `https://randomuser.me/api/?results=${count}`,
      )
        .then((res) => res.json())
        .catch((error) => {
          throw new Error(error);
        });

      const users = results.map((r) => ({
        githubLogin: r.login.username,
        name: `${r.name.first} ${r.name.last}`,
        avatar: r.picture.thumbnail,
        githubToken: r.login.sha1,
      }));

      await db.collection("users").insertMany(users);

      // 값 반환 전에 subscription 보고
      pubsub.publish("user-added", { newUser: users });

      return users;
    } catch (e) {
      console.log(e);
    }
  },

  async deleteFakeUser(parent, args, { db, currentUser, pubsub }) {
    try {
      if (!currentUser)
        throw new Error("Only an authorized user can delete a photo");

      const { githubLogin, name } = args.input;
      await db.collection("users").deleteOne({ githubLogin });

      return `Delete ${name} success`;
    } catch (e) {
      console.log(e);
    }
  },

  async fakeUserAuth(parent, { githubLogin }, { db }) {
    try {
      const user = await db.collection("users").findOne({ githubLogin });

      if (!user)
        throw new Error(`Cannot find user with githubLogin "${githubLogin}"`);

      return {
        token: user.githubToken,
        user,
      };
    } catch (e) {
      console.log(e);
    }
  },

  async setVisitors(parent, args, { currentUser, db, pubsub }) {},
};
