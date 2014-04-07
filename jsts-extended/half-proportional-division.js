/**
 * Divide a cake such that each color gets a square with 1/2n of its points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('jsts');
require("./factory-utils");
require("./AxisParallelRectangle");
require("./square-with-max-points");
require("./transformations");
require("./point-utils");
var _ = require("underscore");
var utils = require('./numeric-utils');

var DEFAULT_ENVELOPE = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,Infinity);

/**
 * Find a set of axis-parallel squares representing a fair-and-square division of the points.
 * 
 * @param agents an array in which each entry represents the valuation of a single agent.
 * The valuation of an agent is represented by points with fields {x,y}.
 * 
 * @param envelope a jsts.geom.Envelope, defining the boundaries for the shapes.
 * 
 * @param maxAspectRatio maximum aspect ratio allowed for the pieces.
 * 
 * @return a list of AxisParallelRectangle's.
 */
jsts.geom.GeometryFactory.prototype.halfProportionalDivision4Walls = function(agents, envelope, maxAspectRatio) {
	var numOfAgents = agents.length;
	if (numOfAgents==0) 
		return [];

	if (!envelope)  envelope = DEFAULT_ENVELOPE;
	if (!maxAspectRatio) maxAspectRatio=1;
	if (numOfAgents==1) { // base case - single agent - find a square covering
		var agent = agents[0];
		var shape = this.createAxisParallelRectangle(
			jsts.algorithm.squareWithMaxNumOfPoints(
					agent, envelope, maxAspectRatio));
		if (agent.color)
			shape.color = agent.color;
		return [shape];
	}
	
	
	// here there are at least two agents:
	
	var width = envelope.maxx-envelope.minx, height = envelope.maxy-envelope.miny;
	var scaleFactor = 1/Math.min(width,height);
	var L = Math.max(width,height)*scaleFactor;
	// assert (L<=2);

	
	// transform the system so that the envelope is [0,1]x[0,L], where L>=1:
	
	var transformation = {
		translateX: -envelope.minx,
		translateY: -envelope.miny,
		scale: scaleFactor,
		transpose: (width>height),
	};
	
	agents = agents.map(function(pointsOfAgent) {
		var newPoints = jsts.algorithm.pointsInEnvelope(pointsOfAgent,envelope).map(jsts.algorithm.transformedPoint.bind(0,transformation));
		if (pointsOfAgent.color)  newPoints.color = pointsOfAgent.color;
		return newPoints;
	});
	console.dir(agents);

	
	// Here the actual implementation begins:
	
	var yCuts = agents.map(function(pointsOfAgent) {
		var yVals = _.pluck(pointsOfAgent,"y");
		yVals.sort(function(a,b){return a-b});
		return utils.cutPoints(yVals, 2*numOfAgents);
	});
	console.dir(yCuts);
	
	
	var shapes = [];


	// transform the system back:

	shapes.forEach(
		jsts.algorithm.transformAxisParallelRectangle.bind(
			jsts.algorithm.reverseTransformation(transformation)));
	return shapes;
}
