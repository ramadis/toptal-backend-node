var mongoose = require("mongoose");
var router = require("express").Router();
var passport = require("passport");
var User = mongoose.model("User");
var randomString = require('randomstring');
var auth = require("../auth");
var mailer = require("../../config/sendgrid");

function sendVerificationMessage(user) {
  return new Promise(function(res, rej) {
    const msg = {
      to: user.email,
      from: "contact@jant.com",
      subject: "One step more to start counting your calories...",
      text: "Just validate your account with token: " + user.verificationToken,
      html: "Validate your account with token: " + user.verificationToken
    };

    mailer.send(msg).then(res);
  });
}

function sendInviteMessage(user) {
  return new Promise(function(res, rej) {
    const msg = {
      to: user.email,
      from: "contact@jant.com",
      subject: "Invited to maximo virgolini's app",
      text: "Continue your registration with the token: " + user.verificationToken,
      html: "Continue your registration with the token: " + user.verificationToken
    };

    mailer.send(msg).then(res);
  });
}

router.get("/user", auth.required, function(req, res, next) {
  User.findById(req.payload.id)
    .then(function(user) {
      if (!user) {
        return res.sendStatus(401);
      }

      return res.json({ user: user.toAuthJSON() });
    })
    .catch(next);
});

router.patch("/users/validate", function(req, res, next) {
  if (!req.query.vtk) return res.sendStatus(401);

  User.findOne({ verificationToken: req.query.vtk })
    .then(function(user) {
      if (!user) return res.sendStatus(401);
      user.verify();
      user.save().then(function() {
        return res.status(200).json(user.toAuthJSON());
      });
    })
    .catch(next);
});

router.patch("/users/invited", function(req, res, next) {
  if (!req.query.vtk) return res.sendStatus(401);

  if (!req.body.user.username) {
    return res.status(422).json({ errors: { username: "can't be blank" } });
  }

  if (!req.body.user.password) {
    return res.status(422).json({ errors: { password: "can't be blank" } });
  }

  User.findOne({ verificationToken: req.query.vtk })
    .then(function(user) {
      if (!user) return res.sendStatus(401);
      user.verify();
      user.username = req.body.user.username;
      user.setPassword(req.body.user.password);

      user.save().then(function() {
        return res.status(200).json(user.toAuthJSON());
      });
    })
    .catch(next);
});

// TODO: Only admins
router.post("/users/invite", function(req, res, next) {
  var user = new User();

  user.email = req.body.user.email;
  user.username = randomString.generate({ length: 50 });
  user.setVerificationToken();
  
  user
    .save()
    .then(function() {
      sendInviteMessage(user);
      return res.sendStatus(201);
    })
    .catch(next);
});

// TODO: Only admins and managers
router.patch("/users/unlock", function(req, res, next) {
  if (!req.body.user || !req.body.user.username) return res.sendStatus(404);

  User.findOne({ username: req.body.user.username })
    .then(function (user) {
      user.resetBlocking();
      return user.save().then(function() {
        return res.sendStatus(200);
      })
    }).catch(next);
});

router.put("/user", auth.required, function(req, res, next) {
  User.findById(req.payload.id)
    .then(function(user) {
      if (!user) {
        return res.sendStatus(401);
      }

      // only update fields that were actually passed...
      if (typeof req.body.user.username !== "undefined") {
        user.username = req.body.user.username;
      }
      if (typeof req.body.user.email !== "undefined") {
        user.email = req.body.user.email;
      }
      if (typeof req.body.user.bio !== "undefined") {
        user.bio = req.body.user.bio;
      }
      if (typeof req.body.user.image !== "undefined") {
        user.image = req.body.user.image;
      }
      if (typeof req.body.user.expectedCalories !== "undefined") {
        user.expectedCalories = req.body.user.expectedCalories;
      }
      if (typeof req.body.user.password !== "undefined") {
        user.setPassword(req.body.user.password);
      }

      return user.save().then(function() {
        return res.json({ user: user.toAuthJSON() });
      });
    })
    .catch(next);
});

router.post("/users/login", function(req, res, next) {
  // TODO: Check if user is verified

  if (!req.body.user.email) {
    return res.status(422).json({ errors: { email: "can't be blank" } });
  }

  if (!req.body.user.password) {
    return res.status(422).json({ errors: { password: "can't be blank" } });
  }

  passport.authenticate("local", { session: false }, function(err, user, info) {
    if (err) {
      return next(err);
    }

    if (user) {
      user.token = user.generateJWT();
      return res.json({ user: user.toAuthJSON() });
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

router.post("/users", function(req, res, next) {
  var user = new User();

  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.setPassword(req.body.user.password);
  user.setVerificationToken();

  user
    .save()
    .then(function() {
      sendVerificationMessage(user);
      return res.sendStatus(201);
    })
    .catch(next);
});

// TODO: Only admins and managers
router.get("/users", function(req, res, next) {
  
  User.find({}).then(function (users) {
    return res.status(200).json(users.map(function (user) { return user.toProfileJSONFor(null)}));
  }).catch(next);
});

module.exports = router;
