var _ = require("underscore");

/**
 * Class ValueFunction represents a valuation function of an agent.
 * Defined by a list of points, all of which have the same value.
 * @author Erel Segal-Halevi
 * @since 2014-04
 */
var ValueFunction = function(totalValue, points, color, valuePerPoint) {
	if (!Array.isArray(points))
		throw new Error("points: expected an array but got "+JSON.stringify(points));
	this.totalValue = totalValue;
	if (!valuePerPoint) valuePerPoint = totalValue/points.length;
	this.valuePerPoint = valuePerPoint;
	this.pointsPerUnitValue = 1/valuePerPoint;
	this.color = color? color: points.color? points.color: null;
	this.setPoints(points);
};

ValueFunction.prototype.setPoints = function(newPoints) {
	this.points = newPoints;
	
	// Don't change the totalValue and the valuePerPoint - they remain as they are 
	//	even when the points are filtered by an envelope!
	var yVals = _.pluck(newPoints,"y");
	yVals.sort(function(a,b){return a-b});
	
	var cuts = [0];
	var curPointsInPiece = 0;
	for (var i=0; i<yVals.length; ++i) {
		curPointsInPiece += 1;
		while (curPointsInPiece>=this.pointsPerUnitValue) {
			cuts.push(yVals[i]);
			curPointsInPiece -= this.pointsPerUnitValue;
		}
	}
	this.yCuts = cuts;
}

ValueFunction.prototype.cloneWithNewPoints = function(newPoints) {
	return new ValueFunction(this.totalValue, newPoints, this.color, this.valuePerPoint);
}

/**
 * @return the value of the given rectangle, according to this value function.
 */
ValueFunction.prototype.valueOf = function(envelope) {
	return this.valuePerPoint * jsts.algorithm.numPointsInEnvelope(this.points, envelope);
}

/**
 * @return the smallest side-length of a square with the given south-west corner {x,y}, containing at least the requested value. 
 * @return Infinity if no such square exists.
 */
ValueFunction.prototype.sizeOfSquareWithValue = function(southWestCorner, requestedValue) {
	var requestedNumOfPoints = Math.ceil(requestedValue / this.valuePerPoint);
	//console.log("requestedNumOfPoints="+requestedNumOfPoints)
	if (this.points.length<requestedNumOfPoints) return Infinity;
	var pointsToNorthEast = this.points.filter(function(point) {
		return point.x>=southWestCorner.x && point.y>=southWestCorner.y;
	});
	if (pointsToNorthEast.length<requestedNumOfPoints) return Infinity;
	var pointsSortedByMaxDistance = _.sortBy(pointsToNorthEast, function(point) {
		return Math.max(point.x-southWestCorner.x, point.y-southWestCorner.y);
	});
	var farthestPoint = pointsSortedByMaxDistance[requestedNumOfPoints-1];
	var sideLength = Math.max(farthestPoint.x-southWestCorner.x, farthestPoint.y-southWestCorner.y);
	return sideLength;
}

/** @return a ValueFunction object based on the given total value and list of points. */
ValueFunction.create = function(totalValue, points) {
	return (points.prototype===ValueFunction.prototype? 
			points:
			new ValueFunction(totalValue, points));
}

/** @return an array of ValueFunction objects based on the given total value (same for all objects) and the lists of points. */
ValueFunction.createArray = function(totalValue, arraysOfPoints) {
	return arraysOfPoints.map(ValueFunction.create.bind(0,totalValue));
}

/** Order the given array of ValueFunction objects by an ascending order of a specific yCut - the yCut with value "yCutValue". */
ValueFunction.orderArrayByYcut = function(valueFunctions, yCutValue) {
	valueFunctions.sort(function(a,b){return a.yCuts[yCutValue]-b.yCuts[yCutValue]}); // order the valueFunctions by their v-line. complexity O(n log n)
}

/** Order the given array of ValueFunction objects by an ascending order of the value they assign to a specific landplot */
/** WARNING: Not thread-safe! */
ValueFunction.orderArrayByLandplotValue = function(valueFunctions, landplot) {
	valueFunctions.forEach(function(a){a.valueOfLandplot = a.valueOf(landplot);})
	valueFunctions.sort(function(a,b){return a.valueOfLandplot-b.valueOfLandplot});
	valueFunctions.forEach(function(a){delete a.valueOfLandplot});
}

/** Order the given array of ValueFunction objects by an ascending order of the ratio of values they assign to two specific landplots */
/** WARNING: Not thread-safe! */
ValueFunction.orderArrayByLandplotValueRatio = function(valueFunctions, landplot1, landplot2) {
	valueFunctions.forEach(function(a){a.ratioOfValues = a.valueOf(landplot1)/a.valueOf(landplot2);})
	valueFunctions.sort(function(a,b){return a.ratioOfValues-b.ratioOfValues});
	valueFunctions.forEach(function(a){delete a.ratioOfValues});
}


module.exports = ValueFunction;
