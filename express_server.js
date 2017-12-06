const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');


app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "abc" : "http://www.example.org"
};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get('/urls', function(req, res){
  let templateVar = { urls : urlDatabase,
                      username: req.cookies["username"]}
  res.render('urls_index', templateVar);
});


app.get('/urls/new', (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  let urlShortName = generateRandomString();
  urlDatabase[urlShortName] = req.body.longURL;
  res.redirect(`/urls/${urlShortName}`);  // Respond with 'Ok' (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if(longURL){
    res.redirect(longURL);
  } else {
    res.status(404).send("Page Not Found");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get('/urls/:id', function(req, res){
  let templateVars = {shortURL : req.params.id,
                      longURL: urlDatabase[req.params.id],
                      username: req.cookies["username"]};
  res.render('urls_show', templateVars);
});

app.post('/urls/:id/delete', function(req, res){
  delete urlDatabase[req.params.id];
  res.status(200);
  res.redirect("/urls");
});

app.post('/urls/:id', function(req, res){
  urlDatabase[req.params.id] = req.body.longURL;
  res.status(200);
  res.redirect('/urls/' + req.params.id);
})

app.post('/login', function(req, res){
  res.cookie("username", req.body.username);
  res.redirect('/urls');
})

app.post('/logout', function(req, res){
  res.clearCookie("username", req.body.username);
  res.redirect('/urls');
})


//  URL Shortening functions:

function generateRandomString(){
  let text = "";
  let possibleText = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(let i = 0; i < 6; i++){
  // for(let i = 0; i < (Math.floor(Math.random() * (7 - 1) + 7)); i++){
    let randomLetter = Math.floor(Math.random() * (possibleText.length));
    text += possibleText[randomLetter];
    // return Math.random() * (max - min) + min;
  }

  // Advanced method:
  // let text = "";
  // for(let i = 0; i < 7; i++){
  //   text += String.fromCharCode(Math.floor(Math.random() * ()))
  // }
  return text;
}

