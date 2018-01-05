const express = require('express');
const router = express.Router();

const secret = require('../../config/secret');
const jwt = require('jsonwebtoken');
const async = require('async');
const pool = require('../../config/dbPool');


router.get('/:filter',(req,res)=>{
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
            let query ;
            if(req.params.filter =='following'){
                query = 'select lounge_id,user_name,user_image,lounge_time,lounge_content,native_lang,hope_lang,like_count, comment_count from user,lounge where user.user_id = lounge.user_id and user.native_lang in (select hope_lang from user where user_id=?) and user.hope_lang in (select native_lang from user where user_id=?) and lounge_id in (select lounge_id from user, lounge, user_following where lounge.user_id=user_following.following_id and user_following.user_id=?) order by lounge_time desc '
            }else{

                query = 'select lounge_id,user_name,user_image,lounge_time,lounge_content,native_lang,hope_lang,like_count, comment_count from user,lounge where  user.user_id = lounge.user_id and (lounge.user_id = ? or (user.native_lang in (select hope_lang from user where user_id=?) and user.hope_lang in (select native_lang from user where user_id=?) and (lounge_id in (select lounge_id from user,lounge where  is_public=0 or  lounge_id in (select lounge_id from user,lounge where is_public=1 and lounge_id in (select lounge_id from user, lounge,user_following where lounge.user_id=user_following.following_id and user_following.user_id=?)))))) order by lounge_time desc '
            }
            connection.query(query, [userId, userId, userId, userId], (err, rows) => {
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
            connection.query('select lounge_id from lounge_like where lounge_like.user_id =?', userId,(err, isLikeRows) =>{
                if(err){
                    res.status(500).send({
                        message: "query error"
                    });
                    connection.release();
                    callback(err);
                }else{
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
                                user_image: row.user_image,
                                user_name: row.user_name,
                                lounge_time: row.lounge_time,
                                lounge_image : imageArray,
                                lounge_content: row.lounge_content,
                                native_lang: row.native_lang,
                                hope_lang : row.hope_lang,
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