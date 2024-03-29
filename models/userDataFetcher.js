const getConnection = require("./dbConnector");

async function isValidCredential(email, password) {
  let conn;
  try {
    conn = await getConnection();
    const sql =
      "SELECT user.*, user_role.type FROM user INNER JOIN user_role ON user.user_role_id = user_role.id WHERE user.email = ? AND user.password = ?";
    const credential = [email, password];
    const result = await conn.promise().query(sql, credential);
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

async function updateUserImage(userId, imageName) {
  let conn;
  try {
    conn = await getConnection();
    const sql = "UPDATE user SET image_name = ? WHERE id = ?";
    const data = [imageName, userId];
    await conn.promise().query(sql, data);
    return true;
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
  updateUserImage,
};
