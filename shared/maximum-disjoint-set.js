var rectutils = require('./rectutils');
var powerSet = require('./powerset');
var _ = require('underscore');

var COUNT_THE_NUM_OF_CALLS = false; // a measure of performance 

var numRecursiveCalls;
function maximumDisjointSet(candidates) {
	candidates = rectutils.rectsNotEmpty(candidates);
	candidates = _.uniq(candidates, false, function(rect) {
		return ""+rect.xmin+" "+rect.xmax+" "+rect.ymin+" "+rect.ymax;
	});
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
		
		var candidatesOnSideOne = rectutils.rectsNotIntersecting(partition[0], subsetOfIntersectedRects);
		var candidatesOnSideTwo = rectutils.rectsNotIntersecting(partition[2], subsetOfIntersectedRects);
		
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
function partitionRects(candidates) {
	if (candidates.length<=1)
		throw new Error("less than two candidate rectangles - nothing to partition!");
	
	var bestXPartition = null;
	var xValues = rectutils.sortedXValues(candidates).slice(1,-1);
	if (xValues.length>0) {
		var bestX = _.max(xValues, function(x) {
			return partitionQuality(rectutils.partitionByX(candidates, x));
		});
		var bestXPartition = rectutils.partitionByX(candidates, bestX);
	}

	var bestYPartition = null;
	var yValues = rectutils.sortedYValues(candidates).slice(1,-1);
	if (yValues.length>0) {
		var bestY = _.max(yValues, function(y) {
			return partitionQuality(rectutils.partitionByY(candidates, y));
		});
		var bestYPartition = rectutils.partitionByY(candidates, bestY);
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
 * Calculate a quality factor for the given partition of squares.
 * 
 * @see http://cs.stackexchange.com/questions/20126
 * 
 * @param partition contains three parts; see partitionRects.
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

module.exports = maximumDisjointSet;

