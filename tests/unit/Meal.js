require("../../models/User");
require("../../models/Meal");
var mongoose = require("mongoose");
var Meal = mongoose.model("Meal");
const expect = require("chai").expect;

describe("Meal", function() {
  it("should generate an id", function(done) {
    var meal = new Meal();

    meal.generateId();
    expect(meal.generateId).to.exist.and.to.be.string;
    done();
  });

  it("should be calculate hours correctly", function(done) {
    const now = new Date();
    var meal = new Meal({ datetime: now });

    meal.generateHour();
    expect(meal.hour).to.be.equal(now.getHours());
    done();
  });

  it("defaults should behave as expected", function(done) {
    var meal = new Meal();

    expect(meal.calories).to.equal(0);
    expect(meal.hour).to.equal(0);
    done();
  });
});
