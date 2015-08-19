var gui = require('nw.gui');
var win = gui.Window.get(),
    nativeMenuBar = new gui.Menu({
        type: "menubar"
    });

// check operating system for the menu
if (process.platform === "darwin") {
    nativeMenuBar.createMacBuiltin("kami to pen");
    win.menu.items[0].click = function(){
		console.log('clicked');
	}
}

win.menu = nativeMenuBar;

win.showDevTools();
process.on('uncaughtException', function(err) {
	alert(err);
	throw new Error(err);
});
var fs = require('fs');
var soap = require('soap');

var soap_url = "http://ideone.com/api/1/service.wsdl";

var editor;
var stdin;
var stdout;

var obj;

var font_size = 14;

function createSubmission(callback){
	var args = {
		'user'			: obj.user,
		'pass'			: obj.pass,
		'sourceCode'	: editor.getSession().getDocument().getValue(),
		'language'		: 44,
		'input'			: stdin.getSession().getDocument().getValue(),
		'run'			: true,
		'private'		: true
	}
	soap.createClient(soap_url,function(err,client){
		client.createSubmission(args, function(err,result){
			callback(result);
//			callback(result.return.item[0].value['$value'],result.return.item[1].value['$value'])
		});
	});
}

function getSubmissionStatus(link,callback){
	var args = {
		'user'			: obj.user,
		'pass' 			: obj.pass,
		'link'			: link
	}
	soap.createClient(soap_url,function(err,client){
		client.getSubmissionStatus(args, function(err,result){
			callback(result);
		});
	});
}

function getSubmissionDetails(link,callback){
	var args = {
		'user'			: obj.user,
		'pass' 			: obj.pass,
		'link'			: link,
		'withSource'	: true,
		'withInput'		: true,
		'withOutput'	: true,
		'withStderr'	: true,
		'withCmpinfo'	: true, 
	}
	soap.createClient(soap_url,function(err,client){
		client.getSubmissionDetails(args, function(err,result){
			callback(result);
		});
	});
}

function changeStatus(text){
	$('#statusText').html(text + " | kami to pen");
}
function changeSubStatus(text,color){
	$('#statusSubText').html(text);
	if(color == undefined) color = "#8E8E8E";
	$('#statusSubText').css('color',color);
	new Notification(text);
}

function ideone(){
	changeSubStatus('preparing');
	var link;
	createSubmission(function(result){
		console.log(result);
		if(result.return.item[0].value['$value'] != "OK") return;
		$('#statusBar').animate({
			width:"50%"
		},3000,"easeOutCirc");
		changeSubStatus('submitted')
		link = result.return.item[1].value['$value'];
		changeStatus(link);
		function checkCompiled(){
			getSubmissionStatus(link,function(result) {
				console.log(result);
				err = result.return.item[0].value['$value'];
				stat = result.return.item[1].value['$value'];
				res = result.return.item[2].value['$value'];
				if(err == "OK"){
					if(stat < 0){
						changeSubStatus('waiting for compilation');
					} else if(stat == 0){//get the results
						$('#statusBar').animate({
							width:"100%"
						},100,"easeInSine",function(){
							setTimeout("$('#statusBar').css('width','0%')",100);
						});
						getSubmissionDetails(link,function(res){
							console.log(res);
							error		= res.return.item[0].value['$value'];
							langId		= res.return.item[1].value['$value'];
							langName	= res.return.item[2].value['$value'];
							langVersion	= res.return.item[3].value['$value'];
							time		= res.return.item[4].value['$value'];
							date		= res.return.item[5].value['$value'];
							status		= res.return.item[6].value['$value'];
							result		= res.return.item[7].value['$value'];
							memory		= res.return.item[8].value['$value'];
							signal		= res.return.item[9].value['$value'];
							public		= res.return.item[10].value['$value'];
							source		= res.return.item[11].value['$value'];
							input		= res.return.item[12].value['$value'];
							output		= res.return.item[13].value['$value'];
							stderr		= res.return.item[14].value['$value'];
							cmpinfo		= res.return.item[15].value['$value'];

							if(result == 0) changeSubStatus('not running');
							if(result == 11) changeSubStatus('compilation error','#DB0000');
							if(result == 12) changeSubStatus('runtime error','#DB0000');
							if(result == 13) changeSubStatus('time limit exceeded','#D6DB00');
							if(result == 15) changeSubStatus('success','#38DB00');
							if(result == 17) changeSubStatus('memory limit exceeded','#D6DB00');
							if(result == 19) changeSubStatus('illegal system call','#DB0000');
							if(result == 20) changeSubStatus('internal error','#DB0000');

							stdoutText = "";
							LE = stdout.getSession().getDocument().getNewLineCharacter();
							if(output !== undefined) stdoutText+="output:" + LE + output;
							if(stderr !== undefined) stdoutText+="stderr:" + LE + stderr;
							if(cmpinfo !== undefined) stdoutText+="compilation information:" + LE + cmpinfo;

							stdout.getSession().getDocument().setValue(stdoutText);
						});
						return;
					} else if(stat == 1){
						changeSubStatus('compilation');
					} else if(stat == 3){
						changeSubStatus('running');
					}
					setTimeout(checkCompiled,1000);
				} else {

				}
			});
		}
		checkCompiled();
	});
	/*function checkCompiled(){
		getSubmissionStatus(link);
	}*/
}

win.on('loaded',function(){
	obj = JSON.parse(fs.readFileSync("setting.json", 'utf8'))
	var isMaximum=false;
	$("#minimize").click(function(){
		win.minimize();
	});
	$("#maximize").click(function(){
		if(isMaximum){
			win.unmaximize();
		} else {
			win.maximize();
		}
		isMaximum=!isMaximum;
	});
	$("#exit").click(function(){
		//stream.close();
		win.close();
	});

	$('#ideone').click(function(){
		ideone();
	})

	editor = ace.edit("editor");
    editor.setTheme("ace/theme/chaos");
    editor.getSession().setMode("ace/mode/c_cpp");
    editor.getSession().setUseSoftTabs(false);
	setTimeout("editor.setShowPrintMargin(false)",100);
    fs.readFile('./basic_code.cpp', function (err, data) {
		if (err) console.log(err);
		console.log(data);
		editor.setValue(data.toString());
		editor.navigateLineEnd();
		editor.setShowInvisibles(true);
		editor.setShowPrintMargin(true);
		editor.setOptions({
			fontFamily:'Menlo,Monaco,Consolas',
			fontSize: font_size + "px"
		});
	});

	stdin = ace.edit("stdin");
	stdout = ace.edit("stdout");
	stdout.setReadOnly(true);


});

win.on('resize',function(){
	/*$('.toolbar').css('-webkit-app-region','no-drag');
	$('.toolbar').css('-webkit-app-region','drag');*/
});