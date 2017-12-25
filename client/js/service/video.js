/**
 * Created by lei_sun on 2017/11/28.
 */
var $ = require('../lib/jquery-3.2.1.min');
var _ = require('../lib/lodash.min');
var util = require('../helper/util');

var video = {};
video.getList = function(sucCallback, errCallback){
    util.getJSON('/video/getList', sucCallback, errCallback);
};
video.getIndexFiles = function(sucCallback, errCallback){
    util.getJSON('/video/getIndexFiles', sucCallback, errCallback);
};
video.getIndex = function(sucCallback, errCallback){
    util.getJSON('/video/getIndex', sucCallback, errCallback);
};
video.setIndex = function(data, sucCallback, errCallback){
    util.ajaxPost('/video/setIndex', data, sucCallback, errCallback);
};
module.exports = video;