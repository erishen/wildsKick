require("./index.less");

var $ = require('../../js/lib/jquery-3.2.1.min');
var _ = require('../../js/lib/lodash.min');
var moment = require('../../js/lib/moment-with-locales.min');
var util = require('../../js/helper/util');
var videoService = require('../../js/service/video');
var videoUI = require('../../js/ui/video');

var videoId = 'my_video_1';
var playerUrl = 'http://vjs.zencdn.net/v/oceans.mp4';
var coverImageUrl = 'http://vjs.zencdn.net/v/oceans.png';
var urlPrefix = 'http://' + window.ip + ':9999';
var player = null;

var uploadFileName = '';
var uploadFile = null;
var uploadFileSize = 0; // 上传的文件总大小
var uploadHadUploaded = 0;  // 已上传文件大小
var trunkSize = 1 * 1024 * 1024;  // 4M = 4 * 1024 * 1024

// 设置上传进度
var setProgress = function(progress){
    $('#js_progress').html(uploadFileName + ' <span class="progress-num">' + progress + '%</span>');
};

// 上传文件
var sendUploadFile = function(fileKey, fileSize, file, callback, options){
    var formData = new FormData();
    formData.append('fileKey', fileKey);
    formData.append('fileSize', fileSize);
    formData.append('uploadFile', file);

    if(options){
        for(var key in options){
            formData.append(key, options[key]);
        }
    }

    util.ajaxPostFile('/video/videoUploadTo', formData, function(result){
        console.log('upload_result', result);
        if(result){
            var flag = result.flag;
            if(flag){
                uploadHadUploaded = uploadFileSize;
                setProgress(100);

                var playUrl = result.playUrl;

                if(playUrl){
                    playerUrl = urlPrefix + playUrl;
                    $('#js_videoContent').css('display', 'flex');

                    if(!player)
                        player = videoUI.init(videoId, '', playerUrl);
                    else
                        videoUI.setPlayerUrl(player, playerUrl);

                    if(player){
                        setTimeout(function(){
                            videoUI.play(player);
                        }, 1000);
                    }
                }
            }
            else {
                var uploadFlag = result.uploadFlag;
                var hadUploadSize = result.hadUploadSize;
                uploadHadUploaded = hadUploadSize;

                if(uploadFlag && hadUploadSize < fileSize){
                    var trunkFile = uploadFile.slice(hadUploadSize, hadUploadSize + trunkSize);
                    options.hadUploadSize = hadUploadSize;
                    return sendUploadFile(fileKey, fileSize, trunkFile, callback, options);
                }
            }
        }
    }, function(xhr){
        if(xhr){
            xhr.upload.onprogress = function(event){
                console.log('upload_event', event, uploadHadUploaded, uploadFileSize);
                if (event.lengthComputable) {
                    var complete = Number.parseInt(event.loaded / event.total * 100);
                    if(uploadFileSize > trunkSize){
                        complete = Number.parseInt(uploadHadUploaded / uploadFileSize * 100);
                    }
                    console.log('complete', complete);
                    setProgress(complete);
                }
            };
        }
    });
};

// 根据文件大小进行分片上传
var postUploadFile = function(fileKey, fileSize, offset, callback, options){
    if(uploadFile){
        var trunkFile = null;
        if(offset + trunkSize < fileSize){
            trunkFile = uploadFile.slice(offset, offset + trunkSize);
            sendUploadFile(fileKey, fileSize, trunkFile, function(){
                postUploadFile(fileKey, fileSize, offset + trunkSize, callback, options);
            }, options);
        }
        else {
            trunkFile = uploadFile.slice(offset, offset + fileSize);
            sendUploadFile(fileKey, fileSize, trunkFile, function(){
                return callback && callback();
            }, options);
        }
    }
};

// DOM 事件绑定
$('#js_file').change(function(e){
    $('#js_image').hide();
    uploadFile = e.target.files[0];
    console.log('uploadFile', uploadFile);

    var fileType = uploadFile.type;
    uploadFileName = uploadFile.name;
    setProgress(0);

    if(fileType.indexOf('image') != -1)
    {
        $('#js_image').show();
        $('#js_videoContent').hide();
        var reader = new FileReader();
        reader.onload = function (event) {
            console.log('fileReader', event);
            $('#js_image').attr('src', event.target.result);
        };
        reader.readAsDataURL(uploadFile);
    }
    else if(fileType.indexOf('video') != -1){
        $('#js_image').hide();
        $('#js_videoContent').css('display', 'flex');

        if(!player)
            player = videoUI.init(videoId, coverImageUrl, playerUrl);
    }

    if(player){
        videoUI.pause(player);
    }
});

$('#js_upload').click(function(e){
    if(uploadFile){
        $('#js_file').val('');
        $(e.currentTarget).removeClass('btn-unclick').addClass('btn-click');

        var fileName = uploadFile.name;
        var fileSize = uploadFile.size;
        var fileKey = md5(fileName + ':' + fileSize);
        uploadFileSize = fileSize;
        uploadHadUploaded = 0;

        postUploadFile(fileKey, fileSize, 0, function(){
            uploadFile = null;
        }, {
            fileName: fileName,
            hadUploadSize: 0
        });

        setTimeout(function(){
            $(e.currentTarget).removeClass('btn-click').addClass('btn-unclick');
        }, 500);
    }
});