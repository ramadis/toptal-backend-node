var mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");
var crypto = require("crypto");
var jwt = require("jsonwebtoken");
var secret = require("../config").secret;
var randomString = require("randomstring");

var UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      match: [/^[a-zA-Z0-9]+$/, "is invalid"],
      index: true
    },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, "is invalid"],
      index: true
    },
    bio: {
      type: String,
      default: "I'm a human being who loves easy calorie counting!"
    },
    blocking: { type: Number, default: 0 },
    image: String,
    verificationToken: String,
    expectedCalories: { type: Number, default: 1800 },
    verified: Boolean,
    facebookId: String,
    githubId: String,
    roles: { type: Array, default: ["regular"] },
    hash: String,
    salt: String
  },
  { timestamps: true }
);

UserSchema.plugin(uniqueValidator, { message: "is already taken." });

UserSchema.methods.validPassword = function(password) {
  var hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, "sha512")
    .toString("hex");
  return this.hash === hash;
};

UserSchema.methods.setVerificationToken = function() {
  var verificationToken = randomString.generate({ length: 64 });
  this.verificationToken = verificationToken;
};

UserSchema.methods.resetBlocking = function() {
  this.blocking = 0;
};

UserSchema.methods.increaseBlocking = function() {
  this.blocking++;
};

UserSchema.methods.verify = function() {
  this.verified = true;
};

UserSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, "sha512")
    .toString("hex");
};

UserSchema.methods.generateJWT = function() {
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      roles: this.roles,
      exp: parseInt(exp.getTime() / 1000)
    },
    secret
  );
};

UserSchema.methods.toAuthJSON = function() {
  return {
    username: this.username,
    email: this.email,
    token: this.generateJWT(),
    bio: this.bio,
    roles: this.roles,
    expectedCalories: this.expectedCalories,
    image: this.image || "https://static.productionready.io/images/smiley-cyrus.jpg"
  };
};

UserSchema.methods.toProfileJSONFor = function() {
  return {
    username: this.username,
    bio: this.bio,
    blocking: this.blocking,
    roles: this.roles,
    expectedCalories: this.expectedCalories,
    image:
      this.image || "https://static.productionready.io/images/smiley-cyrus.jpg"
  };
};

mongoose.model("User", UserSchema);
