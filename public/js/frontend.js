var socket = io.connect('http://api-sandbox.oanda.com' , {
    resource : 'ratestream'
});
socket.emit('subscribe', {'instruments': ['EUR/USD','USD/CAD']});
socket.on('tick', function (data) {
    console.log("Received tick:" + JSON.stringify(data));
});

Date.prototype.yyyymmddhhmm = function() {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();
    var hour = this.getHours().toString();
    var min = this.getMinutes().toString();
    return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]) + (hour[1]?hour:"0"+hour[0]) + (min[1]?min:"0"+min[0]); // padding
};
//appendMasterData({});
function loadChart(){
    var stxx=new STXChart();
    stxx.manageTouchAndMouse=true;
    stxx.chart.symbol='USD';
    //var curDate = new Date().yyyymmddhhmm();
    var data = [{Open : 1, Date: "201311091514", High: 1, Low: 1, Close: 1, Volume: 1}];
    stxx.setMasterData(data);
    stxx.createDataSet();
    stxx.initializeChart($$("chartContainer"));
    stxx.draw();
}