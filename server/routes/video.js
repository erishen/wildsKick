/**
 * Created by lei_sun on 2017/11/27.
 */
var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    router = express.Router();
var redis = require("redis");
var bodyParser = require('body-parser');
var url = require('url');
var version = require('../config/version');
var videoMysql = require('../service/videoMysql');

var redisFlag = true;
var rootName = '/home/erishen/Videos';
// 测试数据
//rootName = 'D:/ERISHEN';

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
    //console.log('files', files);

    files.forEach(function(file){
        var pathName = dictionaryName + '/' + file;
        var fileStat = fs.lstatSync(pathName);

        if(!fileStat.isDirectory()) {
            //console.log('fileStat', pathName, fileStat);
            pathName = pathName.replace(rootName, '');

            var pathObj = pathName.split('.');
            var pathObjLen = pathObj.length;
            if(pathObjLen > 1)
            {
                var pathSuffix = pathObj[1].toLowerCase();
                if(pathSuffix == 'mp4' || pathSuffix == 'mov'){
                    filesArray.push({
                        pathName: pathName,
                        mtimeMs: fileStat.mtimeMs,
                        size: fileStat.size
                    });
                }
            }
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

// 视频控制器
router.get('/videoControl', function(req, res) {
    if(redisFlag)
        redisClient = redis.createClient();
    res.render('video/control', { version: version });
});

// 视频Tag页面
router.get('/videoTag', function(req, res){
    res.render('video/tag', { version: version });
});

// 视频列表
router.get('/getVideoList', function(req, res) {
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

// 视频列表以及序号
router.get('/getVideoIndexFiles', function(req, res) {
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

// 获取视频序号
router.get('/getVideoIndex', function(req, res) {
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

// 设置视频序号
router.post('/setVideoIndex', bodyParser.json(), function(req, res){
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
    res.send({ flag: 'Successfully' });
});

// 获取视频Tags
router.get('/getVideoTags', function(req, res){
    videoMysql.getVideoTags(function(result){
        if(result){
            res.send(JSON.stringify(result));
        }
        else {
            res.send('');
        }
    });
});

// 获取视频TagsVideo
router.get('/getVideoTagsVideo', function(req, res){
    var query = url.parse(req.url, true).query;
    if(query){
        var mtimeMs = query.mtimeMs;
        var size = query.size;

        videoMysql.getVideoTagsVideo(mtimeMs, size, function(result){
            if(result){
                res.send(JSON.stringify(result));
            }
            else {
                res.send('');
            }
        });
    }
});

// 设置视频Tags
router.post('/setVideoTags', bodyParser.json(), function(req, res){
    videoMysql.setVideoTags(req.body, function(result){
        res.send({ flag: result });
    });
});

// 新增 Tag
router.get('/videoTagAdd', function(req, res){
    var query = url.parse(req.url, true).query;
    console.log(query);

    if(query){
        var name = query.name;

        if(name) {
            videoMysql.videoTagAdd(name, function(result){
                if(result)
                    res.send(result);
                else
                    res.send('Please check url parameters');
            });
        } else {
            res.send('Please check url parameters');
        }
    }
    else {
        res.send('Please check url parameters');
    }
});

// 删除 Tag
router.get('/videoTagDel', function(req, res){
    var query = url.parse(req.url, true).query;
    console.log(query);

    if(query){
        var name = query.name;

        if(name){
            videoMysql.videoTagDel(name, function(result){
                if(result)
                    res.send(result);
                else
                    res.send('Please check url parameters');
            });
        }
        else {
            res.send('Please check url parameters');
        }
    }
    else {
        res.send('Please check url parameters');
    }
});

// 清除 Tags, Tags_video
router.get('/videoTagClean', function(req, res){
    videoMysql.videoTagClean(function(result){
        if(result)
            res.send(result);
        else
            res.send('Please check url parameters');
    });
});

// 根据 tag 搜索相应的 videoIndex
router.get('/searchTagsVideo', function(req, res){
    var query = url.parse(req.url, true).query;
    console.log(query);

    if(query){
        var tags = query.tags;

        if(tags) {
            videoMysql.searchTagsVideo(tags, function(result){
                if(result)
                    res.send(result);
                else
                    res.send('Please check url parameters');
            });
        } else {
            res.send('Please check url parameters');
        }
    }
    else {
        res.send('Please check url parameters');
    }
});

module.exports = router;