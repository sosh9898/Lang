const express = require('express');
const mysql = require('mysql');
const aws = require('aws-sdk');
const pool = require('../config/dbPool.js');
const router = express.Router();
const async = require('async');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
aws.config.loadFromPath('./config/aws_config.json');


router.get('/lists/:type', (req, res) => {
	var type = req.params.type;
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
 			let notiListQuery;
      console.log(type);
 			if(type == 401)
 				notiListQuery = "select * from meeting_notification where user_id = ?";
 			else
 				notiListQuery = "select ur.user_id , ur.user_image, mn.my_notification_id, mn.lounge_id, mn.noti_content, mn.noti_time, mn.noti_read_check from user as ur join my_notification as mn on ur.user_id = mn.sender_id where mn.user_id = ?"

 			conn.query(notiListQuery, userid, (err, rows) => {
 				if(err){
 					res.status(500).send({
                	status: "fail",
                	message: "failure get notification lists"
                });
 					conn.release();
 				 callback(err, null);
 				}
 				else{
 					res.status(200).send({
                    status: "success",
                    data: rows,
                    message: "successful get notification lists"
                });
                conn.release(); 
                callback(null, "successful get notification lists");
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