// -------------------------------------------------------------------------------------------
// Copyright 2012 by ChartIQ LLC
// -------------------------------------------------------------------------------------------

function STXMarket(){
}

STXMarket.isMarketDay=function(symbol){
	var nd=getETDateTime();
	if(nd.getDay()==0) return false;
	if(nd.getDay()==6) return false;
	if(STXMarket.isHoliday(nd, symbol)) return false;
	return true;
};

STXMarket.isMarketOpen=function(symbol){
	if(!STXMarket.isMarketDay(symbol)) return false;
	var nd=getETDateTime();
	if((nd.getHours()>9 || (nd.getHours()==9 && nd.getMinutes()>29)) && (nd.getHours()<16 || (nd.getHours()==16 && nd.getMinutes()<5))) return true;
	return false;
};

STXMarket.isAfterMarket=function(symbol){
	if(!STXMarket.isMarketDay(symbol)) return false;
	var nd=getETDateTime();
	if((nd.getHours()>16 || (nd.getHours()==16 && nd.getMinutes()>0))) return true;
	return false;
};

STXMarket.isAfterDelayed=function(symbol){
	if(!STXMarket.isMarketDay(symbol)) return false;
	var nd=getETDateTime();
	if((nd.getHours()>16 || (nd.getHours()==16 && nd.getMinutes()>20))) return true;
	return false;
};

STXMarket.isForexOpen=function(){
	var nd=getETDateTime();
	if(nd.getDay()==6) return false;
	if(nd.getDay()==5 && nd.getHours()>=18) return false;
	if(nd.getDay()==0 && nd.getHours()<15) return false;
	return true;
};

// Contains array of epochs
STXMarket.holidayArray=[];
STXMarket.halfDayArray=[];

// Contains epochs hashed to midnight for quick mathematical comparison
STXMarket.holidayHash={};
STXMarket.halfDayHash={};

STXMarket.initializeHolidays=function(){
	// Be sure to put these in order!
	STXMarket.holidayArray.push(new Date("01/02/2012").getTime());
	STXMarket.holidayArray.push(new Date("01/16/2012").getTime());
	STXMarket.holidayArray.push(new Date("02/20/2012").getTime());
	STXMarket.holidayArray.push(new Date("04/06/2012").getTime());
	STXMarket.holidayArray.push(new Date("05/28/2012").getTime());
	STXMarket.holidayArray.push(new Date("07/04/2012").getTime());
	STXMarket.holidayArray.push(new Date("09/03/2012").getTime());
	STXMarket.holidayArray.push(new Date("10/29/2012").getTime());
	STXMarket.holidayArray.push(new Date("10/30/2012").getTime());
	STXMarket.holidayArray.push(new Date("11/22/2012").getTime());
	STXMarket.holidayArray.push(new Date("12/25/2012").getTime());
	STXMarket.holidayArray.push(new Date("01/01/2013").getTime());
	STXMarket.holidayArray.push(new Date("01/21/2013").getTime());
	STXMarket.holidayArray.push(new Date("02/18/2013").getTime());
	STXMarket.holidayArray.push(new Date("03/29/2013").getTime());
	STXMarket.holidayArray.push(new Date("05/27/2013").getTime());
	STXMarket.holidayArray.push(new Date("07/04/2013").getTime());
	STXMarket.holidayArray.push(new Date("09/02/2013").getTime());
	STXMarket.holidayArray.push(new Date("11/28/2013").getTime());
	STXMarket.holidayArray.push(new Date("12/25/2013").getTime());

	STXMarket.halfDayArray.push(new Date("07/03/2012").getTime());
	STXMarket.halfDayArray.push(new Date("11/23/2012").getTime());
	STXMarket.halfDayArray.push(new Date("12/24/2012").getTime());
	STXMarket.halfDayArray.push(new Date("07/03/2013").getTime());
	STXMarket.halfDayArray.push(new Date("11/29/2013").getTime());
	STXMarket.halfDayArray.push(new Date("12/24/2013").getTime());
	
	for(var i=0; i<STXMarket.holidayArray.length;i++){
		var g=STXMarket.holidayArray[i];
		var midnight=g-g%(24*60*60*1000);
		STXMarket.holidayHash[midnight]=true;
	}
	for(var i=0; i<STXMarket.halfDayArray.length;i++){
		var g=STXMarket.halfDayArray[i];
		var midnight=g-g%(24*60*60*1000);
		STXMarket.halfDayHash[midnight]=true;
	}
	
};

STXMarket.initializeHolidays();

STXMarket.isHoliday=function(dt, symbol){
	var ms=dt.getTime();
	ms=ms-ms%(24*60*60*1000);
	if(STXMarket.holidayHash[ms]) return true;
	return false;
};

STXMarket.isHalfDay=function(dt, symbol){
	var ms=dt.getTime();
	ms=ms-ms%(24*60*60*1000);
	if(STXMarket.halfDayHash[ms]) return true;
	return false;
};

STXMarket.incDate=function(dt, amt){
	if(!amt) amt=1;
	dt.setDate(dt.getDate() + amt);
	return dt;
};

STXMarket.decDate=function(dt, amt){
	if(!amt) amt=1;
	dt.setDate(dt.getDate() - amt);
	return dt;
};

STXMarket.nextDay=function(dt, inc, stx){
	if(!inc) inc=1;
	var dt2=new Date(dt.getTime());
	for(var i=0;i<inc;i++){
		dt2=STXMarket.incDate(dt2);
		if(stx.chart.beginHour==0){	// forex. Note that the time is not accurate if the date lands on a Sunday
			if(dt2.getDay()==6) dt=STXMarket.incDate(dt2);
			if(STXMarket.isHoliday(dt2, stx.chart.symbol)) dt=STXMarket.incDate(dt2);
			if(STXMarket.isHoliday(dt2, stx.chart.symbol)) dt=STXMarket.incDate(dt2);
			if(dt2.getDay()==6) dt=STXMarket.incDate(dt2);
		}else{
			if(dt2.getDay()==0) dt=STXMarket.incDate(dt2);
			if(dt2.getDay()==6) dt=STXMarket.incDate(dt2,2);
			if(STXMarket.isHoliday(dt2, stx.chart.symbol)) dt=STXMarket.incDate(dt2);
			if(STXMarket.isHoliday(dt2, stx.chart.symbol)) dt=STXMarket.incDate(dt2);
			if(dt2.getDay()==0) dt=STXMarket.incDate(dt2);
			if(dt2.getDay()==6) dt=STXMarket.incDate(dt2,2);
		}
	}
	return dt2;
};

STXMarket.prevDay=function(dt, inc, stx){
	if(!inc) inc=1;
	var dt2=new Date(dt.getTime());
	for(var i=0;i<inc;i++){
		dt2=STXMarket.decDate(dt2);
		if(stx.chart.beginHour==0){	//forex. Note that the time is not accurate if the date lands on a Sunday
			if(dt2.getDay()==6) dt2=STXMarket.decDate(dt2);
			if(STXMarket.isHoliday(dt2, stx.chart.symbol)) dt2=STXMarket.decDate(dt2);
			if(dt2.getDay()==6) dt2=STXMarket.decDate(dt2);
		}else{
			if(dt2.getDay()==6) dt2=STXMarket.decDate(dt2);
			if(dt2.getDay()==0) dt2=STXMarket.decDate(dt2);
			if(STXMarket.isHoliday(dt2, stx.chart.symbol)) dt2=STXMarket.decDate(dt2);
			if(dt2.getDay()==6) dt2=STXMarket.decDate(dt2);
			if(dt2.getDay()==0) dt2=STXMarket.decDate(dt2,2);
		}
	}
	return dt2;
};

STXMarket.nextPeriod=function(dt, interval, inc, stx){
	var t1=dt.getTime();
	var multiplier=interval;
	if(interval=="minute") multiplier=1;
	t1+=inc*multiplier*60*1000;
	var future=new Date(t1);
	if(stx.chart.beginHour==0 && stx.chart.beginMinute==0){
		if(dt.getDay()==5 && dt.getHours()>=18){
			var fmorning=new Date(dt.getYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0).getTime();
			fmorning+=2 * 24 * 60 * 60 * 1000;
			fmorning+=15 * 60 * 60 * 1000;	// Currencies open at Sunday 3:00pm
			dt=new Date(fmorning);
		}
	}else{
		var endHour=stx.chart.endHour;
		if(STXMarket.isHalfDay(future)){	// Half day
			endHour=13;
		}
		if(future.getHours()>endHour || (future.getHours()==endHour && future.getMinutes()>=stx.chart.endMinute) || future.getHours()==0){
			dt=STXMarket.nextDay(dt, 1, stx);
			dt.setHours(stx.chart.beginHour);
			dt.setMinutes(stx.chart.beginMinute);
			dt.setSeconds(0);
			dt.setMilliseconds(0);
			return dt;
		}
	}
	return future;
};

STXMarket.prevPeriod=function(dt, interval, inc, stx){
	var multiplier=interval;
	if(interval=="minute") multiplier=1;
	var t1=dt.getTime();
	if(stx.chart.beginHour==0 && dt.getDay()==0 && dt.getHours()<15){	// Forex. Skip from Sunday to Friday evening
		var fridayEvening=new Date(dt.getTime()-(2*24*60*60*1000));
		fridayEvening.setHours(18);
		fridayEvening.setMinutes(0);
		fridayEvening.setSeconds(0);
		fridayEvening.setMilliseconds(0);
		t1=fridayEvening.getTime();
	}else{
		t1-=inc*multiplier*60*1000;
	}
	var past=new Date(t1);
	if(past.getHours()==stx.chart.beginHour && past.getMinutes()<stx.chart.beginMinute){
		var dt2=STXMarket.prevDay(dt, 1, stx);
		var endHour=stx.chart.endHour;
		if(STXMarket.isHalfDay(dt2)){
			endHour=13;	// Half day
		}
		dt2.setHours(endHour);
		dt2.setMinutes(stx.chart.endMinute);
		dt2.setSeconds(0);
		dt2.setMilliseconds(0);
		return dt2;
	}
	return past;
};

STXMarket.nextWeek=function(dt, inc, stx){
	var pd=new Date(dt.getTime());
	if(!inc) inc=1;
	for(var i=0;i<inc;i++){
		for(var j=0;j<14;j++){
			dt=STXMarket.nextDay(dt, 1, stx);
			if(dt.getDay()<=pd.getDay()) break;
		}
		if(j==14) console.log("nextWeek function skipped 14 days. Probably infinite loop. Check dates in dataSet.");
		pd=new Date(dt.getTime());
	}
	return dt;
};

STXMarket.prevWeek=function(dt, inc, stx){
	var pd=new Date(dt.getTime());
	if(!inc) inc=1;
	for(var i=0;i<inc;i++){
		if(pd.getDay()==0){	// Sunday, so we can just subtract 7 and ignore holidays
			dt=pd;
			dt.setDate(dt.getDate()-7);
		}else{
			while(1){
				dt=STXMarket.prevDay(dt, 1, stx);
				if(dt.getDay()<=pd.getDay()) break;
			}
		}
		pd=new Date(dt.getTime());
	}
	return dt;
};

STXMarket.nextMonth=function(dt, inc, stx){
	var pd=new Date(dt.getTime());
	if(!inc) inc=1;
	for(var i=0;i<inc;i++){
		while(1){
			dt=STXMarket.nextDay(dt, 1, stx);
			if(dt.getMonth()!=pd.getMonth()) break;
		}
		pd=new Date(dt.getTime());
	}
	return dt;
};

STXMarket.prevMonth=function(dt, inc, stx){
	var pd=new Date(dt.getTime());
	if(!inc) inc=1;
	for(var i=0;i<inc;i++){
		while(1){
			dt=STXMarket.prevDay(dt, 1, stx);
			if(dt.getMonth()!=pd.getMonth()) break;
		}
		pd=new Date(dt.getTime());
	}
	return dt;
};

STXMarket.beginDay=function(dt, stx){
	if(stx.chart.beginHour!=0){
		return stx.chart.beginHour*60 + stx.chart.beginMinute;
	}
	if(dt.getDay()==0) return 15*60;
	return stx.chart.beginHour*60 + stx.chart.beginMinute;
};

STXMarket.endDay=function(dt, stx){
	if(stx.chart.beginHour!=0){
		//Would be nice to take into account half market days for equities
		return stx.chart.endHour*60 + stx.chart.endMinute;
	}
	if(dt.getDay()==5) return 18*60;
	return stx.chart.endHour*60 + stx.chart.endMinute;
};

STXMarket.isQuarterEnd=function(dt){
	if(dt.getMonth()==2){
		if(dt.getDate()==31) return true;
		if(dt.getDay()==5 && (dt.getDate()==30 || dt.getDate()==29)) return true;
		return false;
	}
	if(dt.getMonth()==5){
		if(dt.getDate()==30) return true;
		if(dt.getDay()==5 && (dt.getDate()==29 || dt.getDate()==28)) return true;
		return false;
	}
	if(dt.getMonth()==8){
		if(dt.getDate()==30) return true;
		if(dt.getDay()==5 && (dt.getDate()==29 || dt.getDate()==28)) return true;
		return false;
	}
	if(dt.getMonth()==11){
		if(dt.getDate()==31) return true;
		if(dt.getDay()==5 && (dt.getDate()==29 || dt.getDate()==30)) return true;
		return false;
	}
	return false;
};

if(typeof exports!="undefined") exports.STXMarket=STXMarket;