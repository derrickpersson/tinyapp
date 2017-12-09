const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

app.set('view engine', 'ejs');


// Helper functions
function generateRandomString(){
  let text = "";
  let possibleText = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(let i = 0; i < 6; i++){
    let randomLetter = Math.floor(Math.random() * (possibleText.length));
    text += possibleText[randomLetter];
  }
  return text;
}

function getCreatedDate(){
  let todaysDate = new Date();
  let dd = todaysDate.getDate();
  let mm = todaysDate.getMonth() + 1;
  let yyyy = todaysDate.getFullYear();

  if(dd < 10){
    dd = `0${dd}`;
  }
  if(mm < 10){
    mm = `0${mm}`;
  }
  return today = `${dd}/${mm}/${yyyy}`;
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
  for(let user in users){
    if(email === users[user].email){
      return users[user].id;
    }
  }
  return undefined;
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

function getUniqueVisits(visits){
  let results = {};
  for(let i = 0; i < visits.length; i++){
    results[visits[i].visitorId] = true;
  }
  return Object.keys(results).length;
}

// Initial Database (Example data)
const urlDatabase = {
  "b2xVn2": {
    id: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userid: "userRandomID",
    visits: []
  },
  "9sm5xK": {
    id: "9sm5xK",
    longURL: "http://www.google.com",
    userid: "user2RandomID",
    createdDate: getCreatedDate(),
    visits: []
  },
  "abc": {
    id: "abc",
    longURL: "http://www.example.com",
    userid: "test",
    createdDate: getCreatedDate(),
    visits: []
  },
  "xyz": {
    id: "xyz",
    longURL: "http://abc.xyz",
    userid: "test",
    createdDate: getCreatedDate(),
    visits:[]
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

app.use(methodOverride('_method'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["Secrets!!"]
}));

app.use(function(req, res, next){
  res.locals.user = users[req.session["user_id"]];
  req.loggedIn = !!res.locals.user;
  next();
});

app.use("/urls", function(req, res, next){
  if(req.loggedIn){
    next();
  }else{
    res.redirect('/login');
  }
});

app.use((req, res, next) => {
  if(!req.session.visitorId){
    req.session.visitorId = generateRandomString();
  }
  next();
})

app.get('/urls/new', (req, res) => {
  res.render("urls_new");
});

app.use('/urls/:id', function(req, res, next){
  if(checkExistence(req.params.id, urlDatabase, "id")){
    next();
  }else{
    res.status(400).send("Invalid request");
  }
})

// Get the URLs page if logged in, otherwise re-direct to Login.
app.get("/", (req, res) => {
    res.redirect("/urls");
});

app.get('/urls', function(req, res){
  res.render('urls_index', { urls: urlsForUser(req.session["user_id"]) });
});




app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if(shortURL in urlDatabase){
    const longURL = urlDatabase[shortURL].longURL;
    if(longURL){
      urlDatabase[shortURL].visits.push({
        "time": new Date(),
        "visitorId": req.session.visitorId
      });
      res.redirect(longURL);
      return;
    }
  }
  res.status(404).send("Page Not Found");
});

app.get('/urls/:id', function(req, res){
  const templateVars = {
    url : urlDatabase[req.params.id],
    shortURL : req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  res.status(200).render('urls_show', templateVars);
  return;
});

app.get('/login', (req,res) => {
  if(req.loggedIn){
    res.status(301).redirect('/urls');
    return;
  }
    res.render('login');
});

app.get('/register', (req, res) => {
  if(req.loggedIn){
    res.status(301).redirect('/urls');
    return;
  }else{
    res.render('register');
  }
})

app.post("/urls", (req, res) => {
  const urlShortName = generateRandomString();
  urlDatabase[urlShortName] = {
    id: urlShortName,
    longURL: req.body.longURL,
    userid: users[req.session["user_id"]].id,
    createdDate: getCreatedDate(),
    visits: []
  };
  res.redirect(`/urls/${urlShortName}`);
});

app.put('/urls/:id', function(req, res){
  if(res.locals.user.id === urlDatabase[req.params.id].userid){
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.status(200);
    res.redirect('/urls');
  }else{
    res.status(401);
    res.send("You don't have permission to do that!");
  }
})

app.delete('/urls/:id/delete', function(req, res){
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

  const id = generateRandomString();
  users[id] = {
    "id" : id,
    "email" : req.body.email,
    "password" : bcrypt.hashSync(req.body.password, 11)
  };
  req.session["user_id"] = users[id].id;
  res.redirect('/urls');
});


app.post('/login', function(req, res){
  if(checkExistence(req.body.email, users, "email")){
    if(checkPassword(req.body.email, req.body.password, users)){
      const userId = lookupUserId(req.body.email, users);
      req.session["user_id"] = userId;
      res.redirect('/urls');
    }else{
      res.status(403);
      res.send("Invalid Password.");
    }
  }else{
    res.status(403);
    res.send("Invalid Username.");
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
