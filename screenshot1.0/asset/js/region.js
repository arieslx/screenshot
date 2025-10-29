// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Region selection DOM loaded");
    
    var mask = document.getElementById("test"); //定义蒙版
    var cropArea = document.getElementById("test1"); //定义裁剪框

    //定义裁剪框周围四个被剪去的区域
    var Top = document.getElementById("screenTop");
    var Bot = document.getElementById("screenBottom");
    var Rig = document.getElementById("screenRight");
    var Lef = document.getElementById("screenLeft");

    console.log("Elements found:", {mask, cropArea, Top, Bot, Rig, Lef});

    //定义mousedown落点左上角leftTop，mouseup复原点右下角rightBottom
    var leftTop = {};
    var rightBottom = {};

    //定义蒙版包括边框在内盒子的长和高
    var mh = mask ? mask.offsetHeight : 0;
    var mw = mask ? mask.offsetWidth : 0;

    console.log("Mask dimensions:", {mh, mw});

    //裁剪区域的宽和高
    var cw, ch;

    var crop;
    var originalImage = null;

    // 获取原始截图
    chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
        // 使用更安全的方式检查错误
        if (chrome.runtime.lastError) {
            console.error("Error getting original image:", 
                typeof chrome.runtime.lastError === 'string' ? 
                chrome.runtime.lastError : 
                (chrome.runtime.lastError.message || JSON.stringify(chrome.runtime.lastError)));
            return;
        }
        
        console.log("Received response for original image:", response);
        if (response && response.pic) {
            originalImage = response.pic;
            console.log("Original image received");
        } else {
            console.error("Failed to receive original image");
        }
    });
    
    // 监听来自background的消息
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        console.log("Message received in content script:", request);
        
        if (request.action === "cropImage" && request.crop && request.originalImage) {
            console.log("Cropping image in content script");
            cropImageInContent(request.crop, request.originalImage, sendResponse);
            return true; // 保持消息通道开放以进行异步响应
        }
    });

    // 在content script中裁剪图像
    function cropImageInContent(crop, originalImage, sendResponse) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = crop.width;
        canvas.height = crop.height;

        const img = new Image();
        img.onload = function() {
            // 在原始图像上根据crop参数裁剪出指定区域
            context.drawImage(
                this,               // 源图像（原始截图）
                crop.x1,            // 源图像中要裁剪区域的左上角x坐标
                crop.y1,            // 源图像中要裁剪区域的左上角y坐标
                crop.width,         // 源图像中要裁剪区域的宽度
                crop.height,        // 源图像中要裁剪区域的高度
                0,                  // 目标画布上放置图像的左上角x坐标
                0,                  // 目标画布上放置图像的左上角y坐标
                crop.width,         // 目标画布上图像的宽度
                crop.height         // 目标画布上图像的高度
            );
            const screenshot = canvas.toDataURL('image/png');
            console.log("Image cropped in content script");
            sendResponse({screenshot: screenshot});
        };
        
        img.onerror = function(e) {
            console.error("Failed to load image for cropping in content script:", e);
            sendResponse({error: "Failed to load image"});
        };
        
        img.src = originalImage;
    }

    // 创建4个遮盖
    function createMasks(leftTop, rightBottom) {
        if (!mw || !mh) return;
        
        var topHeight = leftTop.y;
        var topWidth = mw;
        if (Top) {
            Top.style.width = topWidth + "px";
            Top.style.height = topHeight + "px";
        }

        var leftHeight = mh - leftTop.y;
        var leftWidth = leftTop.x;
        if (Lef) {
            Lef.style.width = leftWidth + "px";
            Lef.style.height = leftHeight + "px";
            Lef.style.top = leftTop.y + "px";
            Lef.style.left = 0 + "px";
        }

        var bottomHeight = mh - rightBottom.y;
        var bottomWidth = mw - leftTop.x;
        if (Bot) {
            Bot.style.width = bottomWidth + "px";
            Bot.style.height = bottomHeight + "px";
            Bot.style.bottom = 0 + "px";
            Bot.style.left = leftTop.x + "px";
        }

        var rightHeight = rightBottom.y - leftTop.y;
        var rightWidth = mw - rightBottom.x;
        if (Rig) {
            Rig.style.width = rightWidth + "px";
            Rig.style.height = rightHeight + "px";
            Rig.style.right = 0 + "px";
            Rig.style.top = topHeight + "px";
        }
    };

    //选取截取位置，定义起点
    var start = {
      x: 0,
      y: 0,
    };

    var mousedown = false;

    if (mask) {
        mask.onmousedown = function (event) {
          console.log("MouseDown event triggered");
          if (
            !cropArea.style.width ||
            parseInt(cropArea.style.width) <= 0 ||
            !cropArea.style.height ||
            parseInt(cropArea.style.height) <= 0
          ) {
            var x = event.pageX;
            var y = event.pageY;
            start.x = x;
            start.y = y;

            cropArea.style.left = x + "px";
            cropArea.style.top = y + "px";

            cropArea.style.height = 0 + "px";
            cropArea.style.width = 0 + "px";
            cropArea.style.display = "block";

            mousedown = true;
            console.log("Started selection at:", {x, y});
          } else {
            mousedown = false;
          }

          event.preventDefault();
        };
    }

    document.body.onmousemove = function (event) {
      if (mousedown) {
        var x = event.pageX;
        var y = event.pageY;

        // 更新leftTop坐标
        if (start.x <= x && start.y <= y) {
          leftTop.x = start.x;
          leftTop.y = start.y;
        } else if (start.x <= x && start.y >= y) {
          leftTop.x = start.x;
          leftTop.y = y;
        } else if (start.x >= x && start.y >= y) {
          leftTop.x = x;
          leftTop.y = y;
        } else if (start.x >= x && start.y <= y) {
          leftTop.x = x;
          leftTop.y = start.y;
        }

        // 更新rightBottom坐标
        if (start.x <= x && start.y <= y) {
          rightBottom.x = x;
          rightBottom.y = y;
        } else if (start.x <= x && start.y >= y) {
          rightBottom.x = x;
          rightBottom.y = start.y;
        } else if (start.x >= x && start.y >= y) {
          rightBottom.x = start.x;
          rightBottom.y = start.y;
        } else if (start.x >= x && start.y <= y) {
          rightBottom.x = start.x;
          rightBottom.y = y;
        }

        var diffY = Math.abs(rightBottom.y - leftTop.y);
        var diffX = Math.abs(rightBottom.x - leftTop.x);

        if (cropArea) {
            cropArea.style.width = diffX + "px";
            cropArea.style.height = diffY + "px";
            cropArea.style.left = leftTop.x + "px";
            cropArea.style.top = leftTop.y + "px";
        }

        createMasks(leftTop, rightBottom);

        ch = diffY;
        cw = diffX;

        // 设置crop对象用于发送消息
        crop = {
          x1: leftTop.x,
          y1: leftTop.y,
          width: diffX,
          height: diffY,
        };
        
        console.log("Selection updated:", crop);
      }

      event.preventDefault();
    };

    document.body.onmouseup = function (event) {
      if (mousedown) {
          console.log("MouseUp event triggered, selection complete");
      }
      mousedown = false;
      start.x = 0;
      start.y = 0;

      event.preventDefault();
    };

    // 选中之后的点击事件
    var choose = document.getElementById("choose");
    if (choose) {
        choose.onclick = function () {
          console.log("Choose button clicked");
          console.log("Crop data:", crop);
          console.log("Original image:", originalImage);
          
          // 验证裁剪数据是否有效
          if (!crop || crop.width <= 0 || crop.height <= 0) {
              console.error("Invalid crop data");
              return;
          }
          
          // 验证原始图像是否存在
          if (!originalImage) {
              console.error("Original image not available");
              return;
          }
          
          if (cropArea) {
              cropArea.style.border = "none";
          }
          
          // 移除可能存在的cropArea图像
          var existingCropArea = document.getElementById("cropArea");
          if (existingCropArea) {
              document.body.removeChild(existingCropArea);
          }
          
          // 创建临时canvas用于裁剪图像
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          canvas.width = crop.width;
          canvas.height = crop.height;

          const img = new Image();
          img.onload = function() {
            // 在原始图像上根据crop参数裁剪出指定区域
            context.drawImage(
                this,
                crop.x1,
                crop.y1,
                crop.width,
                crop.height,
                0,
                0,
                crop.width,
                crop.height
            );
            
            // 获取裁剪后的图像数据
            const croppedImageData = canvas.toDataURL('image/png');
            
            // 发送到background script以在preview页面显示
            chrome.runtime.sendMessage({
                croppedImage: croppedImageData
            }, function(response) {
                // 使用更安全的方式检查错误
                if (chrome.runtime.lastError) {
                    console.error("Error sending message to background:", 
                        typeof chrome.runtime.lastError === 'string' ? 
                        chrome.runtime.lastError : 
                        (chrome.runtime.lastError.message || JSON.stringify(chrome.runtime.lastError)));
                    return;
                }
                console.log("Message sent to background, response:", response);
            });
            
            // 移除选择区域界面
            if (parent) {
                parent.postMessage("removeRegion", "*");
            }
          };
          
          img.src = originalImage;
        };
    } else {
        console.error("Choose button not found");
    }

    var cancel = document.getElementById("cancel");
    if (cancel) {
        cancel.onclick = function () {
          console.log("Cancel button clicked");
          
          if (parent) {
            parent.postMessage("removeRegion", "*");
          }
        };
    } else {
        console.error("Cancel button not found");
    }
});