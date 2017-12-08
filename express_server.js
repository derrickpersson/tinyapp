const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

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
    userid: "userRandomID",
    clicks: 0,
    createdDate: getCreatedDate(),
    uniqueClicks: []
  },
  "9sm5xK": {
    id: "9sm5xK",
    longURL: "http://www.google.com",
    userid: "user2RandomID",
    clicks: 0,
    createdDate: getCreatedDate(),
    uniqueClicks: []
  },
  "abc" : {
    id: "abc",
    longURL: "http://www.example.com",
    userid: "test",
    clicks: 0,
    createdDate: getCreatedDate(),
    uniqueClicks: []
  },
  "xyz" : {
    id: "xyz",
    longURL: "http://abc.xyz",
    userid: "test",
    clicks: 0,
    createdDate: getCreatedDate(),
    uniqueClicks: []
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 11)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 11)
  },
   "test": {
    id: "test",
    email: "test@example.com",
    password: bcrypt.hashSync("test", 11)
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

function checkExistence(identifier, database, property){
  for(let id in database){
    if(identifier === database[id][property]){
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

function checkUniqueVisit(user, previousVisits){
  for(let i = 0; i < previousVisits.length; i++){
    if(user === previousVisits[i]){
      return false;
    }
  }
  return true;
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["Secrets!!"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(express.static('public'));

app.use(function(req, res, next){
  res.locals.user = users[req.session["user_id"]];
  req.loggedIn = !!res.locals.user;
  next();
});

// Get the URLs page if logged in, otherwise re-direct to Login.
app.get("/", (req, res) => {
  if(req.logginIn){
    res.redirect("/urls");
  }else{
    res.redirect('/login');
  }
});

app.get('/urls', function(req, res){
  let templateVar = {
    urls: urlsForUser(req.session["user_id"]),
  };
  res.render('urls_index', templateVar);
});


app.get('/urls/new', (req, res) => {
  if(req.loggedIn){
  res.render("urls_new");
  }else{
  res.redirect('/login');
  }
});


app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;

  if(shortURL in urlDatabase){
    let longURL = urlDatabase[shortURL].longURL;
    if(longURL){
      urlDatabase[shortURL].clicks += 1;
      if(checkUniqueVisit(res.locals.user.id, urlDatabase[shortURL].uniqueClicks)){
        urlDatabase[shortURL].uniqueClicks.push(res.locals.user.id);
      }
      res.redirect(longURL);
      return;
    }
  }
  res.status(404).send("Page Not Found");
});

app.get('/urls/:id', function(req, res){
  if(checkExistence(req.params.id, urlDatabase, "id")){
    let templateVars = {
      url : urlDatabase[req.params.id],
      shortURL : req.params.id,
      longURL: urlDatabase[req.params.id].longURL
    };
    if(req.loggedIn){
      if(res.locals.user.id === urlDatabase[req.params.id].userid){
        res.status(200).render('urls_show', templateVars);
        return;
      }
    }
    res.status(401).send("Invalid request");
  }else{
    res.status(400).send("Invalid request");
  }
});

app.get('/login', (req,res) => {
  if(req.loggedIn){
    res.status(301).redirect('/urls');
    return;
  }
    res.render('login');
});

app.post("/urls", (req, res) => {
  let urlShortName = generateRandomString();
  urlDatabase[urlShortName] = {
    id : urlShortName,
    longURL : req.body.longURL,
    userid : users[req.session["user_id"]].id,
    clicks : 0,
    createdDate : getCreatedDate(),
    uniqueClicks : 0
  };
  res.redirect(`/urls/${urlShortName}`);
});

app.post('/urls/:id', function(req, res){
  if(res.locals.user.id === urlDatabase[req.params.id].userid){
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.status(200);
    res.redirect('/urls');
  }else{
    res.status(401);
    res.send("You don't have permission to do that!");
  }
})

app.post('/urls/:id/delete', function(req, res){
  if(res.locals.user.id === urlDatabase[req.params.id].userid){
    delete urlDatabase[req.params.id];
    res.status(200);
    res.redirect("/urls");
  }else{
    res.status(401);
    res.send("You don't have permission to do that!");
  }
});

app.post('/logout', function(req, res){
  req.session = null;
  res.redirect('/urls');
})

app.post('/register', function(req, res){
  if(!req.body.email || !req.body.password){
    res.status(400);
    res.send("Either email or password is missing");
    return;
  }

  if(checkExistence(req.body.email, users, "email")){
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


app.post('/login', function(req, res){
  if(checkExistence(req.body.email, users, "email")){
    if(checkPassword(req.body.email, req.body.password, users)){
      let userId = lookupUserId(req.body.email, users);
      req.session["user_id"] = userId;
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
