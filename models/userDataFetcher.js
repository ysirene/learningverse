const getConnection = require("./dbConnector");

async function isValidCredential(email, password) {
  try {
    const conn = await getConnection();
    const sql =
      "SELECT user.*, role.role_type FROM user INNER JOIN role ON user.role_id = role.id WHERE user.email = ? AND user.password = ?";
    const credential = [email, password];
    const result = await conn.promise().query(sql, credential);
    conn.release();
    if (result[0] == []) {
      return false;
    } else {
      return result[0][0];
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function isEmailUsed(email) {
  try {
    const conn = await getConnection();
    const sql = "SELECT * FROM user WHERE email = ?";
    const result = await conn.promise().query(sql, [email]);
    conn.release();
    if (result[0].length == 1) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function insert(name, email, password) {
  try {
    const conn = await getConnection();
    const emailUsed = await isEmailUsed(email);
    if (emailUsed) {
      return false;
    } else {
      const sql = "INSERT INTO user(name, email, password) VALUES(?, ?, ?)";
      const userData = [name, email, password];
      await conn.promise().query(sql, userData);
      conn.release();
      return true;
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

module.exports = {
  isValidCredential,
  insert,
};

// module.exports.isValidCredential = isValidCredential();
// module.exports.insert = insert();
