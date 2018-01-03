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
var getIndexTimeout = null;
var tmpVideoIndex = 0;
var newVideoIndex = 0;
var videoTags = '';

// URL 参数设置: T = Tag
var urlObj = util.getUrlObj(window.location.search);

if(urlObj){
    if(urlObj.T != undefined)
        videoTags = urlObj.T;
}

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

                displayIndexArea();
                return;
            }
        }
    }

    $('.js_title').html('Nothing To Control');
};

// 保存当前视频序号到 Redis
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

// 停止延时获取
var stopGetIndex = function(){
    if(getIndexTimeout != null)
    {
        clearTimeout(getIndexTimeout);
        getIndexTimeout = null;
    }
};

// 间隔3秒调用后端接口 getIndex 获取 index, status
var getIndex = function(){
    stopGetIndex();

    videoService.getIndex(function(result){
        console.log('getIndex_result', result, tmpVideoIndex);
        if(result){
            newVideoIndex = parseInt(result.index, 10);
            videoStatus = result.status;
            videoIndex = newVideoIndex;

            if(tmpVideoIndex != newVideoIndex)
            {
                tmpVideoIndex = newVideoIndex;
                setVideo(tmpVideoIndex);
            }

            if(videoStatus != '') {
                var obj = {};
                obj.currentTarget = '.js_btn_' + videoStatus;
                changeClickEffect(obj);
            }
        }

        getIndexTimeout = setTimeout(getIndex, 3000);
    });
};

// 获取后端接口 getIndexFiles
videoService.getIndexFiles(function(result){
    if(result){
        videoIndex = parseInt(result.index, 10);
        videoFiles = result.files;
        videoFilesLen = videoFiles.length;

        if(videoIndex >= videoFilesLen)
            videoIndex = 0;

        setVideo(videoIndex);
        getIndex();
    }
});

// 显示与当前视频序号相关的其他序号
var displayIndexArea = function(){
    var content = [];
    content.push('<div class="row">');

    if(videoIndex > 5)
        content.push('<div class="btn btn-unclick btn-index">' + (videoIndex - 5) + '</div>');
    else
        content.push('<div class="btn btn-unclick btn-index">' + (0) + '</div>');

    if(videoIndex + 5 <= videoFilesLen - 1)
        content.push('<div class="btn btn-unclick btn-index">' + (videoIndex + 5) + '</div>');
    else
        content.push('<div class="btn btn-unclick btn-index">' + (videoFilesLen - 1) + '</div>');

    content.push('</div>');

    $('.js_index').html(content.join(''));

    $('.btn-index').click(function(e){
        changeClickEffect(e);
        videoIndex = parseInt($(e.currentTarget).html(), 10);
        setVideo(videoIndex);
        setVideoIndex();
    });
};

// 增加点击效果
var changeClickEffect = function(e){
    $('.btn').removeClass('btn-click').addClass('btn-unclick');
    $(e.currentTarget).addClass('btn-click');
};

// 调用后端接口 searchTagsVideo
var searchTagsVideo = function(callback){
    videoTags = util.trim(videoTags);
    if(videoTags != ''){
        return videoService.searchTagsVideo(videoTags, callback);
    }
    return callback && callback(null);
};

// DOM 事件绑定
$('.js_btn_pre').click(function(e){
    changeClickEffect(e);
    if(videoIndex >= 1){
        videoIndex--;
    }
    else {
        videoIndex = videoFilesLen - 1;
    }
    videoStatus = 'pre';
    setVideo(videoIndex);
    setVideoIndex();
});

$('.js_btn_next').click(function(e){
    changeClickEffect(e);
    if(videoIndex <= videoFilesLen - 2){
        videoIndex++;
    }
    else {
        videoIndex = 0;
    }
    videoStatus = 'next';
    setVideo(videoIndex);
    setVideoIndex();
});

$('.js_btn_random').click(function(e){
    changeClickEffect(e);

    searchTagsVideo(function(indexArray){
        console.log('videoTags_indexArray', indexArray);
        util.getVideoRandomNum(videoIndex, videoFilesLen, function(randomIndex){
            videoIndex = randomIndex;
            videoStatus = 'random';
            setVideo(videoIndex);
            setVideoIndex();
        }, indexArray);
    });
});

$('.js_btn_play').click(function(e){
    changeClickEffect(e);
    videoStatus = 'play';
    setVideoIndex();
});

$('.js_btn_pause').click(function(e){
    changeClickEffect(e);
    videoStatus = 'pause';
    setVideoIndex();
});
