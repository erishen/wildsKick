/**
 * Created by lei_sun on 2018/1/12.
 */
var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    router = express.Router();
var { exec } = require('child_process');

var videoConfig = require('../config/video');

var rootName = videoConfig.dictionary;

var doFFmpeg = function(index, filesArray, callback){
    if(filesArray) {
        var filesArrayLen = filesArray.length;
        console.log('doFFmpeg', index, filesArrayLen);

        if(index >= 0 && index < filesArrayLen){
            var fileObj = filesArray[index];
            var pathName = fileObj.pathName;
            var pathPrefix = fileObj.pathPrefix;

            if (pathName != '' && pathPrefix != '') {
                var command = 'ffmpeg -y -i ' + pathName + ' -vcodec copy -acodec copy ' + pathPrefix + '.mp4';
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        return;
                    }
                    //console.log(`stdout: ${stdout}`);
                    //console.log(`stderr: ${stderr}`);

                    setTimeout(function () {
                        fs.unlinkSync(pathName);

                        index++;
                        doFFmpeg(index, filesArray, callback);
                    }, 2000);
                });
            }
        }
        else {
            return callback && callback();
        }
    }
    else {
        return callback && callback();
    }
};

var getAllFiles = function(dictionaryName, filesArray){
    var files = fs.readdirSync(dictionaryName);

    files.forEach(function(file){
        var pathName = dictionaryName + '/' + file;
        var fileStat = fs.lstatSync(pathName);

        if(!fileStat.isDirectory()) {
            var pathObj = pathName.split('.');
            var pathObjLen = pathObj.length;

            if(pathObjLen > 1) {
                var pathPrefix = pathObj[0];
                var pathSuffix = pathObj[1].toLowerCase();
                if(pathSuffix == 'mov'){
                    //console.log('fileStat', fileStat);
                    filesArray.push({ pathName: pathName, pathPrefix: pathPrefix });
                }
            }
        }
        else {
            getAllFiles(pathName, filesArray);
        }
    });
};

router.get('/', function(req, res) {
    var filesArray = [];
    getAllFiles(rootName, filesArray);
    res.send(filesArray);
    doFFmpeg(0, filesArray);
});

module.exports = router;