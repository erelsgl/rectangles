/**
 * main.js - Main Javascript program from svgdisjointsquares.html
 */

var maximumDisjointSet = require("../shared/maximum-disjoint-set");
var makeXYUnique = require("../shared/make-xy-unique");
var squaresTouchingPoints = require("../shared/squares-touching-points");

var _ = require("underscore");

$(document).ready(function() {

var canvas = document.getElementById("canvas");
canvas.width  = 400;
canvas.height = 400;

var svgpaper = SVG('svg');
svgpaper.size(canvas.width,canvas.height);

var MAX_POINT_COUNT = parseInt($("#max-point-count").text());

//svgpaper.rect(10,10);
//alert(svgpaper.exportSvg());

var points, rects;


/* WALLS */

function setWallStyle(direction, isChecked) {
	$("#svg").css("border-"+direction, isChecked? "solid #000": "dotted #ccc");
}
setWallStyle("top", $("#wall-top").is(":checked"));
setWallStyle("bottom", $("#wall-bottom").is(":checked"));
setWallStyle("left", $("#wall-left").is(":checked"));
setWallStyle("right", $("#wall-right").is(":checked"));

function setWallFlag(direction, isChecked) {
	$("#wall-"+direction).prop("checked", isChecked);
	setWallStyle(direction, isChecked);
}

function wallsToString() {
	return ""+
		($("#wall-top").is(":checked")? 1: 0)+","+
		($("#wall-bottom").is(":checked")? 1: 0)+","+
		($("#wall-left").is(":checked")? 1: 0)+","+
		($("#wall-right").is(":checked")? 1: 0);
}

function wallsFromString(string) {
	if (!string) return;
	var flags = string.split(/,/);
	if (flags.length != 4)
		throw new Error("expected a string with 4 values but found '"+string+"'");
	setWallFlag("top", flags[0]=='1');
	setWallFlag("bottom", flags[1]=='1');
	setWallFlag("left", flags[2]=='1');
	setWallFlag("right", flags[3]=='1');
}

$(".wall").change(function() {
	var isChecked = $(this).is(':checked');
	var direction = $(this).attr("id").replace(/^wall-/,"");
	setWallStyle(direction, isChecked);
	drawSquares();
})


/* SQUARES */

function drawSquares() {
	rects.clear();
	var drawDisjointSquares = document.getElementById('drawDisjointSquares').checked;
	var drawAllCandidateSquares = document.getElementById('drawAllCandidateSquares').checked;
	if (!drawAllCandidateSquares && !drawDisjointSquares)
		return;
	
	var xminWall = $("#wall-left").is(':checked')? 0: -Infinity;
	var xmaxWall = $("#wall-right").is(':checked')? canvas.width: Infinity;
	var yminWall = $("#wall-top").is(':checked')? 0: -Infinity;
	var ymaxWall = $("#wall-bottom").is(':checked')? canvas.height: Infinity;

	makeXYUnique(points);
	var candidates = squaresTouchingPoints(points, xminWall, xmaxWall, yminWall, ymaxWall);
	if (!drawAllCandidateSquares) 
		candidates = maximumDisjointSet(candidates);

	for (var i=0; i<candidates.length; ++i) {
		var square = candidates[i];
		
		rects.add(candidates[i] = 
				new SVG.math.Rectangle(
						new SVG.math.Point(square.xmin,square.ymin), 
						new SVG.math.Point(square.xmax,square.ymax)), 
				square.color);
	}
	updateStatus();
	updatePermaLink();
}


var statusText = svgpaper.text("");
statusText.move(200,0);
statusText.draggable();
statusText.font({
	family:   'Helvetica',
	color:  'blue',
	anchor: 'middle'
})

function updateStatus() {
	statusText.text(""+points.length+" points ; "+rects.length+" squares"+
		//rectutils.sortedXValues(rects)+		
		"");
	if (points.length>=MAX_POINT_COUNT)
		$(".addpoint").attr("disabled","disabled");
	else 
		$(".addpoint").removeAttr("disabled");
}

function updatePermaLink() {
	var permalink = 
		location.host+"/"+
		location.pathname+"?walls="+wallsToString()+"&points="+encodeURI(points.toString());
	permalink = permalink.replace(/[?]+/g,"?");
	permalink = permalink.replace(/[/]+/g,"/");
	permalink = location.protocol+"//"+permalink;
	document.getElementById('permalink').href = permalink;
}

rects =  ColorfulRectangles(svgpaper);
points = DraggablePoints(svgpaper, drawSquares);

points.fromString(Arg("points"));
wallsFromString(Arg("walls"));
drawSquares();


/* EVENTS */

$(".addpoint").click(function() {
	var color=$(this).text().toLowerCase();
	points.add(new SVG.math.Point(20,20), color); 
	updateStatus();
});

/**
 * From a gist by OTM: https://gist.github.com/otm/379a3cdb572ac81d8c19#file-svg-to-img
 */
$(".export").click(function() {
	var data = new XMLSerializer().serializeToString(document.getElementById('svg'));
	var ctx = canvas.getContext("2d");

	var DOMURL = self.URL || self.webkitURL || self;
	var img = new Image();
	var svg = new Blob([data], {type: "image/svg+xml;charset=utf-8"});
	var url = DOMURL.createObjectURL(svg);
	img.onload = function() {
		ctx.drawImage(img, 0, 0);
		DOMURL.revokeObjectURL(url);
	};
	img.src = url;
});

$(".shuffley").click(function() {
	yvalues = _.chain(points).pluck("y").shuffle().value();
	for (var i=0; i<yvalues.length; ++i) {
		var p = points[i];
		p.move(p.x, yvalues[i]);
	}
	drawSquares();	
});

$(".randomize").click(function() {
	for (var i=0; i<points.length; ++i) {
		var p = points[i];
		p.move(Math.random() * 400,Math.random() * 400); 
	}
	drawSquares();	
});

$(".clear").click(function() {
	points.clear(); 
	rects.clear();
	updateStatus();
});

$("#drawDisjointSquares").change(function() {
	$("#drawAllCandidateSquares").attr('checked', false);
	drawSquares();	
});

$("#drawAllCandidateSquares").change(function() {
	$("#drawDisjointSquares").attr('checked', false);
	drawSquares();	
});

}); // end of $(document).ready

