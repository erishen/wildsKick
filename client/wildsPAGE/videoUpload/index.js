require("./index.less");

var $ = require('../../js/lib/jquery-3.2.1.min');
var _ = require('../../js/lib/lodash.min');
var moment = require('../../js/lib/moment-with-locales.min');
var util = require('../../js/helper/util');
var videoService = require('../../js/service/video');

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
        }, function(xhr){
            if(xhr){
                xhr.upload.onprogress = function(event){
                    console.log('upload_event', event);
                    if (event.lengthComputable) {
                        var complete = Number.parseInt(event.loaded / event.total * 100);
                        $('#js_progress').html(uploadFileName + ' ' + complete + '%');
                    }
                };
            }
        });
    }

    setTimeout(function(){
        $(e.currentTarget).removeClass('btn-click').addClass('btn-unclick');
    }, 500);
});