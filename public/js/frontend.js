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
stxx.setPeriodicityV2(1,1);

//ugly globals hack
var avgData = {};
var symbolDeviation = {};

function loadChart(data, symbol){
    stxx.chart.symbol=symbol;
    stxx.setMasterData(data);
    stxx.createDataSet();
    stxx.initializeChart($$("chartContainer"));
    stxx.draw();
    for (var i=0; i<33; ++i){
        stxx.zoomIn();
    }

}

function convertSymbolOanda(symbol){
    return symbol.substring(0,3)+'_'+symbol.substring(3,6);
}
function updateInstruments(symbol){
    $('#tabs li').not('li.'+symbol).each(function(index, ele){
        loadInstrument(false, $(ele).attr('class').split(" ")[0], false);
    });
}
function loadInstrument(init, symbol, graph){
    var convertSymbol = convertSymbolOanda(symbol);
    $.get('http://api-sandbox.oanda.com/v1/history?instrument='+convertSymbol+'&count=100', function(response){
        var data = {};
        $(response.candles).each(function(index, price){
            var curDate = new Date(price.time).yyyymmddhhmm();
            data[curDate] = {Open : price.openBid, Date : curDate, High: price.highBid, Low: price.lowBid, Close: price.closeBid, Volume: price.volume};
        });
        var dataArr = [];
        for(var date in data) {
            dataArr.push(data[date]);
        }
        symbolDeviation.symbol = calcStats(dataArr);
        console.log("symbol:"+symbol+" mean:"+symbolDeviation.symbol.mean+" close:"+dataArr[dataArr.length-1].Close+" std dev:"+symbolDeviation.symbol.deviation);
        if (!withinStd(symbolDeviation.symbol.mean, dataArr[dataArr.length-1].Close, symbolDeviation.symbol.deviation, 1.5)){
            $('li.'+symbol).addClass('label-warning');
        }else if (!withinStd(symbolDeviation.symbol.mean, dataArr[dataArr.length-1].Close, symbolDeviation.symbol.deviation, 2.0)){
            $('li.'+symbol).addClass('label-danger');
        }else{
            $('li.'+symbol).removeClass('label-danger').removeClass('label-warning');
        }
        if (graph){
            if (init){
                loadChart(dataArr, symbol);
            }else{
                stxx.appendMasterData(dataArr);
            }
            drawAvgLines(avgData);
        }
    });
}

function diffDays(fromDate, tillDate){
    var timeDiff = Math.abs(tillDate.getTime() - fromDate.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

function loadSentiment(symbol){
    $.get("/sentiment?symbol="+symbol, function(response){
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
        var avgBear = 100*rollingBear/(bears*4);
        var avgBull = 100*rollingBull/(bulls*4);
        var recentBearString = "No Data";
        if (response.bearish.length > 0){
            recentBear = response.bearish[response.bearish.length-1];
            recentBearString = 100*recentBear[1]/4+"% on "+ recentBear[0];
        }
        var recentBullString = "No Data";
        if (response.bullish.length > 0){
            recentBull = response.bullish[response.bullish.length-1];
            recentBullString = 100*recentBull[1]/4+"% on "+ recentBull[0];
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

function loadDayAvg(symbol){
    var convertSymbol = convertSymbolOanda(symbol);
    $.get("/dayHistory?symbol="+convertSymbol, function(response){
        response = $.parseJSON(response);
        avgData.day = response.candles[0].closeMid;
        $('#dayHist').html('<span class="avgDay">'+avgData.day+'</span>');

    });
}

function drawAvgLines(avgData){
    var pixelDay = stxx.pixelFromPrice(avgData.day);
    var pixelMin = stxx.pixelFromPrice(avgData.min);
    stxx.plotLine(stxx.chart.left, stxx.chart.width, pixelMin, pixelMin, stxx.getCanvasColor("avgMin"), "line");//, stxx.chart.context, false, {});
    stxx.plotLine(stxx.chart.left, stxx.chart.width, pixelDay, pixelDay, stxx.getCanvasColor("avgDay"), "line");//, stxx.chart.context, false, {});
}

function loadAvg(symbol){
    var convertSymbol = convertSymbolOanda(symbol);
    $.get("/minHistory?symbol="+convertSymbol, function(response){
        response = $.parseJSON(response);
        if (response.candles.length === 2){
            avgData.min = ((response.candles[0].closeMid+response.candles[1].closeMid)/2).toFixed(3);
            $('#recentHist').html('5 min average: <span class="avgMin">'+avgData.min+'</span>');
        }
    });
}

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}

function calcStats(data) {
    var r = {mean: 0, variance: 0, deviation: 0}, t = data.length;
    for(var m, s = 0, l = t; l--; s += data[l].Close);
    for(m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(data[l].Close - m, 2));
    return r.deviation = Math.sqrt(r.variance = s / t), r;
}

function withinStd(mean, val, stdev, stdDevLimit) {
    var low = mean-(stdDevLimit*stdev);
    var hi = mean+(stdDevLimit*stdev);
    return (val > low) && (val < hi);
}