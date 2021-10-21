const fetch = require("node-fetch");
const fs = require("fs");
const AWS = require("aws-sdk");
const env = require("./env");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: "test@example.com",
  from: "bread@ruu.kr",
  subject: "Sending with SendGrid is Fun",
  text: "and easy to do anywhere, even with Node.js",
  html: "<strong>and easy to do anywhere, even with Node.js</strong>",
};

sgMail
  .send(msg)
  .then((response) => {
    console.log(response[0].statusCode);
    console.log(response[0].headers);
  })
  .catch((error) => {
    console.error(error);
  });

const requestGithubToken = (credentials) =>
  fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(credentials),
  })
    .then((res) => res.json())
    .catch((error) => {
      throw new Error(JSON.stringify(error));
    });

const requestGithubUserAccount = (token) =>
  fetch(`https://api.github.com/user`, {
    headers: {
      Authorization: `token ${token}`,
    },
  })
    .then((res) => res.json())
    .catch((error) => {
      throw new Error(JSON.stringify(error));
    });

const authorizeWithGithub = async (credentials) => {
  const { access_token } = await requestGithubToken(credentials);
  const githubUser = await requestGithubUserAccount(access_token);
  return { ...githubUser, access_token };
};

const uploadStream = (stream, path) =>
  new Promise((resolve, reject) => {
    stream
      .pipe(fs.createWriteStream(path))
      .on("finish", resolve)
      .on("error", (error) => {
        if (stream.truncated) {
          fs.unlinkSync(path);
        }
        console.log(error);
        reject(error);
      });
  });

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
  region: process.env.AWS_S3_REGION,
});

const uploadS3 = async (stream, name) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: name,
    Body: stream,
    ACL: "public-read",
  };

  try {
    const { Location } = await s3.upload(params).promise();
    return Location;
  } catch (err) {
    console.log(err);
  }
};

const deleteS3 = async (fileName) => {
  try {
    s3.deleteObject(
      {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileName,
      },
      (err, data) => {
        if (err) throw err;
        return data;
      }
    );
  } catch (err) {
    console.log(err);
  }
};

module.exports = { authorizeWithGithub, uploadStream, uploadS3, deleteS3 };
