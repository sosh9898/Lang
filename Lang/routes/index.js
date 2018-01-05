const express = require('express');
const router = express.Router();

const user = require('./user');
// router.use('/user', user);

// const meeting = require('./meeting');
// router.use('/meeting', meeting);

<<<<<<< HEAD
const lounge = require('./lounge/index');
router.use('/lounge', lounge);
=======
// const lounge = require('./lounge');
// router.use('/lounge', lounge);
>>>>>>> cb675f674e9ac72908dee69cb1e723476b0400b2

// const user = require('./user');
// router.use('/user', user);
//
// const meeting = require('./meeting');
// router.use('/meeting', meeting);
//
// const lounge = require('./lounge');
// router.use('/lounge', lounge);
//
// const chatting = require('./chatting');
// router.use('/chatting', chatting);

// const mypage = require('./mypage');
// router.use('/mypage', mypage);

// const notification = require('./notification');
// router.use('/notification', notification);

<<<<<<< HEAD
// const notification = require('./notification');
// router.use('/notification', notification);

module.exports = router;
=======
const management = require('./management');
router.use('/management', management);

const reviews = require('./reviews');
router.use('/reviews', reviews);

module.exports = router;
>>>>>>> cb675f674e9ac72908dee69cb1e723476b0400b2
