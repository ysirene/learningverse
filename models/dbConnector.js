require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "learningverse",
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

const getConnection = async () => {
  return new Promise((resolve, reject) => {
    pool.getConnection(function (err, connection) {
      if (err) {
        return reject(err);
      }
      resolve(connection);
    });
  });
};

module.exports = getConnection;
