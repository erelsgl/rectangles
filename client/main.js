/**
 * main.js - Main Javascript program from svgdisjointsquares.html
 */
var jsts = require("../jsts-extended/index");
var factory = new jsts.geom.GeometryFactory();
var makeXYUnique = require("../shared/make-xy-unique");

var _ = require("underscore");

$(document).ready(function() {

var canvas = document.getElementById("canvas");
canvas.width  = 400;
canvas.height = 400;

var svgpaper = SVG('svg');
svgpaper.size(canvas.width,canvas.height);

var MAX_POINT_COUNT = parseInt($("#max-point-count").text());



/* STATUS */

var statusText = svgpaper.text("");
statusText.move(200,0);
statusText.draggable();
statusText.font({
	family:   'Helvetica',
	color:  'blue',
	anchor: 'middle'
})

function updateStatus() {
	statusText.text(""+points.length+" points ; "+landplots.length+" squares"+
		"");
	if (points.length>=MAX_POINT_COUNT)
		$(".addpoint").attr("disabled","disabled");
	else 
		$(".addpoint").removeAttr("disabled");
}

function updatePermaLink() {
	var wallsString = document.getElementById('walls').value = wallsToString();
	var pointsString = points.toString();
	document.getElementById('points').value = pointsString.replace(/:/g,":\n");
	var permalink = 
		location.host+"/"+
		location.pathname+"?walls="+encodeURI(wallsString)+"&points="+encodeURI(pointsString);
	permalink = permalink.replace(/[?]+/g,"?");
	permalink = permalink.replace(/[/]+/g,"/");
	permalink = location.protocol+"//"+permalink;
	document.getElementById('permalink').href = permalink;
}






/* SQUARES */

var points, landplots;

function drawSquares() {
	landplots.clear();
	var drawDisjointSquares = document.getElementById('drawDisjointSquares').checked;
	var drawAllCandidateSquares = document.getElementById('drawAllCandidateSquares').checked;
	if (!drawAllCandidateSquares && !drawDisjointSquares)
		return;
	
	var xminWall = $("#wall-left").is(':checked')? 0: -Infinity;
	var xmaxWall = $("#wall-right").is(':checked')? canvas.width: Infinity;
	var yminWall = $("#wall-top").is(':checked')? 0: -Infinity;
	var ymaxWall = $("#wall-bottom").is(':checked')? canvas.height: Infinity;
	var envelope = new jsts.geom.Envelope(xminWall, xmaxWall, yminWall, ymaxWall);
	
	var rotatedSquares = $("#rotatedSquares").is(':checked');
	makeXYUnique(points, xminWall, xmaxWall, yminWall, ymaxWall);
	var candidates = (rotatedSquares?
		factory.createRotatedSquaresTouchingPoints(points, envelope):
		factory.createSquaresTouchingPoints(points, envelope));
	if (!drawAllCandidateSquares) 
		candidates = jsts.algorithm.maximumDisjointSet(candidates);

	for (var i=0; i<candidates.length; ++i) {
		var shape = candidates[i];
		landplots.add(shape, {fill: shape.color});
	}
	updateStatus();
	updatePermaLink();
}

landplots =  ShapeCollection(svgpaper, /*default style =*/ {
	stroke: '#000',
	'stroke-dasharray': '5,5',
	opacity: 0.5,
});
points = DraggablePoints(svgpaper, /* change event = */drawSquares);

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
	landplots.clear();
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

$(".wall").change(function() {
	var isChecked = $(this).is(':checked');
	var direction = $(this).attr("id").replace(/^wall-/,"");
	setWallStyle(direction, isChecked);
	drawSquares();
})

$(".shape").change(function() {
	drawSquares();
})

}); // end of $(document).ready

