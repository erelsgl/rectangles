/**
 * a unit-test for half-proportional-division
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var should = require('should');
var jsts = require("../jsts-extended");
var alg4walls = jsts.algorithm.halfProportionalDivision4Walls; // shorthand
var alg3walls = jsts.algorithm.halfProportionalDivision3Walls; // shorthand

var square    = new jsts.geom.Envelope(0,400, 0,400);
var fatrect1  = new jsts.geom.Envelope(0,300, 0,400); // a 2-fat rectangle
var fatrect2  = new jsts.geom.Envelope(0,400, 0,200); // a 2-fat rectangle
var thinrect1 = new jsts.geom.Envelope(0,100, 0,400); // a 2-fat rectangle
var thinrect2 = new jsts.geom.Envelope(0,400, 0,90); // a 2-fat rectangle

var testAlgorithm = jsts.algorithm.testAlgorithm;


/** @return a list of points representing a Valuation function. */
var V = function(color, offset_x, offset_y /*, y1, [x11,x12,...], y2, [x21,x22,...],  ... */) {
	var numOfPoints = (arguments.length-3)/2;
	var points = [];
	for (var i=0; i<numOfPoints; ++i) {
		var y = arguments[2*i+3];
		var x = arguments[2*i+4];
		if (!Array.isArray(x))
			x = [x];
		for (var j=0; j<x.length; ++j) {
			points.push({x:x[j]+offset_x, y:y+offset_y});
		}
	}
	points.color = color;
	console.log(jsts.algorithm.pointsToString(points, color)+":");
	return points;
}


var T = function(agents) {         // shorthand for testing the 4-walls algorithm on a square
	//console.dir(agents);
	testAlgorithm(alg4walls, [agents, square, 1], 2);
}

test1agent = function() {  
	// just to test the testing tools
	T([
		V('red', +0,+0, 
			000, [000], 
			400, [100]),
	]);
}

test3agents_no_openpartition = function() {
	// 2nd 2-line low, but 2 squares go high. Will agent 3 have room in the remainder?
	// 2nd 4-line high, but 2 squares go low. Will agent 1 have room in the remainder?
	T([
	V('red', +2,+2, 
			000, [000,200,390],
			390, [000,130,260,390]
	),
	V('blue', +2,+8,
			000, [000,200,390],
			390, [000,130,260,390]
	),
	V('green', +8,+8, 
			000, [000,200,390],
			390, [000,130,260,390]
	),
	]);
	

	T([
		V('red', +0,+0, 
				000, [005,200,395],
				399, [005,130,260,395]
		),
		V('blue', 0,0, 
				000, [005,200,395],
				399, [005,130,260,395]
		),
		V('green', 0,0, 
				000, [005,200,395],
				180, [260,395],
				390, [005,130]
		),
		]);


	T([
		V('red', 0,0, 
				000, [005,200,395],
				399, [005,130,260,395]
		),
		V('blue', 0,0, 
				000, [005,200,395],
				399, [005,130,260,395]
		),
		V('green', 0,0, 
				000, [005,200,395],
				180, [130,260],
				399, [005,395]
		),
		]);
}

test3agents_no_bipartition= function() {
// Is there a way to cut the cake to two 2-by-1 rectangles as a step towards a division?
	T([
		V('red', +2,+2,
				000, [000,180,390],
				260, [390],
				390, [000,230,390]
		),
		V('blue', +2,+8,
				000, [000,390],
				140, [000],
				260, [390],
				390, [000,230,390]
		),
		V('green', +8,+8,
				000, [000,390],
				140, [000],
				260, [390],
				390, [000,230,390]
		),
		]);
}	

test3agents_no_bipartition_no_openpartition = function() {
	T([
		V('red', +2,+2,
				000, [000,130,390],
				180, [000],
				390, [000,130,390]
		),
		V('blue', +2,+8,
				000, [000,220,390],
				180, [000],
				380, [000,120],
				390, [390]
		),
		V('green', +8,+8,
				000, [000,170,390],
				180, [160,240],
				390, [000,390]
		),
		]);
	
}

test1agent();
test3agents_no_openpartition();
test3agents_no_bipartition();
test3agents_no_bipartition_no_openpartition();
