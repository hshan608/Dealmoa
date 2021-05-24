var express = require('express');

var router = express.Router();
const nodemailer = require('nodemailer');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var session = require('express-session');
var JSAlert = require("js-alert");
var passport = require('../config/passport');
var bodyParser = require('body-parser');
var Member = require('../models/Member');
var crypto = require('crypto');
var randomstring = require("randomstring");
var Post = require('../models/Post');
var Like = require('../models/Like');
var moment = require('moment'); require('moment-timezone');
var util = require('../util');
moment.tz.setDefault("Asia/Seoul");
const { totalmem } = require('os');
const { title } = require('process');
const { start } = require('repl');

const convert = require('xml-js');  //새로추가
const iconv = require("iconv-lite"); //새로추가








 /* naver api */
var client_id = 'K3pfuWt6HY25WTRh5l5i';
var client_secret = 'XPcSUwfXW6';
var obj=[];
var item=[];

/*11번가 api*/
var st11_key = '8470a641840d1947ba87c18d130d1def';
var obj11=[];
var item11=[];







// -----------라우팅 ------------------------ //
 router.get( '/', function ( req, res ) {
   res.redirect('/HOME');
});

router.get( '/HOME', async function ( req, res ) { // 메인화면
  let likes = await Like.find({}); // 좋아요한 상품을 전체 검색
  let posts = await Post.find({}); // 게시글을 전체 검색
  let member = req.user; // 현재 로그인중인 사용자 정보
  res.render('index', {posts:posts, likes :likes, member:member}); // 메인화면으로 상품, 게시글, 접속회원정보 전달
});


/* 메인화면 네이버검색 */
router.post('/HOME', function (req, res) {
  var query = req.body.query;
  res.redirect('/naversearch?query='+query+'&sort=asc&p=1&search=all');
  //res.redirect('/naversearch?query='+query+'&sort=sim&p=1');
 });



router.get( '/mypage', function (req,res,next) {
  if(req.isAuthenticated()) { // 로그인되어있는 사용자면 mypage로
    return next();
  }
  return res.redirect('/login'); // 로그인 사용자가 아닐시 login 페이지

},  function ( req, res ) {

  const member = req.user; // 현재 접속중인 사용자 정보
  console.log("[index.js] mypage user -> ",member);
  res.render('mypage', { // 마이페이지에 해당 사용자의 정보를 전달한다.
    member : member
  });
});

router.post('/mypage', function(req,res){
  let member = req.user; // 현재 접속중인 사용자 정보
  if(req.body.chpw && req.body.cfpw){ // 비밀번호와 변경 비밀번호가 존재할 경우
    if(req.body.chpw == req.body.cfpw){ // 비밀번호와 변경 비밀번호가  일치할 경우
      member.password = req.body.chpw; // 사용자의 비밀번호 변경
      member.save(function(err,member){ // DB에 해당 정보 변경
        if(err){
          return res.redirect('/mypage');
        }
      });
    res.redirect('/changesuccess');
  }else{  // 틀릴시
    res.send('<script>alert("비밀번호가 틀립니다.");location.href="/mypage";</script>'); // 알람 발생
  }
  }else{
    return res.redirect('/mypage'); // 마이페이지로 다시이동
  }
})

router.get('/changesuccess',function(req, res){ // 비밀번호 변경 성공
  let member = req.user;
  res.render('changepw',{member :member});
})

router.get('/logout', function(req, res){ // 로그아웃
  req.logout(); // 세션 아웃
  res.send('<script>alert("로그아웃 되었습니다.");location.href="/";</script>'); // 로그아웃 알람 발생
});
router.get( '/login', function ( req, res ) {
  let flashMessage = req.flash(); // 로그인 실패시 flash 메시지 전달을 위해 선언
  res.render('login',{flashMessage: flashMessage} );
});

router.post('/login', function(req,res,next){ // 로그인 시도
    var errors = {}; // 에러가 발생할시 문구를 담을 변수
    var isValid = true; // 유효성 검사
    if(!req.body.email){ // 이메일이 없을시
      isValid = false;
      errors.email = 'Username is required!'; // 에러 발생
    }
    if(!req.body.password){
      isValid = false; // 패스워드가 없을시
      errors.password = 'Password is required!';
    }
    if(isValid){
      next();
    } // 문제 생김1
    else {
      // req.flash('errors',errors);
      res.redirect('/login');
    }
  },
  passport.authenticate('local-login', { // passport를 이용하여 로그인 성공시와 실패시 응답을 생성.
    successRedirect : '/home',
    successFlash : true,
    failureRedirect : '/login',
    failureFlash : true
  }
));
router.get( '/join', function ( req, res ) {
  res.render('join');
});

router.get( '/pwfind', function ( req, res ) { // 비밀번호찾기페이지.
  res.render('pwfind');
});

router.post('/pwfind', async function(req, res, next){
  try{
    let email = req.body.email;  // 사용자가 입력한 이메일 변수 선언.

    let member = await Member.findOne({email : req.body.email}); // 해당 사용자의 아이디로 DB 검색.
    if(!member){
      res.redirect('/pwfind'); // 회원정보가 없을시 접근불가.
    }
    let changepw = randomstring.generate(6); // 랜덤 난수 발생.

    let transporter = nodemailer.createTransport({ // nodemailer를 이용하여 메일 전송.
      service : 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth : {
        user : 'hshan12345@gmail.com',
        pass : 'zwdvlwutdsyorvxe'
      }
    });
    let mailOption ={
      from : 'hshan12345@gmail.com',
      to : email,
      subject : '[딜모아] 회원님의 요청하신 비밀번호 입니다.',
      text : changepw +'입니다. 로그인후 비밀번호를 꼭 바꿔주세요!' // 변경된 비밀번호 전달.
    };

    transporter.sendMail(mailOption, function(error, info){
      if (error){
        console.log(error);
      }
      else{
        console.log('Email sent');
      }
    });
    member.password = changepw; // DB의 비밀번호를 생성난수로 변경한다.
    member.save(function(err,member){
      if(err){
        return res.redirect('/pwfind');
      }
    });
    res.redirect('/pwfindsuccess');
  } catch(error) {
    next(error);
  }
})
router.get('/pwfindsuccess', function(req, res){
  let member = req.user;
  res.render('findpwsuccess',{member : member});
})


router.post( '/join', function( req, res ) {
    var memberInfo = req.body; //Get the parsed information
    var exptext = /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-Za-z0-9\-]+/;
    Member.findOne({email : req.body.email}, function(err, obj){
      var member = obj;
     if(exptext.test(memberInfo.email)==false){ //이메일 형식이 알파벳+숫자@알파벳+숫자.알파벳+숫자 형식이 아닐경우
      return res.send('<script>alert("이메일이 형식에 맞지 않습니다. 다시 확인해주세요");location.href="/join";</script>');
     }
      if ( !memberInfo.email || !memberInfo.name || !memberInfo.nick || !memberInfo.password || !memberInfo.passwordConfirmation ) {
        return res.send('<script>alert("정보를 잘못 입력하셨습니다. 다시 확인해주세요");location.href="/join";</script>');
      }else if (memberInfo.password != memberInfo.passwordConfirmation) {
        return res.send('<script>alert("비밀번호가 틀립니다. 다시 확인해주세요");location.href="/join";</script>');
        }
        if(member){
          return res.send('<script>alert("중복된 정보가 있습니다. 다시 확인해주세요");location.href="/join";</script>');
        }
        else{
          var newMember = new Member( { // 새로운 회원 생성.
              email : memberInfo.email,
              name : memberInfo.name,
              nick : memberInfo.nick,
              password : memberInfo.password,
          } );
          Member.create(newMember, function( error, user ) {
              if ( error ) {
                return res.send('<script>alert("중복된 정보가 있습니다. 다시");location.href="/join";</script>');
              }
              else {
                return res.send('<script>alert("회원가입이 완료되었습니다! 로그인페이지로 이동합니다.");location.href="/login";</script>');
              }
          } );
        }
    });

} );




/* naver,11번가 검색결과 */
router.get('/naversearch', function(req, res){
  var img = req.member
  let member = req.user;
  var query=req.query.query;
  var sort = req.query.sort;
  var p = req.query.p;
  var search = req.query.search;
  var api_url = 'https://openapi.naver.com/v1/search/shop.json';
  var request = require('request');
  var p =Math.max(1,req.query.p);
  var display = 50;
  if(p==1){
    skip=0;
  }else{
  var skip = (p-1)*12;
  };
  var options = {
      url: api_url,
      headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret},
      method : 'get',
      encoding : "utf-8",
      qs:{
        query : query,
        display : display

      }
   };

   const SERVICE_KEY = '8470a641840d1947ba87c18d130d1def'
   console.log(query);
   var requestUrl = 'http://openapi.11st.co.kr/openapi/OpenApiService.tmall?key='+SERVICE_KEY+'&apiCode=ProductSearch&keyword='+encodeURI(query)+'&pageSize=50&sortCd=CP';
   var options11 = {
     url: requestUrl,
     method : 'get',
     encoding : null,
   };

 request.get(options11, function(err,response,body2) {         //11번가 api받아오기
    function renameKey ( obj, oldKey, newKey ) {  //key변경 함수
    obj[newKey] = obj[oldKey];
    delete obj[oldKey];
    }
    function re11st ( obj) {                     //11번가 객체변경 함수
      obj.title = obj.title._cdata;
      obj.image = obj.image._cdata;
      obj.link = obj.link._cdata;
      obj.mallName = obj.mallName._cdata;
      obj.lprice = obj.lprice._text;
      }

     if(err){
         console.log(`err => ${err}`);
     }
     else {
         if(response.statusCode == 200){
             var i_result = iconv.decode(body2, 'cp949');
             var result = i_result;
             var xmlToJson = convert.xml2json(result, {compact: true, spaces: 4});
             obj11 = JSON.parse(xmlToJson);
             item11=obj11.ProductSearchResponse.Products.Product;

            if(item11==null){                                                      //검색결과가 없을때 에러제거
               console.log("11번가 검색 결과 없음!");


            }else{
              console.log(item11);
               item11.forEach( obj => renameKey( obj, 'ProductName', 'title' ) );       //상품명변환
               item11.forEach( obj => renameKey( obj, 'ProductImage300', 'image' ) );   //이미지변환
               item11.forEach( obj => renameKey( obj, 'DetailPageUrl', 'link' ) );      //링크변환
               item11.forEach( obj => renameKey( obj, 'SellerNick', 'mallName' ) );       //판매자변환
               item11.forEach( obj => renameKey( obj, 'SalePrice', 'lprice' ) );        //가격변환
               item11.forEach(re11st);
            }








             request.get(options, function (error, response, body) {             //네이버api받아오기
              if (!error && response.statusCode == 200) {
                obj = JSON.parse(body);
                item = obj.items;




               console.log(item);
               //console.log(skip);


               if(search=="all") {

                Array.prototype.push.apply(item,item11);   //객체결합

                if(sort=="dsc"){
                  item.sort(function (a,b){
                    return b.lprice-a.lprice;
                  })
                }else{
                  item.sort(function (a,b){
                    return a.lprice - b.lprice;
                  })

                }

                res.render('Nsearch',{
                  data : item,
                  member :member,
                  query : query,
                  sort : sort,
                  a:skip,
                  p:p,
                  search:search
                });


               }else if(search=="11st"){                  //11번가만 검색


                  res.render('Nsearch',{
                  data : item11,
                  member :member,
                  query : query,
                  sort : sort,
                  a:skip,
                  p:p,
                  search:search
                });

               }else if(search=="naver"){         //네이버만 검색

                res.render('Nsearch',{
                  data : item,
                  member :member,
                  query : query,
                  sort : sort,
                  a:skip,
                  p:p,
                  search:search
                });
               }



              }
              else {

                res.status(response.statusCode).end();
                console.log('error = ' + response.statusCode);
             }
            });


         }

     }
 });






  });



  router.post('/naversearch?', function (req, res) {
    var query = req.body.query;
    var i = req.body.i;


    res.redirect('/naversearch?query='+query+'&sort=asc&p=1&search=all');

   });



/*공유게시판 작성*/

var num=0;
router.get('/sharewrite', util.isLoggedin, function(req, res, next){
  num=req.query.id;
  res.render('write',{
    data : item[num]
  });
});



router.post('/sharewrite', function(req, res){
  const member = req.user;
  console.log(req.body);
  var newlike = new Like( { // 새로운 좋아요 목록 생성.
    title : req.body.title,
    picture : req.body.img,
    comment : req.body.comment,
    lprice : req.body.lprice,
    link : req.body.link,
    nick : member.nick
  } );
  Like.create(newlike, function( error, user ) {// DB상에 생셩.
      if ( error ) {
        return res.render( 'write', {data : item[num]} );
      }
      else {
        return res.redirect('/home');
      }
  } );
});


router.get( '/nlike', async  function ( req, res ) {
    let member = req.user;
    var p =Math.max(1,req.query.p);
    var limit = 12; //12개만 보여주기위한 변수 선언.
    Like.count({},function(err,count){
      if(err) return res.json({success:false, message:err});
      var skip = (p-1)*limit;
      Like.find({})//최신 좋아요 목록부터 보여주기 위한 sort
        .populate('author')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .exec(function(err, likes){
          if(err) return res.json(err);
          console.log(likes.length);
          res.render('nlike', {likes:likes, member :member, p:p});
        });
    });
});


router.get('/mylike', util.isLoggedin, async function(req,res){
  let member = req.user; // 유저 정보 변수
  let usernick = member.nick; // 유저의 닉네임 변수
  var p =Math.max(1,req.query.p);
  var limit = 12;
  Like.count({},function(err,count){
    if(err) return res.json({success:false, message:err});
    var skip = (p-1)*limit;
    Like.find({nick :usernick}) // 해당 유저의 좋아요 목록만 조회하여 반환한다.
      .populate('author')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .exec(function(err, likes){
        if(err) return res.json(err);
        console.log(likes.length);
        res.render('mylike', {likes:likes, member :member, p:p});
      });
  });
});

router.post('/mylike/:id', util.isLoggedin, async function(req,res){
  Like.deleteOne({_id:req.params.id}, function(err){//삭제한 상품을 DB상에서 제거하는 명령.
    if(err) return res.json(err);
    res.redirect('/mylike?p=1');
  });
});

router.get('/mypost',util.isLoggedin, async function(req,res){
  let member = req.user;
  let usernick = member._id;
  var p =Math.max(1,req.query.p);
  var limit = 10;
  Post.count({},function(err,count){
    if(err) return res.json({success:false, message:err});
    var skip = (p-1)*limit;
    Post.find({author : usernick})// 자신의 게시글 목록만 조회하여 반환한다.
      .populate('author')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .exec(function(err, posts){
        if(err) return res.json(err);
        console.log(posts);
        res.render('mypost', {posts:posts, moment :moment,member :member, p:p});
    });
});
});

module.exports = router;
