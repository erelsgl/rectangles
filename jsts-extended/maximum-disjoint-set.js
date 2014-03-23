/**
 * Calculate a largest subset of interior-disjoint shapes from a given set of candidates.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-02
 */

var powerSet = require("powerset");
var _ = require('underscore');

var jsts = require('jsts');

var TRACE_PERFORMANCE = false; 
var numRecursiveCalls;// a measure of performance 


/*--- Main Algorithm ---*/

/**
 * Calculate a largest subset of non-intersecting shapes from a given set of candidates.
 * @param candidates a set of shapes (geometries).
 * @param stopAtCount - After finding this number of disjoint shapes, don't look further (default: infinity)
 * @return a subset of these shapes, that are guaranteed to be pairwise disjoint.
 */
jsts.algorithm.maximumDisjointSet = function(candidates, stopAtCount) {
	if (!stopAtCount) stopAtCount = Infinity;

	if (TRACE_PERFORMANCE) var startTime = new Date();
	candidates = _.chain(candidates)
		.filter(function(cur) { return (cur.getArea() > 0); })  	// remove empty candidates
		.uniq(function(cur) { return cur.toString(); })           // remove duplicates
		.value();
	prepareDisjointCache(candidates);
	if (TRACE_PERFORMANCE) 	console.log("Preparation time = "+(new Date()-startTime)+" [ms]");

	if (TRACE_PERFORMANCE) numRecursiveCalls = 0;
	var maxDisjointSet = maximumDisjointSetRec(candidates,stopAtCount);
	if (TRACE_PERFORMANCE) console.log("numRecursiveCalls="+numRecursiveCalls);
	return maxDisjointSet;
}




/*--- Interior-Disjoint Cache ---*/

function prepareDisjointCache(candidates) {
	for (var ii=0; ii<candidates.length; ++ii) {
		var cur = candidates[ii];
		cur.id = ii;
		cur.normalize();

		// calculate axis-parallel envelope:
		var envelope = cur.getEnvelopeInternal();
		cur.xmin = envelope.getMinX();
		cur.xmax = envelope.getMaxX();
		cur.ymin = envelope.getMinY();
		cur.ymax = envelope.getMaxY();
		
		// pre-calculate interior-disjoint relations with other shapes, to save time:
		cur.disjointCache = [];
		cur.disjointCache[ii] = true; // a shape overlaps itself
		for (var jj=0; jj<ii; jj++) {
			var other = candidates[jj];
			var disjoint = ('groupId' in cur && 'groupId' in other && cur.groupId==other.groupId?
				false:
				disjoint = cur.interiorDisjoint(other));
			if (typeof disjoint==='undefined') {
				console.dir(cur);
				console.dir(other);
				throw new Error("interiorDisjoint returned an undefined value");
			}
			cur.disjointCache[jj] = other.disjointCache[ii] = disjoint;
		}
		cur.overlaps = function(another) {
			if ('id' in another)
				return this.disjointCache[another.id];
			else {
				console.dir(another);
				throw new Error("id not found");
			}
		}
	}
	//	console.dir(candidates);
}

/**
 * @return true iff all pairs of shapes in the given array are interior-disjoint
 */
function arePairwiseInteriorDisjoint(shapes) {
	for (var i=0; i<shapes.length; ++i) {
		var shape_i_id = shapes[i].id;
		for (var j=0; j<i; ++j) 
			if (!shapes[j].disjointCache[shape_i_id])
				return false;
	}
	return true;
}


/**
 * @return all shapes from the "shapes" array that do not overlap any of the shapes in the "referenceShapes" array.
 */
function calcInteriorDisjoint(shapes, referenceShapes) {
	var referenceShapesIds = _.pluck(referenceShapes, "id");
	return shapes.filter(function(shape) {
		for (var i=0; i<referenceShapesIds.length; ++i) 
			if (!shape.disjointCache[referenceShapesIds[i]])
				return false;
		return true;
	});
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
function maximumDisjointSetRec(candidates,stopAtCount) {
	if (TRACE_PERFORMANCE) ++numRecursiveCalls;
	if (candidates.length<=1) 
		return candidates;

	var currentMaxDisjointSet = [];
	var partition = partitionShapes(candidates);
			//	partition[0] - on one side of separator;
			//	partition[1] - intersected by separator;
			//	partition[2] - on the other side of separator (- guaranteed to be disjoint from rectangles in partition[0]);

	var allSubsetsOfIntersectedShapes = powerSet(partition[1]);

	for (var i=0; i<allSubsetsOfIntersectedShapes.length; ++i) {
		var subsetOfIntersectedShapes = allSubsetsOfIntersectedShapes[i];
		if (!arePairwiseInteriorDisjoint(subsetOfIntersectedShapes)) 
			// If the intersected shapes themselves are not pairwise-disjoint, they cannot be a part of an MDS.
			continue;

		var candidatesOnSideOne = calcInteriorDisjoint(partition[0], subsetOfIntersectedShapes);
		var candidatesOnSideTwo = calcInteriorDisjoint(partition[2], subsetOfIntersectedShapes);

		// Make sure candidatesOnSideOne is larger than candidatesOnSideTwo - to enable heuristics
		if (candidatesOnSideOne.length<candidatesOnSideTwo.length) {
			var temp = candidatesOnSideOne;
			candidatesOnSideOne = candidatesOnSideTwo;
			candidatesOnSideTwo = temp;
		}

		// branch-and-bound (advice by D.W.):
		var upperBoundOnNewDisjointSetSize = candidatesOnSideOne.length+candidatesOnSideTwo.length+subsetOfIntersectedShapes.length;
		if (upperBoundOnNewDisjointSetSize<=currentMaxDisjointSet.length)
			continue;

		var maxDisjointSetOnSideOne = maximumDisjointSetRec(candidatesOnSideOne);
		var upperBoundOnNewDisjointSetSize = maxDisjointSetOnSideOne.length+candidatesOnSideTwo.length+subsetOfIntersectedShapes.length;
		if (upperBoundOnNewDisjointSetSize<=currentMaxDisjointSet.length)
			continue;

		var maxDisjointSetOnSideTwo = maximumDisjointSetRec(candidatesOnSideTwo);

		var newDisjointSet = maxDisjointSetOnSideOne.concat(maxDisjointSetOnSideTwo).concat(subsetOfIntersectedShapes);
		if (newDisjointSet.length > currentMaxDisjointSet.length) 
			currentMaxDisjointSet = newDisjointSet;
		
		if (currentMaxDisjointSet.length >= stopAtCount)
			return currentMaxDisjointSet;
	}
	return currentMaxDisjointSet;
}



/*--- Partition subroutines ---*/

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

