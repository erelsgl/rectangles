/**
 * Select points at random, and calculate the size of the maximum disjoint set of squares touching them.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */
//var seed = require('seed-random');
//seed('a', {global: true});//over-ride global Math.random

var xminWall = 0;//-Infinity;
var xmaxWall = Infinity; // 400; //
var yminWall = 0;//-Infinity;
var ymaxWall = 400; //

var EXPERIMENT_COUNT=100000;
var POINT_COUNT=6; // Full plane: 6:2 7:2 8:3 9:3 10:9 11:5 12:5
                   //  Half plane: 6:~500 less than 5 (~0.2 less than 4)
                   //  Quart plane: 6:~2000 less than 5 (no less than 3)
var POINT_COUNT_AT_LEFT_WALL=0;  // points for which x=1.
var POINT_COUNT_AT_BOTTOM_WALL=0;  // points for which y=1
var KNOWN_SQUARE_COUNT=3;
var X_RANGE = Y_RANGE = 400;

var GRID_SIZE = 1;

var maximumDisjointSet = require("../shared/maximum-disjoint-set");
var makeXYUnique = require("../shared/make-xy-unique");
var squaresTouchingPoints = require("../shared/squares-touching-points");

function randomPointSnappedToGrid(maxVal, gridSize) {
	return 	Math.floor(Math.random()*maxVal/gridSize)*gridSize;
}

function randomPoints(count, xmax, ymax, gridSize) {
	var points = [{x:1, y:1}];  // always put a point at the bottom-left corner
	for (var i=1; i<count; ++i) {
		points.push({
			x: i<=POINT_COUNT_AT_LEFT_WALL? 1: randomPointSnappedToGrid(xmax, gridSize),
			y: POINT_COUNT_AT_LEFT_WALL<i&&i<=POINT_COUNT_AT_LEFT_WALL+POINT_COUNT_AT_BOTTOM_WALL? 1: randomPointSnappedToGrid(ymax, gridSize),
		});
	}
	makeXYUnique(points);
	points.sort(function(a,b){return a.x-b.x});
	return points;
}

function pointsToString(points) {
		var s = "";
		for (var p=0; p<points.length; ++p) {
			if (s.length>0)
				s+=":";
			s += points[p].x + "," + points[p].y+","+"green";
		}
		return s;
}

var start=new Date();
var proportionalCount = 0;
var candidateCount = 0;
for (var e=0; e<EXPERIMENT_COUNT; ++e) {
	var points = randomPoints(POINT_COUNT,  X_RANGE, Y_RANGE, GRID_SIZE);
	var candidates = squaresTouchingPoints(points, xminWall, xmaxWall, yminWall, ymaxWall);
	candidateCount += candidates.length;
	var disjointset = maximumDisjointSet(candidates);
	if (disjointset.length >= points.length-1) 
		proportionalCount++;
	else {
		if (disjointset.length < KNOWN_SQUARE_COUNT) {
			console.log(points.length+" points, "+disjointset.length+" squares");
			console.log("\t points="+pointsToString(points));
			console.log("\t candidates="+JSON.stringify(candidates));
		}
	}
}
var elapsed=new Date()-start;
var elapsedMean = Math.round(elapsed/EXPERIMENT_COUNT);
var candidateCountMean = (candidateCount/EXPERIMENT_COUNT);

console.log(proportionalCount+" proportional out of "+EXPERIMENT_COUNT+" experiments ("+(100.0*proportionalCount/EXPERIMENT_COUNT)+"%). "+candidateCountMean+" avg candidate count. "+elapsedMean+" avg time [ms].")
