/**
 * Calculate a set of representative interior-disjoint shapes from a given set of sets of candidates.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var powerSet = require("powerset");
var _ = require('underscore');

var jsts = require('jsts');
require("./intersection-utils");
require("./partition-utils");

var TRACE_PERFORMANCE = false; 
var numRecursiveCalls;// a measure of performance 


/*--- Main Algorithm ---*/

/**
 * Calculate a largest subset of non-intersecting shapes from a given set of candidates.
 * @param candidates a set of shapes (geometries).
 * @param stopAtCount - After finding this number of disjoint shapes, don't look further (default: infinity)
 * @return a subset of these shapes, that are guaranteed to be pairwise disjoint.
 */
jsts.algorithm.representativeDisjointSet = function(candidateSets) {
	if (TRACE_PERFORMANCE) var startTime = new Date();
	for (var iSet=0; iSet<candidateSets.length; ++iSet)
		candidateSets[iSet] = jsts.algorithm.prepareDisjointCache(jsts.algorithm.prepareShapesToPartition(candidateSets[iSet]));
	if (TRACE_PERFORMANCE) 	console.log("Preparation time = "+(new Date()-startTime)+" [ms]");

	if (TRACE_PERFORMANCE) numRecursiveCalls = 0;
	var repDisjointSet = representativeDisjointSetRec(candidateSets);
	if (TRACE_PERFORMANCE) console.log("numRecursiveCalls="+numRecursiveCalls);
	return repDisjointSet;
}



/*--- Recursive function ---*/

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
function representativeDisjointSetRec(candidateSets) {
	if (TRACE_PERFORMANCE) ++numRecursiveCalls;
	
	var repDisjointSet = [];
	for (var iSet=0; iSet<candidateSets.length; ++iSet) {
		var currentSet = candidateSets[iSet];
		for (var iCandidate=0; iCandidate<currentSet.length; ++iCandidate) {
			var currentCandidate = currentSet[iCandidate];
			if (jsts.algorithm.isDisjointByCachecurrentCandidate, repDisjointSet)
				repDisjointSet.push(currentCandidate);
		}
	}
	return currentMaxDisjointSet;
}
