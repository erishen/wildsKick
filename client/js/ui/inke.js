/**
 * Created by lei_sun on 2017/12/5.
 */
var $ = require('../lib/jquery-3.2.1.min');
var _ = require('../lib/lodash.min');
var leancloud = require('../helper/leancloud');

var STORAGE_INKE_LIVEID_KEY = 'STORAGE_INKE_LIVEID_KEY';
var STORAGE_INKE_PLAYBEGIN_TIME_KEY = 'STORAGE_INKE_PLAYBEGIN_TIME_KEY';

var inke = {};
inke.logUserAction = function(parameters, player){
    console.log('logUserAction', parameters);

    leancloud.init();
    var inkeObject = leancloud.getObject('Inke');
    var inkeQuery = leancloud.getQuery('Inke');

    var { inkeLiveID, inkeUserID } = parameters;

    parameters.hostname = window.location.hostname;
    parameters.href = window.location.origin + window.location.pathname + '?U=' + inkeUserID + '&L=' + inkeLiveID;

    // 获取观看秒数
    var getWatchSeconds = function(){
        var watchSeconds = 0;
        var storageInkePlayBeginTime = window.localStorage.getItem(STORAGE_INKE_PLAYBEGIN_TIME_KEY);
        console.log('storageInkePlayBeginTime', storageInkePlayBeginTime);
        if(storageInkePlayBeginTime != null && storageInkePlayBeginTime != 0)
        {
            window.localStorage.setItem(STORAGE_INKE_PLAYBEGIN_TIME_KEY, 0);
            watchSeconds = parseInt(((new Date()).getTime() - storageInkePlayBeginTime) / 1000, 10);
        }
        console.log('watchSeconds', watchSeconds);
        return watchSeconds;
    };

    // 开始播放视频
    var playVideo = function(){
        var storageInkeLiveID = window.localStorage.getItem(STORAGE_INKE_LIVEID_KEY);
        console.log('storageInkeLiveID', storageInkeLiveID);

        if(storageInkeLiveID == null || storageInkeLiveID == 0 || storageInkeLiveID != inkeLiveID)
        {
            window.localStorage.setItem(STORAGE_INKE_LIVEID_KEY, inkeLiveID);
        }
        window.localStorage.setItem(STORAGE_INKE_PLAYBEGIN_TIME_KEY, (new Date()).getTime());

        parameters.watchSeconds = 0;
        parameters.status = 'play';
        leancloud.updateInkeObject(inkeQuery, inkeObject, parameters);
    };

    // 暂停播放视频
    var pauseVideo = function(){
        var storageInkeLiveID = window.localStorage.getItem(STORAGE_INKE_LIVEID_KEY);
        console.log('storageInkeLiveID', storageInkeLiveID);

        if(storageInkeLiveID == inkeLiveID)
        {
            parameters.watchSeconds = getWatchSeconds();
        }

        parameters.status = 'pause';
        leancloud.updateInkeObject(inkeQuery, inkeObject, parameters);
    };

    // 重新加载视频
    var reloadVideo = function(){
        var storageInkeLiveID = window.localStorage.getItem(STORAGE_INKE_LIVEID_KEY);
        console.log('storageInkeLiveID', storageInkeLiveID);

        if(storageInkeLiveID != null && storageInkeLiveID != 0 && storageInkeLiveID != inkeLiveID) {
            window.localStorage.setItem(STORAGE_INKE_LIVEID_KEY, 0);
            parameters.watchSeconds = getWatchSeconds();
            parameters.inkeLiveID = storageInkeLiveID;
            parameters.status = 'pause';
            leancloud.updateInkeObject(inkeQuery, inkeObject, parameters);
        }
    };

    if(player){
        player.onPlayState(1, function(){
            console.log('player_play', player.getVideoWidth(), player.getVideoHeight());
            playVideo();
        });
        player.onPlayState(2, function(){
            console.log('player_pause', player.getVideoWidth(), player.getVideoHeight());
            pauseVideo();
        });
        player.onPlayState(3, function(){
            console.log('player_ended');
            pauseVideo();
        });
    }

    // 监听页面可见
    document.addEventListener("visibilitychange", function(){
        if(document.hidden) { // 用户离开了
            pauseVideo();
        }
        else { // 用户回来了
            playVideo();
        }
    });

    /*
    var playClickFlag = true;
    var firstClickFlag = false;

    $('.js_player').on('click', function () {
        firstClickFlag = true;
        playClickFlag = true;

        console.log('play', inkeLiveID, inkeUserID);
        playVideo();

        setTimeout(function () {
            playClickFlag = false;
        }, 100);
    });

    $('.js_player_cover').on('click', function () {
        if (firstClickFlag && !playClickFlag) {
            console.log('pause', inkeLiveID, inkeUserID);
            pauseVideo();
        }
    });
    */

    $('.js_reload').on('click', function () {
        console.log('reload', inkeLiveID, inkeUserID);
        reloadVideo();
    });

    $(document).ready(function(){
        console.log('ready', inkeLiveID, inkeUserID);
        reloadVideo();
    });
};
module.exports = inke;