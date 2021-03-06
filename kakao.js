const env = require("./env");
const fetch = require("node-fetch");
const { jsonToUrlEncoded } = require("./lib");

const sendKakao = async () => {
  // 기본 템플릿으로 나에게 카카오톡 보내기
  const url = "https://kapi.kakao.com/v2/api/talk/memo/default/send";

  //TODO: x-www-form-urlencode 패키지 수정해서 NPM에 올려보기
  //TODO: x-www-form-urlencode 패키지 수정해서 NPM에 올려보기(+ 부분 띄어쓰기 공백으로)
  //TODO: template_object 값들 다이나믹하게 넣기
  const template_object = {
    object_type: "text",
    text: "텍스트 영역입니다. 최대 200자 표시 가능합니다.",
    link: {
      web_url: "http://localhost:3000/",
      mobile_web_url: "http://localhost:3000/",
    },
    button_title: "바로 확인",
  };

  const data = jsonToUrlEncoded(JSON.stringify(template_object));

  //TODO: KAKAO ACCESS TOKEN 반영할 때 코드 절차 따라서 받아온 걸로 올리기
  // https://m.blog.daum.net/geoscience/1636
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${process.env.KAKAO_ACCESS_TOKEN}`,
    },
    body: `template_object=${data}`,
  })
    .then((res) => {
      console.log(res);
      return res.json();
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

module.exports = { sendKakao };
