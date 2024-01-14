const getConnection = require("./dbConnector");

async function isValidCredential(email, password) {
  let conn;
  try {
    conn = await getConnection();
    const sql =
      "SELECT user.*, user_role.type FROM user INNER JOIN user_role ON user.user_role_id = user_role.id WHERE user.email = ? AND user.password = ?";
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
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function isEmailUsed(email) {
  let conn;
  try {
    conn = await getConnection();
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
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function insert(name, email, password, role) {
  let conn;
  try {
    conn = await getConnection();
    const emailUsed = await isEmailUsed(email);
    if (emailUsed) {
      return false;
    } else {
      const sql =
        "INSERT INTO user(name, email, password, user_role_id) VALUES(?, ?, ?, ?)";
      const userData = [name, email, password, role];
      await conn.promise().query(sql, userData);
      conn.release();
      return true;
    }
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

module.exports = {
  isValidCredential,
  insert,
};

// module.exports.isValidCredential = isValidCredential();
// module.exports.insert = insert();
