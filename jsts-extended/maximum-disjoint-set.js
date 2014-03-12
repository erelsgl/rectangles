/**
 * Calculate a largest subset of non-intersecting shapes from a given set of candidates.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-02
 */

var powerSet = require("powerset");
var _ = require('underscore');

var jsts = require('jsts');
require("./intersection-utils"); // add some utility functions to jsts.algorithm

var COUNT_THE_NUM_OF_CALLS = false; // a measure of performance 
var numRecursiveCalls;


/**
 * Calculate a largest subset of non-intersecting shapes from a given set of candidates.
 * @param candidates a set of shapes (geometries).
 * @return a subset of these shapes, that are guaranteed to be pairwise disjoint.
 */
jsts.algorithm.maximumDisjointSet = function(candidates) {
	candidates = _.chain(candidates)
		.filter(function(cur) { return (cur.getArea() > 0); })  	// remove empty candidates
		.map(function(cur) { return (cur.norm()); })              // normalize representation
		.uniq(function(cur) { return cur.toString(); })           // remove duplicates
		.value();
	candidates.forEach(function(cur) {   // cache x and y values of the envelopes
		var envelope = cur.getEnvelopeInternal();
		cur.xmin = envelope.getMinX();
		cur.xmax = envelope.getMaxX();
		cur.ymin = envelope.getMinY();
		cur.ymax = envelope.getMaxY();
	})


	if (COUNT_THE_NUM_OF_CALLS) numRecursiveCalls = 0;
	var maxDisjointSet = maximumDisjointSetRec(candidates);
	if (COUNT_THE_NUM_OF_CALLS) console.log("numRecursiveCalls="+numRecursiveCalls);
	return maxDisjointSet;
}

/**
 * Find a largest interior-disjoint set of rectangles, from the given set of candidates.
 * 
 * @param candidates an array of candidate rectangles from which to select the MDS.
 * Each rectangle should contain the fields: xmin, xmax, ymin, ymax.
 * 
 * @return a largest set of rectangles that do not interior-intersect.
 * 
 * @note uses a simple exact divide-and-conquer algorithm that can be exponential in the worst case.
 * For more complicated algorithms that are provably more efficient (in theory) see: https://en.wikipedia.org/wiki/Maximum_disjoint_set 
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */
function maximumDisjointSetRec(candidates) {
	if (COUNT_THE_NUM_OF_CALLS) ++numRecursiveCalls;
	if (candidates.length<=1) 
		return candidates;

	var currentMaxDisjointSet = [];
	var partition = partitionShapes(candidates);
			//	partition[0] - on one side of separator;
			//	partition[1] - intersected by separator;
			//	partition[2] - on the other side of separator (- guaranteed to be disjoint from rectangles in partition[0]);

	var allSubsetsOfIntersectedRects = powerSet(partition[1]);
	
	for (var i=0; i<allSubsetsOfIntersectedRects.length; ++i) {
		var subsetOfIntersectedRects = allSubsetsOfIntersectedRects[i];
		if (!jsts.algorithm.arePairwiseDisjoint(subsetOfIntersectedRects)) 
			// the intersected rectangles themselves are not pairwise-disjoint, so they cannot be a part of an MDS.
			continue;
		
		var candidatesOnSideOne = jsts.algorithm.calcDisjoint(partition[0], subsetOfIntersectedRects);
		var candidatesOnSideTwo = jsts.algorithm.calcDisjoint(partition[2], subsetOfIntersectedRects);

		// Make sure candidatesOnSideOne is larger than candidatesOnSideTwo - to enable heuristics
		if (candidatesOnSideOne.length<candidatesOnSideTwo.length) {
			var temp = candidatesOnSideOne;
			candidatesOnSideOne = candidatesOnSideTwo;
			candidatesOnSideTwo = temp;
		}
		
		// branch-and-bound (advice by D.W.):
		var upperBoundOnNewDisjointSetSize = candidatesOnSideOne.length+candidatesOnSideTwo.length+subsetOfIntersectedRects.length;
		if (upperBoundOnNewDisjointSetSize<=currentMaxDisjointSet.length)
			continue;

		var maxDisjointSetOnSideOne = maximumDisjointSetRec(candidatesOnSideOne);
		var upperBoundOnNewDisjointSetSize = maxDisjointSetOnSideOne.length+candidatesOnSideTwo.length+subsetOfIntersectedRects.length;
		if (upperBoundOnNewDisjointSetSize<=currentMaxDisjointSet.length)
			continue;

		var maxDisjointSetOnSideTwo = maximumDisjointSetRec(candidatesOnSideTwo);

		var newDisjointSet = maxDisjointSetOnSideOne.concat(maxDisjointSetOnSideTwo).concat(subsetOfIntersectedRects);
		if (newDisjointSet.length > currentMaxDisjointSet.length) 
			currentMaxDisjointSet = newDisjointSet;
	}
	return currentMaxDisjointSet;
}

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
function partitionShapes(candidates) {
	if (candidates.length<=1)
		throw new Error("less than two candidate rectangles - nothing to partition!");

	var bestXPartition = null;
	var xValues = sortedXValues(candidates).slice(1,-1);
	if (xValues.length>0) {
		var bestX = _.max(xValues, function(x) {
			return partitionQuality(partitionByX(candidates, x));
		});
		var bestXPartition = partitionByX(candidates, bestX);
	}

	var bestYPartition = null;
	var yValues = sortedYValues(candidates).slice(1,-1);
	if (yValues.length>0) {
		var bestY = _.max(yValues, function(y) {
			return partitionQuality(partitionByY(candidates, y));
		});
		var bestYPartition = partitionByY(candidates, bestY);
	}
	
	if (!bestYPartition && !bestXPartition) 
		throw new Error("No x partition and no y partition! candidates="+JSON.stringify(candidates));

	if (partitionQuality(bestXPartition)>=partitionQuality(bestYPartition)) {
//		console.log("\t\tSeparator line: x="+bestX+" "+partitionDescription(bestXPartition));
		return bestXPartition;
	} else {
//		console.log("\t\tSeparator line: y="+bestY+" "+partitionDescription(bestYPartition));
		return bestYPartition;
	}
}


/**
 * @param shapes an array of shapes, each of which contains pre-calculated "xmin" and "xmax" fields.
 * @returns a sorted array of all X values of the envelopes.
 */
function sortedXValues(shapes) {
	var xvalues = {};
	for (var i=0; i<shapes.length; ++i) {
		var s = shapes[i];
		xvalues[s.xmin]=xvalues[s.xmax]=true;
	}
	var xlist = Object.keys(xvalues);
	xlist.sort(function(a,b){return a-b});
	return xlist;
}

/**
 * @param shapes an array of shapes, each of which contains pre-calculated "ymin" and "ymax" fields.
 * @returns a sorted array of all Y values of the envelopes.
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
		if (cur.xmax<=x)
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
		if (cur.ymax<=y)
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

