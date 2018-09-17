require("../../models/User");
var mongoose = require("mongoose");
var User = mongoose.model("User");
const expect = require("chai").expect;

describe("User", function() {
  it("should be invalid if username is empty", function(done) {
    var user = new User();

    const err = user.validateSync();
    expect(err.errors.username).to.exist;
    done();
  });

  const invalidChars = ["!", "#", "@", " ", "/", "\\"];
  invalidChars.forEach(invalidChar => {
    it("should be invalid if username contains " + invalidChar, function(done) {
      var user = new User({ username: invalidChar });

      const err = user.validateSync();
      expect(err.errors.username).to.exist;
      done();
    });
  });

  it("should be invalid if email is not valid", function(done) {
    var user = new User({ email: "notvalidemail" });

    const err = user.validateSync();
    expect(err.errors.email).to.exist;
    done();
  });

  it("defaults should behave as expected", function(done) {
    var user = new User({ username: "test" });

    expect(user.expectedCalories).to.equal(1800);
    expect(user.blocking).to.equal(0);
    expect(user.roles).to.eql(["regular"]);
    expect(user.bio).to.equal(
      "I'm a human being who loves easy calorie counting!"
    );
    done();
  });

  it("should increase blocking", function(done) {
    var user = new User({ blocking: 2 });

    user.increaseBlocking();
    expect(user.blocking).to.be.equal(3);

    done();
  });

  it("should unblock", function(done) {
    var user = new User({ blocking: 2 });

    expect(user.blocking).to.be.equal(2);

    user.resetBlocking();
    expect(user.blocking).to.be.equal(0);

    done();
  });

  it("should verify", function(done) {
    var user = new User();

    expect(user.verified).to.be.undefined;

    user.verify();

    expect(user.verified).to.be.equal(true);

    done();
  });

  it("should work with password", function(done) {
    var user = new User();

    user.setPassword("secret");

    expect(user.validPassword("secret")).to.be.equal(true);

    done();
  });
});
