require("./index.less");

var $ = require('../../js/lib/jquery-3.2.1.min');
var _ = require('../../js/lib/lodash.min');
var moment = require('../../js/lib/moment-with-locales.min');
var util = require('../../js/helper/util');
var videoService = require('../../js/service/video');

var videoFiles = [];
var videoFilesLen = 0;
var videoIndex = 0;
var videoStatus = '';

var setVideo = function(index){
    console.log('setVideo_index', index);

    if(videoFiles){
        if(videoFilesLen > 0) {
            if(index >= 0 && index < videoFilesLen){
                var fileObj = videoFiles[index];
                var pathName = fileObj.pathName;
                var mtimeMs = fileObj.mtimeMs;
                var size = fileObj.size;

                mtimeMs = moment(mtimeMs).format('YYYY-MM-DD HH:mm:ss');
                size = parseInt(size / 1024 / 1024, 10) + 'MB';

                console.log('mtimeMs', mtimeMs);
                console.log('size', size);

                var title = index + '(' + (videoFilesLen - 1) + ').' + pathName;
                document.title = title;
                $('.js_title').html(title + '<br/>' + mtimeMs + ' ' + size);
                return;
            }
        }
    }

    $('.js_title').html('没有什么可控制的');
};

var setVideoIndex = function(){
    videoService.setIndex({ index: videoIndex, status: videoStatus }, function(result){
        console.log('setVideoIndex_result', result);
        if(result){
            var flag = result.flag;
            $('.js_result').html(flag);
            setTimeout(function(){
                $('.js_result').html('');
            }, 500);
        }
    });
};

videoService.getIndexFiles(function(result){
    if(result){
        videoIndex = parseInt(result.index, 10);
        videoFiles = result.files;
        videoFilesLen = videoFiles.length;

        if(videoIndex >= videoFilesLen)
            videoIndex = 0;

        setVideo(videoIndex);
    }
});

$('.js_pre').click(function(){
    if(videoIndex >= 1){
        videoIndex--;
        videoStatus = 'pre';
        setVideo(videoIndex);
        setVideoIndex();
    }
});

$('.js_next').click(function(){
    if(videoIndex <= videoFilesLen - 2){
        videoIndex++;
        videoStatus = 'next';
        setVideo(videoIndex);
        setVideoIndex();
    }
});

$('.js_random').click(function(){
    util.getVideoRandomNum(videoIndex, videoFilesLen, function(randomIndex){
        videoIndex = randomIndex;
        videoStatus = 'random';
        setVideo(videoIndex);
        setVideoIndex();
    });
});

$('.js_btn_play').click(function(){
    videoStatus = 'play';
    setVideoIndex();
});

$('.js_btn_pause').click(function(){
    videoStatus = 'pause';
    setVideoIndex();
});
