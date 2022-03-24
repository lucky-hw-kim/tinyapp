////////////////////////////////////////////////////
/** Setup & Middleware **/
const cookieSession = require('cookie-session');
const morgan = require("morgan");
const express = require("express");
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const { render } = require('express/lib/response');

/** Helper Functions **/
const {generateRandomString, emailChecker, passwordChecker, getUserByEmail, getUserUrl} = require('./helpers');

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(cookieSession({
  name: 'user_id',
  keys: ['Eggy'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
/////////////////////////////////////////////////////////////

/** Global Variable **/
const urlDatabase = {};
const users = {};

/** Endpoints (Routing) **/
//
// GET root directory 
// redirect to '/urls' and '/login' 
app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } res.redirect("/urls");
});

// GET '/urls' page (when logged in)
// Redirect to error page (when not logged in) 
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const userUrl = getUserUrl(userId, urlDatabase);
  const templateVars = {
    // need to change to fixed date (created date)
    date: new Date().toLocaleDateString(),
    user: users[req.session.user_id],
    userUrl: userUrl
  };
  if (!req.session.user_id) {
    res.render('urls_error', templateVars);
  } else {
    res.render('urls_index', templateVars);
  }
});

// GET '/urls/new' (when logged in)
// Redirect to '/login' (when not logged in)
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  if (!req.session.user_id) {
    res.redirect('/login');
  }
  res.render('urls_new', templateVars);
});

// GET `/urls/:shortURL`
// Open up result page with links
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id;
  const userUrl = getUserUrl(userId, urlDatabase);
  const templateVars = {
    user: users[req.session.user_id],
    shortURL,
    urlDatabase,
    userUrl
  };
  if (!urlDatabase[shortURL]) {
    return res.status(404).send('ERRrrr... cannot find the url 👻');
  } else if (urlDatabase[shortURL] && userId === urlDatabase[shortURL].userId) {
    res.render("urls_show", templateVars);
  } else {
    return res.status(405).send("You don't have a permission to access this url 😡");
  }
});

// GET '/u/:shortURL'
// Redirecting shortURL to longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL] === undefined) {
    return res.status(404).send('Hmmmm...🧐 Are you sure about the URL? ');
  } else if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    return res.status(404).send('Hmmmm...🧐 Are you sure about the URL? ');
  }
});

//URL Register and Handling
// User request short url & Add urls to urlDatabase
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(405).send("Don't try to sneak it! Login FIRST!!!🚔");
  } else {
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      userId: req.session.user_id,
      longURL: req.body.longURL
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

// POST '/urls/:shortURL/edit'  
// URL & redirect to urls page
app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id;
  const userUrl = getUserUrl(userId, urlDatabase);
  if (req.session.user_id === urlDatabase[shortURL].userId) {
    userUrl[shortURL].longURL = req.body.editURL;
    res.redirect("/urls");
  } else {
    return res.status(405).send("You need to login with your email first! 👆");
  }
});

// POST '/urls/:shortURL/delete'
// Delete URL & redirect to urls page
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(405).send("You need to login with your email first! 👆");
  }
  if (userId && userId === urlDatabase[shortURL].userId) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

// GET '/urls/:shortURL/edit'
// redirect to urls_show page via edit buttons
app.get("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});

// GET '/login' page (when not logged in)
// Redirect to '/urls' (when logged in)
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlDatabase
  };
  if (!req.session.user_id) {
    res.render("urls_login", templateVars);
  } res.redirect("/urls");
});

// GET '/register' page (when not logged in)
// Redirect to '/urls' (when logged in)
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlDatabase };
  res.render("urls_register", templateVars);
});

// POST '/login' 
// Check if the password and email matches or not
app.post("/login", (req, res) => {
  if (emailChecker(req.body.email, users)) {
    if (!passwordChecker(req.body.password, users)) {
      return res.status(403).send("TRIPLE CHECK YOUR PASSWARDDdddd!🤌");
    } else {
      const userId = getUserByEmail(req.body.email, users).id;
      req.session.user_id = users[userId].id;
      res.redirect("/urls");
    }
  } else {
    return res.status(403).send("DOUBLE CHECK YOUR EMAIL ADDRESSSSSssss!🤌");
  }
});

// POST '/register'
// Sign up new user and check if existing email address
app.post("/register", (req, res) => {
  if (emailChecker(req.body.email, users)) {
    return res.status(403).send('This Email is alreay taken 🥷');
  }
  if (req.body.email === '' || req.body.password === '') {
    return res.status(406).send('You MUST enter email && password 🤬');
  }
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  req.session.user_id = generateRandomString();
  console.log(req.session.user_id);
  users[req.session.user_id] = {
    id: req.session.user_id,
    email: req.body.email,
    hashedPassword: hashedPassword
  };
  res.redirect("/urls");
});

// POST '/logout'
// clear current user_id cookies
app.post("/logout", (req, res) => {
  res.clearCookie('user_id.sig');
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



