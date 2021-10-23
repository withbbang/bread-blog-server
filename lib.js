const fetch = require("node-fetch");
const fs = require("fs");
const AWS = require("aws-sdk");
const env = require("./env");
const sgMail = require("@sendgrid/mail");
const { adjectives, nouns } = require("./word");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("bson");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const generateSecret = () => {
  const randomNumber = Math.floor(Math.random() * adjectives.length);
  return `${adjectives[randomNumber]} ${nouns[randomNumber]}`;
};

const sendMail = async (email, secretWord) => {
  const msg = {
    to: email,
    from: "bread@ruu.kr",
    subject: "Login Secret Word For Graphql-Tutorial",
    // text: "and easy to do anywhere, even with Node.js",
    html: `Hello! Your Login secret is <strong>${secretWord}</strong>.<br/>Copy and paste on the app/website to log in`,
  };

  try {
    const response = await sgMail.send(msg);
    console.log(response);
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
};

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
    // expiresIn: "1h",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "180 days",
  });
};

const decodeToken = (token) => {
  try {
    const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return ObjectId(user.id);
  } catch (err) {
    if (err.name === "TokenExpiredError") throw new Error("Expired Token. Please Login Again");
    else {
      console.log(err);
      throw new Error(err);
    }
  }
};

const resetToken = (refreshToken) => {
  return;
};

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

module.exports = {
  authorizeWithGithub,
  uploadStream,
  uploadS3,
  deleteS3,
  generateSecret,
  sendMail,
  generateAccessToken,
  generateRefreshToken,
  decodeToken,
};
