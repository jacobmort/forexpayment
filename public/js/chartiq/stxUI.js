

//TODO, add an "x" to clear symbol input
// use ontouchend on touch devices


STXTouchAction="onclick";
if(STX.touchDevice && (STX.ipad || STX.iphone)) STXTouchAction="ontouchend";

/*
 * STXMenuManager
 * 
 * This widget manages menus. First, it ensures that charts do not react to users clicking or tapping on menus that overlap
 * the charting area. Then it also allows users to close menus by tapping outside of the menu area. This is accomplished
 * through the use of invisible, temporary overlay divs. Menu manager is a singleton. It automatically exists and only one is required per page.
 * Simply register your charts with the manager in order for it to automatically engage.
 */
STXMenuManager=function(){};
STXMenuManager.registeredCharts=[];
STXMenuManager.openMenu=null;
STXMenuManager.useOverlay=true;

STXMenuManager.registerChart=function(stx){
	STXMenuManager.registeredCharts.push(stx);
	if(!STXMenuManager.bodyOverlay){
		STXMenuManager.bodyOverlay=STX.newChild(document.body, "DIV", "stxBodyOverlay");
	}
};

/*
 * Override whether or not to use overlays. If overlays are not enabled then menus will still co-react
 * but no overlay will be generated to allow tapping outside of the menus
 */
STXMenuManager.useOverlays=function(useOverlay){
	STXMenuManager.useOverlay=useOverlay;
};

/* Turns on the menu manager. Pass a callback for when the user taps outside of the menu. The callback function will receive the name.
 * name should be unique for each menu on the page, so that clicking one menu will close an already open menu
 */
STXMenuManager.menuOn=function(name, callback){
	function tapMe(callback, name){
		return function(e){
			STXMenuManager.menuOff();
			callback(name);
			for(var i=0;i<STXChart.registeredContainers.length;i++){
				var stx=STXChart.registeredContainers[i].stx;
				stx.cancelTouchSingleClick=true;
			}
		};
	}
	if(STXMenuManager.registeredCharts.length==0) return;
	if(STXMenuManager.openMenu){
		if(name==STXMenuManager.openMenu) return;	// menu already open and manager active
		STXMenuManager.closeCurrentMenu();
	}
	STXMenuManager.openMenu=name;
	if(STXMenuManager.useOverlay){
		STXMenuManager.bodyOverlay.style.display="block";
		STXMenuManager.bodyOverlay[STXTouchAction]=tapMe(callback, name);
	}
	STXMenuManager.closeCurrentMenu=callback;
	for(var i=0;i<STXMenuManager.registeredCharts.length;i++){
		STXMenuManager.registeredCharts[i].openDialog=name;
	}
};

STXMenuManager.menuOff=function(){
	if(STXMenuManager.registeredCharts.length==0) return;
	STXMenuManager.openMenu=null;
	if(STXMenuManager.useOverlay){
		STXMenuManager.bodyOverlay.style.display="none";
		STXMenuManager.bodyOverlay[STXTouchAction]=null;
	}
	for(var i=0;i<STXMenuManager.registeredCharts.length;i++){
		STXMenuManager.registeredCharts[i].openDialog="";
	}
};

STXMenuManager.makeMenus=function(){
	function toggle(div){
		return function(e){
			function turnMeOff(div){
				return function(){
					div.style.display="none";
				};
			}
			var dom=getEventDOM(e);
			do{
				if(dom.className && dom.className.indexOf("menuOutline")!=-1) return;	// clicked inside the menuDisplay and not the menu button
				if(dom.className && dom.className.indexOf("stxMenu")!=-1) break; // clicked the actual button
				dom=dom.parentNode;
			}while(dom);
			if(div.style.display=="none"){
				div.style.display="block";
				var menuName=uniqueID();
				STXMenuManager.menuOn(menuName, turnMeOff(div));
			}else{
				STXMenuManager.menuOff();
				div.style.display="none";
			}
		};
	}
	function activate(menuOutline, clickable, priorClick){
		return function(e){
			STXMenuManager.menuOff();
			menuOutline.style.display="none";
			if(priorClick) priorClick();
			var action=clickable.getAttribute("stxToggle");
			eval(action);
		};
	}
	var menus=document.querySelectorAll(".stxMenu");
	for(var i=0;i<menus.length;i++){
		var menu=menus[i];
		var menuOutline=menu.querySelectorAll(".menuOutline")[0];
		menu[STXTouchAction]=toggle(menuOutline);
		
		var clickables=menuOutline.querySelectorAll("*[stxToggle]");
		for(var j=0;j<clickables.length;j++){
			clickables[j][STXTouchAction]=activate(menuOutline, clickables[j], clickables[j][STXTouchAction]);
		}
	}
};

/*
 * Close the menu of a containing object.
 */
STXMenuManager.closeThisMenu=function(el){
	while(el && el.className && el.className.indexOf("menuOutline")==-1){
		el=el.parentNode;
	}
	if(el){
		el.style.display="none";
	}
	STXMenuManager.menuOff();	
};

STXMenuManager.attachColorPicker = function(colorClick, cpHolder, cb){
	var closure=function(colorClick, cpHolder, cb){
		return function(color){
			if(cpHolder.colorPickerDiv) cpHolder.colorPickerDiv.style.display="none";
			colorClick.style.backgroundColor="#"+color;
			if(cb) cb(color);
			STXMenuManager.menuOff();
		};
	};
	function closeMe(cpHolder){
		return function(){
			if(cpHolder.colorPickerDiv) cpHolder.colorPickerDiv.style.display="none";			
		};
	}

	colorClick[STXTouchAction]=(function(fc, cpHolder){ return function(){
		STXMenuManager.menuOn("colorPicker", closeMe(cpHolder));
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
	};})(closure(colorClick, cpHolder, cb), cpHolder);
};
/*
 * STXDialogManager
 * 
 * A widget for managing modal dialogs. It maintains an internal stack so that multiple dialogs may be open simultaneously.
 * Optionally set useOverlay to true in order to create an overlay for dimming the screen
 */
STXDialogManager=function(){};
STXDialogManager.useOverlay=false;
STXDialogManager.stack=[];

STXDialogManager.modalBegin=function(){
	for(var i=0;i<STXChart.registeredContainers.length;i++){
		var stx=STXChart.registeredContainers[i].stx;
		stx.openDialog="modal";
		stx.undisplayCrosshairs();
	}
};

STXDialogManager.modalEnd=function(){
	for(var i=0;i<STXChart.registeredContainers.length;i++){
		var stx=STXChart.registeredContainers[i].stx;
		stx.cancelTouchSingleClick=true;
		stx.openDialog="";
		stx.doDisplayCrosshairs();
	}
};

STXDialogManager.displayDialog=function(id){
	STXDialogManager.modalBegin();
	if(STXDialogManager.useOverlay && !STXDialogManager.bodyOverlay){
		STXDialogManager.bodyOverlay=STX.newChild(document.body, "DIV", "stxDialogOverlay");		
	}
	if(STXDialogManager.useOverlay){
		STXDialogManager.bodyOverlay.style.display="block";
	}
	var node=id;
	if(typeof id=="string") node=$$(id);
	node.style.display="block";
	STXDialogManager.stack.push(node);
};

STXDialogManager.dismissDialog=function(){
	var node=STXDialogManager.stack.pop();
	node.style.display="none";
	if(STXDialogManager.colorPickerDiv!=null) STXDialogManager.colorPickerDiv.style.display="none";
	
	if(STXDialogManager.length==0){
		if(STXDialogManager.bodyOverlay && STXDialogManager.bodyOverlay.style.display=="block"){
			STXDialogManager.bodyOverlay.style.display="none";
		}
		STXDialogManager.modalEnd();
	}
};


/*
 * STXThemeManager
 * 
 * A widget for managing chart colors and themes. The dialog functionality assumes that color picker
 * divs have been set up with a class that matches one of the stx chart configuration classes (such as stx_candle_up)
 * 
 * The classMapping determines which classes are mapped to each color picker. If null then apply to the container itself
 */
STXThemeManager=function(){};
STXThemeManager.baseThemeEL=null;
STXThemeManager.builtInThemes={};
STXThemeManager.themes={
		enabledTheme:null,
		customThemes:{}
};
STXThemeManager.classMapping={
	stx_candle_up: {stx_candle_up:true, stx_bar_up:true, stx_hollow_candle_up:true},
	stx_candle_down: {stx_candle_down:true, stx_bar_down:true, stx_hollow_candle_down:true},
	stx_candle_shadow: {stx_candle_shadow:true, stx_line_chart:true},
	stx_grid: {stx_grid:true},
	stx_grid_dark: {stx_grid_dark:true},
	stx_xaxis_dark: {stx_xaxis_dark:true, stx_xaxis:true, stx_yaxis:true, stx_yaxis_dark:true},
	backgroundColor: null
};

/*
 * Populate a dialog with the existing colors from a chart
 */
STXThemeManager.populateDialog=function(id, stx){
	function toggleBorders(){
		if($$$("#candleBordersOn",$$(id)).checked){
			stx.styles["stx_candle_up"]["border-left-color"]=$$(id).querySelectorAll(".border.stx_candle_up")[0].style.backgroundColor;
			stx.styles["stx_candle_down"]["border-left-color"]=$$(id).querySelectorAll(".border.stx_candle_down")[0].style.backgroundColor;
		}else{
			stx.styles["stx_candle_up"]["border-left-color"]="transparent";
			stx.styles["stx_candle_down"]["border-left-color"]="transparent";
		}
		stx.draw();
	}
	function chooseColor(property, className){
		return function(color){
			var mapping=STXThemeManager.classMapping[className];
			if(mapping){
				for(var mapped in mapping){
					stx.canvasStyle(mapped);
					stx.styles[mapped][property]="#"+color;
				}
			}else{
				stx.chart.container.style[className]="#" + color;
			}
			stx.draw();
			if(property=="border-left-color" && color && color!="transparent"){
				$$$("#candleBordersOn", $$(id)).checked=true;
			}
		};
	}
	$$$("#candleBordersOn",$$(id)).checked=false;
	$$$("#candleBordersOn",$$(id))[STXTouchAction]=toggleBorders;
	
	var computed=getComputedStyle(stx.chart.container);
	for(var className in STXThemeManager.classMapping){
		var mapping=STXThemeManager.classMapping[className];
		var color=null;
		var borderColor=null;
		
		if(mapping){
			var firstClass=STX.first(mapping);
			var style=stx.canvasStyle(firstClass);
			color=style.color;
			borderColor=style["border-left-color"];
		}else{
			color=computed[className];
		}
		
		var picker=$$(id).querySelectorAll(".color." + className)[0];
		if(picker){
			picker.style.backgroundColor=color;
			if(!picker[STXTouchAction]){
				STXMenuManager.attachColorPicker(picker, STXDialogManager, chooseColor("color", className));
			}
		}
		
		var picker=$$(id).querySelectorAll(".border." + className)[0];
		if(picker){
			picker.style.backgroundColor=borderColor;
			if(!picker[STXTouchAction]){
				STXMenuManager.attachColorPicker(picker, STXDialogManager, chooseColor("border-left-color", className));
			}
			if(borderColor && borderColor!="transparent") $$$("#candleBordersOn", $$(id)).checked=true;
		}
	}
};

/*
 * Convert colors from a chart into a theme object
 */
STXThemeManager.createTheme=function(stx){
	var theme={};
	if(STXThemeManager.baseTheme) theme["baseTheme"]=STXThemeManager.baseTheme;
	for(var className in STXThemeManager.classMapping){
		var mapping=STXThemeManager.classMapping[className];
		if(mapping){
			var firstClass=STX.first(mapping);
			var style=stx.canvasStyle(firstClass);
			theme[className]={color:style.color};
			if(style["border-left-color"] && style["border-left-color"]!="transparent"){
				theme[className]["border-left-color"]=style["border-left-color"];
			}else{
				theme[className]["border-left-color"]="transparent";
			}
		}else{
			theme[className]=stx.chart.container.style[className];
		}
	}
	return theme;
};

/*
 * Save a theme by name. Optional callback function when finished of fc(str) where str is a stringified version of the themes
 * that can be used for saving to a server or to local storage
 */
STXThemeManager.saveTheme=function(name, stx){
	var theme=STXThemeManager.createTheme(stx);
	STXThemeManager.themes.customThemes[name]=theme;
	STXThemeManager.themes.enabledTheme=name;
	if(STXThemeManager.storageCB) STXThemeManager.storageCB(JSON.stringify(STXThemeManager.themes), stx);
	STXThemeManager.themesToMenu(STXThemeManager.el, STXThemeManager.el2, STXThemeManager.stx, STXThemeManager.storageCB);
};

STXThemeManager.setThemes=function(obj, stx){
	if(obj!=null){
		if(obj.customThemes) STXThemeManager.themes.customThemes=obj.customThemes;
		STXThemeManager.themes.enabledTheme=obj.enabledTheme;
		if(STXThemeManager.themes.enabledTheme){
			STXThemeManager.enableTheme(stx, STXThemeManager.themes.enabledTheme);
		}
	}
};

STXThemeManager.enableTheme=function(stx, theme){
	function addCustomizations(){
		var obj=STXThemeManager.themes.customThemes[theme];
		for(var className in obj){
			if(className=="baseTheme") continue;
			var mapping=STXThemeManager.classMapping[className];
			if(mapping){
				for(var mapped in mapping){
					stx.canvasStyle(mapped);
					stx.styles[mapped].color=obj[className].color;
					if(obj[className]["border-left-color"]){
						stx.styles[mapped]["border-left-color"]=obj[className]["border-left-color"];
					}
				}
			}else{
				if(stx.chart.container) stx.chart.container.style[className]=obj[className];
			}
		}
		if(stx.chart.container) stx.draw();
	}
	var obj=STXThemeManager.themes.customThemes[theme];
	if(obj){
		var baseTheme=obj["baseTheme"];
		STXThemeManager.loadBuiltInTheme(stx, baseTheme, addCustomizations);
		STXThemeManager.themes.enabledTheme=theme;
		if(STXThemeManager.storageCB) STXThemeManager.storageCB(JSON.stringify(STXThemeManager.themes), stx);
	}else{
		STXThemeManager.loadBuiltInTheme(stx, theme);
	}
};

STXThemeManager.enableBuiltInTheme=function(stx, theme){
	STXThemeManager.loadBuiltInTheme(stx, theme);
	STXThemeManager.themes.enabledTheme=theme;
	if(STXThemeManager.storageCB) STXThemeManager.storageCB(JSON.stringify(STXThemeManager.themes), stx);
};

/*
 * Pass null theme to remove the current built in theme, that is, go back to the defaults
 */
STXThemeManager.loadBuiltInTheme=function(stx, theme, cb){
	var links=document.getElementsByTagName("link");
	var lastLink=links[links.length-1];
	var linkContainer=lastLink.parentNode;
	if(STXThemeManager.baseThemeEL){
		linkContainer.removeChild(STXThemeManager.baseThemeEL);
		STXThemeManager.baseThemeEL=null;
	}
	if(!theme){
		if(cb) cb();
		return;
	}
	var lnk=document.createElement("link");
	lnk.rel="stylesheet";
	lnk.type="text/css";
	lnk.media="screen";
	lnk.href=STXThemeManager.builtInThemes[theme];
	linkContainer.insertBefore(lnk, lastLink.nextSibling);
	STXThemeManager.baseThemeEL=lnk;
	lnk.onload=function(){
		stx.styles={};
		if(stx.chart.container){
			stx.chart.container.style.backgroundColor="";
			stx.draw();
		}
		STXThemeManager.baseTheme=theme;
		if(cb) cb();
	};	
};
/*
 * el - The menu element where themes will be added
 * stx - a chart
 * cb - A callback method for storing the themes
 */
STXThemeManager.themesToMenu=function(el, el2, stx, cb){
	STXThemeManager.el=el;
	STXThemeManager.el2=el2;
	STXThemeManager.stx=stx;
	STXThemeManager.storageCB=cb;
	
	function useBuiltInTheme(theme){
		return function(){
			STXThemeManager.enableBuiltInTheme(stx, theme);
		};
	}
	function useTheme(theme){
		return function(){
			STXThemeManager.enableTheme(stx, theme);
		};
	}
	
	function deleteTheme(theme){
		return function(){
			delete STXThemeManager.themes.customThemes[theme];
			STXThemeManager.themesToMenu(el, el2, stx, cb);
			if(cb) cb(JSON.stringify(STXThemeManager.themes), stx);
		};
	}
	var els=el.querySelectorAll("li");
	for(var i=0;i<els.length;i++){
		if(els[i].style.display=="block")
			el.removeChild(els[i]);
	}
	
	var template=el.querySelectorAll(".themeSelectorTemplate")[0];
	for(var theme in STXThemeManager.themes.customThemes){
		var li=template.cloneNode(true);
		li.style.display="block";
		var stxItem=$$$(".stxItem",li);
		stxItem.innerHTML=theme;
		stxItem[STXTouchAction]=useTheme(theme);
		el.appendChild(li);
		$$$(".stxClose", li)[STXTouchAction]=deleteTheme(theme);
	}
	clearNode(el2);
	for(var theme in STXThemeManager.builtInThemes){
		var li=STX.newChild(el2, "li");
		li.innerHTML=theme;
		li[STXTouchAction]=useBuiltInTheme(theme);
	}
};
/*
STXLookupWidget

This is a widget that can be used to display symbol search results

config={
	input: // reference to an input field to attach to
	textCallback: // function to call when a symbol is entered of format func(this, txt, filter)
	selectCallback: // function to call when the user selects a symbol or hits enter func(this, txt)
	filters: // an array of security classes to filter on. Valid values are: ALL, STOCKS, FOREX, INDEXES. Null to not provide a filter.
}
*/

STXLookupWidget=function(config){
	this.config=config;
	this.div=null;
	this.currentFilter=null;
	this.filterButtons=[];
	this.height=480;
};

/*
 * Call this function with the results from your search. results should be an array of the following object:
 * {
 * symbol: symbol,
 * description: full name of security,
 * exchange: optional exchange
 * }
 */
STXLookupWidget.prototype.displayResults=function(results){
	function select(that, symbol){
		return function(e){
			if(STXScrollManager.isClick(e)){
				that.config.input.value=symbol;
				that.config.selectCallback(that, symbol);
				that.close();
				that.config.input.blur();
			}
		};
	}
	if(results.length>0){
		this.display();
	}else{
		return;
	}
	clearNode(this.ul);
	for(var i=0;i<results.length;i++){
		var result=results[i];
		var li=STX.newChild(this.ul, "LI");
		var symbolSpan=STX.newChild(li, "span");
		symbolSpan.innerHTML=result.symbol;
		var descriptionSpan=STX.newChild(li, "span");
		descriptionSpan.innerHTML=result.description;
		var exchangeSpan=STX.newChild(li, "span");
		if(result.exchange) exchangeSpan.innerHTML=result.exchange;
		li.onclick=select(this, result.symbol);
		li.onmousedown=STXScrollManager.start;
		li.ontouchstart=STXScrollManager.start;
	}
	if(!this.iscroll){
		this.iscroll = new iScroll($$$(".stxLookupSymbols").parentNode, {vScrollbar: true, hScroll:false, hideScrollbar: false});
	}else{
		this.iscroll.refresh();
	}
};

STXLookupWidget.prototype.init=function(){
	function closure(that){
		return function(e){
			var div=getEventDOM(e);
			var key = (window.event) ? event.keyCode : e.keyCode;
			switch(key){
				case 13:
					that.close();
					that.config.selectCallback(that, div.value);
					div.blur();
					break;
				case 27:
					that.close();
					div.value="";
					div.blur();
					break;
				default:
					//TODO, clear symbol icon
					that.config.textCallback(that, div.value, that.currentFilter);
					break;
			}
			e = e||event;
			e.stopPropagation? e.stopPropagation() : e.cancelBubble = true;			
		};
	}
	this.config.input.onkeyup=closure(this);
};

STXLookupWidget.prototype.display=function(){
	function pressFilter(that, div, filter){
		return function(){
			for(var i=0;i<that.filterButtons.length;i++){
				unappendClassName(that.filterButtons[i],"on");
			}
			appendClassName(div, "on");
			that.currentFilter=filter;
			that.config.textCallback(that, that.config.input.value, that.currentFilter);
		};
	}
	if(this.div==null){
		this.div=STX.newChild(this.config.input.parentNode, "DIV", "menuOutline stxLookupResults");
		var ul=STX.newChild(this.div, "UL", "stxResults");
		var li=STX.newChild(ul, "LI", "stxLookupFilter");
		if(this.config.filters){
			for(var i=0;i<this.config.filters.length;i++){
				var filter=this.config.filters[i];
				var div=STX.newChild(li, "div", "btn");
				div.innerHTML=filter;
				div[STXTouchAction]=pressFilter(this, div, filter);
				this.filterButtons.push(div);
			}
			var divider=STX.newChild(ul, "LI", "divider");
		}
		var li=STX.newChild(ul, "LI");
		this.ul=STX.newChild(li, "UL", "menuSelect stxLookupSymbols");
		li.style.maxHeight=this.height + "px";
	}else{
		this.div.style.display="inline-block";
	}
	
	function closeCallback(that){
		return function(){
			that.close();
		};
	}
	STXMenuManager.menuOn("lookup", closeCallback(this));

};

STXLookupWidget.prototype.close=function(){
	if(this.div) this.div.style.display="none";
	STXMenuManager.menuOff();
};


/*
 * STXScrollManager
 * 
 * This is a widget for detecting whether a user has scrolled between the time that they press the mouse and let go. Otherwise
 * the act of scrolling a dialog would cause a selection. To use, register start as your mousedown or touchstart event. Then
 * call isClick(e) during your mouseup or touchend event to determine whether the user truly clicked or not.
 */
STXScrollManager=function(){};
STXScrollManager.x=0;
STXScrollManager.y=0;
STXScrollManager.downTime=0;

STXScrollManager.start=function(e){
	STXScrollManager.x=e.pageX;
	STXScrollManager.y=e.pageY;
	STXScrollManager.downTime=new Date().getTime();
};

STXScrollManager.isClick=function(e){
	var now=new Date().getTime();
	if(now-STXScrollManager.downTime>2000) return false;	// Over two seconds from mouse down to mouse up is not a click
	if(Math.abs(e.pageX-STXScrollManager.x)>10) return false;	// Moved mouse or finger too much
	if(Math.abs(e.pageY-STXScrollManager.y)>10) return false;
	return true;
};


/*
 * STXTimeZoneWidget
 * 
 * Lets users pick a local timezone for display on the xaxis of charts
 */
STXTimeZoneWidget=function(){};


//Creates a menu structure which can be used to provide a user with timezone selection
//First level tier is the region. Each region has an array of cities. If the array is empty
//then no cities are available for that region. The timezone should be reconstructed as
//region/city. For instance, "America/New_York". Or for regions without cities simply "Iran".
//The reconstructed value can then be passed into stxx.setTimeZone();

STXTimeZoneWidget.init=function(){
	if(typeof timezoneJS!="undefined"){
		STXTimeZoneWidget.timezoneMenu={};
		
		for(var i in timezoneJS.timezone.zones){
			//if(typeof timezoneJS.timezone.zones[i]=="string") continue;	// translations
			var s=i.split("/");
			var region=s[0];
			if(!STXTimeZoneWidget.timezoneMenu[region]) STXTimeZoneWidget.timezoneMenu[region]=[];
			
			if(s.length>1){
				var city=s[1];
				if(s.length>2) city+="/" + s[2];
				STXTimeZoneWidget.timezoneMenu[region].push(city);
			}
		}
	}
};

STXTimeZoneWidget.setTimeZone=function(zone){
	STXChart.defaultDisplayTimeZone=zone;
	for(var i=0;i<STXChart.registeredContainers.length;i++){
		var stx=STXChart.registeredContainers[i].stx;
		stx.setTimeZone(stx.dataZone, zone);
		stx.draw();
	}	
};

STXTimeZoneWidget.populateDialog=function(id){
	if(!STXTimeZoneWidget.timezoneMenu) STXTimeZoneWidget.init();
	
	function setTimezone(zone){
		return function(e){
			if(STXScrollManager.isClick(e)){
				STXDialogManager.dismissDialog();
				STXTimeZoneWidget.setTimeZone(zone);
				if(STXTimeZoneWidget.storageCB){
					STXTimeZoneWidget.storageCB(zone);
				}
			}
		};
	}
	if(typeof timezoneJS=="undefined") return;
	var el=$$(id);
	if(!el) return;
	var ul=el.querySelector("ul");
	var template=ul.querySelector("li#timezoneTemplate").cloneNode(true);
	clearNode(ul);
	ul.appendChild(template);
	var arr=[];
	for(var region in STXTimeZoneWidget.timezoneMenu){
		var cities=STXTimeZoneWidget.timezoneMenu[region];
		if(cities.length==0){
			arr.push(region);
		}else{
			for(var city=0;city<cities.length;city++){
				arr.push(region+"/"+cities[city]);
			}
		}
	}
	arr.sort();
	for(var i=0;i<arr.length;i++){
		var zone=arr[i];
		var li=template.cloneNode(true);
		li.style.display="block";
		li.onmousedown=STXScrollManager.start;
		li.innerHTML=zone;
		li.onmouseup=setTimezone(zone);
		ul.appendChild(li);
	}
	if(!STXTimeZoneWidget.iscroll){
		STXTimeZoneWidget.iscroll = new iScroll("timezoneDialogWrapper", {vScrollbar: true, hScroll:false, hideScrollbar: false});
	}else{
		STXTimeZoneWidget.iscroll.refresh();
	}
};

/*
 * Initialize the time zone manager with a prior saved timezone (initialTimeZone) and a callback
 * mechanism for saving the timezone.
 */
STXTimeZoneWidget.initialize=function(initialTimeZone, cb){
	if(initialTimeZone){
		STXTimeZoneWidget.setTimeZone(initialTimeZone);
	}
	STXTimeZoneWidget.storageCB=cb;
};


/*
 * STXStorageManager
 * 
 * A widget for saving and getting name value pairs. Uses browser localStorage by default but you can override
 * the get and store functions to save to a different data store.
 */
STXStorageManager=function(){};


STXStorageManager.get=function(key){
	if(!localStorage) return null;
	var datum=localStorage.getItem(key);
	return datum;
};

STXStorageManager.store=function(key, value){
	localStorage.setItem(key, value);	
};

STXStorageManager.callbacker=function(key){
	return function(value, stx){
		STXStorageManager.store(key, value);
	};
};

STXDrawingToolbar=function(){};

STXDrawingToolbar.initialize=function(){
	function setLineColor(){
		return function(color){
			STXChart.currentColor="#" + color;			
		};
	}
	function setFillColor(){
		return function(color){
			STXChart.currentFill="#" + color;			
		};
	}
	var toolbar=$$$(".stx-toolbar");
	var lineColorPicker=$$$(".stxLineColorPicker", toolbar);
	var fillColorPicker=$$$(".stxFillColorPicker", toolbar);
	STXChart.currentColor=lineColorPicker.style.backgroundColor;		
	STXChart.currentFill=fillColorPicker.style.backgroundColor;		
	
	STXMenuManager.attachColorPicker(lineColorPicker, toolbar, setLineColor());
	STXMenuManager.attachColorPicker(fillColorPicker, toolbar, setFillColor());
};

STXDrawingToolbar.configurator={
		".stxToolbarFill":{"line":false, "ray":false, "segment":false, "annotation": false, "horizontal":false, "fib retrace":false},
		".stxToolbarLine":{},
		".stxToolbarNone":{"line":false, "ray":false, "segment":false, "annotation": false, "horizontal":false, "fib retrace":false},
		".stxToolbarDotted":{},
		".stxToolbarDashed":{}
};

STXDrawingToolbar.setLine=function(width, pattern){	
	var className="stx-line stxLineDisplay weight" + width;
	STXChart.currentVectorParameters.lineWidth=width+.1;	// Use 1.1 instead of 1 to get good anti-aliasing on Android Chrome
	if(pattern=="solid"){
		STXChart.currentVectorParameters.pattern="solid";
		className+=" style1";
	}else if(pattern=="dotted"){
		STXChart.currentVectorParameters.pattern="dotted";
		className+=" style2";
	}else if(pattern=="dashed"){
		STXChart.currentVectorParameters.pattern="dashed";
		className+=" style2";
	}else if(pattern=="none"){
		STXChart.currentVectorParameters.pattern="none";
	}
	var display=$$$(".stx-toolbar .stxLineDisplay");
	if(display) display.className=className;
};

STXDrawingToolbar.setVectorType=function(stx,vectorType){
	if(vectorType==null || vectorType==""){	
		stx.changeVectorType("");
		for(var i in STXDrawingToolbar.configurator){
			var all=document.querySelectorAll(i);
			for(var j=0;j<all.length;j++){
				all[j].style.display="none";
			}
		}
		$$("toolSelection").innerHTML="Select Tool";
		return;
	}
	for(var i in STXDrawingToolbar.configurator){
		var all=document.querySelectorAll(i);
		for(var j=0;j<all.length;j++){
			if(STXDrawingToolbar.configurator[i][vectorType]==false){
				all[j].style.display="none";
			}else{
				all[j].style.display="";				
			}
		}
	}
	stx.changeVectorType(vectorType);
	var prettyDisplay=vectorType.capitalize();
	$$("toolSelection").innerHTML=prettyDisplay;
};

STXDrawingToolbar.crosshairs=function(stx, state){
	STXDrawingToolbar.setVectorType(stx, null);
	stx.layout.crosshair=state;
	if(state){
		$$("toolSelection").innerHTML="Crosshairs";
	}else{
		$$("toolSelection").innerHTML="Select Tool";		
	}
	stx.draw();
	stx.changeOccurred("layout");
	stx.doDisplayCrosshairs();
};

function runSampleUI(){
	STXThemeManager.builtInThemes={
			"Light":"stx-demo-theme-1.css",
			"Dark":"stx-demo-theme-2.css"
	};
	// Set up menu manager
	STXMenuManager.makeMenus();
	STXMenuManager.registerChart(stxx);
	
	// Set up lookup result widget using dummy data
	var sampleResults=[
	 {symbol:"S",description:"Sprint Corporation", exchange:"NYSE"},
	 {symbol:"SPY",description:"SPDR S&amplP 500 ETF", exchange:"NYSE"},
	 {symbol:"^GSPC",description:"SPDR S&amplP 500", exchange:""},
	 {symbol:"CSCO",description:"Cisco Systems, Inc.", exchange:"NASDAQ"},
	 {symbol:"SWKS",description:"Skyworks Solutions Inc.", exchange:"NASDAQ"},
	 {symbol:"GLD",description:"SPDR Gold Shares", exchange:"NYSE"},
	 {symbol:"WMT",description:"Wal-Mart Stores Inc.", exchange:"NYSE"},
	 {symbol:"SLV",description:"iShares Silver Trust", exchange:"NYSE"},
	 {symbol:"DDD",description:"3D Systems Corp.", exchange:"NYSE"},
	 {symbol:"GS",description:"The Goldman Sachs Group, Inc.", exchange:"NYSE"},
	 {symbol:"USDAUD",description:"US Dollar Australian Dollar", exchange:"FX"},
	 {symbol:"USDBRL",description:"US Dollar Brazilian Real", exchange:"FX"}
	 ];
	function textCallback(that, txt, filter){
		that.displayResults(sampleResults);
	}
	
	function selectCallback(that, txt){
		getYahooQuotes(txt);
	}
	
	var config={
		input: $$("symbol"),
		textCallback: textCallback,
		selectCallback: selectCallback,
		filters:["ALL","STOCKS","FOREX","INDEXES"]
	};
	stxLookupWidget=new STXLookupWidget(config);
	stxLookupWidget.init();
	
	STXThemeManager.setThemes(JSON.parse(STXStorageManager.get("themes")), stxx);
	STXThemeManager.themesToMenu($$("customThemeSelector"), $$("builtInThemeSelector"), stxx, STXStorageManager.callbacker("themes"));

	STXDrawingToolbar.initialize();
	STXDrawingToolbar.setVectorType(stxx, null);

	if(typeof(STXSocial)!="undefined"){
		$$("shareBtn").style.display="inline-block";
	}
	
	STXTimeZoneWidget.initialize(STXStorageManager.get("timezone"), STXStorageManager.callbacker("timezone"));
}





