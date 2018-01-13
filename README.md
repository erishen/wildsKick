## Start

1. Clone this repo.

2. Install dependencies.

        npm install
        npm install supervisor -g

3. Try these out.

    * `npm start` to develop with full live reload.
    * `npm run browsersync` is a alternative for development. It may be faster when modifying the express views
    (templates) only.
    * `npm run production` to emit outputs and run the express for production.
    * `npm run build` if you care about what is hold in memory for development...
    
4. URL list:
    * 视频投影,连续播放: http://localhost:3000/video
    * 视频随机播放: http://localhost:3000/video?R
    * 视频按序播放: http://localhost:3000/video?I=0....
    * 视频遥控器: http://localhost:3000/videoControl
    * 视频加标签: http://localhost:3000/videoTag
    * 视频上传: http://localhost:3000/videoUpload
    * 增加标签: http://localhost:3000/videoTagAdd?name=..,..
    * 删除标签: http://localhost:3000/videoTagDel?name=..,..
    * 清理标签: http://localhost:3000/videoTagClean
    * ffmpeg all mov to mp4: http://localhost:3000/ffmpeg
    * 映客视频随机播放: http://localhost:3000/inke?R
    * 映客视频单个播放: http://localhost:3000/inke?U=..&L=..
    * 天气按城市显示:   http://localhost:3000/seniverse?L=..
