var rectutils = require('./rectutils');
var powerSet = require('./powerset');
var _ = require('underscore');

/**
 * Find a largest interior-disjoint set of rectangles, from the given set of candidates.
 * 
 * @param candidateRects an array of candidate rectangles from which to select the MDS.
 * Each rectangle should contain the fields: xmin, xmax, ymin, ymax.
 * 
 * @return a largest set of rectangles that do not interior-intersect.
 * 
 * @note uses a simple exact divide-and-conquer algorithm that can be exponential in the worst case.
 * For more complicated algorithms that are provably more efficient (in theory) see: https://en.wikipedia.org/wiki/Maximum_disjoint_set 
 */
function maximumDisjointSet(candidateRects) {
	return maximumDisjointSetNotIntersecting([], candidateRects);
}

/**
 * Recursive subroutine of maximumDisjointSet.
 * 
 * @param ironRects a list of rectangles that must not be intersected.
 * @param candidateRects an array of candidate rectangles to add to the MDS.
 */
function maximumDisjointSetNotIntersecting(ironRects, candidateRects) {
	if (candidateRects.length==0)
		return candidateRects;
	
	if (candidateRects.length==1) {
		if (rectutils.numContainingRect(ironRects, candidateRects[0])==0) 
			return candidateRects;
		else 
			return [];
	}
	
	var partition = partitionRects(candidateRects);
			//	partition[0] - on one side of separator;
			//	partition[1] - intersected by separator;
			//	partition[2] - on the other side of separator (- guaranteed to be disjoint from rectangles in partition[0]);

	var subsetsOfIntersectedRects = powerSet(partition[1]);
	
	var currentMaxDisjointSet = [];
	for (var i=0; i<subsetsOfIntersectedRects.length; ++i) {
		var newIronRects = ironRects.concat(subsetsOfIntersectedRects[i]);
		var sideOne = maximumDisjointSetNotIntersecting(newIronRects, partition[0]);
		var sideTwo  = maximumDisjointSetNotIntersecting(newIronRects, partition[2]);
		var currentDisjointSet = sideOne.concat(newIronRects).concat(sideTwo);
		if (currentDisjointSet.length > currentMaxDisjointSet.length)
			currentMaxDisjointSet = currentDisjointSet;
	}
	return currentMaxDisjointSet;
}

/**
 * Subroutine of maximumDisjointSetNotIntersecting.
 * 
 * @param candidateRects an array of candidate rectangles to add to the MDS. 
 * 	Must have length at least 2.
 * @return a partition of the rectangles to three groups:
		partition[0] - on one side of separator;
		partition[1] - intersected by separator;
		partition[2] - on the other side of separator (- guaranteed to be disjoint from rectangles in partition[0]);
 * 
 */
function partitionRects(candidateRects) {
	if (candidateRects.length<=1)
		throw new Error("less than two candidate rectangles - nothing to partition!");
	
	var xValues = rectutils.sortedXValues(candidateRects).slice(1,-1);
	if (xValues.length>0) {
		var xThatCutsFewestRects = _.min(xValues, function(x) {
			return rectutils.numContainingX(candidateRects, x)
		});
		return rectutils.partitionByX(candidateRects, xThatCutsFewestRects);
	} 
	var yValues = rectutils.sortedYValues(candidateRects).slice(1,-1);
	if (yValues.length>0) {
		var yThatCutsFewestRects = _.min(yValues, function(y) {
			return rectutils.numContainingY(candidateRects, y)
		});
		return rectutils.partitionByY(candidateRects, yThatCutsFewestRects);
	}
	
	throw new Error("Cannot partition by X nor by Y");
}

module.exports = maximumDisjointSet;

