/**
 * Adds to jsts.algorithm some utility functions related to partitioning.
 * These utility functions are used mainly by the maximum-disjoint-set algorithm.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */
var _ = require('underscore');

/**
 * Subroutine of maximumDisjointSet.
 * 
 * @param candidates an array of candidate rectangles to add to the MDS. 
 * 	Must have length at least 2.
 * @return a partition of the rectangles to three groups:
		partition[0] - on one side of separator;
		partition[1] - intersected by separator;
		partition[2] - on the other side of separator (- guaranteed to be disjoint from rectangles in partition[0]);
	@note Tries to minimize the size of partition[1]. I.e., out of all possible separators, selects a separator that intersects a smallest number of rectangles.
 * 
 */
jsts.algorithm.partitionShapes = function(candidates) {
	if (candidates.length<=1)
		throw new Error("less than two candidate rectangles - nothing to partition!");

	var bestXPartition = null;
	var xValues = sortedXValues(candidates).slice(1,-1);
	if (xValues.length>0) {
		var bestX = _.max(xValues, function(x) {
			return partitionQuality(partitionByX(candidates, x));
		});
		bestXPartition = partitionByX(candidates, bestX);
	}

	var bestYPartition = null;
	var yValues = sortedYValues(candidates).slice(1,-1);
	if (yValues.length>0) {
		var bestY = _.max(yValues, function(y) {
			return partitionQuality(partitionByY(candidates, y));
		});
		bestYPartition = partitionByY(candidates, bestY);
	}
	
	if (!bestYPartition && !bestXPartition) {
		console.dir(candidates.map(function(cur){return cur.toString()}));
		console.warn("Warning: no x partition and no y partition!");
		return [[],candidates,[]];
	}

	if (partitionQuality(bestXPartition)>=partitionQuality(bestYPartition)) {
//		console.log("\t\tBest separator line: x="+bestX+" "+partitionDescription(bestXPartition));
		return bestXPartition;
	} else {
//		console.log("\t\tBest separator line: y="+bestY+" "+partitionDescription(bestYPartition));
		return bestYPartition;
	}
}


/**
 * @param shapes an array of shapes, each of which contains pre-calculated "xmin" and "xmax" fields.
 * @returns a sorted array of all unique X values of the envelopes.
 */
function sortedXValues(shapes) {
	var xvalues = {};
	for (var i=0; i<shapes.length; ++i) {
		var s = shapes[i];
		xvalues[s.xmin]=xvalues[s.xmax]=true;
	}
	var xlist = Object.keys(xvalues);
	xlist.sort(function(a,b){return a-b});
//	console.log(xlist)
	return xlist;
}

/**
 * @param shapes an array of shapes, each of which contains pre-calculated "ymin" and "ymax" fields.
 * @returns a sorted array of all unique Y values of the envelopes.
 */
function sortedYValues(shapes) {
	var yvalues = {};
	for (var i=0; i<shapes.length; ++i) {
		var s = shapes[i];
		yvalues[s.ymin]=yvalues[s.ymax]=true;
	}
	var ylist = Object.keys(yvalues);
	ylist.sort(function(a,b){return a-b});
	return ylist;
}


/**
 * @param shapes an array of shapes, each of which contains pre-calculated "xmin" and "xmax" fields.
 * @param x a number.
 * @return a partitioning of shapes to 3 lists: before, intersecting, after x.
 */
function partitionByX(shapes, x) {
	var beforeX = [];
	var intersectedByX = [];
	var afterX = [];
	shapes.forEach(function(cur) {
		if (cur.xmax<x)
			beforeX.push(cur);
		else if (x<=cur.xmin)
			afterX.push(cur);
		else
			intersectedByX.push(cur);
	});
	return [beforeX, intersectedByX, afterX];
}

/**
 * @param shapes an array of shapes, each of which contains pre-calculated "ymin" and "ymax" fields.
 * @param y a number.
 * @return a partitioning of shapes to 3 lists: before, intersecting, after y.
 */
function partitionByY(shapes, y) {
	var beforeY = [];
	var intersectedByY = [];
	var afterY = [];
	shapes.forEach(function(cur) {
		if (cur.ymax<y)
			beforeY.push(cur);
		else if (y<=cur.ymin)
			afterY.push(cur);
		else
			intersectedByY.push(cur);
	});
	return [beforeY, intersectedByY, afterY];
}




/**
 * Calculate a quality factor for the given partition of squares.
 * 
 * @see http://cs.stackexchange.com/questions/20126
 * 
 * @param partition contains three parts; see partitionShapes.
 */
function partitionQuality(partition) {
	if (!partition) return -1; // worst quality
	var numIntersected = partition[1].length; // the smaller - the better
	var smallestPart = Math.min(partition[2].length,partition[0].length);  // the larger - the better
	if (!numIntersected && !smallestPart)
		throw new Error("empty partition - might lead to endless recursion!");

//	return 1/numIntersected; 
//	return smallestPart; 
	return smallestPart/numIntersected;  // see http://cs.stackexchange.com/a/20260/1342
}

function partitionDescription(partition) {
	return "side1="+partition[0].length+" intersect="+partition[1].length+" side2="+partition[2].length;
}

