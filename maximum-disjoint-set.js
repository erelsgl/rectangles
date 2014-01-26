var rectangles = require('./rectangles');
var powerSet = require('./powerset');
var _ = require('underscore');

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
	var xValues = rectangles.sortedXValues(candidateRects);
	xValues.pop();
	xValues.shift();
	if (xValues.length==0)
		return candidateRects;

	var xThatCutsFewestRects = _.min(xValues, function(x) {
		return rectangles.numContainingX(candidateRects, x)
	});
	var rectsThatAreCutByX = rectangles.rectsContainingX(candidateRects, xThatCutsFewestRects);
	console.dir(rectsThatAreCutByX);
	var subsetsOfRectsThatAreCutByX = powerSet(rectsThatAreCutByX);
	console.dir(subsetsOfRectsThatAreCutByX);
	
	return MDS;
}


module.exports = maximumDisjointSet;
