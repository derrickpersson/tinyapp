const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

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

app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "abc" : "http://www.example.org"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
    loggedin: false
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
    loggedin: false
  },
   "test": {
    id: "test",
    email: "test@example.com",
    password: "test",
    loggedin: false
  }
}

function checkEmailExistence(email, users){
  for(let uid in users){
    if(email === users[uid].email){
      return true;
    }
  }
  return false;
}

function checkPassword(email, password, users){
  for(let user in users){
    if(email === users[user].email){
      if(password === users[user].password){
        return true;
      }
    }
  }
  return false;
}

function lookupUserId(email, users){
  let result = "";
  for(let user in users){
    if(email === users[user].email){
      result = users[user].id;
    }
  }
  return result;
}


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static('public'));

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get('/urls', function(req, res){
  let templateVar = { urls : urlDatabase,
                      user : users[req.cookies["user_id"]]}
  res.render('urls_index', templateVar);
});


app.get('/urls/new', (req, res) => {
  let templateVar = { urls : urlDatabase,
                      user : users[req.cookies["user_id"]]}
  res.render("urls_new", templateVar);
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


app.get('/urls/:id', function(req, res){
  let templateVars = {shortURL : req.params.id,
                      longURL: urlDatabase[req.params.id],
                      user : users[req.cookies["user_id"]]};
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


app.post('/logout', function(req, res){
  users[req.cookies["user_id"]].loggedin = false;
  res.clearCookie("user_id");
  res.redirect('/urls');
})

app.post('/register', function(req, res){
  if(!req.body.email || !req.body.password){
    res.status(400);
    res.send("Either email or password is missing");
    return;
  }

  if(checkEmailExistence(req.body.email)){
    res.status(400);
    res.send("Email already exists");
    return;
  }

  let id = generateRandomString();
  users[id] = { "id" : id,
              "email" : req.body.email,
              "password" : req.body.password,
              "loggedin" : true};
  res.cookie("user_id", users[id].id);
  res.redirect('/urls');
});

app.get('/login', (req,res) => {
  res.render('login');
});

app.post('/login', function(req, res){
  if(checkEmailExistence(req.body.email, users)){
    if(checkPassword(req.body.email, req.body.password, users)){
      let userId = lookupUserId(req.body.email, users);
      res.cookie("user_id", userId);
      users[userId].loggedin = true;
      res.redirect('/urls');
    }else{
      res.status(403);
      res.send("Invalid Password.");
    }
  }else{
    res.status(403);
    res.send("Invalid Username");
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
