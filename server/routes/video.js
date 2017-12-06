/**
 * Created by lei_sun on 2017/11/27.
 */
var express = require('express'),
    router = express.Router();
var version = require('../config/version');

router.get('/', function(req, res) {
    res.render('video', { version: version });
});

module.exports = router;