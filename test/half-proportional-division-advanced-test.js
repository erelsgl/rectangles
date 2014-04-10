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
var V = function(color/*, x1, y1, x2, y2, ... */) {
	var numOfPoints = (arguments.length-1)/2;
	var points = Array(numOfPoints);
	for (var i=0; i<numOfPoints; ++i) 
		points[i] = {x: arguments[2*i+1], y: arguments[2*i+2]};
	points.color = color;
	return points;
}


var T = function(agents) {         // shorthand for testing the 4-walls algorithm on a square
	//console.dir(agents);
	testAlgorithm(alg4walls, [agents, square, 1], 2);
}

test1agent = function() {  // to test the testing tools
	console.log("\n/* 1 agent: */\n");
	T([
		V('red', 
			000,000, 
			100,400),
	]);
}


// 2nd 2-line low, but 2 squares go high. Will agent 3 have room in the remainder?
// 2nd 4-line high, but 2 squares go low. Will agent 1 have room in the remainder?
T([
V('red', 
		005,000, 200,001, 395,002,
		005,399, 130,398, 260,397, 395,396
),
V('blue', 
		005,000, 200,004, 395,005,
		005,396, 130,395, 260,394, 395,493
),
V('green', 
		005,000, 200,006, 395,007,
		005,392, 130,391, 260,390, 395,389
),
]);



