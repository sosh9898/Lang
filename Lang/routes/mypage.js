
const express = require('express');
const router = express.Router();
const secret = require('../config/jwt_secret');
const pool = require('../config/dbpool');
const async = require('async');
// const jwt = require('jsonwebtoken');

// jwt.verify(jwtToken, secret, (err, data) => {
//     	if (err){
//   		if(err.message === 'jwt expired') {
//       		console.log(err);
//       		console.log('expired token');
//     	}
//   		else if(err.message === 'invalid token') console.log('invalid token');
//  		 }
//   		else {
// 		    userToken = data.key1;
// 	}
// 	console.log(userToken);

//multer????
/*
aws.config.loadFromPath('./config/aws_config.json');

var s3 = new aws.S3();

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'targetsopt21th',
    acl: 'public-read',
    key: function (req, file, cb)
    {
      cb(null, Date.now() + '.' + file.originalname.split('.').pop());
    }
  })
});
*/

//테스트용
router.get('/', function(req, res, next) {
  res.send('respond with a resource mypage');
});


// 20. 내가 보는 마이 페이지
// 패키징 고치기

router.get('/:userToken', function(req, res){
//router.get('/', function(req, res) {
//  let userToken = req.headers.jwttoken;



  let userToken = req.params.userToken;


  let task = [

    //연결
    function(callback) {

      pool.getConnection(function(err, connection){
        if(err) {
          res.status(500).send( {
						status : "fail" ,
						message : "internal server err1 : connection err"
					});
					callback("getConnection err");
        } else{
          callback(null, connection);
        }
      });
    },


    //내 정보 받아오는 함수
    function(connection, callback){

      let mypageQuery = 'SELECT * FROM user WHERE user.user_id = ?';


      connection.query(mypageQuery, userToken, function(err, result){
        if(err){
          res.status(500).send( {
						status : "fail" ,
						message : "internal server err2 : mypageQuery err"
					});
					connection.release() ;
					callback( "Query err" ) ;
        }else{

          // mypageResult.myInfo[0].push(result[0]);
					callback( null , connection, result[0] ) ;
          console.log(result);
        }
      });
    },

    //팔로워수
    function (connection, result, callback){
      let followerNumQuery = 'SELECT COUNT(u_fr.user_follower_id) followerNum '+
      'FROM user_follower u_fr , user_following u_fg '+
      'WHERE u_fr.follower_id = u_fg.user_id '+
      'AND u_fr.user_id = u_fg.following_id '+
      'AND u_fr.user_id = ?';


      connection.query(followerNumQuery, userToken, function(err, result2){
        if(err){
          res.status(500).send( {
            status : "fail" ,
            message : "internal server err2 : myFollowerNum query err"
          });
          connection.release() ;
          callback( "Query err" ) ;
        }else{
          // if(!result2.length == 0){
             result.followerNum = result2[0].followerNum;
             // mypageResult.myFollowerNum.push(result2[0]);
             console.log(result);

          callback( null , connection, result ) ;

        }
      });
    },



    //팔로잉수
    function (connection, result, callback){
      let followingNumQuery = 'SELECT COUNT(u_fg.user_following_id) followingNum '+
      'FROM user_follower u_fr , user_following u_fg '+
      'WHERE u_fr.follower_id = u_fg.user_id '+
      'AND u_fr.user_id = u_fg.following_id '+
      'AND u_fg.user_id = ?';


      connection.query(followingNumQuery, userToken, function(err, result2){
        if(err){
          res.status(500).send( {
            status : "fail" ,
            message : "internal server err2 : myFollowingNum query err"
          });
          connection.release() ;
          callback( "Query err" ) ;
        }else{

          result.followingNum = result2[0].followingNum;
          // mypageResult.myFollowingNum.push(result2[0]);
         callback( null , connection, result ) ;
        //  console.log(result);
        }
      });
    },





    //내 모임수
    function (connection,result, callback){
      let meetingNumQuery = 'SELECT COUNT(m.meeting_id) meetingNum '+
      'FROM user u JOIN meeting_users m '+
      'ON u.user_id = m.user_id WHERE u.user_id = ?';


      connection.query(meetingNumQuery, userToken, function(err, result2){
        if(err){
          res.status(500).send( {
            status : "fail" ,
            message : "internal server err2 : myMeetingNum query err"
          });
          connection.release() ;
          callback( "Query err" ) ;
        }else{

          result.meetingNum = result2[0].meetingNum;
          // mypageResult.myMeetingNum.push(resut2[0]);

          callback( null , connection, result ) ;
        }
      });
    },

    //내 라운지 수
    function (connection,result, callback){
      let loungeNumQuery = 'SELECT COUNT(l.lounge_id) loungeNum '+
      'FROM user u JOIN lounge l '+
      'ON u.user_id = l.user_id WHERE u.user_id = ?';


      connection.query(loungeNumQuery, userToken, function(err, result2){
        if(err){
          res.status(500).send( {
            status : "fail" ,
            message : "internal server err2 : myLoungeNum query err"
          });
          connection.release() ;
          callback( "Query err" ) ;
        }else{

          result.loungeNum = result2[0].loungeNum;


          res.status(200).send( {
            status : "success" ,
            data : result,
            msg : "total myPage success"
          });

          connection.release() ;
          callback( null , connection, result ) ;
        }
      });
    }
  ];

  async.waterfall(task, function(err, end) {
    	if(err)
    		console.log(err);
    	else
    		console.log(end);
  	});//async.waterfall
});


//마이페이지 - 팔로워 버튼
// 24. 팔로워 리스트


router.get('/follower/:userToken', function(req, res) {

  //let userToken = req.headers.jwttoken;
  let userToken = req.params.userToken;

  //팔로워 목록 불러오기
  let task = [
    function(callback) {

      pool.getConnection(function(err, connection){
        if(err) {
          res.status(500).send( {
						status : "fail" ,
						msg : "internal server err1"
					});
					callback("getConnection err");
        } else{
          callback(null, connection);
        }
      });
    },

    function(connection, callback){

      let myfollowerListQuery = 'SELECT u.user_image, u.user_name '+
      'FROM user u JOIN user_follower u_f ON u.user_id = u_f.follower_id '+
      'WHERE u_f.user_id = ?';

      connection.query(myfollowerListQuery, userToken, function(err, result){
        if(err){
          res.status(500).send( {
						status : "fail" ,
						msg : "internal server err2 : myfollwerListQuery err"
					});
					connection.release() ;
					callback( "Query err" ) ;
        }else{

          res.status(200).send({
            status : "success",
            data : result,
            msg : "total myFollower list success"
          });

          connection.release();
          callback(null, connection, result);
        }
      });
    }
  ];

  async.waterfall(task, function(err, end) {
    	if(err)
    		console.log(err);
    	else
    		console.log(end);
  	});//async.waterfall
});


// 25. 팔로잉 리스트

router.get('/following/:userToken', function(req, res) {

  //let userToken = req.headers.jwttoken;
  let userToken = req.params.userToken;

  //팔로잉 목록 불러오기
  let task = [
    function(callback) {

      pool.getConnection(function(err, connection){
        if(err) {
          res.status(500).send( {
						status : "fail" ,
						msg : "internal server err1"
					});
					callback("getConnection err");
        } else{
          callback(null, connection);
        }
      });
    },

    function(connection, callback){

      let myfollowingListQuery = 'SELECT u.user_image, u.user_name '+
      'FROM user u JOIN user_following u_f ON u.user_id = u_f.following_id '+
      'WHERE u_f.user_id = ?';

      connection.query(myfollowingListQuery, userToken, function(err, result){
        if(err){
          res.status(500).send( {
						status : "fail" ,
						msg : "internal server err2 : myfollwingListQuery err"
					});
					connection.release() ;
					callback( "Query err" ) ;
        }else{

          res.status(200).send({
            status : "success",
            data : result,
            msg : "total myFollowing list success"
          });

          connection.release();
          callback(null, connection, result);
        }
      });
    }
  ];

  async.waterfall(task, function(err, end) {
    	if(err)
    		console.log(err);
    	else
    		console.log(end);
  	});//async.waterfall
});



// 22. 내 모임 리스트
//내 모임 정보 받아오기 + 승인 여부
//승인 여부에 따라 approval_state 줄 지 결정해서 수정
router.get('/meeting/:userToken', function(req, res) {

  let userToken = req.params.userToken;

  let task = [
    function(callback) {

      pool.getConnection(function(err, connection){
        if(err) {
          res.status(500).send( {
						status : "fail" ,
						message : "internal server err1"
					});
					callback("getConnection err");
        } else{
          callback(null, connection);
        }
      });
    },

//내 모임 정보 받아오기
//승인여부
    function (connection, callback){

      let myMeetingQuery = 'SELECT m.*,m_u.approval_state '+
      'FROM meeting m JOIN meeting_users m_u ON m.meeting_id = m_u.meeting_id '+
      'WHERE m_u.user_id = ? AND m.meeting_id IN '+
      '(SELECT m_u.meeting_id FROM meeting_users m_u JOIN user u ON m_u.user_id = u.user_id)';

      connection.query(myMeetingQuery, userToken, function(err, result){
        if(err){
          res.status(500).send( {
						status : "fail" ,
						message : "internal server err2 : myMeetingQuery err"
					});
					connection.release() ;
					callback( "Query err" ) ;
        }else{

          res.status(200).send({
            status : "success",
            data : result,
            msg : "total myMeeting list success"
          });

          connection.release();
          callback(null, connection, result);
        }
      });
    }
  ];

  async.waterfall(task, function(err, end) {
    	if(err)
    		console.log(err);
    	else
    		console.log(end);
  	});//async.waterfall
});

// 23. 내 라운지 리스트
router.get('/lounge/:userToken', function(req, res) {

  let userToken = req.params.userToken;

  let task = [
    function(callback) {

      pool.getConnection(function(err, connection){
        if(err) {
          res.status(500).send( {
						status : "fail" ,
						message : "internal server err1"
					});
					callback("getConnection err");
        } else{
          callback(null, connection);
        }
      });
    },

    function(connection, callback){

      let myLoungeQuery = 'SELECT * '+
      'FROM lounge l JOIN user u ON l.user_id = u.user_id '+
      'WHERE u.user_id = ? ORDER BY l.lounge_id';


      connection.query(myLoungeQuery, userToken, function(err, result){
        if(err){
          res.status(500).send( {
						status : "fail" ,
						message : "internal server err2 : myLoungeQuery err"
					});
					connection.release() ;
					callback( "Query err" ) ;
        }else{

          res.status(200).send({
            status : "success",
            data : result,
            msg : "total myLounge list success"
          });

          connection.release();
          callback(null, connection, result);
        }
      });
    }
  ];

  async.waterfall(task, function(err, end) {
    	if(err)
    		console.log(err);
    	else
    		console.log(end);
  	});//async.waterfall
});




// 21. 다른 사람 페이지

router.get('/:userToken/:otherUserToken', function(req, res){
//router.get('/', function(req, res) {
//  let userToken = req.headers.jwttoken;

  let userToken = req.params.userToken;
  let otherUserToken = req.params.otherUserToken;


  let task = [

    //연결
    function(callback) {

      pool.getConnection(function(err, connection){
        if(err) {
          res.status(500).send( {
						status : "fail" ,
						message : "internal server err1 : connection err"
					});
					callback("getConnection err");
        } else{
          callback(null, connection);
        }
      });
    },


    // 정보 받아오는 함수
    function(connection, callback){

      let mypageQuery = 'SELECT * FROM user WHERE user.user_id = ?';


      connection.query(mypageQuery, otherUserToken, function(err, result){
        if(err){
          res.status(500).send( {
						status : "fail" ,
						message : "internal server err2 : otherMypageQuery err"
					});
					connection.release() ;
					callback( "Query err" ) ;
        }else{

          // mypageResult.myInfo[0].push(result[0]);
					callback( null , connection, result[0] ) ;
          //console.log(result);
        }
      });
    },

    //팔로워수
    function (connection, result, callback){
      let followerNumQuery = 'SELECT COUNT(u_fr.user_follower_id) followerNum '+
      'FROM user_follower u_fr , user_following u_fg '+
      'WHERE u_fr.follower_id = u_fg.user_id '+
      'AND u_fr.user_id = u_fg.following_id '+
      'AND u_fr.user_id = ?';


      connection.query(followerNumQuery, otherUserToken, function(err, result2){
        if(err){
          res.status(500).send( {
            status : "fail" ,
            message : "internal server err2 : otherFollowerNum query err"
          });
          connection.release() ;
          callback( "Query err" ) ;
        }else{

          // if(!result2.length == 0){
             result.followerNum = result2[0].followerNum;
             // mypageResult.myFollowerNum.push(result2[0]);


          callback( null , connection, result ) ;
          console.log(result);
        }
      });
    },

    //팔로잉수
    function (connection, result, callback){
      let followingNumQuery = 'SELECT COUNT(u_fg.user_following_id) followingNum '+
      'FROM user_follower u_fr , user_following u_fg '+
      'WHERE u_fr.follower_id = u_fg.user_id '+
      'AND u_fr.user_id = u_fg.following_id '+
      'AND u_fg.user_id = ?';


      connection.query(followingNumQuery, otherUserToken, function(err, result2){
        if(err){
          res.status(500).send( {
            status : "fail" ,
            message : "internal server err2 : otherFollowingNum query err"
          });
          connection.release() ;
          callback( "Query err" ) ;
        }else{

          result.followingNum = result2[0].followingNum;
          // mypageResult.myFollowingNum.push(result2[0]);
         callback( null , connection, result ) ;
        //  console.log(result3);
        }
      });
    },

    //그 사람의 모임수
    function (connection,result, callback){
      let meetingNumQuery = 'SELECT COUNT(m.meeting_id) meetingNum '+
      'FROM user u JOIN meeting_users m '+
      'ON u.user_id = m.user_id WHERE u.user_id = ?';


      connection.query(meetingNumQuery, otherUserToken, function(err, result2){
        if(err){
          res.status(500).send( {
            status : "fail" ,
            message : "internal server err2 : otherMeetingNum query err"
          });
          connection.release() ;
          callback( "Query err" ) ;
        }else{

          result.meetingNum = result2[0].meetingNum;
          // mypageResult.myMeetingNum.push(resut2[0]);

          callback( null , connection, result ) ;
        }
      });
    },

    //그 사람의 라운지 수
    function (connection,result, callback){
      let loungeNumQuery = 'SELECT COUNT(l.lounge_id) loungeNum '+
      'FROM user u JOIN lounge l '+
      'ON u.user_id = l.user_id WHERE u.user_id = ?';


      connection.query(loungeNumQuery, otherUserToken, function(err, result2){
        if(err){
          res.status(500).send( {
            status : "fail" ,
            message : "internal server err2 : otherLoungeNum query err"
          });
          connection.release() ;
          callback( "Query err" ) ;
        }else{

          result.loungeNum = result2[0].loungeNum;
          // mypageResult.myMeetingNum.push(resut2[0]);

          res.status(200).send( {
            status : "success" ,
            data : result,
            msg : "total otherPage success"
          });

          connection.release() ;
          callback( null , connection, result ) ;
        }
      });
    }
  ];

  async.waterfall(task, function(err, end) {
    	if(err)
    		console.log(err);
    	else
    		console.log(end);
  	});//async.waterfall
});


//다른 사람 페이지 - 팔로워 버튼
// 24-2. 다른 사람 팔로워 리스트
//필요없는거 같아....


router.get('/follower/:userToken/:otherUserToken', function(req, res) {

  //let userToken = req.headers.jwttoken;
  let userToken = req.params.userToken;
  let otherUserToken = req.params.otherUserToken;


  //팔로워 목록 불러오기
  let task = [
    function(callback) {

      pool.getConnection(function(err, connection){
        if(err) {
          res.status(500).send( {
						status : "fail" ,
						msg : "internal server err1"
					});
					callback("getConnection err");
        } else{
          callback(null, connection);
        }
      });
    },

    function(connection, callback){

      let otherfollowerListQuery = 'SELECT u.user_image, u.user_name '+
      'FROM user u JOIN user_follower u_f ON u.user_id = u_f.follower_id '+
      'WHERE u_f.user_id = ?';

      connection.query(otherfollowerListQuery, otherUserToken, function(err, result){
        if(err){
          res.status(500).send( {
						status : "fail" ,
						msg : "internal server err2 : otherfollwerListQuery err"
					});
					connection.release() ;
					callback( "Query err" ) ;
        }else{

          res.status(200).send({
            status : "success",
            data : result,
            msg : "total otherFollower list success"
          });

          connection.release();
          callback(null, connection, result);
        }
      });
    }
  ];

  async.waterfall(task, function(err, end) {
    	if(err)
    		console.log(err);
    	else
    		console.log(end);
  	});//async.waterfall
});


// 25-2. 팔로잉 리스트
//필요없..?

router.get('/following/:userToken/:otherUserToken', function(req, res) {

  //let userToken = req.headers.jwttoken;
  let userToken = req.params.userToken;
  let otherUserToken = req.params.otherUserToken;

  //팔로잉 목록 불러오기
  let task = [
    function(callback) {

      pool.getConnection(function(err, connection){
        if(err) {
          res.status(500).send( {
						status : "fail" ,
						msg : "internal server err1"
					});
					callback("getConnection err");
        } else{
          callback(null, connection);
        }
      });
    },

    function(connection, callback){

      let otherfollowingListQuery = 'SELECT u.user_image, u.user_name '+
      'FROM user u JOIN user_following u_f ON u.user_id = u_f.following_id '+
      'WHERE u_f.user_id = ?';

      connection.query(otherfollowingListQuery, otherUserToken, function(err, result){
        if(err){
          res.status(500).send( {
						status : "fail" ,
						msg : "internal server err2 : otherfollwingListQuery err"
					});
					connection.release() ;
					callback( "Query err" ) ;
        }else{

          res.status(200).send({
            status : "success",
            data : result,
            msg : "total otherFollowing list success"
          });

          connection.release();
          callback(null, connection, result);
        }
      });
    }
  ];

  async.waterfall(task, function(err, end) {
    	if(err)
    		console.log(err);
    	else
    		console.log(end);
  	});//async.waterfall
});



// 22-2. 남 모임 리스트
//남 모임 정보 받아오기 + 승인 여부 X

router.get('/meeting/:userToken/:otherUserToken', function(req, res) {

  let userToken = req.params.userToken;
  let otherUserToken = req.params.otherUserToken;

  let task = [
    function(callback) {

      pool.getConnection(function(err, connection){
        if(err) {
          res.status(500).send( {
						status : "fail" ,
						message : "internal server err1"
					});
					callback("getConnection err");
        } else{
          callback(null, connection);
        }
      });
    },

//남 모임 정보 받아오기
    function (connection, callback){

      let otherMeetingQuery = 'SELECT m.* '+
      'FROM meeting m JOIN meeting_users m_u ON m.meeting_id = m_u.meeting_id '+
      'WHERE m_u.user_id = ? AND m.meeting_id IN (SELECT m_u.meeting_id FROM meeting_users m_u JOIN user u ON m_u.user_id = u.user_id)';

      connection.query(otherMeetingQuery, otherUserToken, function(err, result){
        if(err){
          res.status(500).send( {
						status : "fail" ,
						message : "internal server err2 : otherMeetingQuery err"
					});
					connection.release() ;
					callback( "Query err" ) ;
        }else{

          res.status(200).send({
            status : "success",
            data : result,
            msg : "total otherMeeting list success"
          });

          connection.release();
          callback(null, connection, result);
        }
      });
    }
  ];

  async.waterfall(task, function(err, end) {
    	if(err)
    		console.log(err);
    	else
    		console.log(end);
  	});//async.waterfall
});

// 23-2. 남 라운지 리스트
//공개여부 프로필 옆에 언어가 native -> hope 둘 다 표시로 바뀜
router.get('/lounge/:userToken/:otherUserToken', function(req, res) {

  let userToken = req.params.userToken;
  let otherUserToken = req.params.otherUserToken;

  let task = [
    function(callback) {

      pool.getConnection(function(err, connection){
        if(err) {
          res.status(500).send( {
						status : "fail" ,
						message : "internal server err1"
					});
					callback("getConnection err");
        } else{
          callback(null, connection);
        }
      });
    },

    function(connection, callback){

      let otherLoungeQuery = 'SELECT * '+
      'FROM lounge l JOIN user u ON l.user_id = u.user_id '+
      'WHERE u.user_id = ? ORDER BY l.lounge_id';


      connection.query(otherLoungeQuery, otherUserToken, function(err, result){
        if(err){
          res.status(500).send( {
						status : "fail" ,
						message : "internal server err2 : otherLoungeQuery err"
					});
					connection.release() ;
					callback( "Query err" ) ;
        }else{

          res.status(200).send({
            status : "success",
            data : result,
            msg : "total otherLounge list success"
          });

          connection.release();
          callback(null, connection, result);
        }
      });
    }
  ];

  async.waterfall(task, function(err, end) {
    	if(err)
    		console.log(err);
    	else
    		console.log(end);
  	});//async.waterfall
});


// 26. 남의 페이지 - 팔로우 신청하기
router.put('/:userToken/:otherUserToken/follow', function(req, res){

  let userToken = req.params.userToken;
  let otherUserToken = req.params.otherUserToken;

  let task = [

    //연결
    function(callback) {

      pool.getConnection(function(err, connection){
        if(err) {
          res.status(500).send( {
                  status : "fail" ,
                  message : "internal server err1"
               });
               callback("getConnection err");
        } else{
          callback(null, connection);
        }
      });
    },

    //팔로우 했는지 체크
    function(connection, callback){

      let followCheckQuery = 'SELECT * FROM user_following u_f WHERE user_id = ? AND following_id = ?';
      //let array = [null, userToken, otherUserToken];

      connection.query(followCheckQuery, [userToken, otherUserToken], function(err, result) {
        if(err){
          res.status(500).send({
            status : "fail",
            message : "internal server err"
          });
          connection.release();
          callback("Query err");
        }
        else{

          //팔로우테이블에 없으면
          if(result.length === 0){ //팔로우 신청

            async.waterfall([

              //followTask
              function(callback) {

                pool.getConnection(function(err, connection){
                  if(err) {
                    res.status(500).send( {
          						status : "fail" ,
          						message : "internal server err1"
          					});
          					callback("getConnection err");
                  } else{
                    callback(null, connection);
                  }
                });
              },

              //user_follower 테이블에 입력
              function(connection, callback){

                let followerInsertQuery = 'INSERT INTO user_follower VALUES(?,?,?)';
                let array = [ null, otherUserToken, userToken ];


                connection.query(followerInsertQuery, array, function(err, result){
                  if(err){
                    res.status(500).send( {
                            status : "fail" ,
                            message : "internal server err2 : followerInsertQuery err"
                         });
                         connection.release() ;
                         callback( "Query err" ) ;
                  }else{

                    callback(null, connection, result);
                  }
                });
              },

              //user_following 테이블에 입력
              function(connection, result, callback){

                let followingInsertQuery = 'INSERT INTO user_following VALUES(?,?,?)';
                let array = [ null, userToken, otherUserToken ];


                connection.query(followingInsertQuery, array, function(err, result2){
                  if(err){
                    res.status(500).send( {
                            status : "fail" ,
                            message : "internal server err2 : followingInsertQuery err"
                         });
                         connection.release() ;
                         callback( "Query err" ) ;
                  }else{

                    //result[0].push(result2[0]);
                    callback(null, connection, result);
                  }
                });
              },


              //user 테이블에 팔로잉 수 +1
              function(connection, result, callback){

                let followingNumUpdateQuery = 'UPDATE user u SET u.following_count = u.following_count + 1 WHERE user_id = ?';


                connection.query(followingNumUpdateQuery, userToken, function(err, result){
                  if(err){
                    res.status(500).send( {
                            status : "fail" ,
                            message : "internal server err2 : followingNumUpdateQuery err"
                         });
                         connection.release() ;
                         callback( "Query err" ) ;
                  }else{

                    callback(null, connection, result);
                  }
                });
              },

              //user 테이블에 팔로워 수 +1
              function(connection, result, callback){

                let followerNumUpdateQuery = 'UPDATE user u SET u.follower_count = u.follower_count + 1 WHERE user_id = ?';


                connection.query(followerNumUpdateQuery, otherUserToken, function(err, result){
                  if(err){
                    res.status(500).send( {
                            status : "fail" ,
                            message : "internal server err2 : followerNumUpdateQuery err"
                         });
                         connection.release() ;
                         callback( "Query err" ) ;
                  }else{

                  //  result.push(result2);

                    res.status(200).send({
                      status : "success",
                      message : "follow success"
                    });

                    connection.release();
                    callback(null, connection, result);
                  }
                });
              }
            ], function(err, end){
              if(err)
              console.log(err);
              else
              console.log(end);
            }
          )

          }else{

            //팔로우테이블에 있으면 팔로우 취소
            async.waterfall([

              function(callback){

                pool.getConnection(function(err, connection){
                  if(err) {
                    res.status(500).send( {
          						status : "fail" ,
          						message : "internal server err1"
          					});
          					callback("getConnection err");
                  } else{
                    callback(null, connection);
                  }
                });
              },

              //user_follower 테이블에서 삭제
              function(connection, callback){

                let followerDeleteQuery = 'DELETE FROM user_follower WHERE user_id = ? AND follower_id = ?';

                connection.query(followerDeleteQuery, [otherUserToken, userToken], function(err, result){
                  if(err){
                    res.status(500).send( {
                            status : "fail" ,
                            message : "internal server err2 : followerDeleteQuery err"
                         });
                         connection.release() ;
                         callback( "Query err" ) ;
                  }else{

                    callback(null, connection, result);
                  }
                });
              },

              //user_following 테이블에서 삭제
              function(connection, result, callback){

                let followingInsertQuery = 'DELETE FROM user_following WHERE user_id = ? AND following_id = ?';
                //let array = [ null, userToken, otherUserToken ];


                connection.query(followingInsertQuery, [userToken, otherUserToken], function(err, result2){
                  if(err){
                    res.status(500).send( {
                            status : "fail" ,
                            message : "internal server err2 : followingDeleteQuery err"
                         });
                         connection.release() ;
                         callback( "Query err" ) ;
                  }else{

                    //result[0].push(result2[0]);
                    callback(null, connection, result);
                  }
                });
              },


              //user 테이블에 팔로잉 수 -1
              function(connection, result, callback){

                let addFollowingNumQuery = 'UPDATE user u SET u.following_count = u.following_count - 1 WHERE user_id = ?';


                connection.query(addFollowingNumQuery, userToken, function(err, result){
                  if(err){
                    res.status(500).send( {
                            status : "fail" ,
                            message : "internal server err2 : addFollowingNumQuery err"
                         });
                         connection.release() ;
                         callback( "Query err" ) ;
                  }else{

                    callback(null, connection, result);
                  }
                });
              },

              //user 테이블에 팔로워 수 -1
              function(connection, result, callback){

                let subFollowerNumQuery = 'UPDATE user u SET u.follower_count = u.follower_count - 1 WHERE user_id = ?';


                connection.query(subFollowerNumQuery, otherUserToken, function(err, result){
                  if(err){
                    res.status(500).send( {
                            status : "fail" ,
                            message : "internal server err2 : subFollowerNumQuery err"
                         });
                         connection.release() ;
                         callback( "Query err" ) ;
                  }else{

                  //  result.push(result2);

                    res.status(200).send({
                      status : "success",
                      message : "unFollow success"
                    });

                    connection.release();
                    callback(null, connection, result);
                  }
                });
              }

            ], function(err, end){
              if(err)
                console.log(err);
              else
                console.log(end);
            }
          )

          }
        }
      });
    }
  ];

  async.waterfall(task, function(err, end) {
      if(err)
        console.log(err);
      else
        console.log(end);
    });//async.waterfall


});





// 프로필 수정
// 사진, 이름, 자기 소개

router.put('/edit/:userToken', function(req, res){
//router.get('/', function(req, res) {
//  let userToken = req.headers.jwttoken;



  let userToken = req.params.userToken;



  let task = [

    //연결
    function(callback) {

      pool.getConnection(function(err, connection){
        if(err) {
          res.status(500).send( {
						status : "fail" ,
						message : "internal server err1 : connection err"
					});
					callback("getConnection err");
        } else{
          callback(null, connection);
        }
      });
    },


    //내 정보 받아오는 함수

    function(connection, callback){

      let mypageEditQuery = 'UPDATE user u SET u.user_image = ?, u.user_name=?, u.user_intro=? '+
      'WHERE u.user_id = ? LIMIT 1';

      let editUserRecord = [
        req.body.user_image,
        req.body.user_name,
        req.body.user_intro,
        req.body.user_id
      ];


      connection.query(mypageEditQuery, editUserRecord, function(err, result){
        if(err){
          res.status(500).send( {
						status : "fail" ,
						message : "internal server err2 : mypageEditQuery err"
					});
					connection.release() ;
					callback( "Query err" ) ;
        }else{

          res.status(200).send( {
            status : "success" ,
            msg : "total myPage edit success"
          });
          // mypageResult.myInfo[0].push(result[0]);
					callback( null , connection, result ) ;
          //console.log(result);
        }
      });
    }


  ];

  async.waterfall(task, function(err, end) {
    	if(err)
    		console.log(err);
    	else
    		console.log(end);
  	});//async.waterfall
});




module.exports = router;
