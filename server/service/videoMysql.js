var mysql = require('mysql');
var mysqlFlag = true;
var mysqlConnection = null;

var initMysql = function(){
    console.log('initMysql', mysqlFlag, !!mysqlConnection);
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

// status: 0 => insert success, 1 => name exist, 2 => name is '', -1 => insert error, -2 => select error
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

// status: 0 => delete success, 1 => nothing to delete, 2 => name is '', -1 => delete tags_video error, -2 => delete tags error, -3 => select error
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
    if(trim(names) != ''){
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
    if(trim(names) != ''){
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
                        // Update
                        var id = selectResults[0].id;
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

