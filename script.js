var gui = require('nw.gui');
var win = gui.Window.get();
win.showDevTools();
process.on('uncaughtException', function(err) {
	new Notification(err);
});
var fs = require('fs');
var editor;

win.on('loaded',function(){
	editor = ace.edit("editor");
    editor.setTheme("ace/theme/chaos");
    editor.getSession().setMode("ace/mode/c_cpp");
    fs.readFile('./basic_code.cpp', function (err, data) {
		if (err) console.log(err);
		console.log(data);
		editor.setValue(data.toString());
		editor.navigateLineEnd();
		editor.setShowInvisibles(true);
		editor.setShowPrintMargin(true);
		editor.setOptions({
			fontFamily:'Menlo,Monaco,Consolas',
			fontSize: "17px"
		});
	});
});