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
	console.log("candidates="+JSON.stringify(candidates));
	var disjointset = maximumDisjointSetNotIntersecting([], candidates);
	console.log("disjoint set="+JSON.stringify(disjointset));
	return disjointset;
}

/**
 * Recursive subroutine of maximumDisjointSet.
 * 
 * @param ironRects a list of rectangles that must not be intersected.
 * @param candidates an array of candidate rectangles to add to the MDS.
 * 
 * @return the largest set of disjoint rectangles from "candidates", that do not intersect "ironRects".
 */
function maximumDisjointSetNotIntersecting(ironRects, candidates) {
//	console.log("\ncandidates="); 	console.log(candidates);
//	console.log("ironRects="); 	console.log(ironRects);
	candidates = rectutils.rectsNotIntersecting(candidates, ironRects);
//	console.log("remainingCandidates="); 	console.log(candidates);
	var currentMaxDisjointSet = null;
	if (candidates.length<=1) {
		currentMaxDisjointSet = candidates;
	} else {
		currentMaxDisjointSet = [];
		var partition = partitionRects(candidates);
				//	partition[0] - on one side of separator;
				//	partition[1] - intersected by separator;
				//	partition[2] - on the other side of separator (- guaranteed to be disjoint from rectangles in partition[0]);
//		console.log("partition[0]="); 	console.log(partition[0]);
//		console.log("partition[1]="); 	console.log(partition[1]);
//		console.log("partition[2]="); 	console.log(partition[2]);
	
		var subsetsOfIntersectedRects = powerSet(partition[1]);
		
		for (var i=0; i<subsetsOfIntersectedRects.length; ++i) {
			var newIronRects = subsetsOfIntersectedRects[i];
//			console.log("subsetsOfIntersectedRects["+i+"]="); 	console.log(newIronRects);
			if (rectutils.arePairwiseDisjoint(newIronRects)) {
				var sideOne = maximumDisjointSetNotIntersecting(newIronRects, partition[0]);
				var sideTwo = maximumDisjointSetNotIntersecting(newIronRects, partition[2]);
				var currentDisjointSet = sideOne.concat(sideTwo).concat(newIronRects);
				if (currentDisjointSet.length > currentMaxDisjointSet.length) 
					currentMaxDisjointSet = currentDisjointSet;
			} else {
//				console.log(" -- skipped");
			}
		}
	}
//	console.log("currentMaxDisjointSet="); console.log(currentMaxDisjointSet); console.log("\n");
	return currentMaxDisjointSet;
}

/**
 * Subroutine of maximumDisjointSetNotIntersecting.
 * 
 * @param candidates an array of candidate rectangles to add to the MDS. 
 * 	Must have length at least 2.
 * @return a partition of the rectangles to three groups:
		partition[0] - on one side of separator;
		partition[1] - intersected by separator;
		partition[2] - on the other side of separator (- guaranteed to be disjoint from rectangles in partition[0]);
 * 
 */
function partitionRects(candidates) {
	if (candidates.length<=1)
		throw new Error("less than two candidate rectangles - nothing to partition!");
	
	var xValues = rectutils.sortedXValues(candidates).slice(1,-1);
	var numContainingX = 99999; //infinity;
	var numContainingy = 99999; //infinity;
	if (xValues.length>0) {
		var xThatCutsFewestRects = _.min(xValues, function(x) {
			return rectutils.numContainingX(candidates, x)
		});
		numContainingX = rectutils.numContainingX(candidates, xThatCutsFewestRects)
	}
	var yValues = rectutils.sortedYValues(candidates).slice(1,-1);
	if (yValues.length>0) {
		var yThatCutsFewestRects = _.min(yValues, function(y) {
			return rectutils.numContainingY(candidates, y)
		});
		numContainingy = rectutils.numContainingY(candidates, yThatCutsFewestRects)
	}
	if (numContainingX<numContainingy)
		return rectutils.partitionByX(candidates, xThatCutsFewestRects);
	else
		return rectutils.partitionByY(candidates, yThatCutsFewestRects);
}

module.exports = maximumDisjointSet;

