const express = require('express');
const router = express.Router();
const loungePid = require('./loungePid');
const loungeLike = require('./loungeLike');
const loungeDetail = require('./loungeDetail');

router.use('/loungePid', loungePid);
router.use('/loungeLike', loungeLike);
router.use('/loungeDetail', loungeDetail);

module.exports = router;
