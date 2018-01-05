const express = require('express');
const mysql = require('mysql');
const aws = require('aws-sdk');
const pool = require('../config/dbPool.js');
const router = express.Router();
const async = require('async');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

aws.config.loadFromPath('./config/aws_config.json');

router.get('/user/recommendation', (req, res) => {
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
 					conn.release();
 				}
 				else callback(null, conn);
 			});
 		},
 		(conn, callback) => {
 			let userRecommendQuery = "select user_id, user_image, user_name, native_lang, hope_lang from user order by follower_count desc limit 20"

 			conn.query(userRecommendQuery, (err, rows) => {
 				if(err){
 					res.status(500).send({
                	status: "fail",
                	message: "failure get remommendation lists"
                });
 					conn.release();
 				 callback(err, null);
 				}
 				else{
 					res.status(200).send({
                    status: "success",
                    data : rows,
                    message: "successful get remommendation lists"
                });
                conn.release(); 
                callback(null, "successful get remommendation lists");
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