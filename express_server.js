const cookieParser = require('cookie-parser');
const morgan = require("morgan");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const { render } = require('express/lib/response');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.set("view engine", "ejs");

app.use(morgan("dev"))



const urlDatabase = {
  // "b2xVn2": "http://www.lighthouselabs.ca",
  // "9sm5xK": "http://www.google.com",
  // "S152tx": "http://www.tsn.ca"
};

const users = { 
  "user1RandomID": {
    id: "userRandomID", 
    email: "user1@a.com", 
    password: "123"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@a.com", 
    password: "123"
  }
}

// Handle registration form data
app.post("/register", (req, res) => {
  const randomId = generateRandomString();
  let info = {id: randomId, email: req.body.email, password: req.body.password}
  users[randomId] = info
  console.log(users);
  res.cookie('user_id', randomId);
  res.redirect('/urls');
})

// Render sign up page (Register) 
app.get("/register", (req, res) => {
  const templateVars = { 
    username: req.cookies.username,
    urls: urlDatabase };
   res.render('urls_register', templateVars);
})

// Handle login (matches 'username' with username)
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username)
  res.redirect('/urls')
  console.log(`${req.body.username} logged in!`)
})

// Handle logout (clear current username cookie)
app.post('/logout', (req, res) => {
  console.log(`${req.cookies.username} logged out!`)
  res.clearCookie('username')
  res.redirect('/urls')
  
})

// render main index page
app.get("/urls", (req, res) => {
  const templateVars = { 
   username: req.cookies.username,
   urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// Render new page for inputting original url
app.get("/urls/new", (req, res) => {
  const templateVars = { 
    username: req.cookies.username,
    urls: urlDatabase };
  res.render('urls_new', templateVars);
});

// User request short url & Add urls to urlDatabase
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// Redirecting shortURL to longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  console.log('longURL', longURL);
  if (longURL) {
    if (longURL === undefined) {
      res.status(500).send('ERROR: BAD REQUEST ');
    }
    res.redirect(longURL);
  } else {
    res.status(500).send('ERROR: I think you forgot to put http:// in longURL');
  }
});

app.get(`/urls/:shortURL`, (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { 
    username: req.cookies.username,
    shortURL, 
    longURL };
  if (longURL) {
    res.render('urls_show', templateVars);
  } else {
    res.status(404).send('Error 404: Page Not Found');
  }
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


// Edit URL & redirect to urls page
app.post('/urls/:shortURL/edit', (req, res) => {
  const shortURL = req.params.shortURL
  urlDatabase[shortURL] = req.body.editURL
  res.redirect('/urls')
})


// redirect to urls_show page via edit buttons
app.get('/urls/:shortURL/edit', (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`)
})


// Delete URL using POST and redirect to urls page
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls')
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// Function to generater 6 random alphabet string
const generateRandomString = function () {
  let result = '';
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 6; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}
