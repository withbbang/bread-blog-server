const { authorizeWithGithub } = require('../lib');
const fetch = require('node-fetch');

module.exports = {
  async postPhoto(parent, args, { db, currentUser }) {
    // 1. 컨텍스트에 사용자가 존재하지 않으면 에러
    if(!currentUser) throw new Error('Only an authorized user can post a photo');

    // 2. 현재 사용자의 id와 사진을 저장.
    const newPhoto = {
      ...args.input,
      userID: currentUser.githubLogin,
      created: new Date()
    };

    // 3. 데이터베이스에 새로운 사진을 넣고, 반환되는 id 값을 받는다.
    const { insertedIds } = await db.collection('photos').insert(newPhoto);
    newPhoto.id = insertedIds[0];

    return newPhoto;
  },

  async githubAuth(parent, { code }, { db }) {
    // 1. 깃헙에서 데이터를 받아 온다.
    let {
      message,
      access_token,
      avatar_url,
      login,
      name
    } = await authorizeWithGithub({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code
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
      avatar: avatar_url
    };

    // 4. 데이터를 새로 추가하거나 이미 있는 데이터를 업데이트 한다.
    // 2021-09-21 api 에러 수정하기
    const { ops: [user] } = await db
      .collection('users')
      .replaceOne({ githubLogin: login }, latestUserInfo, { upsert: true });

    // 5. 사용자 데이터와 토큰을 반환한다.
    return { user, token: access_token };
  },

  async addFakeUsers(root, { count }, { db }) {
    const { results } =
      await fetch(`https://randomuser.me/api/?results=${count}`)
      .then(res => res.json())
      .catch(error => {throw new Error(error)});
    
    const users = results.map(r => ({
      githubLogin: r.login.username,
      name: `${r.name.first} ${r.name.last}`,
      avatar: r.picture.thumbnail,
      githubToken: r.login.sha1
    }));

    await db.collection('users').insertMany(users);

    return users;
  },

  async fakeUserAuth(parent, { githubLogin }, { db }) {
    const user = await db.collection('users').findOne({ githubLogin });

    if(!user) throw new Error(`Cannot find user with githubLogin "${githubLogin}"`);

    return {
      token: user.githubToken,
      user
    };
  }
}