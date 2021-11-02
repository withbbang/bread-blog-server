const env = require("./env");
const fetch = require("node-fetch");

const sendKakao = async () => {
  // 기본 템플릿으로 나에게 카카오톡 보내기
  const url = "https://kapi.kakao.com/v2/api/talk/memo/default/send";

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${process.env.KAKAO_ACCESS_TOKEN}`,
    },
    body: "template_object=%7B%22object_type%22%3A%22text%22%2C%20%22text%22%3A%22%ED%85%8D%EC%8A%A4%ED%8A%B8%20%EC%98%81%EC%97%AD%EC%9E%85%EB%8B%88%EB%8B%A4.%20%EC%B5%9C%EB%8C%80%20200%EC%9E%90%20%ED%91%9C%EC%8B%9C%20%EA%B0%80%EB%8A%A5%ED%95%A9%EB%8B%88%EB%8B%A4.%22%2C%20%22link%22%3A%20%7B%22web_url%22%3A%20%22http%3A%2F%2Flocalhost%3A3000%2F%22%2C%20%22mobile_web_url%22%3A%20%22http%3A%2F%2Flocalhost%3A3000%2F%22%7D%2C%20%22button_title%22%3A%20%22%EB%B0%94%EB%A1%9C%20%ED%99%95%EC%9D%B8%22%7D",
  })
    .then((res) => {
      console.log(res);
      return res.json();
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });

  // await fetch(url, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  //   },
  //   body: new URLSearchParams({
  //     template_object: {
  //       object_type: "text",
  //       text: "텍스트 영역입니다. 최대 200자 표시 가능합니다.",
  //       link: {
  //         web_url: "http://localhost:3000/",
  //         mobile_web_url: "http://localhost:3000/",
  //       },
  //       button_title: "바로 확인",
  //     },
  //   }),
  // })
  //   .then((res) => {
  //     console.log(res);
  //     return res.json();
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     throw new Error(err);
  //   });
};

module.exports = { sendKakao };
