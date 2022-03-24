const bcrypt = require('bcryptjs');

const generateRandomString = function() {
  let result = '';
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 6; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
};

const emailChecker = function(userEmail, database) {
  for(const user in database){
    if(database[user].email === userEmail){
    return true;
    } 
  }
  return false;
}

const passwordChecker = function(userPassword, database) {
  for(const user in database) {
    if(bcrypt.compareSync(userPassword, database[user].hashedPassword)){
      return true
    } 
  }
  return false
}

const getUserByEmail = function(userEmail, database) {
  for(const user in database) {
    if(database[user].email === userEmail) {
      return database[user]
    }
  }
  return undefined
}

const getUserUrl = function(user_id, database) {
  const userUrl = {};
  for(const shortURL in database) {
    if(database[shortURL].userId === user_id){
      userUrl[shortURL]= database[shortURL]
    }
  }
  return userUrl;
}

module.exports = {
  generateRandomString,
  emailChecker,
  passwordChecker,
  getUserByEmail,
  getUserUrl
}