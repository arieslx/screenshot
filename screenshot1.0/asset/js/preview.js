// Access background page using chrome.runtime API instead of deprecated chrome.extension
let screenshot = '';

// Wait for the DOM to be loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPreview);
} else {
    initPreview();
}

function initPreview() {
    // 从chrome.storage获取截图而不是从background页面
    chrome.storage.local.get(['screenshot'], function(result) {
        if (result.screenshot) {
            screenshot = result.screenshot;
            
            // 创建承载的img标签
            const img = document.createElement("img");
            img.src = result.screenshot;
            img.id = "blur";
            img.style.maxWidth = "100%";
            img.style.height = "auto";
            
            // 添加到页面
            document.body.appendChild(img);
        } else {
            // Fallback: Try to create a basic error message
            const errorMsg = document.createElement("p");
            errorMsg.textContent = "Failed to load screenshot. Please try again.";
            document.body.appendChild(errorMsg);
        }
    });
}

// 移除重复的图像处理逻辑，避免显示两张图片
// 只在DOMContentLoaded事件中处理图像显示

// Fixed function - now properly returns the screenshot from storage
const getMerged = function () {
    // 从storage中获取图像数据
    return new Promise((resolve) => {
        chrome.storage.local.get(['screenshot'], function(result) {
            if (result.screenshot) {
                resolve(result.screenshot);
            } else {
                resolve(null);
            }
        });
    });
};