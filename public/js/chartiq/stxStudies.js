// -------------------------------------------------------------------------------------------
// Copyright 2012 by ChartIQ LLC
// -------------------------------------------------------------------------------------------

function STXStudies(){
}

STXStudies.plottedSeries={};
STXStudies.colorPickerDiv=null;

STXStudies.StudyDescriptor=function(name, type, panel, inputs, outputs, parameters){
	this.name=name;
	this.type=type;
	this.panel=panel;
	this.inputs=inputs;
	this.outputs=outputs;
	this.libraryEntry=STXStudies.studyLibrary[type];
	this.outputMap={};	// Maps dataSet label to outputs label "RSI (14)" : "RSI", for the purpose of figuring color
	this.min=null;
	this.max=null;
	this.parameters=parameters;	// Optional parameters, i.e. zones
};

STXStudies.generateID=function(stx, studyName, inputs){
	var translatedStudy=studyName;
	if(stx) translatedStudy=stx.translateIf(translatedStudy);
	id=translatedStudy + " (";
	var first=false;
	for(var field in inputs){
		if(!first){
			first=true;
		}else{
			id+=",";
		}
		var val=inputs[field];
		id+=val;
	}
	id+=")";
	return id;
};

STXStudies.go=function(div, stx){
	var inputs={}; var outputs={};
	var translatedStudy=div.study;
	if(stx) translatedStudy=stx.translateIf(translatedStudy);
	inputs.id = translatedStudy + " (";
	var inputItems=div.querySelectorAll(".inputTemplate");
	var first=false;
	for(var i=0;i<inputItems.length;i++){
		if(inputItems[i].style.display!="none"){
			var field=inputItems[i].querySelectorAll(".heading")[0].fieldName;
			var inputDOM=inputItems[i].querySelectorAll(".data")[0].childNodes[0];
			var value=inputDOM.value;
			if(inputDOM.getAttribute("type")=="checkbox"){
				inputs[field]=inputDOM.checked;
			}else{
				inputs[field]=value;
			}
			if(!first){
				first=true;
			}else{
				inputs.id+=",";
			}
			if(inputDOM.getAttribute("type")=="checkbox"){
				inputs.id+=inputDOM.checked?"T":"F";				
			}else{
				var translatedValue=value;
				if(stx) translatedValue=stx.translateIf(translatedValue);
				inputs.id+=translatedValue;
			}
		}
	}
	inputs.id+=")";
	if(inputItems.length==1){
		inputs.id=div.study;
	}
	var outputItems=div.querySelectorAll(".outputTemplate");
	for(var i=0;i<outputItems.length;i++){
		if(outputItems[i].style.display!="none"){
			var field=outputItems[i].querySelectorAll(".heading")[0].fieldName;
			var color=outputItems[i].querySelectorAll(".color")[0].style.backgroundColor;
			if(!color || color=="") color="auto";
			outputs[field]=color;
		}
	}
	//if(div.stx.panelExists(inputs.id)) return null;
	
	var parameters={};
	STXStudies.getCustomParameters(div, parameters);
	var sd=STXStudies.addStudy(div.stx, div.study, inputs, outputs, parameters);
	return sd;
};

/*
 * This method parses out custom parameters from the study dialog. For this to work, the studyLibrary entry
 * must contain a value "parameters". This object should then include a "template" which is the id of the html
 * element that is appended to the studyDialog. Then another object "init" should contain all of the id's
 * within that template which contain data.
 */
STXStudies.getCustomParameters=function(div, parameters){
	var sd=STXStudies.studyLibrary[div.study];
	if(!sd) return;
	if(!sd.parameters) return;
	if(!sd.parameters.template) return;
	if(!sd.parameters.init) return;
	var template=div.querySelectorAll("#" + sd.parameters.template)[0];
	if(!template) return;
	for(var field in sd.parameters.init){
		var el=template.querySelectorAll("#" + field)[0];
		if(!el) continue;
		if(el.tagName=="INPUT"){
			if(el.type=="checkbox"){
				parameters[field]=el.checked;
			}else{
				parameters[field]=el.value;
			}
		}else{
			parameters[field]=el.style.backgroundColor;
		}
	}
};

STXStudies.prepareStudy=function(stx, study, sd){
	if(typeof(study.calculateFN)=="undefined") study.calculateFN=STXStudies.passToModulus;
	if(typeof(study.seriesFN)=="undefined") study.seriesFN=STXStudies.displaySeriesAsLine;
	if(study.calculateFN) study.calculateFN(stx, sd);
	// Unless overriden by the calculation function we assume the convention that the dataSet entries
	// will begin with the output name such as "RSI rsi (14)"
	if(STX.isEmpty(sd.outputMap)){
		for(var i in sd.outputs){
			sd.outputMap[i + " " + sd.name]=i;
		}
	}
	if(study.overlay){
		var overlay=stx.overlays[sd.name];
		if(!overlay){
			stx.overlays[sd.name]=sd;
		}
	}
	
};

STXStudies.addStudy=function(stx, type, inputs, outputs, parameters){
	var study=STXStudies.studyLibrary[type];
	if(!study) study={};
	var sd=null;
	if(study.initializeFN){
		sd=study.initializeFN(stx, type, inputs, outputs, parameters);
	}else{
		sd=STXStudies.initializeFN(stx, type, inputs, outputs, parameters);
	}
	if(!sd) return;
	if(!stx.layout.studies) stx.layout.studies={};
	stx.layout.studies[sd.inputs["id"]]=sd;
	stx.changeOccurred("layout");
	STXStudies.prepareStudy(stx, study, sd);
	stx.draw();
	sd.study=study;
	sd.type=type;
	return sd;
};

STXStudies.quickAddStudy=function(stx, studyName, inputs, parameters){
	if(!parameters) parameters={};
	var sl=STXStudies.studyLibrary[studyName];
	inputs.id=STXStudies.generateID(stxx, studyName, inputs);
	var sd=STXStudies.addStudy(stxx, studyName, inputs, sl.outputs, parameters);
	return sd;
};

STXStudies.removeStudy=function(stx, sd){
	if(sd.libraryEntry.overlay){
		stx.removeOverlay(sd.name);
		stx.draw();
	}else{
		var panel=stx.panels[sd.panel];
		if(panel)
			stx.panelClose(panel);
	}
};

STXStudies.studyDialog=function(stx, study, div){
	div.style.display="block";
	div.study=study;
	div.stx=stx;
	
	var inputs=div.querySelectorAll("#inputs")[0];
	var inputItems=inputs.querySelectorAll(".inputTemplate");
	for(var i=0;i<inputItems.length;i++){
		if(inputItems[i].style.display!="none"){
			inputs.removeChild(inputItems[i]);
		}
	}
	var outputs=div.querySelectorAll("#outputs")[0];
	var outputItems=outputs.querySelectorAll(".outputTemplate");
	for(var i=0;i<outputItems.length;i++){
		if(outputItems[i].style.display!="none"){
			outputs.removeChild(outputItems[i]);
		}
	}

	var sd=STXStudies.studyLibrary[study];
	if(!sd) sd={};
	if(typeof(sd.inputs)=="undefined") sd.inputs={"Period":14};
	for(var i in sd.inputs){
		var newInput=inputItems[0].cloneNode(true);
		inputs.appendChild(newInput);
		newInput.style.display="block";
		newInput.querySelectorAll(".heading")[0].innerHTML=stx.translateIf(i);
		newInput.querySelectorAll(".heading")[0].fieldName=i;
		var formField=null;
		var acceptedData=sd.inputs[i];
		if(acceptedData.constructor==Number){
			formField=document.createElement("input");
			formField.setAttribute("type", "number");
			formField.value=acceptedData;
		}else if(acceptedData.constructor==String){
			if(acceptedData=="ma" || acceptedData=="ema"){
				formField=document.createElement("select");
				var option=document.createElement("OPTION");option.value="simple";option.text=stx.translateIf("Simple");formField.add(option, null);
				var option=document.createElement("OPTION");option.value="exponential";option.text=stx.translateIf("Exponential");formField.add(option, null);
				if(acceptedData=="ema") option.selected=true;
				var option=document.createElement("OPTION");option.value="time series";option.text=stx.translateIf("Time Series");formField.add(option, null);
				var option=document.createElement("OPTION");option.value="triangular";option.text=stx.translateIf("Triangular");formField.add(option, null);
				var option=document.createElement("OPTION");option.value="variable";option.text=stx.translateIf("Variable");formField.add(option, null);
				var option=document.createElement("OPTION");option.value="weighted";option.text=stx.translateIf("Weighted");formField.add(option, null);
				var option=document.createElement("OPTION");option.value="wells wilder";option.text=stx.translateIf("Wells Wilder");formField.add(option, null);
			}else if(acceptedData=="field"){
				formField=document.createElement("select");
				var count=0;
				for(var field in stx.chart.dataSet[stx.chart.dataSet.length-1]){
					if(["Date","DT","projection","split","distribution", "atr", "stch_14", "ratio"].indexOf(field) >= 0) continue;
					if(field=="Volume" && !stx.panels["vchart"]) continue;
					var option=document.createElement("OPTION");
					option.value=field;
					option.text=stx.translateIf(field);
					formField.add(option, null);
					if(field=="Close") formField.selectedIndex=count;
					count++;
				}
			}
		}else if(acceptedData.constructor==Boolean){
			formField=document.createElement("input");
			formField.setAttribute("type","checkbox");
			if(acceptedData==true) formField.checked=true;
		}else if(acceptedData.constructor==Array){
			formField=document.createElement("select");
			for(var i=0;i<acceptedData.length;i++){
				var option=document.createElement("OPTION");option.value=acceptedData[i];option.text=acceptedData[i];formField.add(option, null);
			}
		}
		if(formField) newInput.querySelectorAll(".data")[0].appendChild(formField);
	}
	if(typeof(sd.outputs)=="undefined") sd.outputs={"Result":"auto"};
	for(var i in sd.outputs){
		var newOutput=outputItems[0].cloneNode(true);
		outputs.appendChild(newOutput);
		newOutput.style.display="block";
		newOutput.querySelectorAll(".heading")[0].innerHTML=stx.translateIf(i);
		newOutput.querySelectorAll(".heading")[0].fieldName=i;
		var colorClick=newOutput.querySelectorAll(".color")[0];
		if(sd.outputs[i]!="auto"){
			colorClick.style.backgroundColor=sd.outputs[i];
			unappendClassName(colorClick, "stxColorDarkChart");
		}else{
			if(stx.defaultColor=="#FFFFFF") appendClassName(colorClick, "stxColorDarkChart");
		}
		
		STX.attachColorPicker(colorClick, STXStudies);
	}
	
	// Optional parameters for studies. This is driven by a UI template that must be created by the developer, and which
	// is referenced from the study description (studyLibrary entry).
	var parametersEL=div.querySelectorAll("#parameters")[0];
	if(parametersEL){
		clearNode(parametersEL);
		if(sd.parameters && sd.parameters.template && sd.parameters.init){
			var template=document.querySelectorAll("#" + sd.parameters.template)[0];
			if(template){
				template=template.cloneNode(true);
				template.style.display="block";
				parametersEL.appendChild(template);
				for(var field in sd.parameters.init){
					var value=sd.parameters.init[field];
					var el=template.querySelectorAll("#" + field)[0];
					if(!el) continue;
					if(el.tagName=="INPUT"){
						if(el.type=="checkbox"){
							el.checked=value;
						}else{
							el.value=value;
						}
					}else{
						if(value=="auto"){
							value="";
							if(stx.defaultColor=="#FFFFFF") appendClassName(el, "stxColorDarkChart");
						}else{
							unappendClassName(el, "stxColorDarkChart");
						}
						el.style.backgroundColor=value;
						STX.attachColorPicker(el, STXStudies);
					}
				}
			}
		}
	}
};

STXStudies.displayStudies=function(stx, quotes){
	var s=stx.layout.studies;
	if(!s) return;
	for(var panelName in stx.panels){
		stx.panels[panelName].min=null;
	}
	for(var n in s){
		var sd=s[n];
		var p=STXStudies.studyLibrary[sd.type];
		var panel=stx.panels[sd.panel];
		if(panel){
			if(panel.hidden) continue;
			if(sd.permanent){
				if(panel.closeX){
					panel.closeX.style.display="none";
				}else{
					panel.close.style.display="none";
				}
			}
		}
		if(!p || typeof(p.seriesFN)=="undefined"){	// null means don't display, undefined means display by default as a series
			STXStudies.displaySeriesAsLine(stx, sd, quotes);
		}else{
			if(p.seriesFN){
				if(panel) p.seriesFN(stx, sd, quotes);
			}
		}
	}
};

STXStudies.determineMinMax=function(stx, sd, quotes){
	var panel=stx.panels[sd.panel];
	if(!panel) return;
	if(panel.min!=null) return;
	if(sd.min==null){
		if(sd.libraryEntry && sd.libraryEntry.range=="0 to 100"){
			panel.min=0; panel.max=100;
		}else if(sd.libraryEntry && sd.libraryEntry.range=="-1 to 1"){
			panel.min=-1; panel.max=1;
		}else if(!sd.libraryEntry || sd.libraryEntry.range!="bypass"){
			panel.min=2000000000;
			panel.max=-2000000000;
			for(var i=0;i<quotes.length;i++){
				for(var j in sd.outputMap){
					var m=quotes[i][j];
					if(typeof m=="undefined" || m==null) continue;
					if(isNaN(m)) continue;
					panel.min=Math.min(m,panel.min);
					panel.max=Math.max(m,panel.max);
				}
				var m=quotes[i][sd.name+"_hist"];
				if(typeof m=="undefined" || m==null) continue;
				if(isNaN(m)) continue;
				panel.min=Math.min(m,panel.min);
				panel.max=Math.max(m,panel.max);
			}
		}
	}else{
		panel.min=sd.min; panel.max=sd.max;
	}
	panel.height=panel.bottom-panel.top;
	panel.shadow=panel.max-panel.min;
	if(panel.max>0 && panel.bottom<0) panel.shadow=panel.max + panel.min*-1;
	if(panel.min<0 && panel.max>0){
		if(!sd.libraryEntry || !sd.libraryEntry["nohorizontal"])
			STXStudies.drawHorizontal(stx, sd, quotes, 0);		
	}
};

STXStudies.displaySeriesAsLine=function(stx, sd, quotes){
	if(quotes.length==0) return;
	var panel=stx.panels[sd.panel];
	if(!panel) return;
	if(panel.hidden==true) return;
	if(panel.name!="chart"){
		STXStudies.determineMinMax(stx, sd, quotes);
	}
	if(panel.name!="chart" && panel.name!="vchart"){
		panel.height=panel.bottom-panel.top;
		STXStudies.setIdealTicks(stx, panel);
		STXStudies.fitAxisToSeries(stx, panel);
	}
	if(sd.libraryEntry && sd.libraryEntry.yaxis){
		sd.libraryEntry.yaxis(stx, sd);
	}else if(panel.name!="chart" && panel.name!="vchart"){
		if(!panel.axisDrawn) STXStudies.drawYAxis(stx, panel);
	}
	for(var i in sd.outputMap){
		STXStudies.displayIndividualSeriesAsLine(stx, sd, panel, i, quotes);
	}
};

STXStudies.displayIndividualSeriesAsLine=function(stx, sd, panel, name, quotes){
	if(!panel.height) panel.height=panel.bottom-panel.top;
	STXStudies.plottedSeries[name]=panel.name;
    var offset=Math.round(stx.layout.candleWidth*.5);
	stx.chart.context.beginPath();
	var first=true;
	if(panel.name=="chart"){
		var b=stx.computeBottom(panel);
		var t=panel.top;
		var reset=false;
		for(var i=0;i<=stx.chart.maxTicks;i++){
			if(quotes[i]==null) continue;
			if(quotes[i][name]==null || isNaN(quotes[i][name])) continue;
			var x=stx.computePosition(i, offset);
			var y=stx.computeTop(quotes[i][name]);
			if(y<t){
				y=t;
				if(reset){
					stx.chart.context.moveTo(x,y);
					continue;
				}
				reset=true;				
			}else if(y>b){
				y=b;
				if(reset){
					stx.chart.context.moveTo(x,y);
					continue;
				}
				reset=true;
			}else{
				reset=false;
			}
			if(first){
				first=false;
				try{
				stx.chart.context.moveTo(x, y);
				}catch(e){
					STX.alert(x + ":" + y);
				}
			}else{
				try{
				stx.chart.context.lineTo(x, y);
				}catch(e){
					STX.alert(x + ":" + y);
				}
			}
		}
	}else{
		var yPixels=(panel.height-1)/panel.shadow;

		for(var i=0;i<quotes.length;i++){
			if(quotes[i]==null) continue;
			if(quotes[i][name]==null || isNaN(quotes[i][name])) continue;
			var x=stx.computePosition(i, offset);
			var zeroed=quotes[i][name]-panel.min;
			var y=panel.bottom - (zeroed*yPixels);

			if(first){
				first=false;
				try{
				stx.chart.context.moveTo(x, y);
				}catch(e){
					STX.inspectProperties(quotes[i]);
				}
			}else{
				try{
				stx.chart.context.lineTo(x, y);
				}catch(e){
					STX.inspectProperties(quotes[i]);
				}
			}
		}
	}
	stx.chart.context.lineWidth=1;
	if(sd.highlight) stx.chart.context.lineWidth=3;
	var color=sd.outputs[sd.outputMap[name]];
	if(color=="auto") color=stx.defaultColor;	// This is calculated and set by the kernel before draw operation.
	stx.chart.context.strokeStyle=color;
	stx.chart.context.stroke();
	stx.chart.context.closePath();

	if(sd.libraryEntry && sd.libraryEntry.appendDisplaySeriesAsLine) sd.libraryEntry.appendDisplaySeriesAsLine(sd, quotes, name, panel, yPixels);
};

STXStudies.setIdealTicks=function(stx, panel, pixels){
	if(!pixels){
		var fontHeight=stx.getCanvasFontSize("stx_yaxis");
		pixels=fontHeight*1.5;
	}
	var idealTicks=Math.round(panel.height/pixels);
	panel.priceTick=Math.floor(panel.shadow/idealTicks);

	if(panel.priceTick<=0){
		panel.priceTick=Math.floor(panel.shadow/idealTicks*10)/10;
		if(panel.priceTick<=0){
			panel.priceTick=Math.floor(panel.shadow/idealTicks*100)/100;
			if(panel.priceTick<=0) panel.priceTick=.01;
		}
	}	
};

STXStudies.fitAxisToSeries=function(stx, panel){
	panel.verticalTicks=panel.shadow/panel.priceTick;
	panel.spacing=panel.height/(panel.verticalTicks);	// Create one more tick's worth of space
	panel.multiplier=panel.spacing/panel.priceTick;
};

STXStudies.drawYAxis=function(stx, panel){
	panel.axisDrawn=true;
	var fontHeight=stx.getCanvasFontSize("stx_yaxis");
	stx.canvasFont("stx_yaxis");
	stx.canvasColor("stx_yaxis");
	for(var i=0;i<Math.floor(panel.verticalTicks);i++){
		var price=panel.max - (i*panel.priceTick);
		price=Math.round(price*100)/100;
		var y=(panel.max-price)*panel.multiplier;

		if(panel.priceTick<1){
			price=price.toFixed(2);
		}else{
			price=condenseInt(price);
		}
		stx.chart.context.fillText(price, stx.chart.width, panel.top + y + (fontHeight/2));
	}
	stx.createBlock(0, stx.chart.width, panel.top, 1, "stx_grid");
};

STXStudies.yAxisPoint=function(stx, panel, value, config){
	var parameters=config.line;
	if(!parameters) parameters={};
	var formattedValue=value;
	if(config.formatter) formattedValue=config.formatter(value);
	var priceOffset=Math.round((panel.max%panel.priceTick)*100)/100;
	var fontHeight=stx.getCanvasFontSize("stx_yaxis");
	var y=panel.bottom-(panel.height/panel.shadow)*value;
	stx.canvasFont("stx_yaxis");
	stx.canvasColor("stx_yaxis");
	stx.chart.context.textBaseline="middle";
	stx.chart.context.fillText(formattedValue, stx.chart.width, y);
	if(config.grid){
		stx.plotLine(0, stx.chart.canvasWidth, y, y, stx.getCanvasColor("stx_grid"), "segment", stx.chart.context, false, parameters);
	}
};

STXStudies.drawHorizontal=function(stx, sd, quotes, price){
	var panel = stx.panels[sd.name];
	if(!panel) return;
	var yPixels=(panel.height-1)/panel.shadow;

	var zeroed=0-panel.min;
	var y=panel.bottom - (zeroed*yPixels);
	stx.plotLine(stx.chart.left, stx.chart.width, y, y, "#DDDDDD", "line", stx.chart.context, false, {});
};

STXStudies.displayKlinger=function(stx, sd, quotes) {
	STXStudies.determineMinMax(stx, sd, quotes);
	STXStudies.drawHorizontal(stx, sd, quotes, 0);
	STXStudies.createHistogram(stx, sd, quotes);
	STXStudies.displaySeriesAsLine(stx, sd, quotes);
};

STXStudies.calculateKlinger=function(stx, sd){
	STXStudies.passToModulus(stx, sd);
	for(var i=0;i<stx.chart.dataSet.length;i++){
		stx.chart.dataSet[i][sd.name+"_hist"]=stx.chart.dataSet[i]["Klinger " + sd.name]-stx.chart.dataSet[i]["KlingerSignal " + sd.name];
	}
};

STXStudies.displayMACD=function(stx, sd, quotes) {
	STXStudies.createHistogram(stx, sd, quotes, false);
	STXStudies.displaySeriesAsLine(stx, sd, quotes);
};

STXStudies.displayPSAR=function(stx, sd, x, quotes){
	var x0=stx.computePosition(x, 0);
	var y0=stx.pixelFromPrice(quotes[x]["Result " + sd.name]);
	stx.plotLine(x0, x0+3, y0, y0, sd.outputs["Result"], "segment", stx.chart.context, true, {});
};

// Centered will center the histogram on the panel, otherwise the histogram is centered on the zero axis
STXStudies.createHistogram=function(stx, sd, quotes, centered){
	STXStudies.determineMinMax(stx, sd, quotes);
	var panel = stx.panels[sd.name];
	
	var myWidth=stx.layout.candleWidth-2;
	if(myWidth<2) myWidth=1;
	var yPixels=(panel.height-1)/panel.shadow;

	var zeroed=0-panel.min;
	var y=panel.bottom - (zeroed*yPixels);
	if(centered){
		y=panel.top + panel.height/2;
	}

	stx.chart.context.beginPath();
	for(var i=0;i<quotes.length;i++){
	  try {
		  var x0=stx.computePosition(i, 1);
		  var x1=x0 + myWidth;
		  var y1=y+quotes[i][sd.name+"_hist"]*yPixels*-1;
		  stx.chart.context.moveTo(x0, y);
		  stx.chart.context.lineTo(x1, y);
		  stx.chart.context.lineTo(x1, y1);
		  stx.chart.context.lineTo(x0, y1);
		  stx.chart.context.lineTo(x0, y);
	  } catch(e) {}
	}
	stx.canvasColor("stx_histogram");
	stx.chart.context.fill();
	stx.chart.context.closePath();
	stx.chart.context.globalAlpha=1;
};

STXStudies.prettify={
		"Close":"C",
		"Open":"O",
		"High":"H",
		"Low":"L",
		",simple":"",
		"simple":"",
		"exponential":"ema",
		"time series":"ts",
		"triangular":"tri",
		"variable":"var",
		"weighted":"wa",
		"wells wilder":"ww"
};

STXStudies.prettyRE=/^.*\((.*?)\).*$/;

STXStudies.prettyDisplay=function(id){
	var match = STXStudies.prettyRE.exec(id);
	if(!match) return id;
	var guts=match[1];
	if(guts){
		for(var i in STXStudies.prettify){
			guts=guts.replace(i, STXStudies.prettify[i]);
		}
		id=id.replace(match[1], guts);
	}
	return id;
};

STXStudies.initializeFN=function(stx, type, inputs, outputs, parameters){
	if(!inputs) inputs={
			id: type
	};
	if(!inputs.display) inputs.display=STXStudies.prettyDisplay(inputs.id);
	var sd=new STXStudies.StudyDescriptor(inputs.id, type, inputs.id, inputs, outputs, parameters);
	if(inputs["Period"]) sd.days=parseFloat(sd.inputs["Period"]);
	var study=STXStudies.studyLibrary[type];
	if(stx.panelExists(inputs.id)){
		sd.panel=stx.panels[inputs.id].name;
	}else if(!study || !study.overlay){
		stx.createPanel(inputs.display, inputs.id);
	}else{
		var panel=null;
		if(inputs["Field"]){
			panel=STXStudies.plottedSeries[inputs["Field"]];
			if(inputs["Field"]=="Volume") panel="vchart";		
		}
		if(!panel) panel="chart";
		sd.panel=panel;
	}
	return sd;
};

STXStudies.initializeStochastics=function(stx, type, inputs, outputs){
	inputs.display="Stoch (" + inputs["Period"] + ")";
	return STXStudies.initializeFN(stx, type, inputs, outputs);
};

STXStudies.overZones=function(stx, sd, quotes){
	if(quotes.length==0) return;
	var panel=stx.panels[sd.panel];
	if(!panel) return;
	if(panel.hidden==true) return;
	var parameters=sd.parameters;
	if(sd.parameters && sd.parameters.studyOverZonesEnabled){
		panel.axisDrawn=true;	// override the default y-axis
	}
	STXStudies.displaySeriesAsLine(stx, sd, quotes);
	if(sd.parameters && sd.parameters.studyOverZonesEnabled){
		var overBought=parseFloat(sd.parameters.studyOverBoughtValue), overSold=parseFloat(sd.parameters.studyOverSoldValue);
		var ypx=panel.height/panel.shadow;
		var overBoughtY=panel.bottom-ypx*overBought;
		var overSoldY=panel.bottom-ypx*overSold;
		var parameters={
			lineWidth: 1
		};
		stx.chart.context.globalAlpha=.2;
		stx.plotLine(0,stx.chart.width-5, overBoughtY, overBoughtY, sd.parameters.studyOverBoughtColor, "segment", stx.chart.context, false, parameters);
		stx.chart.context.globalAlpha=.2;
		stx.plotLine(0,stx.chart.width-5, overSoldY, overSoldY, sd.parameters.studyOverSoldColor, "segment", stx.chart.context, false, parameters);
		
		if(!sd.libraryEntry.yaxis){
			// Draw the y-axis with overbought/oversold
			var fontHeight=stx.getCanvasFontSize("stx_yaxis");
			stx.canvasFont("stx_yaxis");
			stx.canvasColor("stx_yaxis");
			stx.chart.context.fillText(overBought, stx.chart.width, overBoughtY + (fontHeight/2));
			stx.chart.context.fillText(overSold, stx.chart.width, overSoldY + (fontHeight/2));
		}
	}
};

STXStudies.calculateMACD=function(stx, sd) { STXStudies._calculateMACD(stx, sd); };
STXStudies.calculateRSI=function(stx, sd){STXStudies._calculateRSI(stx,sd);};
STXStudies.calculateStochastics=function(stx, sd){STXStudies._calculateStochastics(stx, sd);};
STXStudies.passToModulus=function(stx, sd){STXStudies._passToModulus(stx, sd);};
STXStudies.calculateMovingAverage=function(stx, sd){STXStudies._calculateMovingAverage(stx, sd);};


STXStudies.studyLibrary={
		"rsi": {
			"inputs": {"Period":14},
			"calculateFN": STXStudies.calculateRSI,
			"seriesFN": STXStudies.overZones,
			"range": "0 to 100",
			"outputs":{"RSI":"auto"},
			"parameters": {
				template:"studyOverZones",
				init:{studyOverZonesEnabled:true, studyOverBoughtValue:80, studyOverBoughtColor:"auto", studyOverSoldValue:20, studyOverSoldColor:"auto"}
			}
		},
		"ma": {
			"overlay": true,
			"range": "bypass",
			"calculateFN": STXStudies.calculateMovingAverage,
			"inputs": {"Period":50,"Field":"field","Type":"ma"},
			"outputs": {"MA":"#FF0000"}
		},
		"macd": {
			"calculateFN": STXStudies.calculateMACD,
			"seriesFN": STXStudies.displayMACD,
			"nohorizontal": true,
			"inputs": {"Fast MA Period":12,"Slow MA Period":26,"Signal Period":9},
			"outputs":{"MACD":"auto", "Signal":"#FF0000"}
		},
		"stochastics": {
			"initializeFN": STXStudies.initializeStochastics,
			"calculateFN": STXStudies.calculateStochastics,
			"inputs": {"Period":14,"Smooth":true},
			"outputs":{"Fast":"auto", "Slow":"#FF0000"}
		},
		"Aroon": {
			"range": "0 to 100",
			"outputs":{"Aroon Up":"#00FF00", "Aroon Down":"#FF0000"}
		},
		"Lin R2": {
			"inputs": {"Period":14,"Field":"field"},
			"outputs":{"RSquared":"auto"}
		},
		"Lin Fcst": {
			"overlay": true,
			"inputs": {"Period":14,"Field":"field"},
			"outputs":{"Forecast":"auto"}
		},
		"Lin Incpt": {
			"overlay": true,
			"inputs": {"Period":14,"Field":"field"},
			"outputs":{"Intercept":"auto"}
		},
		"Time Fcst": {
			"overlay": true,
			"inputs": {"Period":14,"Field":"field"}
		},
		"VIDYA": {
			"overlay": true,
			"inputs": {"Period":50,"Field":"field", "R2 Scale":.65}
		},
		"STD Dev": {
			"inputs": {"Period":14,"Field":"field", "Standard Deviations":2, "Moving Average Type":"ma"}
		},
		"Trade Vol": {
			"inputs": {"Field":"field", "Min Tick Value":.5}
		},
		"Swing": {
			"inputs": {"Limit Move Value":.5}
		},
		"Acc Swing": {
			"inputs": {"Limit Move Value":.5}
		},
		"Price Vol": {
			"inputs": {"Field":"field"}
		},
		"Pos Vol": {
			"inputs": {"Field":"field"}
		},
		"Neg Vol": {
			"inputs": {"Field":"field"}
		},
		"On Bal Vol": {
			"inputs": {"Field":"field"}
		},
		"Perf Idx": {
			"inputs": {"Field":"field"}
		},
		"Stch Mtm": {
			"inputs": {"%K Periods":13,"%K Smoothing Periods":25, "%K Double Smoothing Periods":2, "%D Periods":9, "Moving Average Type":"ma", "%D Moving Average Type":"ma"},
			"outputs":{"%K":"auto", "%D":"#FF0000"}
		},
		"Hist Vol": {
			"inputs": {"Field":"field", "Period":14, "Bar History":10, "Standard Deviations":2}
		},
		"Ultimate": {
			"inputs": {"Cycle 1":3, "Cycle 2":8, "Cycle 3":14}
		},
		"W Acc Dist": {
			"inputs": {}
		},
		"Vol Osc": {
			"inputs": {"Short Term Periods":8, "Long Term Periods":14, "Points Or Percent":["Points","Percent"]}
		},
		"Chaikin Vol": {
			"inputs": {"Period":14, "Rate Of Change":2, "Moving Average Type":"ma"}
		},
		"Price Osc": {
			"inputs": {"Field":"field", "Long Cycle":8, "Short Cycle":3, "Moving Average Type":"ma"}
		},
		"EOM": {
			"inputs": {"Period":14, "Moving Average Type":"ma"}
		},
		"CCI": {
			"inputs": {"Period":20}
		},
		"Detrended": {
			"inputs": {"Field":"field","Period":14, "Moving Average Type":"ma"}
		},
		"True Range": {
			"inputs": {}
		},
		"Aroon Osc": {
			"outputs":{"Aroon Oscillator":"auto"}
		},
		"Elder Force": {
			"inputs": {}
		},
		"Ehler Fisher": {
			"outputs":{"EF":"auto", "EF Trigger":"#FF0000"}
		},
		"Schaff": {
			"inputs": {"Field":"field","Period":14, "Short Cycle":13, "Long Cycle":25, "Moving Average Type":"ma"}
		},
		"QStick": {
			"inputs": {"Period":14, "Moving Average Type":"ma"}
		},
		"Coppock": {
			"inputs": {"Field":"field"}
		},
		"Chande Fcst": {
			"inputs": {"Field":"field", "Period":14}
		},
		"Intraday Mtm": {
			"inputs": {}
		},
		"RAVI": {
			"inputs": {"Field":"field", "Short Cycle":13, "Long Cycle":25}
		},
		"Random Walk": {
			"outputs": {"Random Walk High":"#FF0000", "Random Walk Low":"#0000FF"}
		},
		"Directional": {
			"outputs": {"ADX":"#00FF00", "DI+":"#FF0000", "DI-":"#0000FF"}
		},
		"High Low": {
			"overlay": true,
			"outputs": {"High Low Bands Top":"auto", "High Low Bands Median":"auto", "High Low Bands Bottom":"auto"}
		},
		"MA Env": {
			"overlay": true,
			"inputs": {"Field":"field", "Period":50, "Shift Percentage": 5},
			"outputs": {"Envelope Top":"auto", "Envelope Median":"auto", "Envelope Bottom":"auto"}
		},
		"Fractal Chaos Bands": {
			"overlay": true,
			"outputs": {"Fractal High":"auto", "Fractal Low":"auto"}
		},
		"Prime Number Bands": {
			"overlay": true,
			"outputs": {"Prime Bands Top":"auto", "Prime Bands Bottom":"auto"}
		},
		"Bollinger Bands": {
			"overlay": true,
			"inputs": {"Field":"field", "Period":50, "Standard Deviations": 2, "Moving Average Type":"ma"},
			"outputs": {"Bollinger Band Top":"auto", "Bollinger Band Median":"auto", "Bollinger Band Bottom":"auto"}
		},
		"Keltner": {
			"overlay": true,
			"inputs": {"Period":50, "Shift": 5, "Moving Average Type":"ema"},
			"outputs": {"Keltner Top":"auto", "Keltner Median":"auto", "Keltner Bottom":"auto"}
		},
		"PSAR": {
			"overlay": true,
			"seriesFN": null,
			"calculateFN": STXStudies.passToModulus,
			"tickFN": STXStudies.displayPSAR,
			"inputs": {"Minimum AF":.02,"Maximum AF":.2}
		},
		"Klinger": {
			"seriesFN": STXStudies.displayKlinger,
			"calculateFN": STXStudies.calculateKlinger,
			"inputs": {"Signal Periods":13, "Short Cycle": 34, "Long Cycle": 55, "Moving Average Type":"ma"},
			"outputs": {"Klinger":"auto","KlingerSignal":"#FF0000"}
		},
		"Elder Ray": {
			"inputs": {"Period":13, "Moving Average Type":"ema"},
			"outputs": {"Elder Bull Power":"#00DD00", "Elder Bear Power":"#FF0000"}
		},
		"LR Slope": {
			"inputs": {"Period":14,"Field":"field"},
			"outputs":{"Slope":"auto"}
		}
};

if(typeof exports!="undefined") exports.STXStudies=STXStudies;