var rectangles = require('./rectangles');

/**
 * Find a largest interior-disjoint set of rectangles, from the given set.
 * 
 * @param candidateRects an array of candidate rectangles. 
 * Each rectangle contains the fields: xmin, xmax, ymin, ymax.
 * 
 * @return a largest set of rectangles that do not interior-intersect.
 * 
 * @note uses a simple exact divide-and-conquer algorithm that can be exponential in the worst case.
 * For more complicated algorithms that are provably more efficient (in theory) see: https://en.wikipedia.org/wiki/Maximum_disjoint_set 
 */
function maximumDisjointSet(candidateRects) {
	var MDS = [];
	var minIntersectionCount = rectangles.length;
	var xvalues = rectangles.sortedXValues(candidateRects);
	for (var i=1; i<xvalues.length-1; ++i) {
		var x = xvalues[i];
		// How many rectangles will be intersected if we cut at x?
		var intersectionCount = rectangles.numContainingX(rectangles, x);
		if (intersectionCount<minIntersectionCount) {
			
		}
	}
	return MDS;
}


module.exports = maximumDisjointSet;
