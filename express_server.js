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



const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userId: "user1"
},
  i3BoGr: {
    longURL: "https://www.google.ca",
    userId: "user1"
},   
  i05BoGr: {
    longURL: "https://www.google.ca",
    userId: "user1"
  },

  i05B4Gr: {
    longURL: "https://www.google.ca",
    userId: "user2"
  }

};

const users = {
  "user1": {
    id: "user1",
    email: "1@a.com",
    password: "1"
  },
  "user2": {
    id: "user2",
    email: "2@a.com",
    password: "2"
  }
};

//Main Home Page
app.get("/", (req, res) => {
  if (!req.cookies.user_id) {
  res.redirect("/login");
  } res.redirect("/urls");
});

// render main index page (when logged in)
app.get("/urls", (req, res) => {
  const userId = req.cookies.user_id
  const userUrl = getUserUrl(userId);
  const templateVars = {
    date: new Date().toLocaleDateString(),
    user: users[req.cookies.user_id],
    userUrl: userUrl
  }
  if (!req.cookies.user_id) {
    res.render('urls_error', templateVars)
  } else {

    res.render('urls_index', templateVars);
  }
});

// Render login page 
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
    urls: urlDatabase };
    console.log(templateVars);
  res.render('urls_login', templateVars);
});

// POST action for when user login
app.post("/login", (req, res, next) => {
  console.log('Body:', req.body);
  if(emailChecker(req.body.email, users)) {
    if(!passwordChecker(req.body.password, users)) {
      res.status(403).send("DOUBLE & TRIPLE CHECK YOUR PASSWARDDdddd!🤌")
      next();
    } else {
      const userId = getUserId(req.body.email, users);
      users[userId] = {
        id: userId, 
        email: req.body.email, 
        password: req.body.password
      }
      res.cookie('user_id', userId);
      res.redirect('/urls');
    }
  }else {
    console.log(req.body.email);
    console.log(users);
    res.status(403).send("DOUBLE & TRIPLE CHECK YOUR EMAIL ADDRESSSSSssss!🤌")
  }
});

// Handle logout (clear current user_id cookie)
app.post('/logout', (req, res) => {
  console.log(`${req.cookies.user_id} logged out!`);
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// Render sign up page (Register)
app.get("/register", (req, res) => {
  if(req.cookies.user_id){
    res.redirect('/urls')
  }
  const templateVars = {
    user: users[req.cookies.user_id],
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
  const randomId = generateRandomString();
  users[randomId] = {
    id: randomId, 
    email: req.body.email, 
    password: req.body.password
  }
  console.log(users);
  res.cookie('user_id', randomId);
  res.redirect('/urls');
});

//URL Register and Handling
// User request short url & Add urls to urlDatabase
app.post("/urls", (req, res, next) => {
  if(!req.cookies.user_id) {
    res.status(405).send("Don't try to sneak it! Login FIRST!!!🚔")
    next();
  } else {
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      userId: req.cookies.user_id,
      longURL: req.body.longURL
    }
    res.redirect(`/urls/${shortURL}`);
  }
});

// Render new page for inputting original url
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
    if(!req.cookies.user_id) {
      res.redirect('/login');
    }
    res.render('urls_new', templateVars);
});


// Edit URL & redirect to urls page
app.post('/urls/:shortURL/edit', (req, res, next) => {
  const shortURL = req.params.shortURL;
  const userId = req.cookies.user_id
  const userUrl = getUserUrl(userId);
  if(req.cookies.user_id === urlDatabase[shortURL].userId) {
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
  const userId = req.cookies.user_id
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
  const userId = req.cookies.user_id
  const userUrl = getUserUrl(userId);
  const templateVars = {
    user: users[req.cookies.user_id],
    shortURL,
    urlDatabase,
    userUrl
  }
  if (!urlDatabase[shortURL]) {
    res.status(404).send('ERRrrr... cannot reach further 👻');
    next();
  } else if (urlDatabase[shortURL] && userId === urlDatabase  [shortURL].userId) {
  res.render('urls_show', templateVars);
  } else {
    res.status(405).send("You don't have a permission to access this url 😡")
  }
});

// Redirecting shortURL to longURL 
/* DO All THE ERROR CASES!!!!!! */
app.get("/u/:shortURL", (req, res, next) => {
  const shortURL = req.params.shortURL;
  const userId = req.cookies.user_id
  const userUrl = getUserUrl(userId);
  console.log(userUrl)

  if (typeof urlDatabase[shortURL] === undefined ) {
    res.status(404).send('Hmmmm...🧐 Are you sure about the URL? ');
    next();
  } else if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;
    const templateVars = {
      user: users[req.cookies.user_id],
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
    } 
  }
  return false;
}

const passwordChecker = function(userPassword, users) {
  for(const user in users){
    if(users[user].password === userPassword){
    return true;
    } 
  }
  return false
}


const getUserId = function(userEmail, users) {
  for(const user in users) {
    if(emailChecker(userEmail, users)) {
      return users[user].id
    }
  }
}

const getUserUrl = function(user_id) {
  const userUrl = {};
  for(const shortURL in urlDatabase) {
    if(urlDatabase[shortURL].userId === user_id){
      userUrl[shortURL]= urlDatabase[shortURL]
    }
  }
  return userUrl;
}


// const cookieChecker = function(cookie, users) {
//   for(const user in users){
//     if(cookie === users[user]) {
//       return true;
//     }
//     else {
//       return false
//     }
//   }
// }


// // return an object of urls for each user
// const personalUrls = function(urlDatabase, users, userEmail) {
//   const urls = {};
//   for (let shortURL in urlDatabase) {
//     if(urlDatabase[shortURL].userID === getUserId(userEmail, users)){
//       urls.shortURL = urlDatabase[shortURL];
//       urls.longURL = urlDatabase[shortURL].longURL;
//     } else {
//       return urls;
//     }
//   } return urls;
// }


// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });
