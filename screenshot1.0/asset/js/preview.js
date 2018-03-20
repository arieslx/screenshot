var ext = chrome.extension.getBackgroundPage();
if (ext.screenshot) {
	// 创建承载的img标签
	var blurImage = document.createElement('img');
	blurImage.setAttribute('src',ext.screenshot);
	blurImage.setAttribute('id','blur');
	// document.body.appendChild(img);body可能还是空的
	if(window.addEventListener) window.addEventListener("load", function() { document.body.appendChild(img); }, false); else window.attachEvent("onload", function() { document.body.appendChild(img); }); }

	var canvas = document.createElement('canvas');
	//有点问题
	canvas.setAttribute('id','screenshot');
	context = canvas.getContext('2d');
	img = new Image();
	// stored = false;
	getMerged =function() {
		var mergeCanvas = document.createElement('canvas'),
		    mergeContext = mergeCanvas.getContext('2d');
		    
		    mergeCanvas.width = canvas[0].width;
		    mergeCanvas.height = canvas[0].height;
		    
		    mergeContext.drawImage(img, 0, 0);
		    mergeContext.drawImage(canvas[0], 0, 0);
		
		return mergeCanvas.toDataURL();
	}

	img.onload = function() {
	    if(this.width < window.innerWidth - 100) {
	        var canvas1 = document.createElement('canvas');
	        canvas1.style.margintop = 100;

	    }
	    canvas1.setAttribute({
	    	width : this.width,
	    	height : this.height
	    })
	    canvas1.style.backgroundimage = "url(" + ext.screenshot + ")";
	    document.body.appendChild(canvas);
	    canvas.sketch();
	}
	img.src = ext.screenshot;
	