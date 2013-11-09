// -------------------------------------------------------------------------------------------
// Copyright 2012 by ChartIQ LLC
// -------------------------------------------------------------------------------------------


STXChart.drawingLine=false; // Toggles to true when a drawing is initiated
STXChart.resizingPanel=null; // Toggles to true when a panel is being resized
STXChart.vectorStartX=0;	// The X screen coordinate for the beginning of an active drawing
STXChart.vectorStartY=0;
STXChart.vectorEndX=0;
STXChart.vectorEndY=0;
STXChart.vectorType="";		// The type of drawing currently enabled "segment", "line", "ray", etc. See sample.html menu
STXChart.vectorDescriptor=null;	// The descriptor for the current drawing tool. Used primarily for extension of drawing capabilities.
STXChart.crosshairX=0;	// Current X screen coordinate of the crosshair
STXChart.crosshairY=0;
STXChart.insideChart=false;	// Toggles to true whenever the mouse cursor is within the chart. Only works with a single chart with mouse events managed at the document level.
STXChart.currentColor="#D73C28";	// Currently selected color for drawing tools. This may be changed by developing a menu with a color picker.
STXChart.currentFill="#D73C28";	// Currently selected fill for drawing shapes. This may be changed by developing a menu with a color picker.
STXChart.drawingDescriptors={};	// Library of currently registered drawing tools. Will be empty for standard tools.
STXChart.version="09-2013";
STXChart.currentVectorParameters={};
STXChart.defaultDisplayTimeZone=null;	// If set, then new STXChart objects will pull their display timezone from this

if(typeof $$=="undefined"){
	$$=function(node){
		return{};
	};
}
function STXChart(container){
	this.fibColors={	// Hard coded colors for fib lines
			"#0": ["#999999","#000000","#555555"],
			"#000000": ["#999999","#000000","#555555"],
			"#95C6": ["#6cc7e4","#19404d","#4c8a9e"],
			"#0095C6": ["#6cc7e4","#19404d","#4c8a9e"],
			"#A79387": ["#da9f7c","#574338","#b58c73"],
			"#A61C40": ["#d36481","#5d323d","#ec839f"],
			"#FE8A00": ["#daa667","#7a5529","#b19677"],
			"#2E4DA7": ["#809bea","#03113a","#909ec6"],
			"#7BB665": ["#8fe76e","#204c10","#95bb86"],
			"#D73C28": ["#daa667","#7a5529","#b19677"]
		};
	this.panels={};	// READ ONLY. An array of currently enabled panels
	this.overlays={};	// READ ONLY. An array of currently enabled overlay studies

	this.goneVertical=false;	// Used internally for pinching algorithm
	this.pinchingScreen=false;	// "
	this.grabbingScreen=false;	// Toggles to true when the screen is being panned
	this.grabStartX=0;			// Used internally for panning
	this.grabStartY=0;			// "
	this.grabStartScrollX=0;	// "
	this.grabStartScrollY=0;	// "
	this.grabStartCandleWidth=0;	// Used internally for zooming
	this.grabStartZoom=0;			// "
	this.grabOverrideClick=false;	// "
	this.vectorsShowing=false;		// Used internally to ensure that vectors aren't drawn more than once
	this.mouseMode=true;			// For Windows8 devices this is set to true or false depending on whether the last touch was a mouse click or touch event. To support all-in-one computers
	
	this.anyHighlighted=false;		// Toggles to true if any drawing or overlay is highlighted for deletion
	this.accessoryTimer=null;		// Used internally to speed drawing performance
	this.lastAccessoryUpdate=new Date().getTime();	// "
	this.displayCrosshairs=true;	// Use doDisplayCrosshairs() or undisplayCrosshairs()
	this.hrPanel=null;				// Current panel that mouse is hovering over
	this.annotationTA=null;			// Contains the textArea for a currently edited annotation
	this.editingAnnotation=false;	// True if an annotation is open for editing
	this.openDialog="";				// Set this to non-blank to disable chart touch and mouse events

	this.displayIconsUpDown=true;	// Set these to false to not display these components
	this.displayIconsSolo=true;
	this.displayIconsClose=true;
	this.displayPanelResize=true;
	this.manageTouchAndMouse=false;	// If true then the STXChart object will manage it's own touch and mouse events, by attaching them to the container div
	this.touches=[];
	this.changedTouched=[];
	this.yaxisWidth=40;

	this.pt={
		x1:-1,
		x2:-1,
		y1:-1,
		y2:-1
	};
	this.moveA=-1;	// Used internally for touch
	this.moveB=-1;	// "
	this.touchStartTime=-1;	// "
	this.cancelSwipe=false; // "
	this.momentumDistance=0; // "
	this.momentumTime=0; // "
	this.gestureStartDistance=-1; // "
	this.grabStartPeriodicity=1; // "
	this.grabEndPeriodicity=-1; // "
	this.scrollEvent=null; // "
	this.cmd=false; // "
	this.ctrl=false; // "
	this.shift=false; // "
	this.crosshairXOffset=-40;	// Offset for touch devices so that finger isn't blocking crosshair
	this.crosshairYOffset=-40;
	this.displayInitialized=false; // This gets set to true when the display has been initialized

	this.clicks={
		s1MS: -1,
		e1MS: -1,
		s2MS: -1,
		e2MS: -1
	};

	this.cancelTouchSingleClick=false; // Set this to true whenever a screen item is touched so as to avoid a chart touch event
	this.layout={	// Contains the current screen layout
		interval: "day",
		periodicity: 1,
		candleWidth: 8,	// In pixels
		volumeUnderlay: false,
		adj: true,	// Whether adjusted or nominal prices are being displayed
		chartType: "candle",
		studies: {},
		panels: {}
	};
	this.preferences={
		magnet: false
	};
	this.translationCallback=null;	// fc(english) should return a translated phrase given the English phrase. See separate translation file for list of phrases.
	this.locale=null;			// set this to the locale string to use when localizing charts. locale string should reference a loaded ECMA-402 Intl locale. Leaving null will use the default browser locale. Or call stx.setLocale(locale) to change the locale dynamically.
	this.dataZone=null;		// set by setTimeZone()
	this.displayZone=null;	// set by setTimeZone()
	this.timeZoneOffset=0;	// use setTimeZone() to compute this value
	this.changeCallback=null;	// fc(stxChart, change) where "change" is either "layout" or "vectors". Use this for storing chart configurations or drawings.
	this.masterData=null;		// Contains the historical quotes for the current chart
	this.transformDataSetPre=null;	// Use this to transform the data set previous to a createDataSet() event, such as change in periodicity
	this.transformDataSetPost=null;
	this.intradayDataCallback=null; // deprecated
	this.dataCallback=null;	// Used by setPeriodicityV2 which will call this if an interval is requested that it does not have
	this.dontRoll=false;	// Set this to true if server data comes as week or monthly and doesn't require rolling computation from daily
	this.chart={
			canvas: null,	// Contains the HTML5 canvas with the chart and drawings
			tempCanvas: null,	// lays on top of the canvas and is used when creating drawings
			symbol: null,		// Set this to the current symbol
			symbolDisplay: null,	// Set this for an alternate display on the chart label than symbol
			top: 0,			// Automatically detects screen location of the canvas
			left: 0,
			right: -1,
			height: null,	// Width of the chart, up to but not including the X axis
			width: null,	// Width of the chart, up to but not including the Y axis
			canvasHeight: null,	// Full height of the canvas
			canvasWidth: null,	// Full width of the canvas
			high: null,	// High value (price) for the chart
			low: null,	// Low value (price) for the chart
			shadow: null,	// High - Low
			multiplier: 0,	// Used to calculate Y-axis
			crossX: $$("crossX"),	// Reference to crosshair divs
			crossY: $$("crossY"),
			hr: $$("floatHR"),	// Reference to floating price div
			currentHR: $$("currentHR"),	// Reference to price div for current price
			mSticky: $$("mSticky"),		// Reference to label that appears on chart when you highlight an overlay or drawing
			annotationSave: $$("annotationSave"),	// Save annotation button
			annotationCancel: $$("annotationCancel"), // Cancel annotation button
			chartControls: $$("chartControls"),	// navigational controls for chart
			verticalTicks: null,	// Used internally for y-axis
			spacing: null,			// "
			priceTick: null,		// "
			scroll: 0,			// Currently number of ticks scrolled. Zero would theoretically be scrolled completely to the left.
			standStill: 0,		// Used internally
			maxTicks: 0,	// Horizontal number of chart ticks that currently fit in the canvas, based on candlewidth and spacing
			verticalScroll: 0, // Amount of vertical scroll
			dataSet: null,		// Contains the current complete data set, adjusted for periodicity and with calculated studies
			dataSegment: null,	// Contains the segment of the data set that is displayed on the screen
			xaxis:[],			// Contains data entries for the full xaxis. It is a superset of dataSegment
			zoom: 0,	// Vertical zoom
			memory: {	// Contains date, price, color of current drawings. Use this to save drawings between sessions.
				vectors: [],
				projection: []
			},
			hiddenVectors: null,	// Used internally to hide drawings
			volumeMax: 0,			// Contains the maximum volume displayed if a vchart is enabled
			decimalPlaces: 2,		// Maximum number of decimal places in data set. Computed automatically.
			roundit: 100,			// Computed automatically to round y-axis display
			container: container,
			beginHour:0,
			beginMinute:0,
			endHour:23,
			endMinute:59,
			minutesInSession:1440	// Auto calculated
		};
	this.styles={};					// Contains CSS styles used internally to render canvas elements
}

STXChart.DrawingDescriptor={
		"name": "",
		"render": null, /// function vector, color, context, highlight (boolean), temporary (boolean)
		"intersected": null	/// function vector, x, y, returns whether coordinates intersect the object
};

STXChart.prototype.prepend=function(o,n){
	STXChart.prototype["prepend"+o]=n;
};
STXChart.prototype.append=function(o,n){
	STXChart.prototype["append"+o]=n;
};
STXChart.registeredContainers=[];	// This will contain an array of all of the STX container objects
// Note that if you are dynamically destroying containers in the DOM you should delete them from this array when you do so

STXChart.handleContextMenu=function(e){ // This code prevents the browser context menu from popping up if you right click on a drawing or overlay
	if(!e) e=event;
	for(var i=0;i<STXChart.registeredContainers.length;i++){
		var stx=STXChart.registeredContainers[i].stx;
		if(stx){
			if(stx.anyHighlighted){
				if(e.preventDefault) e.preventDefault();
				return false;
			}
		}
	}
};

if(typeof exports!="undefined") exports.STXChart=STXChart;

if(typeof document!="undefined") document.oncontextmenu=STXChart.handleContextMenu;	// If you need to capture context menu events then override this, handle those events and then pass them to STXChart.handleContextMenu;

// Signatures of native methods that may be accessed using prepend and append extensions. Your function will receive
// the same arguments and "this" will be set to the current STXChart object.
/*

 Call this method to navigate to the latest tick on the chart. The chart will instantly be repositioned with the latest tick on the far right of the screen
STXChart.prototype.home=function();
 
 Call this method to create the X axis (date axis). The default implementation will calculate future dates based on STXMarket.nextPeriod(), STXMarket.nextDay(), and STXMarket.nextWeek()
 Those functions subsequently utilize the STXMarket.isHoliday() function. You can override the STXChart.hideDates() method to hide the dates but keep the grid lines. Use css
 styles stx_xaxis and stx_xaxis_dark to control colors and fonts for the dates. Use css styles stx_grid and stx_grid_dark to control the grid line colors. The dark styles are used
 when the grid changes to a major point such as the start of a new day on an intraday chart, or a new month on a daily chart.
STXChart.prototype.createXAxis=function(){
 
 Call this method to create the Y axis (price axis). Significant logic is incorporated into this function. Significant logic is incorporated into this function to ensure
 a usable grid regardless of price granularity or magnitude. Use css style stx_grid to manage colors of grid lines. Use stx_yaxis to control font and color of the yaxis text (prices).
 Note that this.chart.roundit will control the number of decimal places displayed. This is computed automatically when loading masterData but can be overriden if desired. A roundit
 value of 100 will create two decimal places. 10000 will create four decimal places.
STXChart.prototype.createYAxis=function(){
 
 This method dynamically generates the div tags that are the crosshairs. It utilizes the function createDIVBlock which automatically destroys div tags if they are recreated. If you
 override this function please note that it may be called over again and that destruction of any custom div tags should be handled (it is currently called with every draw operation!). Also, be sure to set onmousedown and onmouseup functions that call event.preventDefault() in order that mouse events are passed through to the chart and not held up on the div tags themselves, since by definition the crosshairs
 are always located underneath the mouse! this.chart.crossX and this.chart.crossY hold references to the divs.
STXChart.prototype.createCrosshairs=function(){
 
 This method creates a volume chart (not volume overlay) in a new panel. Volume charts are always panels called "vchart". If no volume exists then the chart will be watermarked with "Volume Not Available". Note that this.volbar() is the method that actually creates the volume bars. This method simply creates the panel and axis.
STXChart.prototype.createVolumeChart=function(quotes){
 
 This method initializes the display items for the chart. It is called with every draw() operation. The high and low values to display on the chart are calculated. Those values are subsequently used by createYAxis() which is called from within this method. This method also calls createCrosshairs().
STXChart.prototype.initializeDisplay=function(quotes){
 
 This method computes and fills in the value of the "hr" div, which is the div that floats along the Y axis with the current price for the crosshair. This is an appropriate place to inject an append method for drawing a head's up display if desired.
STXChart.prototype.headsUpHR=function(){
 
 This method is at the heart of the interactive portion of the application (note that touchmove() uses the same internal methods and logic). this.grabbingScreen can be checked to
 determine whether the user is holding the mousebutton or finger down (or two fingers when in crosshair mode). this.resizingPanel can be checked to determine whether the used
 is holding the handle to one of the panels. this.ctrl can be used to determine whether the user is effecting a resizing gesture rather than a panning gesture. The values this.chart.left, this.chart.right, this.chart.top and this.chart.bottom can be referenced to see if the event occurs within the chart borders. this.openDialog can be referenced to determine whether a dialog is currently open (and should override most functionality in here).
 
 Note that the default implementation of this functionality has some advanced logic involving timeouts in order to optimize display performance. The method this.headsUpHR() is called via timeouts rather than directly on mousemoves. On slow devices you may therefore see the hr div updating less frequently as events are dropped in order to maximize performance.
STXChart.prototype.mousemove=function(e){
 
 When a user initiates a drawing operation the crosshairs will change color (especially useful on tablet displays). This method is where that occurs. Use the css stx_crosshair and stx_crosshair_drawing to set the colors for crosshairs. Note that this.chart.crossX and this.chart.crossY contain references to the actual divs.
STXChart.prototype.setCrosshairColors=function(){
 
 This method is called whenever the system determines that crosshairs should be displayed (enabling crosshairs or a drawing tool and within the bounds of the chart). It simply changes the display for this.chart.crossX.style.display, this.chart.crossY.style.display and this.chart.hr.style.display. Add an append here if you need to display other elements along with crosshairs. You can check if this.chart.crossX is null in order to determine whether a chart exists (it will be null when the app is started and until a chart is first drawn).
STXChart.prototype.doDisplayCrosshairs=function(){
 
 This is the counter function to doDisplayCrosshairs()
STXChart.prototype.undisplayCrosshairs=function(){
 
 This method computes and displays the measurement pop up when a user highlights a drawing. sMeasure must be the id tag of that div. showMeasure contains the actual message. vectorTrashCan is the id of the trashcan icon itself. Note that depending on the user's device (web or touch) and the type of drawing, one, the other, or both of these divs will be displayed.
STXChart.prototype.setMeasure=function(price1, price2, tick1, tick2, hover){
 
 Call this method to abort the current drawing operation. By default this occurs when a tablet user double taps on the screen. You could for instance capture the "esc" key on
 a web system and call this function. This is also the appropriate spot to append generalized undo functionality if you wish to build a stack of drawing operations (by also intercepting createVector() )
STXChart.prototype.undo=function(){
 
 This method creates a vector (drawing). x0, x1, y0, y1 are the two point locations. Color can be either a hex color or a css reference. type should be one of "segment", "line", "ray", "fib retrace", "annotation". data is ancillary data required for the drawing, currently only containing the text of the annotation. Inject at this function in order to build a stack of drawings outside of the system, such as to implement a generalized undo system (or use the changeCallback to capture the state of this.chart.layout)
STXChart.prototype.createVector=function(x0, x1, y0, y1, color, type, data){
 
  This method actually draws the vector. It is called for every drawing for each drawing operation. It is also called when drawing temporary vectors. Vector should be a vector description (such as contained in this.chart.layout). context is optional, otherwise it will be the chart's html5 canvas context. highlight can optionally be set to inform the vector that it is to be drawn in highlighted state. temporary is set to indicate that the drawing should be drawn in temporary state (as when the user is in the process of drawing a tool).
STXChart.prototype.plotVector=function(vector, context, highlight, temporary){
 
 This method initiates most of the drawing operations (similar logic is incorporated in touchSingleClick and touchDoubleClick for touch devices). See mousemove for details that
 are useful for this method.
STXChart.prototype.mouseup=function(e){
 
 This method is called when a mouse is held down. It's primary function is to set this.grabbingScreen and initiate the grab variables that are used to calculate pan and zoom.
STXChart.prototype.mousedown=function(e){
 
 Call this method to change the periodicity of the chart. Period should be a numeric value. Interval should be one of "minute", "day", "week" or "month". Note that minute periodicities are currently not calculated automatically. See the main documentation for instructions on how to create and manage intraday data sets. setPeriodicity is called automatically when a touch user initiates a 3 finger swipe. Unlike most drawing operations, setPeriodicity() will force the creation of an entire new dataSet (this.createDataSet()). It is therefore a relatively expensive operation.
 (This function is deprecated, please use setPeriodicityV2)
STXChart.prototype.setPeriodicity=function(period, interval){

  Call this method to change the periodicity of the chart. Period should be a numeric value. Interval should be one of "day", "week", "month" or for intraday charts an integer representing the length of a bar. Unlike most drawing operations, setPeriodicityV2() will force the creation of an entire new dataSet (this.createDataSet()). It is therefore a relatively expensive operation.
  example setPeriodicityV2(1, "week"); // draw a weekly chart, assuming setMasterData has daily values
  example setPeriodicityV2(7, 3);	// draw a 21 minute chart, assuming setMasterData has 3 minute values
STXChart.prototype.setPeriodicityV2=function(period, interval){

 This method is called with each drawing operation to draw the vectors (drawings) on the screen. It will automatically adjust the dimensions of drawings if the user switches from adjusted to nominal prices (on daily charts). If this.chart.hiddenVectors is set to true then this method will be bypassed (so as to implement a "hide drawings" user interface function if desired).
STXChart.prototype.drawVectors=function(){
 
 
 This method computes a consolidated quote for periodicities greater than a single day. It is called from within createDataSet()
STXChart.prototype.consolidatedQuote=function(quotes, position, periodicity, interval){
 
 This method runs tick calculations for studies that use them (such as parabolic sar).
STXChart.prototype.runTicks=function(i, quotes){
 
 This method actually draws the chart. It calls this.candle(), this.bar(), this.drawLineChart(), this.volbar(), this.volUnderlay() and this.drawWaveChart() which are all internal functions. It also calls STXStudies.displayStudies(). Prepend or append functionality here if you need to supplement drawing operations.
STXChart.prototype.displayChart=function(quotes){
 
 This method is the complete draw oeration. It creates a new dataSegment (this.createDataSegment()), ensures that the chart hasn't been scrolled entirely off the screen by the user, draws the panels, axis, displays the chart and draws the vectos. Prepend or append as necessary to supplement drawing operations.
STXChart.prototype.draw=function(){
 
 This method calculates the appropriate positions of panels. Panel sizes are stored as a percentage of screen space. When the screen is resized, or a new panel is added or removed those dimensions must be recalculated along with the physical pixels that those dimensions represent. This method also adjusts the location of the "chartControls" div which contains the zoom buttons.
STXChart.prototype.adjustPanelPositions=function(){
 
 This method creates a new panel. It reduces the percentage of any existing panels proportionally. If no panels exist then it allocates 20% of the existing canvas for the first panel. Optionally, height in pixels can be passed in. name is the internal name of the panel and must match the study associated with the panel. display contains the test to display in the div label associated with that panel. Internally this method will call stackPanel() and adjustPanelPositions()
STXChart.prototype.createPanel=function(display, name, height){
 
 When building a display from scratch with known dimensions (such as when using a predefined view) use the stackPanel function. This method instantiates the div tabs that make up the "icons" (up, down, solo, close buttons and the label). iconsTemplate, handleTemplate and closeXTemplate must exist for this method to work.
STXChart.prototype.stackPanel=function(display, name, percent){
 
 This method draws the panels and repositions the associated icons. It is called by draw()
STXChart.prototype.drawPanels=function(){
 
 This method is called whenever a touch user taps the screen once. It essentially performs the same operations as mouseup()
STXChart.prototype.touchSingleClick=function(finger, x, y){
 
 This method is called whenever a touch user taps the screen twice (double click). It essentially performs the same operations as a mouse right click (delete drawing) and also performs a vertical alignment and home operation depending on the user state.
STXChart.prototype.touchDoubleClick=function(finger, x, y){
 
 This method is called whenever a user moves their finger. This event must be registered by the main html page and associated with the window, document or body. Internal calculations for the charting engine are performed based on screen coordinates rather than coordinates of the canvas itself. Single finger moves will either pan or move the crosshair. Double finger moves will pan or zoom. Three finger moves will change periodicity.
STXChart.prototype.touchmove=function(e){
 
 This method is called whenever a user touches the screen. It must also be registered in the main html page. Internal timeout logic is used to subsequently call touchSingleClick() or touchDoubleClick()
STXChart.prototype.touchstart=function(e){
 
 This method is called whenever a user untouches the screen. It must also be registered in the main html page. Internal logic calculates inertia moves (swipe) based on move length and time.
STXChart.prototype.touchend=function(e){
 
 This method is used to create a new data set from the masterData. It calls the study calculateFN functions and consolidates quotes if periodicity is greater than 1 day. The results are stored in chart.dataSet (as opposed to chart.dataSegment which is called during each draw() operation and contains the data represented within the current viewport).
STXChart.prototype.createDataSet=function(){

 This method draws the floating current price. It is always the current price, not the current displayed price if the chart is scrolled backward.
 stx_current_hr_up and stx_current_hr_down are used to color the price depending on whether the most recent change is up or down from the previous tick
STXChart.prototype.drawCurrentHR=function(){

appendQuotes is an array of quotes in the same format as setMasterData. The kernel will append quotes to the end of the masterData. If the first
quote has the same date/time as the existing final quote of masterData then it will be replaced rather than appended. Note that this function will
call createDataSet() and draw() automatically.
STXChart.prototype.appendMasterData(appendQuotes)


 Non injectable methods:
 STXChart.prototype.zoomIn() - Zoom in. Decreases this.chart.layout.candleWidth
 STXChart.prototype.zoomOut()
 STXChart.prototype.watermark(panel, h, v, text) - Creates a watermark on the desired panel. h should be "left" or "center". v should be "top" or "bottom". stx_watermark controls the font.
 STXChart.prototype.rawWatermark(context, x, y, text) - Creates a watermark on the canvas. Pass this.chart.context in.
 STXChart.prototype.resizePanels() - Called internally when dragging a panel resize handle.
 STXChart.prototype.panelDown(panel) - Pass in a reference to the actual panel, not the name of the panel
 STXChart.prototype.panelUp(panel)
 STXChart.prototype.panelSolo(panel)
 STXChart.prototype.panelClose(panel)
 STXChart.prototype.resolveY(y) - provides the absolute screen Y location given the Y location in the canvas element
 STXChart.prototype.backOutY(y) - provides the Y location within the canvas given an absolute screen position
 STXChart.prototype.backOutX(x)
 STXChart.prototype.hideCrosshairs() - Hides crosshairs but does not delete them
 STXChart.prototype.showCrosshairs() - Shows crosshairs when hidden
 STXChart.prototype.deleteHighlighted() - Deletes any highlighted drawings or overlays
 STXChart.prototype.initializeChart() - Initializes a chart by creating a canvas, temp canvas for drawings, and setting initial event captures
 STXChart.prototype.setMasterData(masterData) - Initializes the chart with master data (see main documentation)
 STXChart.prototype.resizeChart() - Resizes the chart and panels.
 STXChart.prototype.resizeCanvas() - Resizes the canvas itself to the size of the container.
 STXChart.prototype.deleteVector(vector) - Deletes a drawing
 STXChart.prototype.correctIfOffEdge() - Will pull the chart back onto the screen if the user has scrolled off. Called automatically by draw()
 STXChart.prototype.createDataSegment() - Creates a new data segment for the current viewport window based on this.chart.scroll and this.chart.maxTicks
 STXChart.prototype.removeOverlay(name) - Removes the named overlay
 STXChart.prototype.plotLine(x0, x1, y0, y1, color, type, context, confineToChart) - Draws a segment, ray or line. Color may be hex or a css canvasFont() object
 STXChart.prototype.constructVector(x0, x1, y0, y1, color, type, data) - Construct a vector object given the values. Automatically increases "gain" so that vectors appear accurate across daily and intraday charts
 STXChart.prototype.pixelFromPrice(price)
 STXChart.prototype.priceFromPixel(y)
 STXChart.prototype.pixelFromTick(tick) - tick is the absolute tick from the dataSet (not the dataSegment)
 STXChart.prototype.tickFromPixel(x) - Pixel may be off screen
 STXChart.prototype.highlightVector(vector)
 STXChart.prototype.unhighlightVector(vector)
 STXChart.prototype.displaySticky(message) - Displays the text in a "sticky" div near the mouse. Set message to null to delete.
 STXChart.prototype.computeLength(high, low) - Returns the length in pixels for a given price differential
 STXChart.prototype.computePosition(x, offset) - Returns the pixel location given the tick. Optionally offset left or right pixels with position or negative value.
 STXChart.prototype.tickFromDate(dt) - Returns the tick given a date (date should be in text format, not a javascript Date object)
 STXChart.prototype.dateFromTick(tick) - Returns the date in yyyymmddhhmm text format
 STXChart.prototype.clearDrawings() - Clears all drawings
 STXChart.prototype.setAdjusted(boolean) - Use to switch between adjusted and nominal prices (assuming they have been set in masterData)
 STXChart.prototype.setChartType(value) - "line", "candle", "bar", "wave"
 STXChart.prototype.hideDates() - Override with function that returns true to hide dates in x axis
 STXChart.prototype.getCanvasColor(className) - Gets a hex color given a css class
 STXChart.prototype.getCanvasFontSize(className) - Gets font size in pixels given a css class name (without "px" attached)
 STXChart.prototype.canvasColor(className, context) - Sets color, width, globalAlpha (opacity) for the canvas given a css class name
 STXChart.prototype.canvasFont(className, context) - Sets canvas font context given a css class name
 STXChart.prototype.canvasStyle(className) - Returns an object containing the class style given a css class name (used by plotLine() for instance)
 STXChart.prototype.setRange(dtLeft, dtRight, padding) - Automatically adjusts the tick and candlewidth to fit the date range on the screen. Does nothing if the date range is not in the dataSet. If dtRight is left out then it will include the entire chart from dtLeft until present
 														The chart will automatically be offset padding number of ticks from the right hand side of the screen if dtRight is null (to create white space for current tick)
 STXChart.prototype.setSpan(period, interval, padding) - Will automatically set the chart to a length of time. interval should be one of "year","month","week","day","hour","minute". Period should be a number greater than or equal to 1. 
*/

