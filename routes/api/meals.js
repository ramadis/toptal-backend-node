var router = require('express').Router();
var mongoose = require('mongoose');
var Meal = mongoose.model('Meal');
var User = mongoose.model('User');
var auth = require('../auth');

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

router.get('/', auth.optional, function(req, res, next) {
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
          return meal.toJSONFor(user);
        }),
        mealsCount: mealsCount
      });
    });
  }).catch(next);
});

router.get('/feed', auth.required, function(req, res, next) {
  var limit = 20;
  var offset = 0;

  if(typeof req.query.limit !== 'undefined'){
    limit = req.query.limit;
  }

  if(typeof req.query.offset !== 'undefined'){
    offset = req.query.offset;
  }

  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    Promise.all([
      Meal.find({ author: {$in: user.following}})
        .limit(Number(limit))
        .skip(Number(offset))
        .populate('author')
        .exec(),
      Meal.count({ author: {$in: user.following}})
    ]).then(function(results){
      var meals = results[0];
      var mealsCount = results[1];

      return res.json({
        meals: meals.map(function(meal){
          return meal.toJSONFor(user);
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

    return meal.save().then(function(){
      console.log(meal.author);
      return res.json({meal: meal.toJSONFor(user)});
    });
  }).catch(next);
});

// return a meal
// TODO: Check a user can get only their own meals
router.get('/:meal', auth.optional, function(req, res, next) {
  Promise.all([
    req.payload ? User.findById(req.payload.id) : null,
    req.meal.populate('author').execPopulate()
  ]).then(function(results){
    var user = results[0];

    return res.json({meal: req.meal.toJSONFor(user)});
  }).catch(next);
});

// update meal
router.put('/:meal', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user){
    if(req.meal.author._id.toString() === req.payload.id.toString()){
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
        return res.json({meal: meal.toJSONFor(user)});
      }).catch(next);
    } else {
      return res.sendStatus(403);
    }
  });
});

// delete meal
router.delete('/:meal', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    if(req.meal.author._id.toString() === req.payload.id.toString()){
      return req.meal.remove().then(function(){
        return res.sendStatus(204);
      });
    } else {
      return res.sendStatus(403);
    }
  }).catch(next);
});

// Favorite an meal
router.post('/:meal/favorite', auth.required, function(req, res, next) {
  var articleId = req.meal._id;

  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    return user.favorite(articleId).then(function(){
      return req.meal.updateFavoriteCount().then(function(meal){
        return res.json({meal: meal.toJSONFor(user)});
      });
    });
  }).catch(next);
});

// Unfavorite an meal
router.delete('/:meal/favorite', auth.required, function(req, res, next) {
  var articleId = req.meal._id;

  User.findById(req.payload.id).then(function (user){
    if (!user) { return res.sendStatus(401); }

    return user.unfavorite(articleId).then(function(){
      return req.meal.updateFavoriteCount().then(function(meal){
        return res.json({meal: meal.toJSONFor(user)});
      });
    });
  }).catch(next);
});

// return an meal's comments
router.get('/:meal/comments', auth.optional, function(req, res, next){
  Promise.resolve(req.payload ? User.findById(req.payload.id) : null).then(function(user){
    return req.meal.populate({
      path: 'comments',
      populate: {
        path: 'author'
      },
      options: {
        sort: {
          createdAt: 'desc'
        }
      }
    }).execPopulate().then(function(meal) {
      return res.json({comments: req.meal.comments.map(function(comment){
        return comment.toJSONFor(user);
      })});
    });
  }).catch(next);
});

// create a new comment
router.post('/:meal/comments', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }

    var comment = new Comment(req.body.comment);
    comment.meal = req.meal;
    comment.author = user;

    return comment.save().then(function(){
      req.meal.comments.push(comment);

      return req.meal.save().then(function(meal) {
        res.json({comment: comment.toJSONFor(user)});
      });
    });
  }).catch(next);
});

router.delete('/:meal/comments/:comment', auth.required, function(req, res, next) {
  if(req.comment.author.toString() === req.payload.id.toString()){
    req.meal.comments.remove(req.comment._id);
    req.meal.save()
      .then(Comment.find({_id: req.comment._id}).remove().exec())
      .then(function(){
        res.sendStatus(204);
      });
  } else {
    res.sendStatus(403);
  }
});

module.exports = router;
