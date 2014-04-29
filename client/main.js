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

window.svgpaper = SVG('svg');
window.svgpaper.size(canvas.width,canvas.height);
window.svgpaper.line(0,200, 400,200).stroke({ width: 1, color:'#ccc' });
window.svgpaper.line(200,0, 200,400).stroke({ width: 1, color:'#ccc' });


// var MAX_POINT_COUNT = parseInt($("#max-point-count").text());



/* STATUS */

//var statusText = window.svgpaper.text("ready");
//statusText.move(200,0);
//statusText.draggable();
//statusText.font({
//	family:   'Helvetica',
//	color:  'blue',
//	anchor: 'middle',
//	size: '12px'
//})

var setStatus = function(text) {
//	statusText.text(text);
	$("#status").text(text);
}

window.updateStatus = function() {
	setStatus(""+window.points.length+" points ; "+window.landplots.length+" squares"+"");
}


/* SQUARES */

function drawShapes(err, shapes) {
	for (var i in shapes) {
		var shape = shapes[i];
		window.landplots.add(shape, {fill:shape.color, stroke:shape.color});
	}
	window.updateStatus();
	$(".interrupt").attr("disabled","disabled");
}

window.drawFairDivision = function(maxSlimness) {
	
	// Make sure the envelope has only at most 2 infinite side:
	var envelopeTemp = new jsts.geom.Envelope(0, canvas.width, 0, canvas.height);
	if (!$("#wall-left").is(':checked')) envelopeTemp.minx = -Infinity;
	else if (!$("#wall-right").is(':checked')) envelopeTemp.maxx = Infinity;
	if (!$("#wall-top").is(':checked')) envelopeTemp.miny = -Infinity;
	else if (!$("#wall-bottom").is(':checked')) envelopeTemp.maxy = Infinity;

	if (!window.points.byColor)
		throw new Error("window.points is "+JSON.stringify(window.points));
	var pointsPerAgent = _.values(window.points.byColor);
	var fairDivision = factory.createHalfProportionalDivision(
		pointsPerAgent, envelopeTemp, maxSlimness);

	var newStatus = " ";
	for (var color in window.points.byColor) {
		var pointsOfAgent = window.points.byColor[color];
		fairDivision.forEach(function(landplot) {
			if (landplot.color==color) {
				newStatus += color+":"+jsts.algorithm.numPointsInEnvelope(pointsOfAgent,landplot)+"/"+pointsOfAgent.length+" ";
			}
		});
	}
	drawShapes(null,fairDivision);
	setStatus(newStatus);
	
	if (fairDivision.length<pointsPerAgent.length)
		alert("Not enough land-plots! Please call Erel 09-7431290");
}

window.drawShapesFromPoints = function() {
	if (window.solver) window.solver.interrupt();

	$(".interrupt").removeAttr("disabled");
	setStatus("working...");
	window.landplots.clear();
	var drawMode = $("#draw").val();
	var shapeName = $("#shape").val();

	if (drawMode==='drawNone') return;

	var minxWall = $("#wall-left").is(':checked')? 0: -Infinity;
	var maxxWall = $("#wall-right").is(':checked')? canvas.width: Infinity;
	var minyWall = $("#wall-top").is(':checked')? 0: -Infinity;
	var maxyWall = $("#wall-bottom").is(':checked')? canvas.height: Infinity;
	var envelope = new jsts.geom.Envelope(minxWall, maxxWall, minyWall, maxyWall);

	setTimeout(function() {
		if (drawMode=="drawRepresentatives" || drawMode=="drawAllRepresentatives") {
			var candidateSets = [];
			var candidatesByColor = {};
			var numPerColor = parseInt($("#numPerColor").val()) || 1;
			var groupId = 1;
			for (var color in window.points.byColor)  {
				var candidatesOfColor = factory.createShapesTouchingPoints(
						shapeName, window.points.byColor[color], envelope);
				for (var i in candidatesOfColor) {
					candidatesOfColor[i].groupId = groupId++;
					candidatesOfColor[i].color = color;
				}
				for (var i=0; i<numPerColor; ++i)
					candidateSets.push(candidatesOfColor);
				candidatesByColor[color]=candidatesOfColor;
			}
			if (drawMode=="drawRepresentatives") {
				var newStatus = "";
				for (var color in window.points.byColor) {
					var maxDisjointSetOfColor = jsts.algorithm.maximumDisjointSet(candidatesByColor[color], candidateSets.length);
					newStatus += color+":"+window.points.byColor[color].length+"p"+maxDisjointSetOfColor.length+"s ";
					for (var i in maxDisjointSetOfColor) {
						var shape = maxDisjointSetOfColor[i];
						window.landplots.add(shape, {stroke: shape.color, fill: 'transparent'});
					}	
				}
				var shapes = jsts.algorithm.representativeDisjointSet(candidateSets);
				newStatus += "   representatives:"+shapes.length;
				drawShapes(null, shapes);
				setStatus(newStatus);
			} else {
				drawShapes(null,candidateSets.reduce(function(a,b){return a.concat(b)}));
			}
		} else if (drawMode=="drawFairDivision") {
			var maxSlimness = parseFloat($("#maxSlimness").val());
			window.drawFairDivision(maxSlimness);
		} else { // drawDisjoint or drawAll
				var candidates = factory.createShapesTouchingPoints(
						shapeName, window.points, envelope);
				if (drawMode=="drawAll") {
					drawShapes(null,candidates);
				} else {  // drawMode=='drawDisjoint'
					window.solver = new jsts.algorithm.MaximumDisjointSetSolver(candidates, window.points.length-1);
					window.solver.solve(drawShapes);
				}
		}
	},10)
}

window.shuffleYValues = function(points) {
	yvalues = _.chain(points).pluck("y").shuffle().value();
	for (var i=0; i<yvalues.length; ++i) {
		var p = points[i];
		p.move(p.x, yvalues[i]);
	}
}


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

}); // end of $(document).ready

