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
var psychKey = "ca0fd572e64d71e2149381fa13fee347";
// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());

}
// production only
if (app.get('env') === 'production') {

}

function parseDate(date){
    //YYYY-MM-DD HH:MM:SS
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = date.getDate().toString();
    var hour = date.getHours().toString();
    var min = date.getMinutes().toString();
    return yyyy +'-'+ (mm[1]?mm:"0"+mm[0]) +"-"+ (dd[1]?dd:"0"+dd[0]) + " "+(hour[1]?hour:"0"+hour[0]) +":"+ (min[1]?min:"0"+min[0])+":00"; // padding
}
/**
 * Routes
 */
app.get('/sentiment', function(req, res){
    var endDate = new Date();
    var startDate = new Date(endDate - 2880 * 60000);
    var endDateString = encodeURIComponent(parseDate(endDate));
    var startDateString = encodeURIComponent(parseDate(startDate));
    var sentimentUrl = 'https://psychsignal.com/api/sentiments?api_key='+psychKey+'&symbol='+req.query.symbol+'&from='+startDateString+'&to='+endDateString+'&period=5&format=json&callback=fillSentiment';
    request(sentimentUrl, function(error, response, body) {
        res.send(body);
    });
});
app.get('/dayHistory', function(req, res){
    var url="http://api-sandbox.oanda.com/v1/history?instrument="+req.query.symbol+"&count=1&candleFormat=midpoint&granularity=D";
    request(url, function(error, response, body) {
        res.send(body);
    });
});
app.get('/minHistory', function(req, res){
    var url="http://api-sandbox.oanda.com/v1/history?instrument="+req.query.symbol+"&count=2&candleFormat=midpoint&granularity=M5";
    request(url, function(error, response, body) {
        res.send(body);
    });
});

app.get('/', function(req, res){
    res.render('index');
});
server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

