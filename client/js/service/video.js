/**
 * Created by lei_sun on 2017/11/28.
 */
var $ = require('../lib/jquery-3.2.1.min');
var _ = require('../lib/lodash.min');
var util = require('../helper/util');

var video = {};
video.getList = function(sucCallback, errCallback){
    util.getJSON('/video/getVideoList', sucCallback, errCallback);
};
video.getIndexFiles = function(sucCallback, errCallback){
    util.getJSON('/video/getVideoIndexFiles', sucCallback, errCallback);
};
video.getIndex = function(sucCallback, errCallback){
    util.getJSON('/video/getVideoIndex', sucCallback, errCallback);
};
video.setIndex = function(data, sucCallback, errCallback){
    util.ajaxPost('/video/setVideoIndex', data, sucCallback, errCallback);
};
video.getTags = function(sucCallback, errCallback) {
    util.getJSON('/video/getVideoTags', sucCallback, errCallback);
};
video.setTags = function(data, sucCallback, errCallback){
    util.ajaxPost('/video/setVideoTags', data, sucCallback, errCallback);
};
video.getTagsVideo = function(mtimeMs, size, sucCallback, errCallback) {
    util.getJSON('/video/getVideoTagsVideo?mtimeMs=' + mtimeMs + '&size=' + size, sucCallback, errCallback);
};

module.exports = video;