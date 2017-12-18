/**
 * Created by lei_sun on 2017/11/27.
 */
require("./index.less");

var $ = require('../../js/lib/jquery-3.2.1.min');
var _ = require('../../js/lib/lodash.min');
var moment = require('../../js/lib/moment-with-locales.min');
var util = require('../../js/helper/util');
var videoUI = require('../../js/ui/video');
var videoService = require('../../js/service/video');

var videoId = 'my_video_1';
var playerUrl = 'http://vjs.zencdn.net/v/oceans.mp4';
var coverImageUrl = 'http://vjs.zencdn.net/v/oceans.png';

var urlPrefix = 'http://localhost:9999';

// URL 参数设置: R = Random
var urlObj = util.getUrlObj(window.location.search);

var isRandom = false;
var videoIndex = 0;

if(urlObj){
    if(urlObj.R != undefined)
        isRandom = true;

    if(urlObj.I != undefined)
        videoIndex = parseInt(urlObj.I, 10);
}

videoService.getList(function(result){
    if(result){
        var files = result.files;
        var filesLen = files.length;

        if(isRandom)
            videoIndex = util.getRandomNum(0, filesLen - 1);

        console.log('videoIndex', videoIndex);
        var fileObj = files[videoIndex];
        var pathName = fileObj.pathName;
        var mtimeMs = fileObj.mtimeMs;
        var size = fileObj.size;
        console.log('mtimeMs', moment(mtimeMs).format('YYYY-MM-DD HH:mm:ss'));
        console.log('size', parseInt(size / 1024 / 1024, 10) + 'MB');

        document.title = videoIndex + '.' + pathName;
        playerUrl = urlPrefix + pathName;
        videoUI.init(videoId, coverImageUrl, playerUrl);
    }
}, function(err){
    videoUI.init(videoId, coverImageUrl, playerUrl);
});