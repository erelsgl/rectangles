var rectutils = require('./rectutils');
var powerSet = require('./powerset');
var _ = require('underscore');

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
 */
function maximumDisjointSet(candidates) {
	if (candidates.length<=1) 
		return candidates;

	currentMaxDisjointSet = [];
	var partition = partitionRects(candidates);
			//	partition[0] - on one side of separator;
			//	partition[1] - intersected by separator;
			//	partition[2] - on the other side of separator (- guaranteed to be disjoint from rectangles in partition[0]);

	var allSubsetsOfIntersectedRects = powerSet(partition[1]);
	
	for (var i=0; i<allSubsetsOfIntersectedRects.length; ++i) {
		var subsetOfIntersectedRects = allSubsetsOfIntersectedRects[i];
		if (!rectutils.arePairwiseDisjoint(subsetOfIntersectedRects)) 
			// the intersected rectangles themselves are not pairwise-disjoint, so they cannot be a part of an MDS.
			continue;
		
		var maxDisjointSetOnSideOne = maximumDisjointSet(
				rectutils.rectsNotIntersecting(partition[0], subsetOfIntersectedRects));
		var maxDisjointSetOnSideTwo = maximumDisjointSet(
				rectutils.rectsNotIntersecting(partition[2], subsetOfIntersectedRects));

		var currentDisjointSet = maxDisjointSetOnSideOne.concat(maxDisjointSetOnSideTwo).concat(subsetOfIntersectedRects);
		if (currentDisjointSet.length > currentMaxDisjointSet.length) 
			currentMaxDisjointSet = currentDisjointSet;
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
function partitionRects(candidates) {
	if (candidates.length<=1)
		throw new Error("less than two candidate rectangles - nothing to partition!");
	
	var numContainingX = Infinity;
	var xValues = rectutils.sortedXValues(candidates).slice(1,-1);
	if (xValues.length>0) {
		var xThatCutsFewestRects = _.min(xValues, function(x) {
			return rectutils.numContainingX(candidates, x);
		});
		numContainingX = rectutils.numContainingX(candidates, xThatCutsFewestRects);
	}

	var numContainingy = Infinity;
	var yValues = rectutils.sortedYValues(candidates).slice(1,-1);
	if (yValues.length>0) {
		var yThatCutsFewestRects = _.min(yValues, function(y) {
			return rectutils.numContainingY(candidates, y);
		});
		numContainingy = rectutils.numContainingY(candidates, yThatCutsFewestRects);
	}
	if (numContainingX<numContainingy)
		return rectutils.partitionByX(candidates, xThatCutsFewestRects);
	else
		return rectutils.partitionByY(candidates, yThatCutsFewestRects);
}

module.exports = maximumDisjointSet;

