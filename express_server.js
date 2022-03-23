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
//   b6UTxQ: {
//     longURL: "https://www.tsn.ca",
//     userID: "aJ48lW"
// },
//   i3BoGr: {
//     longURL: "https://www.google.ca",
//     userID: "aJ48lW"
// },   
//   i05BoGr: {
//     longURL: "https://www.google.ca",
//     userID: "aJ48lW"
//   }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user1@a.com",
    password: "abc"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@a.com",
    password: "123"
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
  const userUrl = getUserUrl(userId, urlDatabase);
  const templateVars = {
    date: new Date().toLocaleDateString(),
    user: users[req.cookies.user_id],
    userUrl: userUrl
  }
  if (!req.cookies.user_id) {
    res.redirect('/login')
  } else {
    res.render('urls_index', templateVars);
  }
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
  console.log(`${req.cookies.user_id} logged in!`);
});

// Handle logout (clear current user_id cookie)
app.post('/logout', (req, res) => {
  console.log(`${req.cookies.user_id} logged out!`);
  res.clearCookie('user_id');
  res.redirect('/urls');
});

//URL Register and Handling

// Edit URL & redirect to urls page
app.post('/urls/:shortURL/edit', (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.cookies.user_id
  const userUrl = getUserUrl(userId, urlDatabase);
  userUrl[shortURL].longURL = req.body.editURL;
  res.redirect('/urls');
});

// Delete URL using POST and redirect to urls page
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// Render new page for inputting original url
app.get("/urls/new", (req, res) => {
  const date = new Date().toLocaleDateString();
  const templateVars = {
    createdDate: date,
    user: users[req.cookies.user_id],
    urls: urlDatabase
  };

    if(!req.cookies.user_id) {
      res.render('urls_login', templateVars);
    }
    res.render('urls_new', templateVars);
});


// User request short url & Add urls to urlDatabase
app.post("/urls", (req, res) => {

  if(!req.cookies.user_id) {
    res.status(405).send("Don't try to sneak it! Login FIRST!!!🚔")
  }

    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      userId: req.cookies.user_id,
      longURL: req.body.longURL
    }
    console.log(urlDatabase[shortURL])
    res.redirect(`/urls/${shortURL}`);
});

// Open up result page with links
app.get(`/urls/:shortURL`, (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.cookies.user_id
  const userUrl = getUserUrl(userId, urlDatabase);
  console.log(userUrl)
  const templateVars = {
    user: users[req.cookies.user_id],
    shortURL,
    urlDatabase,
    userUrl
  }
  if (userUrl) {
    res.render('urls_show', templateVars);
  } else {
    res.status(404).send('ERRrrr... cannot reach further 👻');
  }
});

// Redirecting shortURL to longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.cookies.user_id
  const userUrl = getUserUrl(userId, urlDatabase);
  console.log(userUrl)
  const longURL = userUrl[shortURL].longURL;
  const templateVars = {
    user: users[req.cookies.user_id],
    shortURL,
    urlDatabase,
    userUrl
  }
  if (longURL) {
    if (longURL === undefined) {
      res.status(404).send('ERRrrr... Page Not Found 🥲 ');
    }
    res.redirect(longURL);
  } else {
    res.status(404).send('Hmmmm...🧐 Are you sure about the URL? ');
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

const getUserUrl = function(user_id, urlDatabase) {
  const userUrl = {};
  for(const shortURL in urlDatabase) {
    if(urlDatabase[shortURL].userId === user_id){
      userUrl[shortURL]= urlDatabase[shortURL]
    }
  }
  return userUrl;
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
