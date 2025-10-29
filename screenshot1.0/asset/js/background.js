// 截取区域
const cropAndPreview = function(crop, originalImage) {
    console.log("cropAndPreview called with:", {crop, originalImage});
    
    // 确保裁剪区域有效
    if (!crop || crop.width <= 0 || crop.height <= 0) {
        console.error("Invalid crop dimensions");
        return;
    }

    // 在Service Worker中不能使用Image对象，需要通过content script处理
    console.log("Sending crop data to content script for processing");
    processCropInContentScript(crop, originalImage);
};

// 将图像裁剪处理转发到content script的方法
const processCropInContentScript = function(crop, originalImage) {
    console.log("Processing crop in content script");
    // 这个方法需要在content script中实现相应的处理逻辑
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // 确保tabs数组不为空
        if (!tabs || tabs.length === 0) {
            console.error("No active tab found");
            return;
        }
        
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "cropImage", 
            crop: crop, 
            originalImage: originalImage
        }, function(response) {
            // 使用更安全的方式检查错误
            if (chrome.runtime.lastError) {
                console.error("Error sending message to content script:", 
                    typeof chrome.runtime.lastError === 'string' ? 
                    chrome.runtime.lastError : 
                    (chrome.runtime.lastError.message || JSON.stringify(chrome.runtime.lastError)));
                return;
            }
            
            if (response && response.screenshot) {
                console.log("Received cropped image from content script");
                chrome.storage.local.set({screenshot: response.screenshot}, function() {
                    chrome.tabs.create({url: chrome.runtime.getURL('preview.html')});
                });
            } else {
                console.error("Invalid response from content script");
            }
        });
    });
};

// 整张截图
const receiveMessage = function(data) {
    console.log("receiveMessage called with:", data);
    
    if(data && data.image) {
        if(Array.isArray(data.image)) {
            // 在Service Worker中创建canvas
            const canvas = new OffscreenCanvas(data.width, data.height);
            const context = canvas.getContext('2d');
            let image;
            let done = 0;
            
            for(let i = 0; i < data.image.length; i++) {
                (function(i) {
                    // 在Service Worker中不能使用Image对象，改用fetch获取图像
                    fetch(data.image[i].image)
                        .then(response => response.blob())
                        .then(blob => createImageBitmap(blob))
                        .then(bitmap => {
                            context.drawImage(bitmap, 0, data.image[i].position);
                            if(++done == data.image.length) {
                                canvas.convertToBlob({type: 'image/png'}).then(blob => {
                                    const reader = new FileReader();
                                    reader.onload = function() {
                                        const screenshot = reader.result;
                                        // 使用chrome.storage存储截图
                                        chrome.storage.local.set({screenshot: screenshot}, function() {
                                            chrome.tabs.create({url: chrome.runtime.getURL('preview.html')});
                                        });
                                    };
                                    reader.readAsDataURL(blob);
                                });
                            }
                        })
                        .catch(e => {
                            console.error("Error loading image:", e);
                        });
                })(i);
            } 
        } else {
            // 使用chrome.storage存储截图
            chrome.storage.local.set({screenshot: data.image}, function() {
                chrome.tabs.create({url: chrome.runtime.getURL('preview.html')});
            });
            return;
        }
    }
    
    // 处理裁剪后的图像
    if(data && data.croppedImage) {
        console.log("Processing cropped image");
        // 直接存储裁剪后的图像并打开preview页面
        chrome.storage.local.set({screenshot: data.croppedImage}, function() {
            chrome.tabs.create({url: chrome.runtime.getURL('preview.html')});
        });
    }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received:", request, "from", sender);
    
    if (request.greeting == "hello") {
        console.log("Received greeting request");
        chrome.tabs.captureVisibleTab({
            format:'png',
            quality:100
        }, function(addr){
            console.log("Sending screenshot response");
            sendResponse({pic: addr});
            console.log("Sent screenshot for region selection");
        });
        return true; // Keep the message channel open for async response
    }
    
    // Handle the image data sent from popup.js
    if (request.image) {
        console.log("Handling full image");
        // 使用chrome.storage存储截图
        chrome.storage.local.set({screenshot: request.image}, function() {
            chrome.tabs.create({url: chrome.runtime.getURL('preview.html')});
        });
    }
    
    // Handle cropped image data
    if (request.croppedImage) {
        console.log("Received cropped image data");
        // 直接存储裁剪后的图像并打开preview页面
        chrome.storage.local.set({screenshot: request.croppedImage}, function() {
            chrome.tabs.create({url: chrome.runtime.getURL('preview.html')});
        });
    }
    
    // Always send a response
    sendResponse({status: "received"});
});