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
var inkeUI = require('../../js/ui/inke');

var videoId = 'my_video_1';
var playerUrl = 'http://vjs.zencdn.net/v/oceans.mp4';
var coverImageUrl = 'http://vjs.zencdn.net/v/oceans.png';
var urlPrefix = 'http://' + window.ip + ':9999';

var isRandom = false;
var videoFiles = [];
var videoFilesLen = 0;
var videoIndex = 0;
var videoStatus = '';
var tmpVideoIndex = 0;
var newVideoIndex = 0;
var newVideoStatus = '';
var directVideoIndex = 0;
var player = null;
var playerStatus = '';
var getIndexTimeout = null;

// URL 参数设置: R = Random, I = Index
var urlObj = util.getUrlObj(window.location.search);

if(urlObj){
    if(urlObj.R != undefined)
        isRandom = true;

    if(urlObj.I != undefined)
        directVideoIndex = parseInt(urlObj.I, 10);
}

// 视频播放
var videoPlay = function(){
    if(player){
        videoUI.play(player);
        playerStatus = 'play';
    }
};

// 视频暂停
var videoPause = function(){
    if(player){
        videoUI.pause(player);
        playerStatus = 'pause';
    }
};

// 停止延时获取
var stopGetIndex = function(){
    if(getIndexTimeout != null)
    {
        clearTimeout(getIndexTimeout);
        getIndexTimeout = null;
    }
};

// 间隔1秒调用后端接口 getIndex 获取 index, status
var getIndex = function(){
    stopGetIndex();

    videoService.getIndex(function(result){
        console.log('getIndex_result', result, tmpVideoIndex);
        if(result){
            newVideoIndex = parseInt(result.index, 10);
            newVideoStatus = result.status;

            if(tmpVideoIndex != newVideoIndex)
            {
                tmpVideoIndex = newVideoIndex;
                setVideo(tmpVideoIndex);
                if(player){
                    videoUI.play(player);
                }
            }

            if(player){
                if(newVideoStatus == 'play')
                    videoPlay();
                else if(newVideoStatus == 'pause')
                    videoPause();

                player.off('ended').on('ended', function(){
                    switch (newVideoStatus){
                        case 'random':
                            stopGetIndex();
                            doRandom(function(){
                                tmpVideoIndex = videoIndex;
                                videoPlay();
                                console.log('ended_random', videoIndex);
                                setTimeout(getIndex, 3000);
                            });
                            break;
                        case 'pre':
                            stopGetIndex();
                            doPre();
                            tmpVideoIndex = videoIndex;
                            videoPlay();
                            setTimeout(getIndex, 3000);
                            break;
                        case 'next':
                            stopGetIndex();
                            doNext();
                            tmpVideoIndex = videoIndex;
                            videoPlay();
                            setTimeout(getIndex, 3000);
                            break;
                        default:
                            videoPause();
                            $('.js_player').show();
                            $('.js_header').css('display', 'flex');
                            $('.js_operation').css('display', 'flex');
                            break;
                    }
                });
            }
        }

        getIndexTimeout = setTimeout(getIndex, 1000);
    });
};

// 视频信息相关内容显示
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
                playerUrl = urlPrefix + pathName;
                coverImageUrl = '';

                if(index == 0)
                {
                    $('.js_pre').hide();
                    $('.js_next').show();
                }
                else if(index == videoFilesLen - 1)
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

        if(!player)
            player = videoUI.init(videoId, coverImageUrl, playerUrl);
        else
            videoUI.setPlayerUrl(player, playerUrl);
    }
};

// 获取后端接口 getIndexFiles
videoService.getIndexFiles(function(result){
    if(result){
        videoIndex = parseInt(result.index, 10);
        videoFiles = result.files;
        videoFilesLen = videoFiles.length;

        if(isRandom) {
            util.getVideoRandomNum(videoIndex, videoFilesLen, function(randomIndex){
                videoIndex = randomIndex;
                setVideo(videoIndex);
                logUserAction();
            });
        }
        else if(directVideoIndex) {
            videoIndex = directVideoIndex;
            setVideo(videoIndex);
            logUserAction();
        }
        else {
            setVideo(videoIndex);
            if(player){
                videoUI.play(player);
                $('.vjs-control-bar').css('display', 'flex');
            }
            tmpVideoIndex = videoIndex;
            getIndex();
        }
    }
}, function(err){
    player = videoUI.init(videoId, coverImageUrl, playerUrl);
});

// 记录用户观看时长到 LeanCloud
var logUserAction = function(){
    var ipAddress = window.ip;
    if(ipAddress == '172.25.143.1') // 该网络地址不记录 LeanCloud
        return;

    if(player && videoIndex >= 0 && videoIndex < videoFilesLen){
        var videoObj = videoFiles[videoIndex];
        videoObj.inkeLiveID = videoIndex.toString();
        videoObj.inkeType = 'Video';

        var ipName = ipAddress.split('.').join('_');
        inkeUI.name = 'Video_' + ipName;
        inkeUI.logUserAction(videoObj, player);
    }
};

// 获取 URL Href
var getNewHref = function(params){
    return window.location.origin + window.location.pathname + params;
};

// 保存当前视频序号到 Redis
var setVideoIndex = function(){
    if(!isRandom && !directVideoIndex)
        videoService.setIndex({ index: videoIndex, status: videoStatus });
};

// DOM 事件绑定
var doPre = function(){
    console.log('doPre', videoIndex);
    if(videoIndex >= 1) {
        videoIndex--;
    }
    else {
        videoIndex = videoFilesLen - 1;
    }
    videoStatus = 'pre';
    setVideo(videoIndex);
    setVideoIndex();
};

var doNext = function(){
    console.log('doNext', videoIndex);
    if(videoIndex <= videoFilesLen - 2) {
        videoIndex++;
    }
    else {
        videoIndex = 0;
    }

    videoStatus = 'next';
    setVideo(videoIndex);
    setVideoIndex();
};

var doDirect = function(){
    window.location.href = getNewHref('?I=' + videoIndex);
};

var doRandom = function(callback){
    util.getVideoRandomNum(videoIndex, videoFilesLen, function(randomIndex){
        videoIndex = randomIndex;
        videoStatus = 'random';
        setVideo(videoIndex);
        setVideoIndex();
        return callback && callback();
    });
};

$('.js_pre').click(doPre);
$('.js_next').click(doNext);
$('.js_direct').click(doDirect);
$('.js_random').click(function(){
    doRandom();
});
$('.js_player_cover').on('click', function () {
    if(!isRandom && !directVideoIndex)
        stopGetIndex();
});
$('.js_player').on('click', function () {
    if(!isRandom && !directVideoIndex)
        getIndex();
});