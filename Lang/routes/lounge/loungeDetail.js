const express = require('express');
const router = express.Router();

const secret = require('../../config/secret');
const jwt = require('jsonwebtoken');
const async = require('async');
const pool = require('../../config/dbPool');


router.get('/:lounge_id',(req,res)=>{
	let jwtToken = req.headers.jwttoken
	let userId ="5"

	// jwt.verify(jwtToken, secret, (err, data) => {
 //    	if (err){
 //  		if(err.message === 'jwt expired') {
 //      		console.log(err);
 //      		console.log('expired token');
 //    	}
 //  		else if(err.message === 'invalid token') console.log('invalid token');
 // 		 }
 //  		else {
	// 	    userId = data.key1;
	// }
	// console.log(userId);

	let taskArray = [
        function(callback) {
            pool.getConnection((err, connection) => {
                if (err) {
                    res.status(500).send({
                        message: "connection error"
                    });
                    callback(err);
                } else callback(null, connection);
            });
        },

        function(connection, callback) {
            connection.query('select user_image, user_name, lounge_time, native_lang, hope_lang, lounge_content, like_count ,comment_count ,(select count(*) from lounge_like where user_id = ? and lounge_id = ? ) as isLike from user, lounge where user.user_id = lounge.user_id and lounge_id = ?' ,[userId, req.params.lounge_id , req.params.lounge_id] , (err, rows) => {
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
        },

        function(connection,rows, callback){
            connection.query('select lounge_image from lounge_image where lounge_id = ?', req.params.lounge_id ,(err, imageRows) =>{
                if(err){
                    res.status(500).send({
                        message: "query error"
                    });
                    connection.release();
                    callback(err);
                }else{
                    let imageArray = [];
                    for(let i=0; i<imageRows.length;i++){
                        imageArray.push(imageRows[i].lounge_image);
                    }
                    callback(null, connection,rows, imageArray);
                }
            })
        },

        function(connection, rows, imageArray, callback) {
            let loungePostDetail
            connection.query('select user_image, user_name, comment_content, comment_time from user, lounge_comment where user.user_id = lounge_comment.user_id and lounge_id = ?',req.params.lounge_id, (err, commentRows) =>{
                if(err){
                    res.status(500).send({
                        message: "query error"
                    });
                    connection.release();
                    callback(err);
                }else{
                    console.log("a")
                    let commentArray = []
                    for(let i=0;i<commentRows.length;i++){
                        commentArray.push({
                            user_image : commentRows[i].user_image,
                            user_name : commentRows[i].user_name,
                            comment_content : commentRows[i].comment_content,
                            comment_time : commentRows[i].comment_time
                        })
                    }

                    if(rows.length!=0){
                        console.log("b")
                        loungePostDetail = {
                            user_image: rows[0].user_image,
                            user_name: rows[0].user_name,
                            lounge_time: rows[0].lounge_time,
                            lounge_image : imageArray,
                            native_lang: rows[0].native_lang,
                            hope_lang : rows[0].hope_lang,
                            lounge_content: rows[0].lounge_content,
                            like_count : rows[0].like_count,
                            comment_count : rows[0].comment_count,
                            comments : commentArray,
                            isLike : rows[0].isLike != 0? true : false
                        }
                    }
                    connection.release();
                    callback(null, loungePostDetail, rows);
                    
                }
            })

        },

        function(loungePostDetail, rows, callback) {
            if (rows.length!=0) {
                res.status(200).send({
                    status:"success",
                    data: loungePostDetail,
                    message: "successful get lounge post detail"
                });
                callback(null, "successful get lounge post detail");
            } else {
                res.status(200).send({
                    status:"fail",
                    data: null,
                    message: "fail get lounge post detail"
                });
                callback(null, "fail get lounge post detail");
            }
        }

    ];

    async.waterfall(taskArray, (err, result) => {
        if (err) console.log(err);
        else console.log(result);
    });
})



module.exports = router;