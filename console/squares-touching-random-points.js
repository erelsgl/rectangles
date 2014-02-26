/**
 * Select points at random, and calculate the size of the maximum disjoint set of squares touching them.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */
//var seed = require('seed-random');
//seed('a', {global: true});//over-ride global Math.random

var X_RANGE = Y_RANGE = 600;

var xminWall = -Infinity; //0;//
var xmaxWall = Infinity; // X_RANGE; //
var yminWall = -Infinity; // 0; // 
var ymaxWall = Y_RANGE; //Infinity; // 

var EXPERIMENT_COUNT=100000;
var POINT_COUNT=10;
var PRESET_POINTS = [
  {x:40, y:Y_RANGE},
  {x:200, y:Y_RANGE},
  {x:280, y:Y_RANGE},
  {x:320, y:Y_RANGE},
  {x:400, y:Y_RANGE},
  {x:560, y:Y_RANGE},
  ];
var POINT_COUNT_AT_LEFT_WALL=0;  // points for which x=1.
var POINT_COUNT_AT_BOTTOM_WALL=0;  // points for which y=1
var KNOWN_SQUARE_COUNT=6;

var GRID_SIZE = 10;

var maximumDisjointSet = require("../shared/maximum-disjoint-set");
var makeXYUnique = require("../shared/make-xy-unique");
var squaresTouchingPoints = require("../shared/squares-touching-points");
var pointsToString = require("../shared/points-to-string");

function randomPointSnappedToGrid(maxVal, gridSize) {
	return 	Math.floor(Math.random()*maxVal/gridSize)*gridSize;
}

function randomPoints(count, xmax, ymax, gridSize) {
	var points = PRESET_POINTS.slice(0);
	for (var i=PRESET_POINTS.length; i<count; ++i) {
		points.push({
			x: i<=POINT_COUNT_AT_LEFT_WALL? 1: randomPointSnappedToGrid(xmax, gridSize),
			y: POINT_COUNT_AT_LEFT_WALL<i&&i<=POINT_COUNT_AT_LEFT_WALL+POINT_COUNT_AT_BOTTOM_WALL? 1: randomPointSnappedToGrid(ymax, gridSize),
		});
	}
	makeXYUnique(points);
	points.sort(function(a,b){return a.x-b.x});
	return points;
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
			console.log("\t points="+pointsToString(points,"green"));
			//console.log("\t candidates="+JSON.stringify(candidates));
		}
	}
}
var elapsed=new Date()-start;
var elapsedMean = Math.round(elapsed/EXPERIMENT_COUNT);
var candidateCountMean = (candidateCount/EXPERIMENT_COUNT);

console.log(proportionalCount+" proportional out of "+EXPERIMENT_COUNT+" experiments ("+(100.0*proportionalCount/EXPERIMENT_COUNT)+"%). "+candidateCountMean+" avg candidate count. "+elapsedMean+" avg time [ms].")
