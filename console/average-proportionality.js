/**
 * Select points at random, and calculate the average proportionality level for a given number of agents.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */
//var seed = require('seed-random');
//seed('a', {global: true});//over-ride global Math.random
var X_RANGE = Y_RANGE = 400;

var xminWall = 0;//-Infinity; //
var xmaxWall = X_RANGE; //Infinity; // 
var yminWall = 0; // -Infinity; // 
var ymaxWall = Y_RANGE; //Infinity; // 

var EXPERIMENT_COUNT=1000;

var GRID_SIZE = 1;

var maximumDisjointSet = require("../shared/maximum-disjoint-set");
var makeXYUnique = require("../shared/make-xy-unique");
var squaresTouchingPoints = require("../shared/squares-touching-points");
require('../shared/percent');

function randomPointSnappedToGrid(maxVal, gridSize) {
	return 	Math.floor(Math.random()*maxVal/gridSize)*gridSize;
}

function randomPoints(count, xmax, ymax, gridSize) {
	var points =  [];
	for (var i=0; i<count; ++i) {
		points.push({
			x: randomPointSnappedToGrid(xmax, gridSize),
			y: randomPointSnappedToGrid(ymax, gridSize),
		});
	}
	makeXYUnique(points);
	points.sort(function(a,b){return a.x-b.x});
	return points;
}


console.log("agents\tprop avg\ttotally prop\tavg time[ms]");
for (var AGENT_COUNT = 1; AGENT_COUNT<=10; ++AGENT_COUNT) {
	var POINT_COUNT = AGENT_COUNT+1;  // +1 is probably the worst case
	
	var start=new Date();
	var proportionalCount = 0;
	var proportionalitySum = 0;
	for (var e=0; e<EXPERIMENT_COUNT; ++e) {
		var points = randomPoints(POINT_COUNT,  X_RANGE, Y_RANGE, GRID_SIZE);
		var candidates = squaresTouchingPoints(points, xminWall, xmaxWall, yminWall, ymaxWall);
		var disjointset = maximumDisjointSet(candidates);
		var proportionality = Math.min(1, disjointset.length/AGENT_COUNT);
		proportionalitySum += proportionality;
		if (proportionality==1)
			proportionalCount++;
	}
	var elapsed=new Date()-start;
	var elapsedMean = Math.round(elapsed/EXPERIMENT_COUNT);
	var proportionalityMean = (proportionalitySum/EXPERIMENT_COUNT);
	
	console.log(
		AGENT_COUNT+"\t"+
		Math.percent(proportionalityMean)+"\t"+
		Math.percent(proportionalCount/EXPERIMENT_COUNT)+"\t"+
		elapsedMean
		);
}
