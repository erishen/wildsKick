/**
 * Created by lei_sun on 2017/11/27.
 */
var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    router = express.Router();
var moment = require('moment');
var multer = require('multer');
var redis = require("redis");
var bodyParser = require('body-parser');
var url = require('url');
var version = require('../config/version');
var videoConfig = require('../config/video');
var videoMysql = require('../service/videoMysql');
var systemService = require('../service/system');
var md5 = require('../../public/wildsCOMMON/md5');

var rootName = videoConfig.dictionary;
var uploadDictionary = rootName + '/uploads/';

var redisFlag = true;
var newUploadDictionary = '';
var uploadArray = [];

var createFolder = function(folder){
    try{
        fs.accessSync(folder);
    }catch(e){
        fs.mkdirSync(folder);
    }
};

createFolder(uploadDictionary);

// 通过 filename 属性定制
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDictionary);    // 保存的路径，备注：需要自己创建
    },
    filename: function (req, file, cb) {
        // 将保存文件名设置为 字段名 + 时间戳，比如 logo-1478521468943
        cb(null, file.fieldname + '-' + Date.now());
    }
});

// 通过 storage 选项来对 上传行为 进行定制化
var uploadMulter = multer({ storage: storage });

// 测试数据
//rootName = 'D:/ERISHEN';

var videoFilesKey = videoConfig.redisVideoFilesKey;
var videoIndexKey = videoConfig.redisVideoIndexKey;
var expireSeconds = videoConfig.redisExpireSeconds;
var redisClient = null;

var getOneFile = function(pathName, fileStat, filesArray){

    if(filesArray == undefined)
        filesArray = [];

    if(pathName != '' && fileStat){
        pathName = pathName.replace(rootName, '');

        var pathObj = pathName.split('.');
        var pathObjLen = pathObj.length;

        if(pathObjLen > 1)
        {
            var pathSuffix = pathObj[1].toLowerCase();
            var fileSuffixs = videoConfig.fileSuffixs;
            var fileSuffixsLen = fileSuffixs.length;
            for(var i = 0; i < fileSuffixsLen; i++){
                if(pathSuffix == fileSuffixs[i]){

                    //console.log('pathName', pathName);
                    var lastIndex = pathName.lastIndexOf('/');
                    var fileName = pathName;
                    if(lastIndex != -1){
                        fileName = pathName.substring(lastIndex+1);
                    }
                    //console.log('fileName', fileName);

                    var fileSize = fileStat.size;
                    var mtimeMs = fileStat.mtimeMs;
                    var fileKey = md5(fileName + ':' + fileSize);

                    filesArray.push({
                        fileKey: fileKey,
                        pathName: pathName,
                        mtimeMs: mtimeMs,
                        size: fileSize
                    });
                }
            }
        }
    }

    return filesArray;
};

var getAllFiles = function(dictionaryName, filesArray){
    var files = fs.readdirSync(dictionaryName);
    //console.log('files', files);

    files.forEach(function(file){
        var pathName = dictionaryName + '/' + file;
        var fileStat = fs.lstatSync(pathName);

        if(!fileStat.isDirectory()) {
            getOneFile(pathName, fileStat, filesArray);
        }
        else {
            getAllFiles(pathName, filesArray);
        }
    });
};

// 视频页面
router.get('/', function(req, res) {
    if(redisFlag)
        redisClient = redis.createClient();
    res.render('video', { version: version, ip: systemService.getIPAdress() });
});

// 视频控制器页面
router.get('/videoControl', function(req, res) {
    if(redisFlag)
        redisClient = redis.createClient();
    res.render('video/control', { version: version });
});

// 视频Tag页面
router.get('/videoTag', function(req, res){
    res.render('video/tag', { version: version });
});

// 视频上传页面
router.get('/videoUpload', function(req, res){
    res.render('video/upload', { version: version, ip: systemService.getIPAdress() });
});

// 创建文件夹
var createDictionary = function(index, array, callback){

    if(index == 0)
        newUploadDictionary = uploadDictionary;

    var arrayLen = array.length;
    if(array && arrayLen > 0){
        if(index >= 0 && index < arrayLen){
            newUploadDictionary += array[index] + '/';
            fs.mkdir(newUploadDictionary, function(err) {
                if(!err){
                    index++;
                    return createDictionary(index, array, callback);
                }
                else {
                    console.log('mkdir_err', err);
                    if(index < arrayLen - 1){
                        index++;
                        return createDictionary(index, array, callback);
                    }
                    else
                        return callback && callback();
                }
            });
        }
        else {
            return callback && callback();
        }
    }
    else {
        return callback && callback();
    }
};

// 分片文件合并
var uploadStreamFile = function(needMergeFileNames, newStream, callback){
    if(!needMergeFileNames.length){
        newStream.end('Done');
        return callback && callback();
    }

    var needMergeFileName = uploadDictionary + '/' + needMergeFileNames.shift();
    var stream = fs.createReadStream(needMergeFileName);
    stream.pipe(newStream, { end: false });
    stream.on('end', function(){
        console.log(needMergeFileName + ' appended');
        fs.unlinkSync(needMergeFileName);
        uploadStreamFile(needMergeFileNames, newStream, callback);
    })
};

// 处理新上传的文件
var handleNewFile = function(newPath, originFileKey, callback){
    var newFilePathName = newPath.replace(rootName, '');
    var pathObj = newPath.split('.');
    var pathObjLen = pathObj.length;
    var videoFlag = false;

    if(pathObjLen > 1) {
        var pathSuffix = pathObj[1].toLowerCase();
        var fileSuffixs = videoConfig.fileSuffixs;
        var fileSuffixsLen = fileSuffixs.length;
        for (var i = 0; i < fileSuffixsLen; i++) {
            if (pathSuffix == fileSuffixs[i]) {
                videoFlag = true;
                break;
            }
        }
    }

    if(redisFlag && videoFlag){
        var newFilesArray = [];
        redisClient = redis.createClient();
        redisClient.get(videoFilesKey, function (err, replies) {
            if(!err){
                console.log('replies: ' + replies);
                if(replies != undefined && replies != '[]'){
                    newFilesArray = JSON.parse(replies, true);
                }

                var appendFlag = true;
                var newFilesArrayLen = newFilesArray.length;

                for(var i = 0; i < newFilesArrayLen; i++){
                    var newFileObj = newFilesArray[i];
                    var newFileKey = newFileObj.fileKey;

                    if(originFileKey == newFileKey)
                    {
                        newFilePathName = newFileObj.pathName;
                        appendFlag = false;
                        break;
                    }
                }

                if(appendFlag){
                    var newFileStat = fs.lstatSync(newPath);
                    getOneFile(newPath, newFileStat, newFilesArray);
                    console.log('newFilesArray', newFilesArray);
                    redisClient.set(videoFilesKey, JSON.stringify(newFilesArray), 'EX', expireSeconds);
                }

                return callback && callback({ flag: true, playUrl: newFilePathName });
            }
            else {
                console.log('redis_err', err);
                return callback && callback({ flag: false });
            }
        });
    }
    else {
        return callback && callback({ flag: true });
    }
};

// 视频上传
router.post('/videoUploadTo', uploadMulter.single('uploadFile'), function(req, res){
    // 没有附带文件
    if (!req.file) {
        res.json({ flag: false });
        return;
    }

    // 输出文件信息
    console.log('====================================================');
    console.log('fieldname: ' + req.file.fieldname);
    console.log('originalname: ' + req.file.originalname);
    console.log('encoding: ' + req.file.encoding);
    console.log('mimetype: ' + req.file.mimetype);
    console.log('size: ' + (req.file.size / 1024).toFixed(2) + 'KB');
    console.log('destination: ' + req.file.destination);
    console.log('filename: ' + req.file.filename);
    console.log('path: ' + req.file.path);
    console.log('req.body: ', req.body);

    var tmpFileName = req.file.filename;
    var fileSize = parseInt(req.file.size, 10);
    var reqBody = req.body;
    var hadUploadSize = parseInt(reqBody.hadUploadSize, 10);
    var originFileKey = reqBody.fileKey;
    var originFileName = reqBody.fileName;
    var originFileSize = parseInt(reqBody.fileSize, 10);

    console.log('originFileKey', originFileKey, originFileName, originFileSize);

    var uploadFlag = false;

    if(fileSize == originFileSize){ // 文件没有分片上传
        uploadFlag = true;
    }
    else { // 文件分片上传
        var keyFlag = false;
        var uploadArrayLen = uploadArray.length;
        for(var i = 0; i < uploadArrayLen; i++){
            var uploadObj = uploadArray[i];
            var uploadFileKey = uploadObj.fileKey;
            var uploadFileSize = uploadObj.fileSize;

            if(uploadFileKey == originFileKey){
                keyFlag = true;
                if(fileSize + uploadFileSize == originFileSize)
                {
                    uploadFlag = true;
                }
                else {
                    uploadObj.fileSize = fileSize + uploadFileSize;
                }
                uploadObj.fileNames.push(tmpFileName);
                break;
            }
        }

        if(!keyFlag){
            uploadArray.push({ fileKey: originFileKey, fileSize: fileSize, fileNames: [ tmpFileName ] });
        }
    }

    if(uploadFlag){ // 文件通过multer上传完毕，进行处理
        // 根据上传日期创建文件夹
        var today = moment().format('YYYY-MM-DD');
        console.log('today', today);

        var dicArray = [today];
        var dicArrayLen = dicArray.length;
        var newDictionary = uploadDictionary;
        for(var i = 0; i < dicArrayLen; i++){
            newDictionary += dicArray[i] + '/';
        }

        var newPath = newDictionary + originFileName;
        createDictionary(0, dicArray, function(){
            console.log('uploadArray', uploadArray);
            var uploadArrayLen = uploadArray.length;
            if(uploadArrayLen > 0){
                var needMergeFileNames = uploadArray[0].fileNames;
                var newStreamPath = fs.createWriteStream(newPath);
                // 分片文件合并
                uploadStreamFile(needMergeFileNames, newStreamPath, function(){
                    uploadArray.length = 0;
                    handleNewFile(newPath, originFileKey, function(result){
                        res.json(result);
                    });
                });
            }
            else {
                // 重命名文件
                var oldPath = req.file.path;
                fs.rename(oldPath, newPath, function(err){
                    if (err) {
                        var newFilePathName = newPath.replace(rootName, '');
                        res.json({ flag: true, playUrl: newFilePathName });
                        console.log('rename_err', err);
                        fs.unlinkSync(oldPath);
                    } else {
                        handleNewFile(newPath, originFileKey, function(result){
                            res.json(result);
                        });
                    }
                });
            }
        });
    }
    else { // 只是传了分片，还要继续上传其他分片
        res.json({ flag: false, uploadFlag: true, hadUploadSize: hadUploadSize + fileSize });
    }
});

// 视频列表
router.get('/getVideoList', function(req, res) {
    var files = [];

    if(redisFlag && redisClient){
        redisClient.get(videoFilesKey, function (err, replies) {
            if(!err) {
                console.log('replies: ' + replies);
                if(replies == undefined || replies == '[]'){
                    getAllFiles(rootName, files);
                    redisClient.set(videoFilesKey, JSON.stringify(files), 'EX', expireSeconds);
                }
                else {
                    files = JSON.parse(replies, true);
                }
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

                if(!fileErr && !indexErr) {
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
                    res.send([]);
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