/**
 * Created by lei_sun on 2017/12/1.
 */
var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    router = express.Router();
var version = require('../config/version');

var isDev = process.env.NODE_ENV !== 'production';

var firstUpper = function(str){
    var firstWord = str.substring(0, 1);
    return firstWord.toUpperCase() + str.substring(1);
};

var renderWrite = function(req, res, route){
    if(!isDev){
        var filename = firstUpper(route);

        res.render(route, { version: version }, function(err, html){
            fs.writeFile(path.join(__dirname, '../../public') + '/' + filename + '.html', html, 'utf8', (err) => {
                if (err) throw err;
                console.log('The file ' + filename + '.html has been saved!');
            });
        });
    }
};

router.get('/', function(req, res) {
    if(!isDev) {
        var array = ['inke', 'seniverse', 'video'];
        for(var i = 0; i < array.length; i++)
        {
            renderWrite(req, res, array[i]);
        }
        res.send('renderWrite Finished');
    }
});

module.exports = router;