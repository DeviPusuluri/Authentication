const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// API-1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body; //Destructuring the data from the API call

  const hashedPassword = await bcrypt.hash(password, 10); //Hashing the given password

  const checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${username}';`;
  const userData = await db.get(checkTheUsername); //Getting the user details from the database
  if (userData === undefined) {
    //checks the condition if user is already registered or not in the database
    /*If userData is not present in the database then this condition executes*/
    const postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`;

    /*If password length is greater than 5 then this block will execute*/

    if (password.length < 5) {
      //checking the length of the password
      response.status(400);
      response.send("Password is too short");
    } else {
      const newUserDetails = await db.run(postNewUserQuery); //Updating data to the database
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    /*If the userData is already registered in the database then this block will execute*/
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const checkUser = `
    SELECT * FROM user 
    WHERE username='${username}';`;
  const userData = await db.get(checkUser);
  if (userData === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, userData.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUser = `
    SELECT * FROM user 
    WHERE username='${username}';`;
  const userData = await db.get(checkUser);
  if (userData === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      userData.password
    );
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else if (isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid current password");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePassword = `
      UPDATE user 
      SET password='${hashedPassword}';
      WHERE username='${username}';`;
      await db.run(updatePassword);
      response.send("Password updated");
    }
  }
});

module.exports = app;
