const cookieParser = require('cookie-parser');
const morgan = require("morgan");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const { render } = require('express/lib/response');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(morgan("dev"));

/* DO All THE ERROR CASES!!!!!! */

const urlDatabase = {
  // "b2xVn2": "http://www.lighthouselabs.ca",
  // "9sm5xK": "http://www.google.com",
  // "S152tx": "http://www.tsn.ca"
};

const users = {
  "user1RandomID": {
    id: "userRandomID",
    email: "user1@a.com",
    password: "abc"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@a.com",
    password: "123"
  }
};

/*
GET/
if user is logged in redirect to /urls
if not redirect to /login
*/

// render main index page (when logged in)
app.get("/urls", (req, res) => {
  const date = new Date().toLocaleDateString();
  const templateVars = {
    createdDate: date,
    user: users[req.cookies.user_id],
    urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// POST action for when user login
app.post("/login", (req, res) => {
  if(emailChecker(req.body.email, users)) {
    if(!passwordChecker(req.body.password, users)) {
      console.log(req.body.password);
      res.status(403).send("DOUBLE & TRIPLE CHECK YOUR PASSWARDDDdddddd!🤌")
    } else {
      const userId = getUserId(req.body.email, users);
      console.log(userId)
      users[userId] = {
        id: userId, 
        email: req.body.email, 
        password: req.body.password
      }
      res.cookie('user_id', userId);
    }
  }
  if(!emailChecker(req.body.email, users)){
    res.status(403).send("DOUBLE & TRIPLE CHECK YOUR EMAIL ADDRESSSSSssss!🤌")
  }
  res.redirect('/urls');
  console.log(`${req.cookies.use_id} logged in!`);
});

/* GET /urls */


// Handle logout (clear current user_id cookie)
app.post('/logout', (req, res) => {
  console.log(`${req.cookies.use_id} logged out!`);
  res.clearCookie('user_id');
  res.redirect('/urls');
  
});

// Edit URL & redirect to urls page
app.post('/urls/:shortURL/edit', (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.editURL;
  res.redirect('/urls');
});

// Delete URL using POST and redirect to urls page
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// User request short url & Add urls to urlDatabase
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// Handle registration form data (email & password)
app.post("/register", (req, res) => {
  if(emailChecker(req.body.email, users)){
  res.status(403).send('This Email is alreay taken 🥷');
  }
  if(req.body.email === '' || req.body.password === '' ){
    res.status(406).send('You MUST enter email && password 🤬');
  } 
  const randomId = generateRandomString();
  users[randomId] = {
    id: randomId, 
    email: req.body.email, 
    password: req.body.password
  }
  res.cookie('user_id', randomId);
  res.redirect('/urls');
});

// Render sign up page (Register)
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
    urls: urlDatabase };
  res.render('urls_register', templateVars);
});

// Render login page 
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
    urls: urlDatabase };
    console.log(templateVars);
  res.render('urls_login', templateVars);
});

// Render new page for inputting original url
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user : users[req.cookies.user_id],
    urls: urlDatabase };
  res.render('urls_new', templateVars);
});


// Redirecting shortURL to longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (longURL) {
    if (longURL === undefined) {
      res.status(404).send('ERRrrr... Page Not Found 🥲 ');
    }
    res.redirect(longURL);
  } else {
    res.status(404).send('Hmmmm...🧐 Are you sure about the URL? ');
  }
});

app.get(`/urls/:shortURL`, (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = {
    user: users[req.cookies.user_id],
    shortURL,
    longURL };
  if (longURL) {
    res.render('urls_show', templateVars);
  } else {
    res.status(404).send('ERRrrr... cannot reach further 👻');
  }
});


// redirect to urls_show page via edit buttons
app.get('/urls/:shortURL/edit', (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Functions!

// Function to generater 6 random alphabet string
const generateRandomString = function() {
  let result = '';
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 6; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
};

// Function to look up existing Email
const emailChecker = function(userEmail, users) {
  for(const user in users){
    if(users[user].email === userEmail){
    return true;
    } else {
      return false
    }
  }
}

const passwordChecker = function(userPassword, users) {
  for(const user in users){
    if(users[user].password === userPassword){
    return true;
    } else {
      return false
    }
  }
}


const getUserId = function(userEmail, users) {
  for(const user in users) {
    if(emailChecker(userEmail, users)) {
      return users[user].id
    }
  }
}

const cookieChecker = function(cookie, users) {
  for(const user in users){
    if(cookie === users[user]) {
      return true;
    }
    else {
      return false
    }
  }
}


// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });
