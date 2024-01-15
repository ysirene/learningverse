const { v4: uuidv4 } = require("uuid");

function generateFileName(ext) {
  const fileName = uuidv4() + ext;
  return fileName;
}

exports.generateFileName = generateFileName;
