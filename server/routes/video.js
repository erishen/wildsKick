/**
 * Created by lei_sun on 2017/11/27.
 */
var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    router = express.Router();
var redis = require("redis");
var bodyParser = require('body-parser');
var version = require('../config/version');
var rootName = '/home/erishen/Videos';
var redisFlag = true;
var videoFilesKey = 'video_files';
var videoIndexKey = 'video_index';
var expireSeconds = 3600;
var redisClient = null;

var getIPAdress = function(){
    var interfaces = require('os').networkInterfaces();
    for(var devName in interfaces){
        var iface = interfaces[devName];
        for(var i=0;i<iface.length;i++){
            var alias = iface[i];
            if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                return alias.address;
            }
        }
    }
};

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

router.get('/', function(req, res) {
    if(redisFlag)
        redisClient = redis.createClient();
    res.render('video', { version: version, ip: getIPAdress() });
});

router.get('/videoControl', function(req, res) {
    if(redisFlag)
        redisClient = redis.createClient();
    res.render('video/control', { version: version });
});

router.get('/getList', function(req, res) {
    var files = [];

    if(redisFlag && redisClient){
        redisClient.get(videoFilesKey, function (err, replies) {
            console.log('replies: ' + replies);
            if(replies == undefined || replies == '[]'){
                getAllFiles(rootName, files);
                redisClient.set(videoFilesKey, JSON.stringify(files), 'EX', expireSeconds);
            }
            else {
                files = JSON.parse(replies, true);
            }

            res.send({ files: files });
        });
    }
    else
    {
        getAllFiles(rootName, files);
        res.send({ files: files });
    }
});

router.get('/getIndexFiles', function(req, res) {
    var index = 0;
    var status = '';
    var files = [];

    if(redisFlag && redisClient) {
        redisClient.get(videoFilesKey, function (fileErr, fileReplies) {
            redisClient.get(videoIndexKey, function (indexErr, indexReplies) {

                if(indexReplies != undefined && indexReplies != ''){
                    var indexArr = indexReplies.split('.');
                    var indexArrLen = indexArr.length;

                    if(indexArrLen > 0)
                        index = parseInt(indexArr[0], 10);

                    if(indexArrLen > 1)
                        status = indexArr[1];
                }

                if(fileReplies == undefined || fileReplies == '[]'){
                    getAllFiles(rootName, files);
                    redisClient.set(videoFilesKey, JSON.stringify(files), 'EX', expireSeconds);
                }
                else {
                    files = JSON.parse(fileReplies, true);
                }

                res.send({ files: files, index: index, status: status });
            });
        });
    }
    else
    {
        getAllFiles(rootName, files);
        res.send({ files: files, index: 0, status: '' });
    }
});

router.get('/getIndex', function(req, res) {
    var index = 0;
    var status = '';

    if(redisFlag && redisClient){
        redisClient.get(videoIndexKey, function (indexErr, indexReplies) {
            if(indexReplies != undefined && indexReplies != ''){
                var indexArr = indexReplies.split('.');
                var indexArrLen = indexArr.length;

                if(indexArrLen > 0)
                    index = parseInt(indexArr[0], 10);

                if(indexArrLen > 1)
                    status = indexArr[1];
            }

            res.send({ index: index, status: status });
        });
    }
    else
    {
        res.send({ index: 0 });
    }
});

router.post('/setIndex', bodyParser.json(), function(req, res){
    if(redisFlag && redisClient) {
        console.log('setIndex', req.body);
        var body = req.body;
        if(body){
            var index = body.index;
            var status = body.status;

            if(index != undefined)
                index = parseInt(index, 10);

            redisClient.set(videoIndexKey, index + '.' + status, 'EX', expireSeconds);
        }
    }
    res.send({ flag: 'success' });
});

module.exports = router;