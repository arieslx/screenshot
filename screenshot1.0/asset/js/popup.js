var visible = document.getElementById('visible');
var region = document.getElementById('region');

visible.onclick = function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.captureVisibleTab({
            format : 'png',
            quality : 100
        }, function(res){
            chrome.runtime.sendMessage({image : res }, function(){});
        });
    });
}

region.onclick = function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            files: ['asset/js/region.inject.js']
        });
        window.close();
    });
}