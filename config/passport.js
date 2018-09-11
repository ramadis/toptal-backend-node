var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy,
  FacebookStrategy = require("passport-facebook").Strategy;
var mongoose = require("mongoose");
var User = mongoose.model("User");
var API = require('../config').API;

passport.use(
  new LocalStrategy(
    {
      usernameField: "user[email]",
      passwordField: "user[password]"
    },
    function(email, password, done) {
      User.findOne({ email: email })
        .then(function(user) {
          if (!user) {
            return done(null, false, {
              errors: { "email or password": "is invalid" }
            });
          }

          if (!user.verified) {
            return done(null, false, {
              errors: { verified: "User not verified with email" }
            });
          }

          if (!user.validPassword(password)) {
            user.increaseBlocking();
            return user.save().then(function() {
              return done(null, false, {
                errors: { "email or password": "is invalid" }
              });
            });
          }

          if (user.blocking >= 3)
            return done(null, false, {
              errors: {
                blocking:
                  "The account is locked due to 3 invalid login attemps in a row"
              }
            });

          user.resetBlocking();
          return user.save().then(function() {
            return done(null, user);
          });
        })
        .catch(done);
    }
  )
);

passport.use(
  // TODO: continue this;
  new FacebookStrategy(
    {
      clientID: "[FBID]",
      clientSecret: "[FBSECRET]",
      callbackURL: API + "/facebook-token"
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOrCreate({ facebookId: profile.id }).then(function() {

      })
    }
  )
);
