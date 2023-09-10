require('dotenv').config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const md5 =  require("md5");
// const bcrypt = require("bcrypt");
// const saltRound = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();



app.set('view engine','ejs');

app.use(bodyparser.urlencoded ({extended: true}));
    
app.use(express.static("public"));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect("mongodb+srv://ghorpadeanuj56:ghorpdeanuj56@cluster0.rewuoco.mongodb.net/?retryWrites=true&w=majority",{useNewUrlParser: true}).then(console.log("connected to the mongodb"));


const mongoConnection = async()=>{
    try {
  
   await   mongoose.connect("mongodb+srv://ghorpadeanuj56:ghorpadeanuj56@cluster0.rewuoco.mongodb.net/?retryWrites=true&w=majority",{useNewUrlParser: true});
  
   console.log("Connected succesfully");
      
    } catch (error) {
      console.log("error while connection to mongo cluster :",error);
    }
  
  }
  mongoConnection()

const userSchema = new mongoose.Schema ({
    username: String,
    password: String,
    googleId: String,
    secret: String  
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
    done(null, user.id);
})

passport.deserializeUser(function(id, done){
    User.findById(id)
    .then(user => {
        done(null, user);
    })
    .catch(err => {
        done(err, null);
    })
});

passport.use(new GoogleStrategy({
    clientID: "307128567738-3s02r96i2gbhv9psuig6b874ba3h5ubd.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:3000/auth/google/secrets",

  },
  function(accessToken, refreshToken, profile, cb) {
  
    User.findOrCreate({ googleId: profile.id,username:profile.name }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res){
    res.render("home");
});

app.get("/auth/google", 
    passport.authenticate("google", {scope:["profile"],})
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    
    res.redirect("/secrets");
  });

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/secrets", async function(req, res) {
    try {
        const foundUsers = await User.find({ secret: { $ne: null } });
        if (foundUsers) {
            res.render("secrets", { userswithSecrets: foundUsers });
        }
    } catch (err) {
        console.error(err);
        res.redirect("/error");
    }
});

    // if(req.isAuthenticated()){
    //     res.render("secrets");
    // } else {
    //     res.redirect("/login");
    // }
// });

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", async function(req, res) {
    if (req.isAuthenticated()) {
        const submittedSecret = req.body.secret;
        const userId = req.user.id;

        try {
            const foundUser = await User.findById(userId);

            if (foundUser) {
                foundUser.secret = submittedSecret;
                await foundUser.save();
                res.redirect("/secrets");
            }
        } catch (err) {
            console.error(err);
      
            res.redirect("/error");
        }
    } else {
        res.redirect("/login");
    }
});



app.get("/logout", function(req, res){
     res.redirect("/");
});

app.post("/register", async function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });

    // bcrypt.hash(req.body.password, saltRounds=10, async function(err, hash) {
    //     const newuser = new User ({
    //         email:req.body.username,
    //         password: hash
    //     });
    //     console.log(newuser);
    //     try{
    //       await newuser.save();
    //      res.render("secrets");
               
    //         }catch (err){
    //             console.error(err);
    //         } 
    // });
  
           
    });  

    app.post("/login", async function(req, res){

        const user = new User({
            username: req.body.username,
            password: req.body.password 
        });

        req.login(user, function(err){
            if(err){
                console.log(err);
            }else {
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets");
                });
            }
        });
        // const username = req.body.username;
        // const password = req.body.password;
    
        // try {
        //     const foundUser = await User.findOne({email: username});
        //     // console.log("hiiiii",foundUser);
        //     if (foundUser) {
        //         bcrypt.compare(password, foundUser.password, function(err, result) {
        //             if (result === true) {
        //                 res.render("secrets");
        //             } else {
        //                 res.render("login", {error: "Invalid username or password"});
        //             }
        //         });
        //     } else {
        //         res.render("login", {error: "Invalid username or password"});
        //     }
        // } catch (err) {
        //     console.error(err);
        // }
    });
    
     


app.listen(3000, function(){
    console.log("Server running on port 3000.");
});