var express  = require('express');
var router = express.Router();
var Post = require('../models/Post');
var Member = require('../models/Member');
var Comment = require('../models/Comment'); 
var util = require('../util');
var moment = require('moment'); require('moment-timezone');
var util = require('../util');
moment.tz.setDefault("Asia/Seoul");


// Index
router.get('/', function(req, res){
  let member = req.user;
  var p =Math.max(1,req.query.p);
  var limit = 10;
  Post.count({},function(err,count){
    if(err) return res.json({success:false, message:err});
    var skip = (p-1)*limit;
    Post.find({})
      .populate('author')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .exec(function(err, posts){
        if(err) return res.json(err);
        res.render('posts/index', {posts:posts, moment:moment, member :member, p:p});
    });
});
});


// New
router.get('/new', util.isLoggedin, function(req, res){
  let member = req.user;
  var post = req.flash('post')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('posts/new', { post:post, errors:errors, member:member});
});

// create
router.post('/new', util.isLoggedin, function(req, res){
  req.body.author = req.user._id;
  Post.create(req.body, function(err, post){
    if(err){
      req.flash('post', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/posts/new');
    }
    res.redirect('/posts?p=1');
  });
});

// show
router.get('/:id', function(req, res){
  let member = req.user;

  var commentForm = req.flash('commentForm')[0] || {_id: null, form: {}};
  var commentError = req.flash('commentError')[0] || { _id:null, parentComment: null, errors:{}};

  


    Promise.all([
      Post.findOne({_id:req.params.id}).populate('author'),
      Comment.find({post:req.params.id}).sort('createdAt').populate('author')
    ])
    .then(([post, comments]) => {
      res.render('posts/show', { post:post,  moment:moment, member:member, comments:comments, commentForm:commentForm, commentError:commentError});
    })
    .catch((err) => {
      console.log('err: ', err);
      return res.json(err);
    });
  
    
});

// edit
router.get('/:id/edit', util.isLoggedin, checkPermission, function(req, res){
  let member = req.user;
  Post.findOne({_id:req.params.id}, function(err, post){// 해당 게시글 ID를 조회하여 수정한다.
    if(err) return res.json(err);
    res.render('posts/edit', {post:post, member:member});
  });
});

// update
router.post('/:id/edit',util.isLoggedin, checkPermission, function(req, res){
  req.body.updatedAt = Date.now();
  console.log(req.body);
  Post.findOneAndUpdate({_id:req.params.id}, req.body, function(err, post){ // 게시글 ID를 이용하여 해당 게시글 수정사항을 적용시킨다.
    if(err) return res.json(err);
    res.redirect("/posts/"+req.params.id);
  });
});

// destroy
router.post('/:id', util.isLoggedin, checkPermission, function(req, res){
  Post.deleteOne({_id:req.params.id}, function(err){ // 게시글 ID를 이용하여 해당 게시글을 삭제한다.
    if(err) return res.json(err);
    res.redirect('/posts?p=1');
  });
});

module.exports = router;


// private functions // 1
function checkPermission(req, res, next){
  Post.findOne({_id:req.params.id}, function(err, post){ // 권한을 설정할때 게시글의 ID를 이용하여 작성자와 수정자가 맞는지 확인한다.
    if(err) return res.json(err);
    if(post.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}
