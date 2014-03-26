/**
 * main.js - Main Javascript program from svgdisjointsquares.html
 */
var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

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

var points, landplots, solver;

function drawShapes(err, shapes) {
	for (var i=0; i<shapes.length; ++i) {
		var shape = shapes[i];
		landplots.add(shape, {fill: shape.color});
	}
	updateStatus();
	updatePermaLink();
	$(".interrupt").attr("disabled","disabled");
}

function drawShapesFromPoints() {
	if (solver) solver.interrupt();

	$(".interrupt").removeAttr("disabled");
	landplots.clear();
	var drawDisjointSquares = document.getElementById('drawDisjointSquares').checked;
	var drawAllCandidates = document.getElementById('drawAllCandidates').checked;
	if (!drawAllCandidates && !drawDisjointSquares)
		return;
	
	var xminWall = $("#wall-left").is(':checked')? 0: -Infinity;
	var xmaxWall = $("#wall-right").is(':checked')? canvas.width: Infinity;
	var yminWall = $("#wall-top").is(':checked')? 0: -Infinity;
	var ymaxWall = $("#wall-bottom").is(':checked')? canvas.height: Infinity;
	var envelope = new jsts.geom.Envelope(xminWall, xmaxWall, yminWall, ymaxWall);
	
	var rotatedSquares = $("#rotatedSquares").is(':checked');
	var RAITs = $("#RAITs").is(':checked');
	setTimeout(function() {
		var candidates = (
				rotatedSquares? factory.createRotatedSquaresTouchingPoints(points, envelope):
				RAITs? factory.createRAITsTouchingPoints(points, envelope):
				factory.createSquaresTouchingPoints(points, envelope));
			if (drawAllCandidates) {
				drawShapes(null,candidates);
			} else {
				solver = new jsts.algorithm.MaximumDisjointSetSolver(candidates, points.length-1);
				solver.solve(drawShapes);
				//jsts.algorithm.maximumDisjointSet(candidates, points.length-1);
			}
	},10)
}

landplots =  ShapeCollection(svgpaper, /*default style =*/ {
	stroke: '#000',
	'stroke-dasharray': '5,5',
	opacity: 0.5,
});
points = DraggablePoints(svgpaper, /* change event = */drawShapesFromPoints);

points.fromString(Arg("points"));
wallsFromString(Arg("walls"));
drawShapesFromPoints();


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
	drawShapesFromPoints();	
});

$(".randomize").click(function() {
	for (var i=0; i<points.length; ++i) {
		var p = points[i];
		p.move(Math.random() * 400,Math.random() * 400); 
	}
	drawShapesFromPoints();	
});

$(".clear").click(function() {
	points.clear(); 
	landplots.clear();
	updateStatus();
});

$("#drawDisjointSquares").change(function() {
	$("#drawAllCandidates").attr('checked', false);
	drawShapesFromPoints();	
});

$("#drawAllCandidates").change(function() {
	$("#drawDisjointSquares").attr('checked', false);
	drawShapesFromPoints();	
});

$(".wall").change(function() {
	var isChecked = $(this).is(':checked');
	var direction = $(this).attr("id").replace(/^wall-/,"");
	setWallStyle(direction, isChecked);
	drawShapesFromPoints();
})

$(".shape").change(function() {
	drawShapesFromPoints();
})

$(".interrupt").click(function() {
	solver.interrupt();
});

}); // end of $(document).ready

