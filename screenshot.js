var system = require('system');
var WebPage = require('webpage');
var page = WebPage.create();
var address = system.args[1];
var out = system.args[2];
page.viewportSize = {width: 700, height: 10000}
page.open(address);
page.onLoadFinished = function() {
	setTimeout(function(){
		page.render(out + '.png');
    	phantom.exit();
	}, 2000);   
}