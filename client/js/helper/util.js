/**
 * Created by lei_sun on 2017/11/28.
 */
var $ = require('../lib/jquery-3.2.1.min');
var _ = require('../lib/lodash.min');
var config = require('../helper/config');

var randomArray = [];
var numWordArray = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
    'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y', 'z',
    '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=', '?', '/'
];

var util = {};
util.ajaxPost = function(url, data, sucCallback, errCallback, beforeCallback){
    var self = this;
    //console.log('ajaxPost', url, data);

    data.head = {};
    data.contentType = "json";
    data = JSON.stringify(data);

    $.ajax({
        type: "POST",
        url: url,
        data: data,
        dataType: 'json',
        beforeSend: function (xhr) {
            if(beforeCallback)
                return beforeCallback(xhr);
            else
                xhr.setRequestHeader('Content-Type', 'application/json');
        },
        success: function (result) {
            return sucCallback && sucCallback(result);
        },
        error: function (err) {
            console.log('post_err', err);
            return errCallback && errCallback(err);
        }
    });
};
util.getGeoLocation = function(callback) {
    var self = this;
    console.log('getGeoLocation', window.navigator.geolocation);
    var longitude = 121.48;
    var latitude = 31.22;

    if (window.navigator.geolocation) {
        window.navigator.geolocation.getCurrentPosition(function (position) {
            console.log('getGeoLocation_result: ', position);
            longitude = position.coords.longitude;
            latitude = position.coords.latitude;
            return callback && callback({ longitude: longitude, latitude: latitude });
        }, function (err) {
            console.log('getGeoLocation_err: ', err);
            return callback && callback({ longitude: longitude, latitude: latitude });
        }, { timeout: 10000 });
    }
    else {
        //window.alert('您的浏览器不能获取地理位置');
        return callback && callback({ longitude: longitude, latitude: latitude });
    }
};
util.getUrlObj = function(url){
    console.log('getUrlObj', url);
    var result = {};
    var beginIndex = url.indexOf('?');
    if(beginIndex != -1)
        url = url.substring(beginIndex+1);

    if(url)
    {
        var urlArr = url.split('&');
        _.each(urlArr, function(item, index){
            var itemArr = item.split('=');
            if(itemArr)
            {
                if(itemArr.length >= 2)
                    result[itemArr[0]] = itemArr[1];
                else if(itemArr.length == 1 && itemArr[0] == 'R')
                    result[itemArr[0]] = 0;
            }
        });
    }
    return result;
};
util.getRandomNum = function(min, max){
    return Math.floor(Math.random()*(max-min+1)+min);
};
util.getVideoRandomNum = function(index, length, callback){
    var self = this;
    var randomArrayLen = randomArray.length;
    var randomIndex = self.getRandomNum(0, length - 1);

    if(index == randomIndex)
        return self.getVideoRandomNum(index, length, callback);
    else{
        if(randomArrayLen < length){
            for(var i = 0; i < randomArrayLen; i++){
                var storeRandomIndex = randomArray[i];
                if(storeRandomIndex == randomIndex){
                    return self.getVideoRandomNum(index, length, callback);
                }
            }
        }
        else {
            randomArray.length = 0;
        }

        randomArray.push(randomIndex);
        console.log('randomArray', JSON.stringify(randomArray));
        return callback && callback(randomIndex);
    }
};
util.getJSON = function(url, sucCallback, errCallback, alwaysCallback){
    //console.log('getJSON', url);

    if(url != '')
    {
        $.getJSON(url, function(data) {
            return sucCallback && sucCallback(data);
        }).fail(function(err) {
            console.log("error: ", err);
            return errCallback && errCallback(err);
        }).always(function() {
            //console.log("complete");
            return alwaysCallback && alwaysCallback();
        });
    }
    else
    {
        console.log("error: url can not be null");
        return errCallback && errCallback();
    }
};
util.decodeMyStr = function(str){
    console.log('decodeMyStr', str);
    var strArr = str.split('');
    var strArrLen = strArr.length;
    var numWordArrayLen = numWordArray.length;

    var result = [];
    for(var i = 0; i < strArrLen; i++){
        var flag = false;
        for(var j = 0; j < numWordArrayLen; j++){
            if(strArr[i].toString() == numWordArray[j].toString())
            {
                result.push(numWordArray[numWordArrayLen-1-j].toString());
                flag = true;
                break;
            }
        }

        if(!flag)
            result.push(' ');
    }

    return result.join('');
};
util.encodeMyStr = function(str){
    console.log('encodeMyStr', str);
    var strArr = str.split('');
    var strArrLen = strArr.length;
    var numWordArrayLen = numWordArray.length;

    var result = [];
    for(var i = 0; i < strArrLen; i++){

        var flag = false;
        for(var j = 0; j < numWordArrayLen; j++){
            if(strArr[i].toString() == numWordArray[j].toString())
            {
                result.push(numWordArray[numWordArrayLen-1-j]);
                flag = true;
                break;
            }
        }

        if(!flag)
            result.push(' ');
    }

    console.log('result', result.join(''));
    return result.join('');
};
// 向 HTML 中动态插入 script 标签，通过 JSONP 的方式进行调用
util.appendScript = function(url){
    var newScript = document.createElement('script');
    newScript.type = 'text/javascript';
    newScript.src = url;
    $('body').append(newScript);
};
module.exports = util;