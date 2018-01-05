const express = require('express');
const mysql = require('mysql');
const aws = require('aws-sdk');
const pool = require('../config/dbPool.js');
const router = express.Router();
const async = require('async');
const bodyParser = require('body-parser');
const multer = require('multer');
const multerS3 = require('multer-s3');
const jwt = require('jsonwebtoken');
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

// if(type === 201){
//         switch(day){
//           case 300: //전체
//                 mainListQuery = "select ur.user_name, mt.meeting_id, mt.place_image, mt.title, mt.language, mt.meeting_type from meeting as mt join user as ur on ur.user_id = mt.user_id";
//             break;
//           case 301: //오늘
//                 mainListQuery = 
//             break;
//           case 302: //내일 
//             break;
//           case 303: //이번주
//             break;
//           case 304: //다음주
//             break;
//           case 305: //이번달
//             break;
//         }
//       }
//       else 
//         mainListQuery = "select meeting_id, place_image, title, language, user_id, meeting_type where meeting_type = ?";




// router.get('/mainLists/:type/:day', (req, rows) => {
// 	var type = req.params.type;
// 	var day = req.params.type;

//   var currentDate = moment().format("yyyy-MM-dd HH:mm:ss");
//   var currentDay = moment().day;
//   var currentWeek = moment().week;
//   var availableMeetingLists = [];



// 	let taskArray = [
// 		(callback) => {
//  			pool.getConnection((err, conn) => {
//  				if(err) {
//  					res.status(500).send({
//            			status : 'fail',
//            			message : 'DB connection error'
//          		});
//  					callback(err, null);
//  				}
//  				else callback(null, conn);
//  			});
//  		},
//     (conn, callback) => {

//       let getWeekQuery = "select meeting_id, meeting_start_day, meeting_end_day where meeting";

//       conn.query(getWeekQuery, (err, rows) => {
//         if(err){
//           res.status(500).send({
//                   status: "fail",
//                   message: "failure get week"
//                 });
//           conn.release();
//          callback(err, null);
//         }
//         else{
//         for(var i=0; i<rows.length; i++){
//         if(currentDate.month.isBetween(moment(rows[i].meeting_start_day).month,rows[i].meeting_end_day, '(]'))
//             availableMeetingLists.push("availavle_id",rows[i].meeting_id);
//           }
//             callback(null, availavleList, conn);
//           }
//       });
//     },
//  		(availavleList, conn, callback) => {

//  			conn.query(mainListQuery, (err, rows) => {
//  				if(err){
//  					res.status(500).send({
//                 	status: "fail",
//                 	message: "failure get meeting lists"
//                 });
//  					conn.release();
//  				 callback(err, null);
//  				}
//  				else{
//  					res.status(200).send({
//                     status: "success",
//                     data: rows,
//                     message: "successful get meeting lists"
//                 });
//                 conn.release(); 
//                 callback(null, "successful get meeting lists");
//  				}
//  			}
//  		},
// 	];
// 	async.waterfall(taskArray, (err, result) => {
//  		if (err) {
//             console.log(err);
//         } else {
//             console.log(result);
//         }
//  	});
//  });

router.put('/like/:id', (req, res) => {
	var id = req.params.id;
	var token = req.headers.token;
	var userid;

	jwt.verify(token, req.app.get('secret'), (err, data) => {
    	if (err){
  		if(err.message === 'jwt expired') {
      		console.log(err);
      		console.log('expired token');
    	}
  		else if(err.message === 'invalid token') console.log('invalid token');
 		 }
  		else 
		    userid = data.key1;
	});

	let taskArray = [
		(callback) => {
 			pool.getConnection((err, conn) => {
 				if(err) {
 					res.status(500).send({
           			status : 'fail',
           			message : 'DB connection error'
         		});
 					callback(err, null);
 				}
 				else callback(null, conn);
 			});
 		},
 		(conn, callback) =>{
 			var meetingLikeStatCheckQuery = "select exists (select meeting_id from meeting_like where meeting_id = ? and user_id = ?) as checkResult";

			conn.query(meetingLikeStatCheckQuery,[id, userid], (err, rows) => {
 				if(err){
 					res.status(500).send({
                	status: "fail",
                	message: "failure update meeting like stat"
                });
 					conn.release();
 				 callback(err, null);
 				}
 				else
 				callback(null, conn, rows[0].checkResult);
 		});
 		},
 		(conn,checkResult, callback) => {

      console.log(checkResult);
 			var meetingLikeQuery;
      var parameterList = []
 			if(checkResult === 0){
 				meetingLikeQuery = "insert into meeting_like values(?,?,?)";
        parameterList.push([null,id,userid]);
      }
 			else{
 				meetingLikeQuery = "delete from meeting_like where meeting_id = ? and user_id = ?";
        parameterList.push([id,userid]);
      }
        conn.query(meetingLikeQuery,parameterList[0], (err, result) => {
        if(err){
          res.status(500).send({
                  status: "fail",
                  message: "failure update meeting like stat"
                });
          conn.release();
         callback(err, null);
        }
        else{
          res.status(200).send({
                    status: "success",
                    message: "successful update meeting like stat"
                });
            conn.release();
            callback(null, "successful update meeting like stat");
      }
    });
 		}
	];
	async.waterfall(taskArray, (err, result) => {
 		if (err) {
            console.log(err);
        } else {
            console.log(result);
        }
 	});
 });

router.post('/apply/:id', (req, res) => {
	var id = req.params.id;
	var intro = req.body.intro;

	var token = req.headers.token;
	var userid;

	jwt.verify(token, req.app.get('secret'), (err, data) => {
    	if (err){
  		if(err.message === 'jwt expired') {
      		console.log(err);
      		console.log('expired token');
    	}
  		else if(err.message === 'invalid token') console.log('invalid token');
 		 }
  		else 
		    userid = data.key1;
	});

	let taskArray = [
		(callback) => {
 			pool.getConnection((err, conn) => {
 				if(err) {
 					res.status(500).send({
           			status : 'fail',
           			message : 'DB connection error'
         		});
 					callback(err, null);
 				}
 				else callback(null, conn);
 			});
 		},
 		(conn, callback) => {
 			let meetingApplyQuery = "insert into meeting_users values(?,?,?,?,?)";

 			conn.query(meetingApplyQuery,[null,id,userid,300,intro], (err, rows) => {
 				if(err){
 					res.status(500).send({
                	status: "fail",
                	message: "failure apply meeting"
                });
 					conn.release();
 				 callback(err, null);
 				}
 				else{
 					res.status(200).send({
                    status: "success",
                    message: "successful apply meeting"
                });
                conn.release(); 
                callback(null, "successful apply meeting");
 				}
 			});
 		},
	];
	async.waterfall(taskArray, (err, result) => {
 		if (err) {
            console.log(err);
        } else {
            console.log(result);
        }
 	});
 });


 router.get('/detail/:id', (req, rows) => {
	var id = req.params.id;
	var token = req.headers.token;
	var userid;

	jwt.verify(token, req.app.get('secret'), (err, data) => {
    	if (err){
  		if(err.message === 'jwt expired') {
      		console.log(err);
      		console.log('expired token');
    	}
  		else if(err.message === 'invalid token') console.log('invalid token');
 		 }
  		else 
		    userid = data.key1;
	});

	let taskArray = [
		(callback) => {
 			pool.getConnection((err, conn) => {
 				if(err) {
 					res.status(500).send({
           			status : 'fail',
           			message : 'DB connection error'
         		});
 					callback(err, null);
 				}
 				else callback(null, conn);
 			});
 		},
 		(conn, callback) => {
 			let meetingDetailQuery = "insert into meeting_users values(?,?,?,?,?)";

 			conn.query(meetingApplyQuery,[null,id,userid,300,intro], (err, rows) => {
 				if(err){
 					res.status(500).send({
                	status: "fail",
                	message: "failure apply meeting"
                });
 					conn.release();
 				 callback(err, null);
 				}
 				else{
 					res.status(200).send({
                    status: "success",
                    message: "successful apply meeting"
                });
                conn.release(); 
                callback(null, "successful apply meeting");
 				}
 			});
 		},
	];
	async.waterfall(taskArray, (err, result) => {
 		if (err) {
            console.log(err);
        } else {
            console.log(result);
        }
 	});
 });


 router.delete('/delete/:id', (req, res) => {
	var id = req.params.id;
	var token = req.headers.token;
	var userid;

	jwt.verify(token, req.app.get('secret'), (err, data) => {
    	if (err){
  		if(err.message === 'jwt expired') {
      		console.log(err);
      		console.log('expired token');
    	}
  		else if(err.message === 'invalid token') console.log('invalid token');
 		 }
  		else 
		    userid = data.key1;
	});

	let taskArray = [
		(callback) => {
 			pool.getConnection((err, conn) => {
 				if(err) {
 					res.status(500).send({
           			status : 'fail',
           			message : 'DB connection error'
         		});
 					callback(err, null);
 				}
 				else callback(null, conn);
 			});
 		},
 		(conn, callback) => {
 			let meetingDeleteQuery = "delete from meeting_users where user_id = ?";

 			conn.query(meetingDeleteQuery,userid,(err, rows) => {
 				if(err){
 					res.status(500).send({
                	status: "fail",
                	message: "failure cancel meeting"
                });
 					conn.release();
 				 callback(err, null);
 				}
 				else{
 					res.status(200).send({
                    status: "success",
                    message: "successful cancel meeting"
                });
                conn.release(); 
                callback(null, "successful cancel meeting");
 				}
 			});
 		}
	];
	async.waterfall(taskArray, (err, result) => {
 		if (err) {
            console.log(err);
        } else {
            console.log(result);
        }
 	});
 });


 router.post('/register',upload.single('image'), (req, res) => {
 	var image = req.file ? req.file.location : null;
 	var title = req.body.title;
 	var lang = req.body.language;
 	var intro = req.body.introduce;
 	var type = req.body.type;

	var startDay = req.body.startDay;
 	var endDay = req.body.endDay;
 	var startTime = req.body.startTime;
 	var endTime = req.body.endTime;
 	var lat = req.body.lat;
 	var lng = req.body.lng;

	var token = req.headers.token;
	var userid;

	jwt.verify(token, req.app.get('secret'), (err, data) => {
    	if (err){
  		if(err.message === 'jwt expired') {
      		console.log(err);
      		console.log('expired token');
    	}
  		else if(err.message === 'invalid token') console.log('invalid token');
 		 }
  		else
		    userid = data.key1;
	});

	let taskArray = [
		(callback) => {
 			pool.getConnection((err, conn) => {
 				if(err) {
 					res.status(500).send({
           			status : 'fail',
           			message : 'DB connection error'
         		});
 					callback(err, null);
 				}
 				else callback(null, conn);
 			});
 		},
 		(conn, callback) => {
 			let meetingRegQuery = "insert into meeting values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

 			conn.query(meetingRegQuery,[null,userid,image,title,lang,intro,type,startDay,endDay,startTime,endTime,lat,lng,0],(err, rows) => {
 				if(err){
 					res.status(500).send({
                	status: "fail",
                	message: "failure register meeting"
                });
 					conn.release();
 				 callback(err, null);
 				}
 				else{
 					callback(null, rows, conn);
 				}
 			});
 		},
 		(rows, conn) =>{
 			let id = rows.insertId;

 			let meetingDOWQuery = "insert into meeting_day_of_week values(?,?,?,?,?,?,?,?,?)";

 			conn.query(meetingDOWQuery,[null,id,dayOfWeek[0],dayOfWeek[1],dayOfWeek[2],dayOfWeek[3],dayOfWeek[4],dayOfWeek[5],dayOfWeek[6]],(err, rows) => {
 				if(err){
 					res.status(500).send({
                	status: "fail",
                	message: "failure register meeting"
                });
 					conn.release();
 				 callback(err, null);
 				}
 				else{
 					res.status(200).send({
                    status: "success",
                    message: "successful register meeting"
                });
                conn.release(); 
                callback(null, "successful register meeting");
 				}
 			});
 		}
	];
	async.waterfall(taskArray, (err, result) => {
 		if (err) {
            console.log(err);
        } else {
            console.log(result);
        }
 	});
 });

module.exports = router;