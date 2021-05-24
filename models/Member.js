// models/User.js

var mongoose = require('mongoose');
var bcrypt = require("bcrypt-nodejs");
var SALT_FACTOR = 10;
// schema // 1
var memberSchema = mongoose.Schema( {
    email:{
      type : String,
      required:[true,'Username is required!'],
      trim:true,
      unique : true
    },
    name: { type : String, required:true},

    nick: String,

    password : {
    type:String,
    },
    displayName :String,
    bio :String
} );

// 암호화
memberSchema.pre("save",function(next){
  var member = this;
  if(!member.isModified("password")){
    return next();
  } else {
    member.password = bcrypt.hashSync(member.password);
    return next();
  }
});
// 암호 확인
memberSchema.methods.authenticate = function (password) {
  var member = this;
  return bcrypt.compareSync(password,member.password);
};


var Member = mongoose.model('member',memberSchema);
module.exports = Member;
