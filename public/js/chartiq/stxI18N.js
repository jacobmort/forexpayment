// Be sure your webserver is set to deliver UTF-8 charset
// For apache add "AddDefaultCharset UTF-8" to httpd.conf
// otherwise use \u unicode escapes for non-ascii characters

var stxWordList={
	"bars":"barren",
	"----General study inputs----":"",
	"Period":"Zeitraum",
	"Field":"Feld",
	"Type":"Typ",
	"----Moving average types ----":"",
	"Simple":"Einfach",
	"Exponential":"Exponentiellen",
	"Time Series":"Zeitreihen",
	"Triangular":"Dreieckigen",
	"Variable":"Variable",
	"Weighted":"Gewichteter",
	"Wells Wilder":"Wells Wilder",
	"----- MA lowercase -----":"",
	"simple":"einfach",
	"exponential":"exponentiellen",
	"time series":"zeitreihen",
	"triangular":"dreieckigen",
	"variable":"variable",
	"weighted":"gewichteter",
	"wells wilder":"wells wilder",
	"----Study outputs and inputs ----":"copy from stxStudies.js studyLibrary",
	"MA":"GD",
	"Close":"Schluss",
	"Open":"Eröffnen",
	"High":"Hoch",
	"Low":"Tief",
	"Volume":"Volumen",
	"Adj_Close":"Adj_Schluss",
	"Fast MA Period":"Schnelle GD-Zeitraum",
	"Slow MA Period":"Langsame GD-Zeitraum",
	"Signal Period":"Signalperiode",
	"----- Study names -----":"copy from stxStudies.js studyLibrary",
	"ma":"gd",
	"rsi":"rsi"
};


function stxTranslate(wordList){
	return function stxTranslate(english){
		var translated=wordList[english];
		if(translated) return translated;
		return english;
	};
}