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

var screenWidth = $(window).width();
console.log('screenWidth', screenWidth);

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
                return;
            }
        }
    }

    $('.js_title').html('Nothing To Control');
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
        }

        getIndexTimeout = setTimeout(getIndex, 1000);
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

// 获取后端接口 getTags
videoService.getTags(function(result){
    console.log('getTags', result);
    if(result){
        var resultLen = result.length;
        var content = [];

        for(var i = 0; i < resultLen; i++){

            if(i == 0) {
                content.push('<div class="row">');
            }
            else if(i % 4 == 0){
                content.push('</div><div class="row">');
            }

            var tag = result[i];
            var tagId = tag.id;
            var tagName = tag.name;
            content.push('<div class="btn btn-unclick btn-tag" data-val="' + tagId + '">' + (tagName) + '</div>');
        }

        content.push('</div>');

        $('.js_tag').html(content.join(''));
        $('.row').css({ width: screenWidth });

        $('.btn-tag').click(function(e){
            changeClickEffect(e);
            var tagId = $(e.currentTarget).data('val');
            console.log('tagId', tagId);
            setTags(tagId);
        });
    }
});

// 增加点击效果
var changeClickEffect = function(e){
    $('.btn').removeClass('btn-click').addClass('btn-unclick');
    $(e.currentTarget).addClass('btn-click');
};

// 设置Tag
var setTags = function(tagId){
    var fileObj = videoFiles[videoIndex];
    var pathName = fileObj.pathName;
    var mtimeMs = fileObj.mtimeMs;
    var size = fileObj.size;

    var data = {
        tagId: tagId,
        videoIndex:  videoIndex,
        pathName: pathName,
        mtimeMs: mtimeMs,
        size: size
    };
    videoService.setTags(data, function(result){
        console.log('setTags_result', result);
    });
};