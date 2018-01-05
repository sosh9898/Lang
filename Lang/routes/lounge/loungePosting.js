const express = require('express');
const router = express.Router();

const secret = require('../../config/jwt_secret');
const jwt = require('jsonwebtoken');
const async = require('async');
const pool = require('../../config/dbPool');


router.post('/',(req,res)=>{
    let jwtToken = req.headers.jwttoken
    let userId ="5"

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
            connection.query('insert into lounge(lounge_content, user_id, is_public) value(?,?,?)',[req.body.lounge_content, userId, req.body.is_public],(err, rows)=>{
                if(err){
                    res.status(500).send({
                        message: "query error"
                    });
                    connection.release();
                    callback(err);
                }else callback(null, connection,rows);
            })
        },

        function(connection, rows, callback){
             connection.query('select LAST_INSERT_ID() as lounge_id',(err, postingLoungeIdRows)=>{
                if(err){
                    res.status(500).send({
                        message: "query error"
                    });
                    connection.release();
                    callback(err);
                }else callback(null, connection, rows, postingLoungeIdRows);
            })
        },

        function(connection, rows, postingLoungeIdRows, callback) {
            query = '';
            let imageArray = req.body.imageArray;
            //dbPool.js db 설정 multiStatements true로 설정해줘야됨.
            for(let i=0;i<imageArray.length;i++){
                query += `insert into lounge_image(lounge_id, lounge_image) value(${postingLoungeIdRows[0].lounge_id},?);`
            }

            connection.query(query, [...imageArray], (err, postingResult)=>{
                if(err){
                    res.status(500).send({
                        message: "query error"
                    });
                    connection.release();
                    callback(err);
                }else {
                    connection.release();
                    callback(null, rows);
                }
            }) 
        },

        function(rows, callback) {
            console.log('bb');
            if (rows.length!=0) {
                res.status(201).send({
                    status:"success",
                    data : null,
                    message: "success lounge post"
                });
                 callback(null, "success lounge post");
            } else {
                res.status(201).send({
                    status:"fail",
                    data : null,
                    message: "fail lounge post"
                });
                callback(null, "fail lounge post");
            }
        }

    ];

    async.waterfall(taskArray, (err, result) => {
        if (err) console.log(err);
        else console.log(result);
    });
})

module.exports = router;