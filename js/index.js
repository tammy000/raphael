//初始化变量
var canvas, raph, centerX, centerY, stageWidth, stageHeight, C, M;
var A = new Array();
var savedColors = new Array();
var currentState = "global";
var strokeColor = "#ccc";
var baseColor = ["#FFBC00", "#FF0025", "#FF6000", "#00DE74", "#004FDE", "#FF0065", "#00C5F2", "#48D000", "#6C00FF","#b12a0f"];
var warp = new Array(7, 8, 6, 5, 4, 1, 2, 3, 11, 20, 19, 18, 9, 10, 13, 14, 15, 16, 17, 12);
var warp2 = new Array(5, 6, 7, 4, 3, 2, 0, 1, 12, 13, 8, 19, 14, 15, 16, 17, 18, 11, 10, 9);


Map.setup = function() {
	//INIT
	stageWidth = 980;
	stageHeight = 705;
	centerX = stageWidth * .5;
	centerY = stageHeight * .5;
	canvas = document.getElementById('map');

	raph = new Raphael(canvas, stageWidth, stageHeight);
	raph.setViewBox(0, 0, stageWidth, stageHeight, true);
	raph.canvas.setAttribute('preserveAspectRatio', 'none');

	for(var i = 0; i < polygons.length; i++) {
		var p = Map.polyToPath(polygons[i]);
		A[i] = raph.path(p);
	}

	//给元数据每一项添加基础颜色,给每个nav添加元数据标记属性
	var j = 0;
	for(var i in data) {
		data[i].baseColor = baseColor[j];
		$(".nav .item").eq(j).attr('id',i);
		j++;
	}
	//信息提示内容
	$(".tip-text .tip-title").html(currentState);
	$(".tip-text .tip-content").html(data[currentState].info);
	$(".tip-text .tip-content").css('color',data[currentState].baseColor);
	
	$('#map .rank').css({
		'color': data[currentState].baseColor
	});

	C = Map.generateColors(data[currentState].baseColor);
	Map.update(currentState);
	C.reverse();
	var current = null;
	for(var state in A) {
		savedColors[state] = C[data[currentState]['weight'][state] - 1];

		A[state].attr({
				fill: savedColors[state],
				stroke: strokeColor,
				"stroke-width": 1,
				"stroke-linejoin": "round"
			})
			.data("i", i);

		(function(st, state) {
			st[0].style.cursor = "pointer";
			st[0].onmouseover = function(e) {
				st.animate({
					fill: "#ccc"
				}, 200);

				//TEXT
				$('#floating h1').text('第' + (Number(state) +1) + "区");
				$('#floating .black h2 .txt').text(data[currentState].name + "：" + data[currentState]['weight'][state] + data[currentState].unit);

				$('.highlight').css({
					color: data[currentState].baseColor
				});
				$('#floating').css('border-color',data[currentState].baseColor)
				$('#floating').show();
			};

			st[0].onmouseout = function(e) {
				st.animate({
					fill: savedColors[state]
				}, 200);
			};

		})(A[state], state);
	}
};

Map.getData = function() {
	$.ajax({
		type: "get",
		async: false,
		url: "index.json",
		dataType: "jsonp",
		jsonp: "callback", //传递给请求处理程序或页面的，用以获得jsonp回调函数名的参数名(一般默认为:callback)
		jsonpCallback: "flightHandler", //自定义的jsonp回调函数名称，默认为jQuery自动生成的随机函数名，也可以写"?"，jQuery会自动为你处理数据
		success: function(result) {
			data = result;
			Map.setSplit();
			Map.setup();
		},
	});
};

//根据数值最大和最小来切分成5个分区
Map.setSplit = function(){
	for(var i in data){
		var weight = data[i].weight;
		data[i].split = [];
		data[i].max = Math.max.apply(null, weight);
		data[i].min = Math.min.apply(null, weight);
		var splitCount = (data[i].max - data[i].min)/5;
		for(var j = 0; j < weight.length; j++){
			if(weight[j] == data[i].min){
				data[i].split.push(1);
			}else{
				data[i].split.push(Math.ceil((weight[j] - data[i].min)/splitCount));
			}
		}
	}
}



Map.update = function(state) {
	C = Map.generateColors(data[currentState].baseColor);
	C.reverse();
	for(var a in A) {
		savedColors[a] = C[data[currentState]['split'][a] - 1];
		A[a].animate({
			fill: savedColors[a]
		}, 200);
		var id = parseInt(a) + 1;
		$('#a-' + id).children().children('.rank').text(Number(a) +1);
	}
	//生成图例
	C.reverse();
	$(".legend").find('.legend-item').remove();
	$(".top-text").html(data[currentState].max + data[currentState].unit);
	$(".bottom-text").html(data[currentState].min + data[currentState].unit);
	for(var i = 0; i < C.length; i++){
		var div = $("<div class='legend-item' style='background:" + C[i] + "'><div>");
		$(".legend").append(div);
	}
};

Map.generateColors = function(color) {
	var colors = new Array();
	var c1 = Raphael.getRGB(color);
	var c = Raphael.rgb2hsb(c1.r, c1.g, c1.b);
	var nbColors = 5;
	var p = c.b / nbColors;
	for(var i = 0; i < nbColors; i++) {
		colors[i] = Raphael.hsb2rgb(c).hex;
		c.s -= p;
	}
	return colors;
};


Map.polyToPath = function(poly) {
	var convertedPath = poly.replace(/([0-9.]+),([0-9.]+)/g, function($0, x, y) {
		return 'L ' + Math.floor(x) + ',' + Math.floor(y) + ' ';
	}).replace(/^L/, 'M');
	convertedPath += ' z';
	return convertedPath;
};


$(document).ready(function() {
	Map.getData();

	$('.nav li').mouseover(function() {
		$(this).children('.tip').show(200);
		var id = $(this).children('.item').attr('id');
		$(this).children('.tip').css('color',data[id].baseColor);
	});
	$('.nav li').mouseout(function() {
		$(this).children('.tip').hide(200);
	});

	$('.nav li').click(function() {
		$(this).siblings().removeClass('active');
		$(this).addClass('active');
		currentState = $(this).children('.item').attr('id');
		$('#map .rank').css({
			'color': data[currentState].baseColor
		});
		
		//页面提示区的提示信息
		$(".tip-text .tip-title").html(currentState);
		$(".tip-text .tip-content").html(data[currentState].info);
		$(".tip-text .tip-content").css('color',data[currentState].baseColor);
		
		
		Map.update(currentState);
		return false;
	});

	//地图上点的点击效果
	$(".pointer").click(function(){
		alert("这是一个地图上可点击的点");
	})

	$('#map .item').mouseover(function() {
		$('#floating').show();
		var id = $(this).attr('id').substring(2, 4);
		id = id - 1;
		A[warp2[id]].animate({
			fill: "#ccc",
			stroke: strokeColor
		}, 200);
	});

	$('#map .item').mouseout(function() {
		$('#floating').show();
		var id = $(this).attr('id').substring(2, 4);
		id = id - 1;
		A[warp2[id]].animate({
			fill: savedColors[warp2[id]],
			stroke: strokeColor
		}, 200);
	});

	$('#map').mouseout(function() {
		$('#floating').hide();
	});
	$('#sidebar').mouseover(function() {
		$('#floating').hide();
	});
	$('#legend').mouseover(function() {
		$('#floating').hide();
	});
	$('#header').mouseover(function() {
		$('#floating').hide();
	});
	$('.form').mouseover(function() {
		$('#floating').hide();
	});
	$('.form a').click(function() {
		$('.form').slideToggle();
	});

	$(document).bind('mousemove', function(e) {
		var t;
		var l;
		if(e.pageY < window.innerHeight * .5) t = 40;
		else t = -$('#floating').height() - 20;
		if(e.pageX < window.innerWidth * .5) l = 40;
		else l = -$('#floating').width() - 20;

		$('#floating').css({
			left: e.pageX + l,
			top: e.pageY + t
		});
	});

});