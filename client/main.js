/**
 * main.js - Main Javascript program from svgdisjointsquares.html
 */

var maximumDisjointSet = require("../shared/maximum-disjoint-set");
var _ = require("underscore");

$(document).ready(function() {

var svgpaper = SVG('svg');
svgpaper.size(400,400);

var canvas = document.getElementById("canvas");
canvas.width  = 400;
canvas.height = 400;
//svgpaper.rect(10,10);
//alert(svgpaper.exportSvg());

var points, rects;

var colors = ['#000','#f00','#0f0','#ff0','#088','#808','#880'];
function color(i) {return colors[i % colors.length]}

/**
 * Make sure the x values and the y values of the points are all unique, by adding a small constant to non-unique values.
 */
function makeXYunique(points) {
	var xvalues={};
	var yvalues={};
	for (var i=0; i<points.length; ++i) {
		var p = points[i];
		
		p.x = parseInt(p.x);
		while (xvalues[p.x]) 
			p.x += 1;
		xvalues[p.x] = true;
		
		p.y = parseInt(p.y);
		while (yvalues[p.y])
			p.y += 1;
		yvalues[p.y] = true;
	}
}


/**
 * @param points a list of points.
 * @return a list of candidate squares - all squares that touch two points.
 */
function getCandidateSquares(points) {
	var candidates = [];
	var slide = 0.1;
	makeXYunique(points);
	for (var i=0; i<points.length; ++i) {
		for (var j=0; j<i; ++j) {
			var p1 = points[i];
			var p2 = points[j];
			var xmin = Math.min(p1.x,p2.x);
			var xmax = Math.max(p1.x,p2.x);
			var xdist = xmax-xmin;
			var ymin = Math.min(p1.y,p2.y);
			var ymax = Math.max(p1.y,p2.y);
			var ydist = ymax-ymin;

			var newcolor = color(candidates.length); 
			if (xdist>ydist) {
				var square1 = new SVG.math.Rectangle(
					new SVG.math.Point(xmin,ymax-xdist), new SVG.math.Point(xmax,ymax));
				var square2 = new SVG.math.Rectangle(
					new SVG.math.Point(xmin,ymin), new SVG.math.Point(xmax,ymin+xdist));
			} else {
				var square1 = new SVG.math.Rectangle(
					new SVG.math.Point(xmax-ydist,ymin), new SVG.math.Point(xmax,ymax));
				var square2 = new SVG.math.Rectangle(
					new SVG.math.Point(xmin,ymin), new SVG.math.Point(xmin+ydist,ymax));
			}
			square1.color = square2.color = newcolor;
			if (!points.intersect(square1))  // don't add a square that contains a point.
				candidates.push(square1);
			if (!points.intersect(square2))     // don't add a square that intersects another square.
				candidates.push(square2);
		}
	}
	return candidates;
}

function drawSquares() {
	rects.clear();
	var drawDisjointSquares = document.getElementById('drawDisjointSquares').checked;
	var drawAllCandidateSquares = document.getElementById('drawAllCandidateSquares').checked;
	if (!drawAllCandidateSquares && !drawDisjointSquares)
		return;

	var candidates = getCandidateSquares(points);
	if (!drawAllCandidateSquares) {
		candidates = maximumDisjointSet(candidates);
	}
	for (var i=0; i<candidates.length; ++i) {
		var square = candidates[i];
		rects.add(square, square.color);
	}
	updateStatus();
	updatePermaLink();
	
	if (rects.length<points.length-1)
		alert("Congratulations! You found a winning arrangement! Please tell Erel at erelsgl@gmail.com !");
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
	if (points.length>10)
		$(".addpoint").attr("disabled","disabled");
	else 
		$(".addpoint").removeAttr("disabled");
}

function updatePermaLink() {
	var permalink = 
		location.host+"/"+
		location.pathname+"?"+encodeURI(points.toString());
	permalink = permalink.replace(/[?]+/g,"?");
	permalink = permalink.replace(/[/]+/g,"/");
	permalink = location.protocol+"//"+permalink;
	document.getElementById('permalink').href = permalink;
}

rects =  ColorfulRectangles(svgpaper);
points = DraggablePoints(svgpaper, drawSquares);

points.fromLocationSearchString();





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

