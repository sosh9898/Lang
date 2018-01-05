const express = require('express');
const router = express.Router();

const secret = require('../../config/jwt_secret');
const jwt = require('jsonwebtoken');
const async = require('async');
const pool = require('../../config/dbPool');


router.put('/:lounge_id',(req,res)=>{
    let jwtToken = req.headers.jwttoken
    let userId ="4"

    // jwt.verify(jwtToken, secret, (err, data) => {
 //     if (err){
 //         if(err.message === 'jwt expired') {
 //             console.log(err);
 //             console.log('expired token');
 //     }
 //         else if(err.message === 'invalid token') console.log('invalid token');
 //          }
 //         else {
    //      userId = data.key1;
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
            connection.query('select * from lounge_like where lounge_id = ? and user_id = ?',[req.params.lounge_id,userId],(err, rows)=>{
                if(err){
                    res.status(500).send({
                        message: "query error"
                    });
                    connection.release();
                    callback(err);
                }else callback(null, connection,rows);
            })
        },

        function(connection, rows, callback) {
            let variationValue ;
            if(rows.length == 0){
                connection.query('insert into lounge_like(lounge_id,user_id) value(?,?)',[req.params.lounge_id,userId],(err, rows)=>{
                    if(err){
                        res.status(500).send({
                            message: "query error"
                        });
                        connection.release();
                        callback(err);
                    }else {
                        variationValue = 1;
                        callback(null, connection, variationValue);
                    }
                }) 
            }else{
                connection.query('delete from lounge_like where lounge_id =? and user_id=?',[req.params.lounge_id,userId],(err, rows)=>{
                    if(err){
                        res.status(500).send({
                            message: "query error"
                        });
                        connection.release();
                        callback(err);

                    }else{
                        variationValue = -1;
                        callback(null, connection, variationValue);
                    }
                }) 
            }
            
        },

        function(connection, variationValue, callback) {
            connection.query('update lounge set like_count = like_count + (?) where lounge_id = ?',[variationValue,req.params.lounge_id],(err, updateResult)=>{
                if(err){
                    res.status(500).send({
                        message: "query error"
                    });
                    connection.release();
                    callback(err);
                }else {
                    connection.release();
                    callback(null,updateResult);
                }
            })
        },

        function(updateResult, callback) {
            if (updateResult!=0) {
                res.status(201).send({
                    status:"success",
                    data : null,
                    message: "success like update"
                });
                 callback(null, "success like update");
            } else {
                res.status(201).send({
                    status:"fail",
                    data : null,
                    message: "fail like update"
                });
                callback(null, "fail like update");
            }
        }

    ];

    async.waterfall(taskArray, (err, result) => {
        if (err) console.log(err);
        else console.log(result);
    });
})

module.exports = router;