var screenshot = '',
    // 截取区域
    cropAndPreview = function(crop) {
        var canvas = document.createElement('canvas'),
            context = canvas.getContext('2d');
            
            canvas.width = crop.width;
            canvas.height = crop.height;

        var img = new Image();
        img.onload = function() {
            context.drawImage(this, crop.x1, crop.y1, crop.width, crop.height, 0, 0, crop.width, crop.height);
            screenshot = canvas.toDataURL('image/png');
            window.open('preview.html');
            console.log(crop);
        };


        chrome.tabs.captureVisibleTab({format: 'png'}, function(res) {
            img.src = res;
        });
    },

    // 整张截图
    receiveMessage = function(data) {
        if(data && data.image) {
            if(Array.isArray(data.image)) {
                var canvas = document.createElement('canvas'),
                    context = canvas.getContext('2d'),
                    image,
                    done = 0;
                
                    canvas.width = data.width;
                    canvas.height = data.height;
                
                    
                for(var i = 0; i < data.image.length; i++) {
                    (function(i) {
                        image = new Image();
                        image.onload = function() {
                            context.drawImage(this, 0, data.image[i].position, this.width, this.height);
                            if(++done == data.image.length) {
                                screenshot = canvas.toDataURL('image/png');
                                window.open('preview.html');
                            }
                        }
                        image.src = data.image[i].image;
                    })(i);
                } 
            } else {
                screenshot = data.image;
                window.open('preview.html');
                return;
            }
        }
        
        if(data && data.crop) {
            // cropAndPreview(data.crop);
            cropAndPreview(data.crop);
        }
    };

    chrome.extension.onRequest.addListener(
      function(request, sender, sendResponse) {
        console.log(sender.tab ?
                    "from a content script:" + sender.tab.url :
                    "from the extension");
        if (request.greeting == "hello")
            // document.getElementById('test').style.display = 'none';
        chrome.tabs.captureVisibleTab({
            format:'png',
            quality:100
    },function(addr){
            sendResponse({pic: addr});
            console.log(addr);
    });
        else
          sendResponse({}); // snub them.
      });

    chrome.runtime.onMessage.addListener(receiveMessage);

