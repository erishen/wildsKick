var mysql = require('mysql');
var mysqlFlag = true;
var mysqlConnection = null;

var initMysql = function(){
    if(mysqlFlag && mysqlConnection == null){
        mysqlConnection = mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            password : 'password',
            database : 'video'
        });
        mysqlConnection.connect();
    }
};

var trim = function (str) {
    return str.replace(/^\s*|\s*$/g, '');
};

/*
    status: 0 => insert success, 1 => name exist, 2 => name is '',
            -1 => insert error, -2 => select error
 */
var videoTagAddOne = function(index, nameArray, result, callback){
    console.log('videoTagAddOne', index, nameArray);
    if(nameArray){
        var nameArrayLen = nameArray.length;
        if(index >= 0 && index < nameArrayLen){
            var name = nameArray[index];
            if(trim(name) != '' && mysqlConnection != null) {
                mysqlConnection.query('select id from tags where name=?', name, function (selectError, selectResults, fields) {
                    if (!selectError && selectResults) {
                        if (selectResults.length == 0) {
                            mysqlConnection.query('insert into tags(name,times,createDate)values(?,0,now())', name, function (insertError, insertResults, fields) {
                                if (!insertError){
                                    // insert success
                                    result.push({ name: name, status: 0 });
                                }
                                else {
                                    // insert error
                                    result.push({ name: name, status: -1 });
                                }

                                if(index + 1 < nameArrayLen)
                                    return videoTagAddOne(index + 1, nameArray, result, callback);
                                else
                                    return callback && callback(result);
                            });
                        }
                        else
                        {
                            // name exist
                            result.push({ name: name, status: 1 });

                            if(index + 1 < nameArrayLen)
                                return videoTagAddOne(index + 1, nameArray, result, callback);
                            else
                                return callback && callback(result);
                        }
                    }
                    else
                    {
                        // select error
                        result.push({ name: name, status: -2 });

                        if(index + 1 < nameArrayLen)
                            return videoTagAddOne(index + 1, nameArray, result, callback);
                        else
                            return callback && callback(result);
                    }
                });
            }
            else
            {
                // name is ''
                result.push({ name: name, status: 2 });

                if(index + 1 < nameArrayLen)
                    return videoTagAddOne(index + 1, nameArray, result, callback);
                else
                    return callback && callback(result);
            }
        } else {
            return callback && callback(result);
        }
    } else {
        return callback && callback(result);
    }
};

/*
  status: 0 => delete success, 1 => nothing to delete, 2 => name is '',
         -1 => delete tags_video error, -2 => delete tags error, -3 => select error
 */
var videoTagDelOne = function(index, nameArray, result, callback){
    console.log('videoTagDelOne', index, nameArray);
    if(nameArray){
        var nameArrayLen = nameArray.length;
        if(index >= 0 && index < nameArrayLen){
            var name = nameArray[index];
            if(trim(name) != '' && mysqlConnection != null) {

                mysqlConnection.query('select id from tags where name=?', name, function (selectError, selectResults, fields) {
                    console.log('selectError', selectError, selectResults);

                    if (!selectError && selectResults) {
                        if (selectResults.length > 0) {
                            var id = selectResults[0].id;
                            mysqlConnection.query('delete from tags_video where tagId=?', id, function (deleteError, deleteResults, fields) {
                                if(!deleteError){
                                    mysqlConnection.query('delete from tags where id=?', id, function (deleteError2, deleteResults2, fields) {
                                        if (!deleteError2) {
                                            // delete success
                                            result.push({ name: name, status: 0 });
                                        }
                                        else {
                                            // delete tags error
                                            result.push({ name: name, status: -2 });
                                        }

                                        if(index + 1 < nameArrayLen)
                                            return videoTagDelOne(index + 1, nameArray, result, callback);
                                        else
                                            return callback && callback(result);
                                    });
                                }
                                else {
                                    // delete tags_video error
                                    result.push({ name: name, status: -1 });

                                    if(index + 1 < nameArrayLen)
                                        return videoTagDelOne(index + 1, nameArray, result, callback);
                                    else
                                        return callback && callback(result);
                                }
                            });
                        }
                        else {
                            // nothing to delete
                            result.push({ name: name, status: 1 });

                            if(index + 1 < nameArrayLen)
                                return videoTagDelOne(index + 1, nameArray, result, callback);
                            else
                                return callback && callback(result);
                        }
                    }
                    else {
                        // select error
                        result.push({ name: name, status: -3 });

                        if(index + 1 < nameArrayLen)
                            return videoTagDelOne(index + 1, nameArray, result, callback);
                        else
                            return callback && callback(result);
                    }
                });
            }
            else
            {
                // name is ''
                result.push({ name: name, status: 2 });

                if(index + 1 < nameArrayLen)
                    return videoTagDelOne(index + 1, nameArray, result, callback);
                else
                    return callback && callback(result);
            }
        } else {
            return callback && callback(result);
        }
    } else {
        return callback && callback(result);
    }
};

exports.videoTagAdd = function(names, callback){
    if(mysqlFlag)
        initMysql();

    var result = [];
    if(trim(names) != '' && mysqlConnection != null){
        var namesArr = names.split(',');
        videoTagAddOne(0, namesArr, result, function(newResult){
            return callback && callback(newResult);
        });
    }
    else {
        return callback && callback(null);
    }
};

exports.videoTagDel = function(names, callback){
    if(mysqlFlag)
        initMysql();

    var result = [];
    if(trim(names) != '' && mysqlConnection != null){
        var namesArr = names.split(',');
        videoTagDelOne(0, namesArr, result, function(newResult){
            return callback && callback(newResult);
        });
    }
    else {
        return callback && callback(null);
    }
};

exports.videoTagClean = function(callback){
    if(mysqlFlag)
        initMysql();

    if(mysqlConnection != null){
        mysqlConnection.query('update tags set times=0', function (updateError, updateResults, fields) {
            if (!updateError) {
                mysqlConnection.query('delete from tags_video', function (deleteError, deleteResults, fields) {
                    if (!deleteError) {
                        // clean successfully
                        return callback && callback({ status: 0 });
                    }
                    else {
                        // delete tags_video error
                        return callback && callback({ status: -2 });
                    }
                });
            }
            else {
                // update tags error
                return callback && callback({ status: -1 });
            }
        });
    }
    else {
        // mysqlConnection is null
        return callback && callback({ status: 1 });
    }
};

exports.getVideoTags = function(callback){
    if(mysqlFlag)
        initMysql();

    if(mysqlConnection != null){
        mysqlConnection.query('select * from tags', function (error, results, fields) {
            if (!error) {
                return callback && callback(results);
            }
            else {
                return callback && callback(null);
            }
        });
    }
    else {
        return callback && callback(null);
    }
};

exports.setVideoTags = function(tagObj, callback){
    if(mysqlFlag)
        initMysql();

    if(mysqlConnection != null){
        console.log('setVideoTags', tagObj);
        var tagId = tagObj.tagId;
        var videoIndex = tagObj.videoIndex;
        var pathName = tagObj.pathName;
        var mtimeMs = tagObj.mtimeMs;
        var size = tagObj.size;
        var deleteFlag = tagObj.deleteFlag;

        mysqlConnection.query('select id from tags_video where tagId=? and mtimeMs=? and size=?',
            [tagId, mtimeMs, size], function (selectError, selectResults, fields) {
                if (!selectError && selectResults) {
                    if(selectResults.length == 0){
                        // Insert
                        mysqlConnection.query('insert into tags_video(tagId, videoIndex, pathName, mtimeMs, size, createDate) values (?,?,?,?,?,now())',
                            [tagId, videoIndex, pathName, mtimeMs, size], function (insertError, insertResults, fields) {
                                if (!insertError) {
                                    mysqlConnection.query('update tags set times=times+1 where id=?', tagId, function (updateError, updateResults, fields) {
                                        if (!updateError) {
                                            return callback && callback(true);
                                        }
                                        else {
                                            return callback && callback(false);
                                        }
                                    });
                                }
                                else {
                                    return callback && callback(false);
                                }
                            });
                    }
                    else {
                        var id = selectResults[0].id;
                        if(!deleteFlag) {
                            // Update
                            mysqlConnection.query('update tags_video set videoIndex=?, pathName=? where id=?',
                                [videoIndex, pathName, id], function (updateError2, updateResults2, fields) {
                                    if (!updateError2) {
                                        return callback && callback(true);
                                    }
                                    else {
                                        return callback && callback(false);
                                    }
                                });
                        }
                        else {
                            // Delete
                            mysqlConnection.query('delete from tags_video where id=?', id, function(deleteError, deleteResult, fields){
                                if(!deleteError){
                                    mysqlConnection.query('update tags set times=times-1 where id=?', tagId, function (updateError3, updateResults3, fields) {
                                        if (!updateError3) {
                                            return callback && callback(true);
                                        }
                                        else {
                                            return callback && callback(false);
                                        }
                                    });
                                }
                                else {
                                    return callback && callback(false);
                                }
                            });
                        }
                    }
                }
                else {
                    return callback && callback(false);
                }
            });

    }
    else {
        return callback && callback(false);
    }
};

exports.getVideoTagsVideo = function(mtimeMs, size, callback){
    if(mysqlFlag)
        initMysql();

    if(mysqlConnection != null){
        mysqlConnection.query('select tagId from tags_video where mtimeMs=? and size=?',
            [mtimeMs, size], function (error, results, fields) {
            if (!error) {
                return callback && callback(results);
            }
            else {
                return callback && callback(null);
            }
        });
    }
    else {
        return callback && callback(null);
    }
};

exports.searchTagsVideo = function(tags, callback){
    if(mysqlFlag)
        initMysql();

    if(trim(tags) != '' && mysqlConnection != null){
        var tagsArr = tags.split(',');
        var tagsArrLen = tagsArr.length;
        var tagsStr = '';
        var notTagsStr = '';

        for(var i = 0; i < tagsArrLen; i++){
            var tag = tagsArr[i];

            if(tag.indexOf('!') != 0){
                tagsStr += "'" + tag + "',";
            }
            else {
                notTagsStr += "'" + tag.substring(1) + "',";
            }
        }

        if(tagsStr != ''){
            tagsStr = '(' + tagsStr.substring(0, tagsStr.length - 1) + ')';
        }

        if(notTagsStr != ''){
            notTagsStr = '(' + notTagsStr.substring(0, notTagsStr.length - 1) + ')';
        }

        console.log('tagsStr', tagsStr, notTagsStr);
        if(tagsArrLen > 0){
            mysqlConnection.query('select distinct(tv.videoIndex) as videoIndex from tags as t '
                + ' left join tags_video as tv on tv.tagId = t.id '
                + ' where t.name not in ' + notTagsStr + ' order by videoIndex', function (notError, notResults, fields) {

                if (!notError) {
                    var notArray = [];
                    var notResultsLen = notResults.length;

                    for(var i = 0; i < notResultsLen; i++){
                        var notResultObj = notResults[i];
                        notArray.push(notResultObj.videoIndex);
                    }

                    return callback && callback(array);
                }
                else {
                    return callback && callback(null);
                }
            });

            mysqlConnection.query('select distinct(tv.videoIndex) as videoIndex from tags as t '
                + ' left join tags_video as tv on tv.tagId = t.id '
                + ' where t.name in ' + tagsStr + ' order by videoIndex', function (error, results, fields) {

                if (!error) {
                    console.log('results', results);
                    var array = [];
                    var resultsLen = results.length;

                    for(var i = 0; i < resultsLen; i++){
                        var resultObj = results[i];
                        array.push(resultObj.videoIndex);
                    }
                    return callback && callback(array);
                }
                else {
                    return callback && callback(null);
                }
            });
        }
        else {
            return callback && callback(null);
        }
    } else {
        return callback && callback(null);
    }
};

