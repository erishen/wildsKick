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

$('#js_file').change(function(e){
    $('#js_image').hide();
    uploadFile = e.target.files[0];
    console.log('uploadFile', uploadFile);
    var fileType = uploadFile.type;
    uploadFileName = uploadFile.name;
    $('#js_progress').html('0%');

    if(fileType.indexOf('image') != -1)
    {
        $('#js_image').show();
        var reader = new FileReader();
        reader.onload = function (event) {
            console.log('fileReader', event);
            $('#js_image').attr('src', event.target.result);
        };
        reader.readAsDataURL(uploadFile);
    }

    if(player){
        videoUI.pause(player);
    }
});

$('#js_upload').click(function(e){
    $(e.currentTarget).removeClass('btn-unclick').addClass('btn-click');

    if(uploadFile){
        var formData = new FormData();
        formData.append('upload-file', uploadFile);
        uploadFile = null;
        $('#js_file').val('');

        util.ajaxPostFile('/video/videoUploadTo', formData, function(result){
            console.log('upload_result', result);
            if(result){
                var flag = result.flag;
                if(flag){
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
            }
        }, function(xhr){
            if(xhr){
                xhr.upload.onprogress = function(event){
                    console.log('upload_event', event);
                    if (event.lengthComputable) {
                        var complete = Number.parseInt(event.loaded / event.total * 100);
                        $('#js_progress').html(uploadFileName + ' <span class="progress-num">' + complete + '%</span>');
                    }
                };
            }
        });
    }

    setTimeout(function(){
        $(e.currentTarget).removeClass('btn-click').addClass('btn-unclick');
    }, 500);
});