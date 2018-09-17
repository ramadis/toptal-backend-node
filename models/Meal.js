var mongoose = require('mongoose');
var User = mongoose.model('User');
var randomString = require('randomstring');

var MealSchema = new mongoose.Schema({
  id: {type: String, lowercase: true, unique: true},
  datetime: Date,
  hour: { type: Number, default: 0 },
  text: String,
  calories: {type: Number, default: 0},
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {timestamps: true});

MealSchema.pre('validate', function(next){
  if(!this.id)  {
    this.generateId();
    this.generateHour();
  }

  next();
});

MealSchema.methods.generateHour = function() {
  this.hour = new Date(this.datetime).getHours();
};

MealSchema.methods.generateId = function() {
  this.id = randomString.generate({ length : 30 });
};

// Check if id should be here
MealSchema.methods.toJSON = function(){
  return {
    id: this.id,
    text: this.text,
    calories: this.calories,
    datetime: this.datetime,
    author: this.author.toProfileJSONFor()
  };
};

mongoose.model('Meal', MealSchema);
