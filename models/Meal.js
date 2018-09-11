var mongoose = require('mongoose');
var User = mongoose.model('User');
var randomString = require('randomstring');

var MealSchema = new mongoose.Schema({
  id: {type: String, lowercase: true, unique: true},
  datetime: Date,
  text: String,
  calories: {type: Number, default: 0},
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {timestamps: true});

ArticleSchema.pre('validate', function(next){
  if(!this.id)  {
    this.generateId();
  }

  next();
});

ArticleSchema.methods.generateId = function() {
  this.id = randomString.generate({ length : 30 });
};

// Check if id should be here
MealSchema.methods.toJSONFor = function(user){
  return {
    id: this.id,
    text: this.text,
    calories: this.calories,
    datetime: this.datetime,
    author: this.author.toProfileJSONFor(user)
  };
};

mongoose.model('Meal', MealSchema);
