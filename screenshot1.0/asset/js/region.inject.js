(function() {
    var div = document.createElement('div'),
        src = chrome.extension.getURL('region.html'),
        clear = function() {
            var els = document.getElementsByClassName("ScreenshotInjectFrameOverlay");
            for(var i = 0; i<els.length; i++) {
                document.body.removeChild(els[i]);
            }
        }
        clear();
    div.innerHTML = '<iframe class="ScreenshotInjectFrameOverlay" src="' + src + '" style="width: 100%; height: 100%; margin: 0px; padding: 0px; display: block; position: fixed; top: 0px; left: 0px; background-color: transparent; z-index: 2147483647; box-sizing: border-box;" />';
    var iframe = div.childNodes[0];
    document.body.appendChild(iframe);
    var receiveMessage = function(message) {
        if(message && message.data == 'removeRegion') {
            clear();
        }
    };
    window.addEventListener("message", receiveMessage, false);
})();