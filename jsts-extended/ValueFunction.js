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

ValueFunction.prototype.valueOf = function(envelope) {
	return this.valuePerPoint * jsts.algorithm.numPointsInEnvelope(this.points, envelope);
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

/** Order the given ValueFunction object by an ascending order of a specific yCut - the yCut with value "yCutValue". */
ValueFunction.orderArrayByYcut = function(valueFunctions, yCutValue) {
	valueFunctions.sort(function(a,b){return a.yCuts[yCutValue]-b.yCuts[yCutValue]}); // order the valueFunctions by their v-line. complexity O(n log n)
}



module.exports = ValueFunction;
