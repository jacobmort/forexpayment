Date.prototype.yyyymmddhhmm = function() {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();
    var hour = this.getHours().toString();
    var min = this.getMinutes().toString();
    return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]) + (hour[1]?hour:"0"+hour[0]) + (min[1]?min:"0"+min[0]); // padding
};

Date.prototype.yyymmddhhmmss = function(){
  //YYYY-MM-DD HH:MM:SS
  var dateString = this.yyyymmddhhmm();
  return formatedString = dateString.substring(0,4)+'-'+dateString.substring(4,6)+'-'+dateString.substring(6,8)+' '+dateString.substring(8,10)+':'+dateString.substring(10,12)+":00";
};

//appendMasterData({});
var stxx=new STXChart();
stxx.manageTouchAndMouse=true;;
stxx.setPeriodicityV2(1, 1);

function loadChart(data, symbol){
    //var curDate = new Date().yyyymmddhhmm();
    //var data = [{Open : 1, Date: "201311091514", High: 1, Low: 1, Close: 1, Volume: 1}];
    stxx.chart.symbol=symbol;
    stxx.setMasterData(data);
    stxx.createDataSet();
    stxx.initializeChart($$("chartContainer"));
    stxx.draw();
}

function loadInstrument(init, symbol){
    var convertSymbol = symbol.substring(0,3)+'_'+symbol.substring(3,6);
    $.get('http://api-sandbox.oanda.com/v1/history?instrument='+convertSymbol+'&count=20', function(response){
        var data = {};
        $(response.candles).each(function(index, price){
            var curDate = new Date(price.time).yyyymmddhhmm();
            data[curDate] = {Open : price.openBid, Date : curDate, High: price.highBid, Low: price.lowBid, Close: price.closeBid, Volume: price.volume};
            //data.push({Open : price.openBid, Date : curDate, High: price.highBid, Low: price.lowBid, Close: price.closeBid, Volume: price.volume});
        });
        var dataArr = [];
        for(var date in data) {
            dataArr.push(data[date]);
        }
        console.log(dataArr);
        if (init){
            loadChart(dataArr, symbol);
        }else{
            stxx.appendMasterData(dataArr);
        }
    });
}

function diffDays(fromDate, tillDate){
    var timeDiff = Math.abs(tillDate.getTime() - fromDate.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

function loadSentiment(symbol){
    $.get("http://localhost:3000/sentiment?symbol="+symbol, function(response){
        console.log(response);
        response = $.parseJSON(response);
        var rollingBear = 0.0;
        var bears = 0;
        var rollingBull = 0.0;
        var bulls = 0;
        var recentBear = 0.0;
        var recentBull = 0.0;
        var currentDate = new Date();
        $(response.bullish).each(function(index, val){
            var date=new Date(val[0]);
            if (diffDays(date,currentDate) < 1){
                var sentiment = val[1];
                rollingBull += sentiment;
                bulls += 1;
            }
        });
        $(response.bearish).each(function(index, val){
            var date=new Date(val[0]);
            if (diffDays(date,currentDate) < 1){
                var sentiment = val[1];
                rollingBear += sentiment;
                bears += 1;
            }
        });
        var avgBear = rollingBear/bears;
        var avgBull = rollingBull/bulls;
        var recentBearString = "No Data";
        if (response.bearish.length > 0){
            recentBear = response.bearish[response.bearish.length-1];
            recentBearString = recentBear[1]+" on "+ recentBear[0];
        }
        var recentBullString = "No Data";
        if (response.bullish.length > 0){
            recentBull = response.bullish[response.bullish.length-1];
            recentBullString = recentBull[1]+" on "+ recentBull[0];
        }

        if (isNaN(avgBear) || avgBear===Infinity){
            avgBear = "No data";
        }
        if (isNaN(avgBull) || avgBull===Infinity){
            avgBull = "No data";
        }
        $('#avgBear').html(avgBear);
        $('#recentBear').html(recentBearString);
        $('#avgBull').html(avgBull);
        $('#recentBull').html(recentBullString);
    });
}

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}