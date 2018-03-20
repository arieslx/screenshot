var visible = document.getElementById('visible');
var region = document.getElementById('region');

visible.onclick = function() {
	chrome.tabs.captureVisibleTab({
		format : 'png',
		quality : 100

	},function(res){
		chrome.runtime.sendMessage({image : res },function(){});
	});
}

region.onclick = function() {
	chrome.tabs.executeScript({
	    'file': 'asset/js/region.inject.js',
	    'runAt': 'document_idle'
	});
	window.close();
}


