var mongoose = require('mongoose');

var likeSchema = mongoose.Schema({
  nick :{type:String},
  title:{type:String},
  picture:{type:String},
  comment :{type:String},
  lprice :{type : String},
  createdAt:{type:Date, default:Date.now},
  link :{type : String}
});


var Like = mongoose.model('like',likeSchema);
module.exports = Like;
