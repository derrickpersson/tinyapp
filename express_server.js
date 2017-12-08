const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

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
  "b2xVn2": {
    id: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userid : "userRandomID",
    clicks : 0,
    createdDate : getCreatedDate(),
    uniqueClicks : 0
  },
  "9sm5xK": {
    id: "9sm5xK",
    longURL: "http://www.google.com",
    userid : "user2RandomID",
    clicks : 0,
    createdDate : getCreatedDate(),
    uniqueClicks : 0
  },
  "abc" : {
    id: "abc",
    longURL: "http://www.example.com",
    userid : "test",
    clicks : 0,
    createdDate : getCreatedDate(),
    uniqueClicks : 0
  },
  "xyz" : {
    id: "xyz",
    longURL: "http://abc.xyz",
    userid : "test",
    clicks : 0,
    createdDate : getCreatedDate(),
    uniqueClicks : 0
  }
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
    password: bcrypt.hashSync("test", 11),
    loggedin: false
  }
}

function getCreatedDate(){
  let todaysDate = new Date();
  let dd = todaysDate.getDate();
  let mm = todaysDate.getMonth() + 1;
  let yyyy = todaysDate.getFullYear();

  if(dd < 10){
    dd = '0' + dd;
  }
  if(mm < 10){
    mm = '0' + mm;
  }
  return today = dd + '/' + mm + '/' + yyyy;
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
      if(bcrypt.compareSync(password, users[user].password)){
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

function urlsForUser(id){
  let result = {};
  for(let url in urlDatabase){
    if(urlDatabase[url].userid === id){
      result[url] = urlDatabase[url];
    }
  }
  return result;
}

function checkValidShortId(id){
  for(let url in urlDatabase){
    if(id === urlDatabase[url].id){
      return true;
    }
  }
  return false;
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["Secrets!!"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(express.static('public'));

app.get("/", (req, res) => {
  let templateVar = { urls : urlDatabase,
                      user : users[req.session["user_id"]]}

  if(templateVar.user === undefined){
    res.redirect('/login');
  }else{
    res.redirect("/urls");
  }
});

app.get('/urls', function(req, res){
  let templateVar = { urls : urlsForUser(req.session["user_id"]),
                      user : users[req.session["user_id"]]}
  res.render('urls_index', templateVar);
});


app.get('/urls/new', (req, res) => {
  let templateVar = { urls : urlDatabase,
                      user : users[req.session["user_id"]]}

  if(templateVar.user === undefined){
    res.redirect('/login');
  }else{
  res.render("urls_new", templateVar);
  }
});

app.post("/urls", (req, res) => {
  let urlShortName = generateRandomString();
  urlDatabase[urlShortName] = {
    id : urlShortName,
    longURL : req.body.longURL,
    userid : users[req.session["user_id"]].id,
    clicks : 0,
    createdDate : getCreatedDate()
  };
  res.redirect(`/urls/${urlShortName}`);
});

app.get("/u/:shortURL", (req, res) => {
  if(checkValidShortId(req.params.shortURL)){
    let longURL = urlDatabase[req.params.shortURL].longURL;
    if(longURL){
      urlDatabase[req.params.shortURL].clicks += 1;
      res.redirect(longURL);
      return;
    }
  }
  res.status(404).send("Page Not Found");
});


app.get('/urls/:id', function(req, res){
  if(checkValidShortId(req.params.id)){
    let templateVars = {
      url : urlDatabase[req.params.id],
      shortURL : req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user : users[req.session["user_id"]]
    };
    if(templateVars.user){
      if(users[req.session["user_id"]].id === urlDatabase[req.params.id].userid){
        res.status(200).render('urls_show', templateVars);
        return;
      }
    }
    res.status(401).send("Invalid request");
  }else{
    res.status(400).send("Invalid request");
  }
});

app.post('/urls/:id', function(req, res){
  if(users[req.session["user_id"]].id === urlDatabase[req.params.id].userid){
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.status(200);
    res.redirect('/urls');
  }else{
    res.status(401);
    res.send("You don't have permission to do that!");
  }
})

app.post('/urls/:id/delete', function(req, res){
  if(users[req.session["user_id"]].id === urlDatabase[req.params.id].userid){
    delete urlDatabase[req.params.id];
    res.status(200);
    res.redirect("/urls");
  }else{
    res.status(401);
    res.send("You don't have permission to do that!");
  }
});

app.post('/logout', function(req, res){
  users[req.session["user_id"]].loggedin = false;
  req.session = null;
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
              "password" : bcrypt.hashSync(req.body.password, 11),
              "loggedin" : true};
  req.session["user_id"] = users[id].id;
  res.redirect('/urls');
});

app.get('/login', (req,res) => {
  if(users[req.session["user_id"]] === undefined ){
    res.render('login');
    return;
  }
    res.status(301).redirect('/urls');
});

app.post('/login', function(req, res){
  if(checkEmailExistence(req.body.email, users)){
    if(checkPassword(req.body.email, req.body.password, users)){
      let userId = lookupUserId(req.body.email, users);
      req.session["user_id"] = userId;
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
