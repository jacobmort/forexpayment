var express = require('express'),
  http = require('http'),
  path = require('path');

var app = module.exports = express();
var server = require('http').createServer(app);
var request = require("request");
/**
 * Configuration
 */
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);
// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());

}
// production only
if (app.get('env') === 'production') {

}
/**
 * Routes
 */
app.get('/', function(req, res){
    res.render('index');
});
server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

