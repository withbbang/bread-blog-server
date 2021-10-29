const env = require("./env");
const fetch = require("node-fetch");

const sendKakao = async () => {
  // 기본 템플릿으로 나에게 카카오톡 보내기
  const url = "https://kapi.kakao.com/v2/api/talk/memo/default/send";

  const template_object = {
    object_type: "text",
    text: "텍스트 영역입니다. 최대 200자 표시 가능합니다.",
    link: {
      web_url: "http://localhost:3000/",
      mobile_web_url: "http://localhost:3000/",
    },
    button_title: "바로 확인",
  };

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.KAKAO_ACCESS_TOKEN,
    },
    body: JSON.stringify(template_object),
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
