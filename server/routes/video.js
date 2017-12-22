/**
 * Created by lei_sun on 2017/11/27.
 */
var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    router = express.Router();
var redis = require("redis");
var version = require('../config/version');
var rootName = '/movie';
var redisFlag = false;

router.get('/', function(req, res) {
    res.render('video', { version: version });
});

var getAllFiles = function(dictionaryName, filesArray){
    var files = fs.readdirSync(dictionaryName);
    console.log('files', files);

    files.forEach(function(file){
        var pathName = dictionaryName + '/' + file;
        var fileStat = fs.lstatSync(pathName);

        if(!fileStat.isDirectory()) {
            //console.log('fileStat', pathName, fileStat);
            pathName = pathName.replace(rootName, '');
            filesArray.push({
                pathName: pathName,
                mtimeMs: fileStat.mtimeMs,
                size: fileStat.size
            });
        }
        else {
            getAllFiles(pathName, filesArray);
        }
    });
};

router.get('/getList', function(req, res) {
    var files = [];

    if(redisFlag){
        var videoKey = 'video_files';
        var redisClient = redis.createClient();
        redisClient.get(videoKey, function (err, replies) {
            console.log('replies: ' + replies);
            if(replies == undefined){
                getAllFiles(rootName, files);
                redisClient.set(videoKey, JSON.stringify(files), 'EX', 3600); // expires 3600s
            }
            else {
                files = JSON.parse(replies, true);
            }

            res.send({ files: files });
            redisClient.quit();
        });
    }
    else
    {
        getAllFiles(rootName, files);
        res.send({ files: files });
    }
});

module.exports = router;