const express = require('express');
const mysql = require('mysql');
const aws = require('aws-sdk');
const crypto = require('crypto');
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

router.post("/signup/check", (req, res) =>{

	var id = req.body.id;
	var email = req.body.email;
    var key= "sdfsdfein2@@#!dfkensl#!@~~@#SFfejub";

	var option = {
  	  algorithm: 'HS256',
  	  expiresIn: 60*60*24*30
	};

	 let taskArray = [
        (callback) => {
        crypto.pbkdf2(id, key, 100000, 64, 'sha512', (err, hashed) => {
            if (err) callback(err, null);
            else callback(null, hashed.toString('base64'));
          });
        },
        (afterHashing, callback) => {
            id = afterHashing.toString('base64');
            pool.getConnection((err, connection) => {
                if(err) callback(err, null);
                else callback(null, connection);
              });
        },
        (conn, callback) => {
            var checkIdQuery = "select exists (select user_id from user where user_id = ?) as checkResult";
            conn.query(checkIdQuery, id, (err, rows) => {
                if(err) callback(err, null);
                else callback(null, rows[0].checkResult, conn);
            });
        },
        (checkResult, conn , callback) => {
            if(checkResult === 1){
                res.status(200).send({
                    status : "exist id",
                    data : null,
                    message : "This id exist in Lang"
                });
                conn.release();
                callback(null, "This id exist in Lang");
            }
            else{
            	res.status(200).send({
                    status : "non exist id",
                    data : id,
                    message : "This id non exist in Lang"
                });
                conn.release();
                callback(null, "This id non exist in Lang");
            }
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

router.post("/signup",upload.single('image'), (req, res) => {

	let id = req.body.id;
	let name = req.body.name;
	let email = req.body.email;
	let nativeLang = req.body.nativeLang;
	let hopeLang = req.body.hopeLang;
	let deviceToken = req.body.deviceToken;
	let profileImage;

    let option = {
        algorithm: 'HS256',
        expiresIn: 60*60*24*30
        };

    let payload = {
        key1: id,
        };

    var token;

    jwt.sign(payload, req.app.get('secret'), option, (err, result) => {
        if(err) console.log(err);
        else token = result;
        });

    if(typeof req.file === 'undefined')
        profileImage = req.file.location;
    else
        profileImage = " ";

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
 			var signupQuery = "insert into user values(?,?,?,?,?,?,?,?,?,?)"
 			conn.query(signupQuery,[id,name,email,"",profileImage,deviceToken,nativeLang,hopeLang,0,0], (err, rows) => {
 				if(err){
 					res.status(500).send({
                	status: "fail",
                	message: "signup api error"
                });
 					conn.release();
 				 callback(err, null);
 				}
 				else{
 					res.status(200).send({
                    status: "success",
                    data : token,
                    message: "successful signup"
                });
                conn.release(); 
                callback(null, "successful signup");
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
