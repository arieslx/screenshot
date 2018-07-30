var mask = document.getElementById('test'); //定义蒙版
var cropArea = document.getElementById('test1'); //定义裁剪框

//定义裁剪框周围四个被剪去的区域
var Top = document.getElementById('screenTop');
var Bot = document.getElementById('screenBottom');
var Rig = document.getElementById('screenRight');
var Lef = document.getElementById('screenLeft');

//定义mousedown落点左上角leftTop，mouseup复原点右下角rightBottom
var leftTop ={};
var rightBottom ={};

//定义蒙版包括边框在内盒子的长和高
var mh = mask.offsetHeight;
var mw = mask.offsetWidth;

//裁剪区域的宽和高
var cw,ch;

var crop;
            

// 创建4个遮盖
function createMasks(leftTop, rightBottom) {
    var topHeight = leftTop.y;
    var topWidth = mw;
    Top.style.width = topWidth + 'px';
    Top.style.height = topHeight + 'px';

    var leftHeight = mh - leftTop.y;
    var leftWidth = leftTop.x;
    Lef.style.width = leftWidth + 'px';
    Lef.style.height = leftHeight + 'px';
    Lef.style.top = leftTop.y +'px';
    Lef.style.left = 0 + 'px';

    var bottomHeight = mh - rightBottom.y;
    var bottomWidth = mw - leftTop.x;
    Bot.style.width = bottomWidth + 'px';
    Bot.style.height = bottomHeight + 'px';
    Bot.style.bottom = 0 + 'px';
    Bot.style.left = leftTop.x + 'px';

    var rightHeight = rightBottom.y - leftTop.y;
    var rightWidth = mw - rightBottom.x;
    Rig.style.width = rightWidth + 'px';
    Rig.style.height = rightHeight + 'px';
    Rig.style.right = 0 + 'px';
    Rig.style.top = topHeight + 'px';

};



	//选取截取位置，定义起点
	var start = {
		x: 0,
		y: 0
	};

	var mousedown = false;

mask.onmousedown = function(event){
   
    if (cropArea.style.width <= 0 || cropArea.style.height <= 0) {
        x = event.pageX;
        y = event.pageY;
        start.x = x;
        start.y = y;

        cropArea.style.left = x + 'px';
        cropArea.style.top  = y + 'px';

        cropArea.style.height = 0 + 'px';
        cropArea.style.width = 0 + 'px'; 
        cropArea.style.display = 'block'; 
        
        mousedown = true;
    }

    else{
        mousedown = false;
    }
};


document.body.onmousemove = function(event){

        if (mousedown) {
        var x = event.pageX;
        var y = event.pageY;

        if (start.x < x && start.y < y) {
            leftTop.x = start.x;
            leftTop.y = start.y;
            cropArea.style.left = leftTop.x + 'px';
            cropArea.style.top = leftTop.y + 'px';
        }
        else if (start.x < x && start.y > y) {
            leftTop.x = start.x;
            leftTop.y = y;
            cropArea.style.left = leftTop.x + 'px';
            cropArea.style.top = leftTop.y + 'px';
        }
        else if (start.x > x && start.y > y) {
            leftTop.x = x;
            leftTop.y = y;
            cropArea.style.left = leftTop.x + 'px';
            cropArea.style.top = leftTop.y + 'px';

        }
   
        else if (start.x > x && start.y < y) {
            leftTop.x = x;
            leftTop.y = start.y;
            cropArea.style.left = leftTop.x + 'px';
            cropArea.style.top = leftTop.y + 'px';
        }
        else {
            return 0;
        }


            // 左上到左下
        if (start.x < x && start.y < y) {
            rightBottom.x = x;
            rightBottom.y = y;
        }
            // 左下到右上
        else if (start.x < x && start.y > y) {
            rightBottom.x = x;
            rightBottom.y = start.y;
        }
            // 右下到左上
        else if (start.x > x && start.y > y) {
            rightBottom.x = start.x;
            rightBottom.y = start.y;
        }
            // 右上到左下
        else if (start.x > x && start.y < y) {
            rightBottom.x = start.x;
            rightBottom.y = y;
        }
        else {
            return 0;
        }
 
        var diffY = rightBottom.y -leftTop.y;
        var diffX = rightBottom.x -leftTop.x;

        cropArea.style.width = diffX + 'px';
        cropArea.style.height = diffY + 'px';

        createMasks(leftTop,rightBottom);

        ch = diffY;
        cw = diffX;
    }  

};
    
document.body.onmouseup = function(event){

        mousedown = false;
        //想着只要让start.x取到值就好了
        start.x = {};
        start.y = {};

   
};

drawcrop = function(data){
var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');

var img = new Image();
img.src = data;

img.onload = function() {

    canvas.width = cw;
    canvas.height = ch;
    context.drawImage(img, leftTop.x, leftTop.y, cw, ch, 0, 0, cw, ch);

    img.src = canvas.toDataURL('image/png');
    // window.open(img.src);
    // console.log(img.src);
    document.body.appendChild(canvas);
    crop = img.src;
    return crop;
    };
}

// 选中之后的点击事件
var choose =document.getElementById('choose');
choose.onclick =function() {
    cropArea.style.border = 'none';
    setTimeout(function() {
    chrome.extension.sendRequest({greeting: "hello"}, function(response) {
        drawcrop(response.pic);
        // console.log(crop);
         cropArea.style.border = '2px dashed #fff';
        chrome.runtime.sendMessage(crop); //是croparea还是crop
    });
    // 将drawcrop函数中的参数传出来
    parent.postMessage('removeRegion', '*');
},50);
}

var cancel = document.getElementById('cancel');
cancel.onclick = function() {
    parent.postMessage('removeRegion','*');
}
