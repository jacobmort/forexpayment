// -------------------------------------------------------------------------------------------
// Copyright 2012 by ChartIQ LLC
// -------------------------------------------------------------------------------------------


var debugDoc=null;

function STX(){
}

STX.ipad = navigator.userAgent.indexOf("iPad") != -1;
STX.iphone = navigator.userAgent.indexOf("iPhone") != -1;
STX.isSurface = navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 1;
STX.touchDevice = typeof(document.ontouchstart)!="undefined" || STX.isSurface;
STX.is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
STX.isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
STX.isIE = navigator.userAgent.toLowerCase().indexOf("msie") > -1;
STX.isIE9 = navigator.userAgent.indexOf("Trident/5") > -1;
STX.isIE8 = false;
STX.isSurfaceApp = window.MSApp;

STX.openDebugger=function(){
	var w=window.open("", "Debug", "width=500, height=400, scrollbars=1");
	debugDoc=w.document;
};

STX.debug=function(str){
	if(debugDoc==null){
		return;
	}
	debugDoc.writeln(str);
};

STX.inspectProperties=function(theObject){
   var theProperties = "";
   for (var i in theObject){
	if(i!="outerText" && i!="innerText" && i!="outerHTML" && i!="innerHTML"){
		if(typeof(theObject[i])=="function"){
			theProperties +=  i + "" + "()" + "<br>";
			console.log(i+"()");
		}else{
			try{
				console.log(i+"="+theObject[i]);
				theProperties +=  i + " = " + theObject[i] + "<br>";
			}catch(e){
			}
		}
	}
   }
   theProperties+="<P>";
   STX.debug(theProperties);
};

STX.colorToHex=function(color) {
    if (color.substr(0, 1) === '#') {
        return color;
    }
    var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);
    if(!digits) digits=/(.*?)rgba\((\d+), (\d+), (\d+),.*\)/.exec(color);
    
    var red = parseFloat(digits[2]);
    var green = parseFloat(digits[3]);
    var blue = parseFloat(digits[4]);
   
    var rgb = blue | (green << 8) | (red << 16);
    var s=digits[1] + '#' + rgb.toString(16);
    return s.toUpperCase();
};

STX.isTransparent=function(color){
	if(color=="transparent") return true;
	var digits=/(.*?)rgba\((\d+), (\d+), (\d+), (.*)\)/.exec(color);
	if(digits==null) return false;
	if(parseFloat(digits[5])==0) return true;
	return false;
};

// Accepts a css color, either # or rgb() but not a named color such as "black"
STX.hsv=function(color) {
	var hex=STX.colorToHex(color);
	if(hex.substr(0,1)==="#") hex=hex.slice(1);
	for(var i=hex.length;i<6;i++){
		hex+="0";
	}
	var r=parseInt(hex.slice(0,2),16);
	var g=parseInt(hex.slice(2,4),16);
	var b=parseInt(hex.slice(4,6),16);
	 var computedH = 0;
	 var computedS = 0;
	 var computedV = 0;

	 //remove spaces from input RGB values, convert to int
	 var r = parseInt( (''+r).replace(/\s/g,''),10 ); 
	 var g = parseInt( (''+g).replace(/\s/g,''),10 ); 
	 var b = parseInt( (''+b).replace(/\s/g,''),10 ); 

	 if ( r==null || g==null || b==null ||
	     isNaN(r) || isNaN(g)|| isNaN(b) ) {
	   return null;
	 }
	 if (r<0 || g<0 || b<0 || r>255 || g>255 || b>255) {
	   return null;
	 }
	 r=r/255; g=g/255; b=b/255;
	 var minRGB = Math.min(r,Math.min(g,b));
	 var maxRGB = Math.max(r,Math.max(g,b));

	 // Black-gray-white
	 if (minRGB==maxRGB) {
	  computedV = minRGB;
	  return [0,0,computedV];
	 }

	 // Colors other than black-gray-white:
	 var d = (r==minRGB) ? g-b : ((b==minRGB) ? r-g : b-r);
	 var h = (r==minRGB) ? 3 : ((b==minRGB) ? 1 : 5);
	 computedH = 60*(h - d/(maxRGB - minRGB));
	 computedS = (maxRGB - minRGB)/maxRGB;
	 computedV = maxRGB;
	 return [computedH,computedS,computedV];
};

function $$(id, source){
	if(!source) return document.getElementById(id);
	if(source.id==id) return source;	// Found it!
	if(!source.hasChildNodes) return null;
	for(var i=0;i<source.childNodes.length; i++){
		var element=$$(id, source.childNodes[i]);
		if(element!=null) return element;
	}
	return null;
}

function $$$(selector, source){
	if(!source) source=document;
	return source.querySelectorAll(selector)[0];	// We use querySelectorAll for backward compatibility with IE
}

function getEventDOM(e){
	if(!e){
		return window.event.srcElement;
	}else{
		return e.target;
	}
}

function getHostName(url) {
   return url.match(/:\/\/(.[^/]+)/)[1];
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
/*
 * function clone(data){ return eval('(' + JSON.stringify(data) + ')'); }
 */
function clone(from, to)
{
    if (from == null || typeof from != "object") return from;
    // if (from.constructor != Object && from.constructor != Array) return from;
    if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
        from.constructor == String || from.constructor == Number || from.constructor == Boolean)
        return new from.constructor(from);

    to = to || new from.constructor();

    for (var n in from)
    {
        to[n] = typeof to[n] == "undefined" ? clone(from[n], null) : to[n];
    }

    return to;
}

function uniqueID(){
	var epoch=new Date();
	var id=epoch.getTime().toString(36);
	id+=Math.floor(Math.random()*Math.pow(36,2)).toString(36);
	return id.toUpperCase();
}

function clearNode(node){
	if ( node.hasChildNodes() ){
		while ( node.childNodes.length >= 1 ){
    		node.removeChild( node.firstChild );       
		} 
	}
}


STX.monthLetters=["J","F","M","A","M","J","J","A","S","O","N","D"];
STX.monthAbv=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

STX.monthAsDisplay=function(i, displayLetters,stx){
	if(displayLetters){
		if(stx && stx.monthLetters) return stx.monthLetters[i];
		return STX.monthLetters[i];
	}else{
		if(stx && stx.monthAbv) return stx.monthAbv[i];
		return STX.monthAbv[i];
	}
};

STX.timeAsDisplay=function(dt, stx){
	if(stx && stx.internationalizer){
		return stx.internationalizer.hourMinute.format(dt);
	}else{
		var min=dt.getMinutes();
		if(min<10) min="0" + min;
		return dt.getHours() + ":" + min;
	}
};

// Extract the name of the month from the locale. We do this by creating a
// localized date for the first
// date of each month. Then we extract the alphabetic characters. MonthLetters
// then becomes the first
// letter of the month. Note that in the current Intl.js locale, chinese and
// japanese months are implemented
// as 1月 through 12月 which causes this algorithm to fail. Hopefully real months
// will be available when Intl
// becomes a browser standard, otherwise this method or the locale will need to
// be modified for those or other special cases
STX.createMonthArrays=function(stx, formatter){
	stx.monthAbv=[];
	stx.monthLetters=[];
	var dt=new Date();
	for(var i=0;i<12;i++){
		dt.setDate(1);
		dt.setMonth(i);
		var str=formatter.format(dt);
		var month="";
		for(var j=0;j<str.length;j++){
			var c=str.charAt(j);
			var cc=c.charCodeAt(0);
			if(cc<65) continue;
			month+=c;
		}
		stx.monthAbv[i]=month;
		stx.monthLetters[i]=month[0];
	}
};

function condenseInt(txt){
	if(!txt || typeof txt=="undefined") return "";
	if(txt>0){
		if(txt>1000000) txt=Math.round(txt/100000)/10 + "m";
		else if(txt>1000) txt=Math.round(txt/100)/10 + "k";
		else txt=txt.toFixed(0);
	}else{
		if(txt<-1000000) txt=Math.round(txt/100000)/10 + "m";
		else if(txt<-1000) txt=Math.round(txt/100)/10 + "k";
		else txt=txt.toFixed(0);
	}
	return txt;
}

function volumeText(vchart, y){
	var i=y/vchart.spacing;
	return condenseInt(vchart.max - (vchart.multiplier*i));
}

function boxIntersects(bx1, by1, bx2, by2, x0, y0, x1, y1, vtype){
	if     (linesIntersect(bx1, bx2, by1, by1, x0, x1, y0, y1, vtype)) return true;
	else if(linesIntersect(bx1, bx2, by2, by2, x0, x1, y0, y1, vtype)) return true;
	else if(linesIntersect(bx1, bx1, by1, by2, x0, x1, y0, y1, vtype)) return true;
	else if(linesIntersect(bx2, bx2, by1, by2, x0, x1, y0, y1, vtype)) return true;
	return false;
}

function linesIntersect(x1, x2, y1, y2, x3, x4, y3, y4, type){
	var denom  = (y4-y3) * (x2-x1) - (x4-x3) * (y2-y1);
	var numera = (x4-x3) * (y1-y3) - (y4-y3) * (x1-x3);
	var numerb = (x2-x1) * (y1-y3) - (y2-y1) * (x1-x3);
	var EPS = .000001;

	if(denom==0){
		if(numera==0 && numerb==0) return true; // coincident
		return false; // parallel
	}

	var mua = numera / denom;
	var mub = numerb / denom;
	if(type=="segment" || type=="zig zag"){
		if (mua>=0 && mua<=1 && mub>=0 && mub<=1) return true;
	}else if(type=="line"){
		if (mua>=0 && mua<=1) return true;
	}else if(type=="ray"){
		if (mua>=0 && mua<=1 && mub>=0) return true;
	}
	return false;

}

function yIntersection(vector, x){
	var x1=vector.x0, x2=vector.x1, x3=x, x4=x;
	var y1=vector.y0, y2=vector.y1, y3=0, y4=10000;
	var denom  = (y4-y3) * (x2-x1) - (x4-x3) * (y2-y1);
	var numera = (x4-x3) * (y1-y3) - (y4-y3) * (x1-x3);
	var numerb = (x2-x1) * (y1-y3) - (y2-y1) * (x1-x3);
	var EPS = .000001;

	if(denom==0) return null;

	var mua=numera/denom;
	var y=y1 + (mua * (y2-y1));
	return y;
}

function xIntersection(vector, y){
	var x1=vector.x0, x2=vector.x1, x3=0, x4=10000;
	var y1=vector.y0, y2=vector.y1, y3=y, y4=y;
	var denom  = (y4-y3) * (x2-x1) - (x4-x3) * (y2-y1);
	var numera = (x4-x3) * (y1-y3) - (y4-y3) * (x1-x3);
	var numerb = (x2-x1) * (y1-y3) - (y2-y1) * (x1-x3);
	var EPS = .000001;

	if(denom==0) return null;
	var mua=numera/denom;
	var x=x1 + (mua * (x2-x1));
	return x;
}

function stripPX(text){
	return parseInt(text.substr(0, text.indexOf("p")));
}

// function pageHeight() { return document.documentElement.clientHeight;}
// function pageWidth() { return document.documentElement.clientWidth;}
function pageHeight() {
	var h=window.innerHeight;
	if(top!=self){
		if(h>parent.innerHeight) h=parent.innerHeight;
	}
	return h;
}

function pageWidth() {
	var w=window.innerWidth;
	if(top!=self){
		if(w>parent.innerWidth) w=parent.innerWidth;
	}
	return w;
}

STX.scrub=function(obj, removeNulls){
	for(var i in obj){
		if(typeof(obj[i])=="undefined")
			delete obj[i];
		if(removeNulls && obj[i]==null)
			delete obj[i];
	}
}

function strToDateTime(dt){
	var myDateArray;
	if(dt.length==12){	// yyyymmddhhmm
		var y=parseFloat(dt.substring(0,4));
		var m=parseFloat(dt.substring(4,6)) - 1;
		var d=parseFloat(dt.substring(6,8));
		var h=parseFloat(dt.substring(8,10));
		var mn=parseFloat(dt.substring(10,12));
		var d=new Date(y, m, d, h, mn, 0, 0);
		return d;
	}else{
		var lr=dt.split(" ");
		if(lr[0].indexOf('/')!=-1) myDateArray=lr[0].split("/");
		else if(lr[0].indexOf('-')!=-1) myDateArray=lr[0].split("-");

		if(myDateArray[0].length==4){	// YYYY-MM-DD
			year=parseFloat(myDateArray[0],10);
			myDateArray[0]=myDateArray[1];
			myDateArray[1]=myDateArray[2];
		}
		
		if(lr.length>1){
			var lr=lr[1].split(':');
			return new Date(year,myDateArray[0]-1,myDateArray[1], lr[0], lr[1], 0, 0);
		}else{
			return new Date(year,myDateArray[0]-1,myDateArray[1], 0, 0, 0, 0);
		}
	}
}

function strToDate(dt){
	var myDateArray;
	if(dt.indexOf('/')!=-1) myDateArray=dt.split("/");
	else if(dt.indexOf('-')!=-1) myDateArray=dt.split("-");
	else if(dt.length>=8){
		return new Date(parseFloat(dt.substring(0,4)), parseFloat(dt.substring(4,6))-1, parseFloat(dt.substring(6,8)));
	}else{
		return new Date();
	}
	if(myDateArray[2].indexOf(' ')!=-1){
		myDateArray[2]=myDateArray[2].substring(0, myDateArray[2].indexOf(' '));
	}
	var year=parseFloat(myDateArray[2],10);
	if(year<20) year+=2000;
	if(myDateArray[0].length==4){	// YYYY-MM-DD
		year=parseFloat(myDateArray[0],10);
		myDateArray[0]=myDateArray[1];
		myDateArray[1]=myDateArray[2];
	}
	return new Date(year,myDateArray[0]-1,myDateArray[1]);	
}

function mmddyyyy(d){
	dt=strToDate(d);
	var m=dt.getMonth()+1;
	if(m<10) m="0" + m;
	var d=dt.getDate();
	if(d<10) d="0" + d;
	return m + "/" + d + "/" + dt.getFullYear();
}

function yyyymmdd(dt){
	var m=dt.getMonth()+1;
	if(m<10) m="0" + m;
	var d=dt.getDate();
	if(d<10) d="0" + d;
	return dt.getFullYear() + "-" + m + "-" + d;
}

function yyyymmddhhmm(dt){
	var m=dt.getMonth()+1;
	if(m<10) m="0" + m;
	var d=dt.getDate();
	if(d<10) d="0" + d;
	var h=dt.getHours();
	if(h<10) h="0" + h;
	var mn=dt.getMinutes();
	if(mn<10) mn="0" + mn;
	return '' + dt.getFullYear() + m + d + h + mn;
};

STX.friendlyDate=function(dt){
	var m=dt.getMonth()+1;
	if(m<10) m="0" + m;
	var d=dt.getDate();
	if(d<10) d="0" + d;
	var h=dt.getHours();
	if(h<10) h="0" + h;
	var mn=dt.getMinutes();
	if(mn<10) mn="0" + mn;
	return '' + dt.getFullYear() + "/" + m + "/" + d + " " + h + ":" + mn;
};

function mmddhhmm(strdt){
	var dt=strToDateTime(strdt);
	var m=dt.getMonth()+1;
	if(m<10) m="0" + m;
	var d=dt.getDate();
	if(d<10) d="0" + d;
	var h=dt.getHours();
	if(h<10) h="0" + h;
	var mn=dt.getMinutes();
	if(mn<10) mn="0" + mn;
	if(h=="00" && mn=="00") return m + "-" + d + "-" + dt.getFullYear();
	return m + "-" + d + " " + h + ":" + mn;
}

function getETDateTime(){
	var d=new Date();
	var localTime = d.getTime();
	var localOffset = d.getTimezoneOffset() * 60000;
	var utc = localTime + localOffset;
	var offset = -4;
	if((d.getMonth()<2 || (d.getMonth==2 && d.getDate()<11)) || (d.getMonth>10 || (d.getMonth==10 && d.getDate()>=4)))
			offset = -5;
	var est = utc + (3600000*offset);
	var nd = new Date(est);
	return nd;
}

function getAjaxServer(){
	var server=false;
	if(STX.isIE9){
		server = new XDomainRequest();
		return server;
	}
	try{
		server = new XMLHttpRequest();
	}catch(e){
		try{
			server = new ActiveXObject('Msxml2.XMLHTTP');
		}catch(e){
			try{
				server = new ActiveXObject('Microsoft.XMLHTTP');
			}catch(e){
				alert("ajax not supported in browser");
			}
		}
	}
	return server;
}

STX.qs=function(query) {
	var qsParm = new Array();
	if(!query) query = window.location.search.substring(1);
	var parms = query.split('&');
	for (var i=0; i<parms.length; i++) {
		var pos = parms[i].indexOf('=');
		if (pos > 0) {
			var key = parms[i].substring(0,pos);
			var val = parms[i].substring(pos+1);
			qsParm[key] = val;
		}else{
			var key = parms[i];
			qsParm[key] = null;
		}
	}
	return qsParm;
}

function convertClickToTouchEnd(id){
	var node=$$(id);
	var s=node.getAttribute("onClick");
	if(s && s!=""){
		node.removeAttribute("onClick");
		node.setAttribute("onTouchEnd", s);
	}
}


function getPos(el) {
    for (var lx=0, ly=0;
         el != null;
         lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
    return {x: lx,y: ly};
}

STX.withinElement=function(node, x, y){
	var xy=getPos(node);
	if(x<xy.x) return false;
	if(y<xy.y) return false;
	if(x>xy.x+node.clientWidth) return false;
	if(y>xy.y+node.clientHeight) return false;
	return true;
};

function fixScreen(){
	window.scrollTo(0,0);
}


function setCaretPosition(ctrl, pos){
	ctrl.style.zIndex=5000;
	if(ctrl.setSelectionRange){
		STX.focus(ctrl);
		try{
			ctrl.setSelectionRange(pos,pos);
		}catch(e){}
	}else if (ctrl.createTextRange) {
		var range = ctrl.createTextRange();
		range.collapse(true);
		range.moveEnd('character', pos);
		range.moveStart('character', pos);
		range.select();
	}
}

function appendClassName(node, className){
	if(node.className.indexOf(className)!=-1) return;
	if(node.className=="") node.className=className;
	else node.className+=" " + className;
}

function unappendClassName(node, className){
	if(node.className.indexOf(className)==-1) return;
	if(node.className==className){
		node.className="";
	}else{
		var s=node.className.split(" ");
		var newClassName="";
		for(var i in s){
			if(s[i]==className) continue;
			if(newClassName!="") newClassName+=" ";
			newClassName+=s[i];
		}
		node.className=newClassName;
	}
}

// Don't use, just for crosshairs
var blocks=[];
function createDIVBlock(left, width, top, height){
	var block=document.createElement("div");
	block.style.position="fixed";
	block.style.left=left + "px";
	block.style.width=width + "px";
	block.style.top=top + "px";
	block.style.height=height + "px";
	document.body.appendChild(block);
	blocks[blocks.length]=block;
	return block;
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
	  if (typeof stroke == "undefined" ) {
	    stroke = true;
	  }
	  if (typeof radius === "undefined") {
	    radius = 5;
	  }
	  ctx.beginPath();
	  ctx.moveTo(x + radius, y);
	  ctx.lineTo(x + width - radius, y);
	  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	  ctx.lineTo(x + width, y + height - radius);
	  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	  ctx.lineTo(x + radius, y + height);
	  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	  ctx.lineTo(x, y + radius);
	  ctx.quadraticCurveTo(x, y, x + radius, y);
	  ctx.closePath();
	  if (stroke) {
	    ctx.stroke();
	  }
	  if (fill) {
	    ctx.fill();
	  }        
}

function semiRoundRect(ctx, x, y, width, height, radius, fill, stroke) {
	  if (typeof stroke == "undefined" ) {
	    stroke = true;
	  }
	  if (typeof radius === "undefined") {
	    radius = 5;
	  }
	  ctx.beginPath();
	  ctx.moveTo(x, y);
	  ctx.lineTo(x + width - radius, y);
	  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	  ctx.lineTo(x + width, y + height - radius);
	  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	  ctx.lineTo(x, y + height);
	  ctx.lineTo(x, y);
	  ctx.closePath();
	  if (stroke) {
	    ctx.stroke();
	  }
	  if (fill) {
	    ctx.fill();
	  }        
}
function getLines(ctx,phrase,l) {
	var wa=phrase.split(" "), phraseArray=[], lastPhrase="", measure=0;
	var fw=false;
	for (var i=0;i<wa.length;i++) {
		var w=wa[i];
		measure=ctx.measureText(lastPhrase+w).width;
		if (measure<l) {
			if(fw) lastPhrase+=" ";
			fw=true;
			lastPhrase+=w;
		}else {
			phraseArray.push(lastPhrase);
			lastPhrase=w;
		}
		if (i===wa.length-1) {
			phraseArray.push(lastPhrase);
			break;
		}
	}
	return phraseArray;
}

STX.clearCanvas=function(canvas, stx){
	canvas.context.clearRect(0, 0, canvas.width, canvas.height);
	if(STX.isAndroid && !STX.is_chrome){	// Android browser last remaining
											// one to need this clearing method
		if(STXChart.useOldAndroidClear && stx){
			canvas.context.fillStyle=stx.containerColor;
			canvas.context.fillRect(0, 0, canvas.width, canvas.height);
			canvas.context.clearRect(0, 0, canvas.width, canvas.height);
		}
		var w=canvas.width;
    	canvas.width=1;
    	canvas.width=w;
	}
}

STX.alert=function(text){
	alert(text);
}

STX.horizontalIntersect=function(vector, x, y){
	if(x<Math.max(vector.x0, vector.x1) && x>Math.min(vector.x0, vector.x1)) return true;
	return false;
}

STX.isInElement=function(div, x, y){
	if(x<div.offsetLeft) return false;
	if(x>div.offsetLeft+div.clientWidth) return false;
	if(y<div.offsetTop) return false;
	if(y>div.offsetTop+div.clientHeight) return false;
	return true;
}

STX.privateBrowsingAlert=false;
STX.localStorageSetItem=function(name, value){
	try{
		localStorage.setItem(name, value);
	}catch(e){
		if(!STX.privateBrowsingAlert){
			STX.alert("Your browser is in Private Browsing mode. Chart annotations will not be saved.");
			STX.privateBrowsingAlert=true;
		}
	}
}

// The most complicated function ever written
//
// colorClick = the div that the user clicks on to pull up the color picker. The color picker will set the
//              background of this to the selected color
//
// cpHolder = A global object that is used to contain the color picker and handle closures of the containing dialog.
//
// cb = Callback function for when the color is picked fc(color)

STX.attachColorPicker = function(colorClick, cpHolder, cb){
	var closure=function(colorClick, cpHolder, cb){
		return function(color){
			if(cpHolder.colorPickerDiv) cpHolder.colorPickerDiv.style.display="none";
			colorClick.style.backgroundColor="#"+color;
			if(cb) cb(color);
		}
	};
	colorClick.onclick=(function(fc, cpHolder){ return function(){
		if(cpHolder.colorPickerDiv==null){
			cpHolder.colorPickerDiv=document.createElement("DIV");
			cpHolder.colorPickerDiv.className="ciqColorPicker";
			document.body.appendChild(cpHolder.colorPickerDiv);
		}
		STX.createColorPicker(cpHolder.colorPickerDiv, fc);
		cpHolder.colorPickerDiv.style.display="block";
		var xy=getPos(this);
		var x=xy.x+this.clientWidth;
		if((x+cpHolder.colorPickerDiv.offsetWidth)>pageWidth())
			x-=(x+cpHolder.colorPickerDiv.offsetWidth)-pageWidth()+20;
		cpHolder.colorPickerDiv.style.left=x+"px";
		
		var y=(xy.y);
		if(y+cpHolder.colorPickerDiv.clientHeight>pageHeight())
			y-=(y+cpHolder.colorPickerDiv.clientHeight)-pageHeight();
		cpHolder.colorPickerDiv.style.top=y+"px";
	}})(closure(colorClick, cpHolder, cb), cpHolder);
};

STX.createColorPicker = function (div, fc) {
	var colors=["ffffff","ffd0cf","ffd9bb","fff56c","eaeba3","d3e8ae","adf3ec","ccdcfa","d9c3eb",
				"efefef","eb8b87","ffb679","ffe252","e2e485","c5e093","9de3df","b1c9f8","c5a6e1",
				"cccccc","e36460","ff9250","ffcd2b","dcdf67","b3d987","66cac4","97b8f7","b387d7",
				"9b9b9b","dd3e39","ff6a23","faaf3a","c9d641","8bc176","33b9b0","7da6f5","9f6ace",
				"656565","b82c0b","be501b","e99b54","97a030","699158","00a99d","5f7cb8","784f9a",
				"343434","892008","803512","ab611f","646c20","46603a","007e76","3e527a","503567",
				"000000","5c1506","401a08","714114","333610","222f1d","00544f","1f2a3c","281a33"
];
	clearNode(div);
	var ul=document.createElement("ul");
	div.appendChild(ul);
	for(var i=0;i<colors.length;i++){
		var c=colors[i];
		var li=document.createElement("li");
		var a=document.createElement("a");
		li.appendChild(a);
		a.href="#";
		a.title=c;
		a.style.background="#"+c;
		a.innerHTML=c;
		ul.appendChild(li);
		a.onclick=(function(c){ return function(){ fc(c);};})(c);
	}
}

STX.isEmpty = function( o ) {
    for ( var p in o ) { 
        if ( o.hasOwnProperty( p ) ) { return false; }
    }
    return true;
}

// Convenience function, returns the first property in an object, not guaranteed to work in all browsers
STX.first = function( o ) {
    for ( var p in o ) { 
        return p;
    }
    return null;
}

STX.last = function( o ) {
	var l=null;
    for ( var p in o ) { 
        l=p;
    }
    return l;
}

// Returns the number of properties in an object
STX.objLength = function( o ) {
	var i=0;
    for ( var p in o ) { 
        i++;
    }
    return i;
}

STX.Plotter=function(){
	this.seriesArray=[];
	this.seriesMap={};
}
STX.Plotter.prototype={
		Series: function(name, strokeOrFill, color, opacity){
			this.name=name;
			this.strokeOrFill=strokeOrFill;
			this.color=color;
			this.opacity=opacity;
			this.moves=[];
			if(!opacity) this.opacity=1;
		},
		// Third argument can be either a color or a STXChart.Style object
		newSeries: function(name, strokeOrFill, colorOrStyle, opacity){
			var series;
			if(colorOrStyle.constructor == String) series=new this.Series(name, strokeOrFill, colorOrStyle, opacity);
			else series=new this.Series(name, strokeOrFill, colorOrStyle["color"], colorOrStyle["opacity"]);
			this.seriesArray.push(series);
			this.seriesMap[name]=series;
		},
		moveTo: function(name, x, y){
			var series=this.seriesMap[name];
			series.moves.push({"action":"moveTo","x":x,"y":y});
		},
		lineTo: function(name, x, y){
			var series=this.seriesMap[name];
			series.moves.push({"action":"lineTo","x":x,"y":y});			
		},
		quadraticCurveTo: function(name, x0, y0, x1, y1){
			var series=this.seriesMap[name];
			series.moves.push({"action":"quadraticCurveTo","x0":x0, "y0":y0, "x1":x1, "y1":y1});
		},
		draw: function(context){
			for(var i=0;i<this.seriesArray.length;i++){
				var series=this.seriesArray[i];
				context.beginPath();
				context.lineWidth=1;
				context.globalAlpha=series.opacity;
				context.fillStyle=series.color;
				context.strokeStyle=series.color;
				for(var j=0;j<series.moves.length;j++){
					var move=series.moves[j];
					if(move.action=="quadraticCurveTo"){
						(context[move.action])(move.x0, move.y0, move.x1, move.y1);
					}else{
						(context[move.action])(move.x, move.y);
					}
				}
				if(series.strokeOrFill=="fill"){
					context.fill();
				}else{
					context.stroke();
				}
				context.closePath();
			}
			context.globalAlpha=1;
		}
}

// Microsoft RT disallows innerHTML that contains dom elements. Use this method
// to override.
STX.innerHTML=function(node, html){
	if(window.MSApp){
		MSApp.execUnsafeLocalFunction(function (){
			node.innerHTML=html;
		});
	}else{
		node.innerHTML=html;
	}
}


STX.loadUI=function(url, cb){
	var i=document.createElement("iframe");
	i.src=url+"?" + uniqueID();
	i.hidden=true;
	i.onload=(function(i){
		return function(){
			var iframeDocument = i.contentDocument || i.contentWindow.document;
			if(iframeDocument){
				var html=iframeDocument.body.innerHTML;
				document.body.removeChild(i);
				var div=document.createElement("div");
				STX.innerHTML(div, html);
				for(var j=0;j<div.children.length;j++){
					var ch=div.children[j].cloneNode(true);
					document.body.appendChild(ch);
				}
				cb();
			}
		}
	})(i);
	document.body.appendChild(i);
}

CanvasRenderingContext2D.prototype.dashedLineTo = function (fromX, fromY, toX, toY, pattern) {
	  // Our growth rate for our line can be one of the following:
	  // (+,+), (+,-), (-,+), (-,-)
	  // Because of this, our algorithm needs to understand if the x-coord and
	  // y-coord should be getting smaller or larger and properly cap the
		// values
	  // based on (x,y).
	  var lt = function (a, b) { return a <= b; };
	  var gt = function (a, b) { return a >= b; };
	  var capmin = function (a, b) { return Math.min(a, b); };
	  var capmax = function (a, b) { return Math.max(a, b); };

	  var checkX = { thereYet: gt, cap: capmin };
	  var checkY = { thereYet: gt, cap: capmin };

	  if (fromY - toY > 0) {
	    checkY.thereYet = lt;
	    checkY.cap = capmax;
	  }
	  if (fromX - toX > 0) {
	    checkX.thereYet = lt;
	    checkX.cap = capmax;
	  }

	  this.moveTo(fromX, fromY);
	  var offsetX = fromX;
	  var offsetY = fromY;
	  var idx = 0, dash = true;
	  while (!(checkX.thereYet(offsetX, toX) && checkY.thereYet(offsetY, toY))) {
	    var ang = Math.atan2(toY - fromY, toX - fromX);
	    var len = pattern[idx];

	    offsetX = checkX.cap(toX, offsetX + (Math.cos(ang) * len));
	    offsetY = checkY.cap(toY, offsetY + (Math.sin(ang) * len));

	    if (dash) this.lineTo(offsetX, offsetY);
	    else this.moveTo(offsetX, offsetY);

	    idx = (idx + 1) % pattern.length;
	    dash = !dash;
	  }
	};

CanvasRenderingContext2D.prototype.stxLine = function (fromX, fromY, toX, toY, color, opacity, lineWidth, pattern) {
	this.beginPath();
	this.lineWidth=lineWidth;
	this.strokeStyle=color;
	this.globalAlpha=opacity;
	if(pattern){
		this.dashedLineTo(fromX, fromY, toX, toY, pattern);
	}else{
		this.moveTo(fromX, fromY);
		this.lineTo(toX, toY);
	}
	this.stroke();
	this.closePath();
}

CanvasRenderingContext2D.prototype.stxCircle = function(x, y,radius, filled){
	this.beginPath();
	this.arc(x, y, radius, 0, 2* Math.PI, false);
	if(filled) this.fill();
	this.stroke();
	this.closePath();
}

// Create a boxed label around a text item.
STX.textLabel = function (x, y, text, stx, style) {
	stx.canvasFont(style);
	var m=stx.chart.context.measureText(text);
	var fontHeight=stx.getCanvasFontSize(style);
	var s=stx.canvasStyle(style);
	var context=stx.chart.context;
	var arr=text.split("\n");
	var maxWidth=0;
	for(var i in arr){
		var m=stx.chart.context.measureText(arr[i]);
		if(m.width>maxWidth) maxWidth=m.width;
	}
	var height=arr.length*fontHeight;
	context.textBaseline="alphabetic";
	context.strokeStyle=s["border-left-color"];
	context.fillStyle=s["background-color"];
	context.beginPath();
	context.moveTo(x, y);
	context.lineTo(x+maxWidth+10, y);
	context.lineTo(x+maxWidth+10, y+height+2);
	context.lineTo(x, y+height+2);
	context.lineTo(x, y);
	context.stroke();
	context.fill();
	context.closePath();
	context.strokeStyle=s["color"];
	context.fillStyle=s["color"];
	context.textBaseline="top";
	var y1=0;
	for(var i in arr){
		context.fillText(arr[i], x+5, y+y1+1);
		y1+=fontHeight;
	}
}

// Microsoft surface bug requires a timeout for cursor to show in focused text
// box
// Ipad also, sometimes, when embedded in an iframe but that's up to the caller
// to figure out
STX.focus = function (node, useTimeout){
	if(STX.isSurface || useTimeout){
		setTimeout(function(){node.focus();}, 0);
	}else{
		node.focus();
	}
}

// Finds all of the nodes that match the text. Traversal starts at startNode.
// This is a recursive function so be careful not to start too high in the DOM
// tree
STX.findNodesByText = function(startNode, text){
	if(startNode.innerHTML==text) return [startNode];
	var nodes=[];
	for(var i=0;i<startNode.childNodes.length;i++){
		var pushNodes=STX.findNodesByText(startNode.childNodes[i], text);
		if(pushNodes!=null){
			nodes=nodes.concat(pushNodes);
		}
	}
	if(nodes.length) return nodes;
	return null;
};

// Convenience function to hide nodes that contain certain text
STX.hideByText = function(startNode, text){
	var nodes=STX.findNodesByText(startNode, text);
	for(var i=0;i<nodes.length;i++){
		nodes[i].style.display="none";
	}
};

STX.intersectLineLineX = function(ax1, ax2, ay1, ay2, bx1, bx2, by1, by2) {
    var result;

    var ua_t = (bx2 - bx1) * (ay1 - by1) - (by2 - by1) * (ax1 - bx1);
    var u_b  = (by2 - by1) * (ax2 - ax1) - (bx2 - bx1) * (ay2 - ay1);

    var ua = ua_t / u_b;

    return ax1 + ua * (ax2 - ax1);
};

STX.intersectLineLineY = function(ax1, ax2, ay1, ay2, bx1, bx2, by1, by2) {
    var result;

    var ua_t = (bx2 - bx1) * (ay1 - by1) - (by2 - by1) * (ax1 - bx1);
    var u_b  = (by2 - by1) * (ax2 - ax1) - (bx2 - bx1) * (ay2 - ay1);

    var ua = ua_t / u_b;

    return ay1 + ua * (ay2 - ay1);
};

// Sets all transparent parts of the canvas to the background color
STX.fillTransparentCanvas = function(context, color, width, height){
	var compositeOperation = context.globalCompositeOperation;
	context.globalCompositeOperation = "destination-over";
	context.fillStyle = color;
	context.fillRect(0,0,width,height);
	context.globalCompositeOperation = compositeOperation;
};

STX.readablePeriodicity=function(stx){
	var displayPeriodicity=stx.layout.periodicity;
	var displayInterval=stx.layout.interval;
	if(!stx.isDailyInterval(displayInterval)){
		if(stx.layout.interval!="minute"){
			displayPeriodicity=stx.layout.interval*stx.layout.periodicity;
		}
		displayInterval="min";
	}
	if(displayPeriodicity%60==0){
		displayPeriodicity/=60;
		displayInterval="hour";
	}
	return displayPeriodicity + " " + displayInterval.capitalize();
};

// Post to ajax. If a payload is sent then it will post, otherwise it will get.
// cb is a callback function that
// should access http status as parameter 1 and the server response as parameter
// 2.
// To prevent browser caching, a timestamp is added to every query.
// This function supports cross origin ajax on IE9
function postAjax(url, payload, cb, contentType){
	var server=getAjaxServer();
	if(!server) return false;
	var epoch=new Date();
	if(url.indexOf('?')==-1) url+="?" + epoch.getTime();
	else url+="&" + epoch.getTime();
	if(!STX.isIE9){
		server.open(payload?"POST":"GET", url, true);
		if(!contentType) contentType='application/x-www-form-urlencoded';
		if(payload) server.setRequestHeader('Content-Type', contentType);
		//if(payload) server.setRequestHeader('Content-Type','application/soap+xml');
	}else{
		url=url.replace("https","http");
		server.open(payload?"POST":"GET", url, true);
		server.onload=function(){
			cb(200, server.responseText);
		};
		server.onerror=function(){
			cb(0, null);
		};
		server.onprogress=function(){};
	}
	server.onreadystatechange=function(){
		if(server.readyState==4){
			if(server.status==404){
				cb(server.status, null);
			}else if(server.status!=200){
				cb(server.status, server.responseText);
			}else{
				// Optional code for processing headers. Doesn't work for IE9
				/*var headerString=server.getAllResponseHeaders();
				var headerArray=headerString.split("\n");
				var headers={};
				for(var i=0;i<headerArray.length;i++){
					var split=headerArray[i].split(":");
					if(split[1] && split[1].charAt(0)==' ') split[1]=split[1].substring(1);
					if(split[0]!="")
					headers[split[0]]=split[1];
				}*/
				cb(200, server.responseText);
			}
		}
	};
	server.send(payload);
	return true;
};

STX.log10=function(y){
	return Math.log(y)/Math.LN10;
};

// Adds getComputedStyle for older browsers such as IE8
if (!window.getComputedStyle) {
	window.getComputedStyle = function(el, pseudo) {
		var style = {};
		for(var prop in el.currentStyle){
			style[prop]=el.currentStyle[prop];
		}
		style.getPropertyValue = function(prop) {
			var re = /(\-([a-z]){1})/g;
			if (prop == 'float') prop = 'styleFloat';
			if (re.test(prop)) {
				prop = prop.replace(re, function () {
					return arguments[2].toUpperCase();
				});
			}
			return this[prop] ? this[prop] : null;
		};
		return style;
	}
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(obj, start) {
	    for (var i = (start || 0), j = this.length; i < j; i++) {
	        if (this[i] === obj) { return i; }
	    }
	    return -1;
	}
}

STX.newChild=function(div, tagName, className){
	var div2=document.createElement(tagName);
	if(className) div2.className=className;
	div.appendChild(div2);
	return div2;
};

if(typeof exports!="undefined") exports.STX=STX;


