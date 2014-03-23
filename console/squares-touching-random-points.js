/**
 * Select points at random, and calculate the size of the maximum disjoint set of squares touching them.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */

//require('look').start();
//console.log("click any key to start experiments");
//var fs = require( "fs" );
//var fd = fs.openSync( "/dev/stdin", "rs" );
//fs.readSync( fd, new Buffer( 1 ), 0, 1 );
//fs.closeSync( fd );
//console.log("starting experiments");

var X_RANGE = Y_RANGE = 600;

var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var pointsToString = require("../shared/points-to-string");


var envelope = new jsts.geom.Envelope(
		-Infinity, // 0,//
		Infinity,  // X_RANGE, //
		-Infinity, // 0, // 
		Y_RANGE);  // Infinity); // 

var EXPERIMENT_COUNT=1;
var POINT_COUNT=20;
var ROTATED=0;

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
	points.sort(function(a,b){return a.x-b.x});
	return points;
}


var start=new Date();
var proportionalCount = 0;
var candidateCount = 0;
for (var e=0; e<EXPERIMENT_COUNT; ++e) {
	var points = randomPoints(POINT_COUNT,  X_RANGE, Y_RANGE, GRID_SIZE);
	var candidates = ROTATED? factory.createRotatedSquaresTouchingPoints(points, envelope): factory.createSquaresTouchingPoints(points, envelope);
	
	candidateCount += candidates.length;
	var disjointset = jsts.algorithm.maximumDisjointSet(candidates);
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

console.log(EXPERIMENT_COUNT+" experiments. "+proportionalCount+" proportional ("+(100.0*proportionalCount/EXPERIMENT_COUNT)+"%). "+candidateCountMean+" avg candidate count. "+elapsed+" total time [ms].")
