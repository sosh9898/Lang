const express = require('express');
const router = express.Router();
const loungePid = require('./loungePid');
const loungeLike = require('./loungeLike');

router.use('/loungePid', loungePid);
// router.use('/loungeLike', loungeLike);

module.exports = router;
