const express = require('express');
const mysql = require('mysql');
const aws = require('aws-sdk');
const pool = require('../config/dbPool.js');
const router = express.Router();
const async = require('async');
const bodyParser = require('body-parser');
aws.config.loadFromPath('./config/aws_config.json');

router.get('/participants/:state/:id', (req, res) => {
	var id = req.params.id;
	var state = req.params.state;

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
 			let waitingUserQuery = "select ur.user_id, ur.user_name, ur.user_image from meeting_users as mu join user as ur on mu.user_id = ur.user_id where mu.meeting_id = ? and mu.approval_state = ?";

 			conn.query(waitingUserQuery,[id,state], (err, rows) => {
 				if(err){
 					res.status(500).send({
                	status: "fail",
                	message: "failure get watinglist"
                });
 					conn.release();
 				 callback(err, null);
 				}
 				else{
 					res.status(200).send({
                    status: "success",
                    data : rows,
                    message: "successful get watinglist"
                });
                conn.release(); 
                callback(null, "successful get watinglist");
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

 router.put('/approval', (req, res) => {
	var userId = req.body.userid;
	var meetingId = req.body.meetingid;

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
 			let updateStateQuery = "update meeting_users set approval_state = 203 where user_id = ? and meeting_id = ? ";

 			conn.query(updateStateQuery,[userId, meetingId], (err, rows) => {
 				if(err){
 					res.status(500).send({
                	status: "fail",
                	message: "failure get detail info who wating user"
                });
 					conn.release();
 				 callback(err, null);
 				}
 				else{
 					res.status(200).send({
                    status: "success",
                    message: "successful get detail info who wating user"
                });
                conn.release(); 
                callback(null, "successful get detail info who wating user");
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


 router.get('/watinglist/detail/:id', (req, res) => {
	var applyId = req.params.id;

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
 			let waitingUserDetailQuery = "select ur.user_image, ur.user_name, ur.native_lang, ur.hope_lang, mp.apply_intro from meeting_users as mp join user as ur on mp.user_id = ur.user_id where mp.meeting_users_id = ? ";

 			conn.query(waitingUserDetailQuery,applyId, (err, rows) => {
 				if(err){
 					res.status(500).send({
                	status: "fail",
                	message: "failure get detail info who wating user"
                });
 					conn.release();
 				 callback(err, null);
 				}
 				else{
 					res.status(200).send({
                    status: "success",
                    data : rows[0],
                    message: "successful get detail info who wating user"
                });
                conn.release(); 
                callback(null, "successful get detail info who wating user");
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



module.exports = router;