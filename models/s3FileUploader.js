require("dotenv").config();
const AWS = require("aws-sdk");

const region = process.env.S3_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.S3_BUCKET;

AWS.config.update({
  region,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

exports.uploadFileToS3 = (fileName, file) => {
  return new Promise((resolve, reject) => {
    const s3 = new AWS.S3({});
    let uploadParams = {
      Key: "userImage/" + fileName,
      Bucket: bucketName,
      Body: file,
    };
    s3.upload(uploadParams, (err, response) => {
      if (err) {
        reject({ error: true, message: err });
      }
      resolve({ ok: true, message: "Successfully upload file to S3" });
    });
  });
};
