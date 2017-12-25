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

var urlPrefix = 'http://' + window.ip + ':9999';

// URL 参数设置: R = Random
var urlObj = util.getUrlObj(window.location.search);

var isRandom = false;
var videoFiles = [];
var videoIndex = 0;
var newVideoIndex = 0;
var player = null;

if(urlObj){
    if(urlObj.R != undefined)
        isRandom = true;

    if(urlObj.I != undefined)
        videoIndex = parseInt(urlObj.I, 10);
}

var getIndex = function(){
    videoService.getIndex(function(result){
        console.log('getIndex_result', result);
        if(result){
            newVideoIndex = parseInt(result.index, 10);

            if(videoIndex != newVideoIndex)
            {
                videoIndex = newVideoIndex;
                setVideo(videoIndex);

                if(player){
                    videoUI.play(player);
                }
            }
        }
    });

    setTimeout(getIndex, 1000);
};

var setVideo = function(index){
    console.log('setVideo_index', index);

    if(videoFiles){
        var filesLen = videoFiles.length;

        if(filesLen > 0) {
            if(index >= 0 && index < filesLen){
                var fileObj = videoFiles[index];
                var pathName = fileObj.pathName;
                var mtimeMs = fileObj.mtimeMs;
                var size = fileObj.size;

                mtimeMs = moment(mtimeMs).format('YYYY-MM-DD HH:mm:ss');
                size = parseInt(size / 1024 / 1024, 10) + 'MB';

                console.log('mtimeMs', mtimeMs);
                console.log('size', size);

                var title = index + '(' + (filesLen - 1) + ').' + pathName;
                document.title = title;
                $('.js_title').html(title + '<br/>' + mtimeMs + ' ' + size);
                playerUrl = urlPrefix + pathName;
                coverImageUrl = '';
                player = videoUI.init(videoId, coverImageUrl, playerUrl);

                if(index == 0)
                {
                    $('.js_pre').hide();
                    $('.js_next').show();
                }
                else if(index == filesLen - 1)
                {
                    $('.js_pre').show();
                    $('.js_next').hide();
                }
                else
                {
                    $('.js_pre').show();
                    $('.js_next').show();
                }
            }
        }
        else {
            player = videoUI.init(videoId, coverImageUrl, playerUrl);
        }
    }
};

videoService.getList(function(result){
    if(result){
        videoFiles = result.files;

        if(isRandom)
            videoIndex = util.getRandomNum(0, videoFiles.length - 1);

        setVideo(videoIndex);
    }

    getIndex();
}, function(err){
    player = videoUI.init(videoId, coverImageUrl, playerUrl);
});

var getNewHref = function(params){
    return window.location.origin + window.location.pathname + params;
};

var getRandomNum = function(callback){
    var randomIndex = util.getRandomNum(0, videoFiles.length - 1);
    if(videoIndex == randomIndex)
        getRandomNum(callback);
    else{
        videoIndex = randomIndex;
        return callback && callback();
    }
};

$('.js_pre').click(function(){
    videoIndex--;
    setVideo(videoIndex);
});

$('.js_next').click(function(){
    videoIndex++;
    setVideo(videoIndex);
});

$('.js_direct').click(function(){
    window.location.href = getNewHref('?I=' + videoIndex);
});

$('.js_random').click(function(){
    getRandomNum(function(){
        setVideo(videoIndex);
    });
});