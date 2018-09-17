var router = require('express').Router();
var mongoose = require('mongoose');
var Meal = mongoose.model('Meal');
var User = mongoose.model('User');
var auth = require('../auth');
var asyncGetCalories = require('../../config/nutrionix');
var hasRoles = require("../authorization");
var { withDateFilters } = require("../filters");

// Preload meal objects on routes with ':meal'
router.param('meal', function(req, res, next, id) {
  Meal.findOne({ id: id})
    .populate('author')
    .then(function (meal) {
      if (!meal) { return res.sendStatus(404); }

      req.meal = meal;

      return next();
    }).catch(next);
});

router.get('/', auth.required, hasRoles(['admin']), function(req, res, next) {
  var query = {};
  var limit = 20;
  var offset = 0;

  if(typeof req.query.limit !== 'undefined'){
    limit = req.query.limit;
  }

  if(typeof req.query.offset !== 'undefined'){
    offset = req.query.offset;
  }

  if( typeof req.query.tag !== 'undefined' ){
    query.tagList = {"$in" : [req.query.tag]};
  }

  Promise.all([
    req.query.author ? User.findOne({username: req.query.author}) : null,
    req.query.favorited ? User.findOne({username: req.query.favorited}) : null
  ]).then(function(results){
    var author = results[0];
    var favoriter = results[1];

    if(author){
      query.author = author._id;
    }

    if(favoriter){
      query._id = {$in: favoriter.favorites};
    } else if(req.query.favorited){
      query._id = {$in: []};
    }

    return Promise.all([
      Meal.find(query)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({createdAt: 'desc'})
        .populate('author')
        .exec(),
      Meal.count(query).exec(),
      req.payload ? User.findById(req.payload.id) : null,
    ]).then(function(results){
      var meals = results[0];
      var mealsCount = results[1];
      var user = results[2];

      return res.json({
        meals: meals.map(function(meal){
          return meal.toJSON();
        }),
        mealsCount: mealsCount
      });
    });
  }).catch(next);
});
router.get('/feed', auth.required, withDateFilters, function(req, res, next) {
  var limit = 20;
  var offset = 0;

  if(typeof req.query.limit !== 'undefined'){
    limit = req.query.limit;
  }

  if(typeof req.query.offset !== 'undefined'){
    offset = req.query.offset;
  }

  console.log('estamo en esto')


  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    console.log('estamo en esto')
    Promise.all([
      Meal.find(req.filters.datetime)
        .limit(Number(limit))
        .skip(Number(offset))
        .populate('author')
        .exec(),
      Meal.count(req.filters.datetime)
    ]).then(function(results){
      var meals = results[0];
      var mealsCount = results[1];

      return res.json({
        meals: meals.map(function(meal){
          return meal.toJSON();
        }),
        mealsCount: mealsCount
      });
    }).catch(next);
  });
});

router.post('/', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    var meal = new Meal(req.body.meal);
    meal.author = user;

    if (!meal.calories) {
      return asyncGetCalories(meal).then(function(calories) {
        if (!calories) return res.status(401).json({errors: { calories: "Field not completed" }});

        meal.calories = calories;

        return meal.save().then(function(){
          return res.json({meal: meal.toJSON()});
        });
      })
    }

    return meal.save().then(function(){
      return res.json({meal: meal.toJSON()});
    });
  }).catch(next);
});

// return a meal
router.get('/:meal', auth.required, function(req, res, next) {
  Promise.all([
    User.findById(req.payload.id),
    req.meal.populate('author').execPopulate()
  ]).then(function(results){

    if (req.payload.roles.includes('admin')) {
      return res.json({meal: req.meal.toJSON()});
    }

    if(req.meal.author._id.toString() === req.payload.id.toString()){
      var user = results[0];
      return res.json({meal: req.meal.toJSON()});
    } else {
      return res.sendStatus(401);
    }
  }).catch(next);
});

// update meal
router.put('/:meal', auth.required, function(req, res, next) {

  function updateMeal (user) {
    if(typeof req.body.meal.datetime !== 'undefined'){
      req.meal.datetime = req.body.meal.datetime;
    }

    if(typeof req.body.meal.calories !== 'undefined'){
      req.meal.calories = req.body.meal.calories;
    }

    if(typeof req.body.meal.text !== 'undefined'){
      req.meal.text = req.body.meal.text;
    }

    req.meal.save().then(function(meal){
      return res.json({meal: meal.toJSON()});
    }).catch(next);
  }

  User.findById(req.payload.id).then(function(user){
    if (req.payload.roles.includes('admin')) {
      return updateMeal(user)
    }

    if(req.meal.author._id.toString() === req.payload.id.toString()){
      return updateMeal(user);
    } else {
      return res.sendStatus(403);
    }
  });
});

// delete meal
router.delete('/:meal', auth.required, function(req, res, next) {

  function deleteMeal () {
    return req.meal.remove().then(function(){
      return res.sendStatus(204);
    });
  }
  
  if (req.payload.roles.includes('admin')) {
    return deleteMeal();
  }
  
  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    if(req.meal.author._id.toString() === req.payload.id.toString()){
      return deleteMeal();
    } else {
      return res.sendStatus(403);
    }
  }).catch(next);
});

module.exports = router;
