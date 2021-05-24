var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy; // 1
var Member = require('../models/Member');

// serialize & deserialize User // 2
passport.serializeUser(function(member, done) {
  done(null, member.id);
});
passport.deserializeUser(function(id, done) {
  Member.findOne({_id:id}, function(err, member) {
    done(err, member);
  });
});

// local strategy // 3
passport.use('local-login',
  new LocalStrategy({
      usernameField : 'email', // 3-1
      passwordField : 'password', // 3-1
      passReqToCallback : true
    },
    function(req, email, password, done) { // 3-2
      Member.findOne({email:email})
        .select({password:1})
        .exec(function(err, member) {
          if (err) return done(err);

          if (member && member.authenticate(password)){ // 3-3
            return done(null, member,{
              message :' 환영합니다. '
            });
          }
          else {
            return done(null, false,{
              message:'아이디나 비밀번호가 틀립니다. 다시시도하세요.'
            });
          }
        });
    }
  )
);

module.exports = passport;
