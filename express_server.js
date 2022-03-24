const {generateRandomString, emailChecker, passwordChecker, getUserByEmail, getUserUrl} = require('./helpers')
const cookieSession = require('cookie-session')
const morgan = require("morgan");
const express = require("express");
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const { render } = require('express/lib/response');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(cookieSession({
  name: 'user_id',
  keys: ['Eggy'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

const urlDatabase = {};
const users = {};

//Main Home Page
app.get("/", (req, res) => {
  if (!req.session.user_id) {
  res.redirect("/login");
  } res.redirect("/urls");
});

// render main index page (when logged in)
app.get("/urls", (req, res) => {
  const userId = req.session.user_id
  const userUrl = getUserUrl(userId, urlDatabase);
  const templateVars = {
    date: new Date().toLocaleDateString(),
    user: users[req.session.user_id],
    userUrl: userUrl
  }
  if (!req.session.user_id) {
    res.render('urls_error', templateVars)
  } else {
    res.render('urls_index', templateVars);
  }
});

// Render login page 
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlDatabase 
  };
  if (!req.session.user_id){
    res.render('urls_login', templateVars);
  } res.redirect("/urls");
  
});

// POST action for when user login
app.post("/login", (req, res, next) => {
  if(emailChecker(req.body.email, users)) {
    if(!passwordChecker(req.body.password, users)) {
      res.status(403).send("DOUBLE & TRIPLE CHECK YOUR PASSWARDDdddd!🤌")
      next();
    } else {
      const userId = getUserByEmail(req.body.email, users).id;
      req.session.user_id = users[userId].id;
      res.redirect('/urls');
    }
  }else {
    res.status(403).send("DOUBLE & TRIPLE CHECK YOUR EMAIL ADDRESSSSSssss!🤌")
  }
});

// Handle logout (clear current user_id cookie)
app.post('/logout', (req, res) => {
  res.clearCookie('user_id.sig');
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// Render sign up page (Register)
app.get("/register", (req, res) => {
  if(req.session.user_id){
    res.redirect('/urls')
  }
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlDatabase };
  res.render('urls_register', templateVars);
});

// Handle registration form data (email & password)
app.post("/register", (req, res, next) => {
  if(emailChecker(req.body.email, users)){
  res.status(403).send('This Email is alreay taken 🥷');
  return;
  }
  if(req.body.email === '' || req.body.password === '' ){
    res.status(406).send('You MUST enter email && password 🤬');
  return;
  } 
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  req.session.user_id = generateRandomString();
  console.log(req.session.user_id)
  users[req.session.user_id] = {
    id: req.session.user_id, 
    email: req.body.email, 
    hashedPassword: hashedPassword
  }
  res.redirect('/urls');
});

//URL Register and Handling
// User request short url & Add urls to urlDatabase
app.post("/urls", (req, res, next) => {
  if(!req.session.user_id) {
    res.status(405).send("Don't try to sneak it! Login FIRST!!!🚔")
    next();
  } else {
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      userId: req.session.user_id,
      longURL: req.body.longURL
    }
    res.redirect(`/urls/${shortURL}`);
  }
});

// Render new page for inputting original url
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
    if(!req.session.user_id) {
      res.redirect('/login');
    }
    res.render('urls_new', templateVars);
});


// Edit URL & redirect to urls page
app.post('/urls/:shortURL/edit', (req, res, next) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id
  const userUrl = getUserUrl(userId, urlDatabase);
  if(req.session.user_id === urlDatabase[shortURL].userId) {
    userUrl[shortURL].longURL = req.body.editURL;
    res.redirect('/urls');
  } else {
    res.status(405).send("You need to login with your email first! 👆")
    next();
  }
});

// Delete URL using POST and redirect to urls page
app.post('/urls/:shortURL/delete', (req, res, next) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id
  if(!userId) {
    res.status(405).send("You need to login with your email first! 👆")
    next();
  }
  if(userId && userId === urlDatabase[shortURL].userId) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

// Open up result page with links
app.get(`/urls/:shortURL`, (req, res, next) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id;
  const userUrl = getUserUrl(userId, urlDatabase);
  const templateVars = {
    user: users[req.session.user_id],
    shortURL,
    urlDatabase,
    userUrl
  }
  if (!urlDatabase[shortURL]) {
    res.status(404).send('ERRrrr... cannot find the url 👻');
    next();
  } else if (urlDatabase[shortURL] && userId === urlDatabase[shortURL].userId) {
  res.render('urls_show', templateVars);
  } else {
    res.status(405).send("You don't have a permission to access this url 😡")
  }
});

// Redirecting shortURL to longURL 
app.get("/u/:shortURL", (req, res, next) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id
  const userUrl = getUserUrl(userId);

  if (typeof urlDatabase[shortURL] === undefined ) {
    res.status(404).send('Hmmmm...🧐 Are you sure about the URL? ');
    next();
  } else if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;
    const templateVars = {
      user: users[req.session.user_id],
      shortURL,
      urlDatabase,
      userUrl
    }
      res.redirect(longURL);
    } else {
    res.status(404).send('Hmmmm...🧐 Are you sure about the URL? ');
    next();
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



