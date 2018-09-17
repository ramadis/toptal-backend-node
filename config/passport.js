var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy,
  FacebookStrategy = require("passport-facebook").Strategy,
  GitHubStrategy = require('passport-github').Strategy;

var mongoose = require("mongoose");
var User = mongoose.model("User");
var { API, fbAPP, fbSECRET, githubAPP, githubSECRET } = require("../config");

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
  new FacebookStrategy(
    {
      clientID: fbAPP,
      clientSecret: fbSECRET,
      callbackURL: API + "/users/login/facebook/cb",
      profileFields: ["id", "email", "picture.width(200).height(200)", "name"]
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({ facebookId: profile.id })
        .then(function(user) {
          if (user) return done(null, user);

          const newUser = new User();
          newUser.facebookId = profile.id;
          // TODO: Maybe there's already a user with this username, so we should be careful since it might not be possible to create this user.
          // This points need further investigation to understand the best way to handle this issue.
          newUser.username = profile.username || profile.id;
          newUser.image = profile.photos && profile.photos.length > 0 ? profile.photos[0] && profile.photos[0].value : null;
          newUser.email = profile.email;
          newUser.verified = true;

          newUser
            .save()
            .then(function(user) {
              done(null, user);
            })
            .catch(done);
        })
        .catch(done);
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: githubAPP,
      clientSecret: githubSECRET,
      callbackURL: API + "/users/login/github/cb",
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({ githubId: profile.id })
        .then(function(user) {
          if (user) return done(null, user);

          const newUser = new User();
          newUser.githubId = profile.id;
          // TODO: Maybe there's already a user with this username, so we should be careful since it might not be possible to create this user.
          // This points need further investigation to understand the best way to handle this issue.
          newUser.username = profile.username || profile.id;
          newUser.image = profile.photos && profile.photos.length > 0 ? profile.photos[0] && profile.photos[0].value : null;
          newUser.email = profile.email || (profile.emails && profile.emails.length >= 1 && profile.emails[0] && profile.emails[0].value);
          newUser.verified = true;

          newUser
            .save()
            .then(function(user) {
              done(null, user);
            })
            .catch(done);
        })
        .catch(done);
    }
  )
);