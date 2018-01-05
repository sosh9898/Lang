const express = require('express');
const mysql = require('mysql');
const aws = require('aws-sdk');
const pool = require('../config/dbPool.js');
const router = express.Router();
const async = require('async');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

aws.config.loadFromPath('./config/aws_config.json');

router.get('/:id', (req, res) => {
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
 			let reviewListsQuery = "select ur.user_id, ur.user_name, ur.user_image, mr.review_rating, mr.review_content from meeting_reviews as mr join user as ur on mr.user_id = ur.user_id where mr.meeting_id = ?";
 			conn.query(reviewListsQuery,id, (err, rows) => {
 				if(err){
 					res.status(500).send({
                	status: "fail",
                	message: "failure get reviewLists"
                });
 					conn.release();
 				 callback(err, null);
 				}
 				else
          callback(null, conn, rows);
 			});
 		},
    (conn, rows, callback) => {
      let avgRatingQuery = "select avg(review_rating) as avg_rating from meeting_reviews where meeting_id = ?";
      conn.query(avgRatingQuery,id, (err, result) => {
        if(err){
          res.status(500).send({
                  status: "fail",
                  message: "failure get reviewLists"
                });
          conn.release();
         callback(err, null);
        }
        else{
         var avg;
         if(Math.floor(result[0].avg_rating*10)%10 >= 5)
          avg = Math.floor(result[0].avg_rating)+0.5;
         else
          avg = Math.floor(result[0].avg_rating);

         var data = { "reviewList" : rows,
                      "average_rating" : avg };
         

          res.status(200).send({
                    status: "success",
                    data : data,
                    message: "successful get reviewLists"
                });
                conn.release(); 
                callback(null, "successful get reviewLists");
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

 router.post('/register/:id', (req, res) => {
	var id = req.params.id;
	var token = req.headers.token;
	var userid;

  var rating = req.body.rating;
  var content = req.body.content;

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
 			let reviewRegQuery = "insert into meeting_reviews values(?,?,?,?,?)";
 			conn.query(reviewRegQuery,[null, id, userid, rating, content], (err, rows) => {
 				if(err){
 					res.status(500).send({
                	status: "fail",
                	message: "failure register review"
                });
 					conn.release();
 				 callback(err, null);
 				}
 				else{
 					res.status(200).send({
                    status: "success",
                    message: "successful register review"
                });
                conn.release(); 
                callback(null, "successful register review");
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