const express = require('express');
const router = express.Router();

const secret = require('../../config/secret');
const jwt = require('jsonwebtoken');
const async = require('async');

const pool = require('../../config/dbPool');
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');


router.get('/:filter',(req,res)=>{
	let jwtToken = req.headers.jwttoken
	let userToken ="ccc"

	// jwt.verify(jwtToken, secret, (err, data) => {
 //    	if (err){
 //  		if(err.message === 'jwt expired') {
 //      		console.log(err);
 //      		console.log('expired token');
 //    	}
 //  		else if(err.message === 'invalid token') console.log('invalid token');
 // 		 }
 //  		else {
	// 	    userToken = data.key1;
	// }
	// console.log(userToken);

	let taskArray = [
        function(callback) {
            pool.getConnection((err, connection) => {
                if (err) {
                    res.status(500).send({
                        message: "find user data error"
                    });
                    callback(err);
                } else callback(null, connection);
            });
        },

        function(connection, callback) {
            let loungePostLists=[];
            if(req.params.filter =='following'){
                console.log('bb')

                connection.query('select lounge_id,user.name,user.image,lounge.date,lounge.content,native_language,hope_language,like_count, comment_count from user,lounge where  user.user_token = lounge.user_token and user.native_language in (select hope_language from user where user_token=?) and user.hope_language in (select native_language from user where user_token=?) and lounge_id in (select lounge_id from user, lounge,user_following where lounge.user_token=user_following.follwing_token and user_following.user_token=?)', [userToken,userToken,userToken], (err, rows) => {
                    if (err) {
                        res.status(500).send({
                            message: "query error"
                        });
                        connection.release();
                        callback(err);
                    } else {
                        callback(null, connection, rows);
                    }
                });
            }else{
                 console.log('aa')

                connection.query('select lounge_id,user.name,user.image,lounge.date,lounge.content,native_language,hope_language,like_count, comment_count from user,lounge where  user.user_token = lounge.user_token and user.native_language in (select hope_language from user where user_token=?) and user.hope_language in (select native_language from user where user_token=?) and(lounge_id  in (select lounge_id from user,lounge where  is_public=0 or  lounge_id in (select lounge_id from user,lounge where is_public=1 and lounge_id in (select lounge_id from user, lounge,user_following where lounge.user_token=user_following.follwing_token and user_following.user_token=?))))', [userToken, userToken, userToken], (err, rows) => {
                    if (err) {
                        res.status(500).send({
                            message: "query error"
                        });
                        connection.release();
                        callback(err);
                    } else {
                        callback(null, connection, rows);
                    }
                });
            }
        },
        
        function(connection,rows, callback){
            console.log('aaa')
            connection.query('select lounge_id from lounge_like where lounge_like.user_token =?', userToken,(err, isLikeRows) =>{
                if(err){
                    res.status(500).send({
                        message: "query error"
                    });
                    connection.release();
                    callback(err);
                }else{
                    console.log(isLikeRows);
                    let isLikeArray = [];
                    for(let i=0; i<isLikeRows.length;i++){
                        isLikeArray.push(isLikeRows[i].lounge_id);
                    }
                    callback(null, connection,rows, isLikeArray);
                }
            })
        },

        function(connection, rows, isLikeArray, callback) {
            let loungePostLists=[];
             console.log('bbb')
            function closureSelectLoop(row){
                return function(callback){
                    connection.query('select lounge_image from lounge_image where lounge_id=?',row.lounge_id, (err, imageRows) =>{
                        if(err){
                            res.status(500).send({
                                message: "query error"
                            });
                            connection.release();
                            callback(err);
                        }else{
                            let imageArray=[];
                            for(let j=0;j<imageRows.length;j++){
                                imageArray.push(imageRows[j].lounge_image);
                            }

                            loungePostLists.push({
                                image: row.image,
                                name: row.name,
                                date: row.date,
                                lounge_image : imageArray,
                                content: row.content,
                                native_language: row.native_language,
                                hope_language : row.hope_language,
                                like_count : row.like_count,
                                comment_count : row.comment_count,
                                isLike : isLikeArray.indexOf(row.lounge_id)!=-1? true : false
                            });
                            callback(null);
                        }
                    })
                }
            }

            if (rows.length != 0) {
                let rowsArray=[];
                rows.map((row,index)=> {
                    rowsArray.push(closureSelectLoop(row,index))
                });
                async.series(rowsArray, function(err, result){
                    connection.release();
                    callback(null, loungePostLists);
                })
              
            }else{
                connection.release();
                callback(null, loungePostLists);
            }
        },

        function(loungePostLists, callback) {
            if (loungePostLists.length != 0) {
                res.status(200).send({
                    status:"success",
                    data: loungePostLists,
                    message: "successful get lounge post lists"
                });
                callback(null, "successful get lounge post lists");
            } else {
                res.status(200).send({
                    status:"fail",
                    data: null,
                    message: "fail get lounge post lists"
                });
                callback(null, "fail get lounge post lists");
            }
        }

    ];

    async.waterfall(taskArray, (err, result) => {
        if (err) console.log(err);
        else console.log(result);
    });
})



module.exports = router;