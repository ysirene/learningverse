const jwt = require("jsonwebtoken");
require("dotenv").config();

function encodeToken(data) {
  const secretKey = process.env.JWT_SECRET_KEY;
  const privateClaims = {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role_type,
    img: data.image_name,
  };
  const registeredClaims = { algorithm: "HS256", expiresIn: "7d" };
  const encodedToken = jwt.sign(privateClaims, secretKey, registeredClaims);
  return encodedToken;
}

function decodeToken(data) {
  const secretKey = process.env.JWT_SECRET_KEY;
  try {
    const token = data.split(" ")[1];
    const decodedToken = jwt.verify(token, secretKey);
    return decodedToken;
  } catch (error) {
    return null;
  }
}

module.exports = {
  encodeToken,
  decodeToken,
};
