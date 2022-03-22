const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "S152tx": "http://www.tsn.ca"
};


app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase }
  res.render('urls_index', templateVars);
})

app.get("/urls/new", (req, res) => {
  res.render('urls_new')
})

// User request short url
// Add urls to urlDatabase
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString()
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(200, `/urls/${shortURL}`);
  console.log(req.body.longURL, shortURL);
})

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
})

app.get(`/urls/:shortURL`, (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL };

  res.render('urls_show', templateVars)
})

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


function generateRandomString() {
  let result = '';
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 6; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}
