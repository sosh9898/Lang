const express = require('express');
const router = express.Router();

const user = require('./user');
router.use('/user', user);

const meeting = require('./meeting');
router.use('/meeting', meeting);


const lounge = require('./lounge/index');
router.use('/lounge', lounge);

const chatting = require('./chatting');
router.use('/chatting', chatting);

const mypage = require('./mypage');
router.use('/mypage', mypage);

const notification = require('./notification');
router.use('/notification', notification);

const management = require('./management');
router.use('/management', management);

const reviews = require('./reviews');
router.use('/reviews', reviews);

module.exports = router;

