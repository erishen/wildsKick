/**
 * Created by lei_sun on 2017/11/27.
 */
require("./index.less");

var $ = require('../../js/lib/jquery-3.2.1.min');
var _ = require('../../js/lib/lodash.min');
var videoUI = require('../../js/ui/video');

var videoId = 'my_video_1';
var playerUrl = 'http://vjs.zencdn.net/v/oceans.mp4';
var coverImageUrl = 'http://vjs.zencdn.net/v/oceans.png';

videoUI.init(videoId, coverImageUrl, playerUrl);