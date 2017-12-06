module.exports = function (app) {
    app.use('/', require('./video'));
    app.use('/video', require('./video'));
    app.use('/seniverse', require('./seniverse'));
    app.use('/inke', require('./inke'));
    app.use('/static', require('./static'));
};
