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

var TRACE = function(s) {
	console.log(s);
};

/**
 * Find a set of axis-parallel squares representing a fair-and-square division for the agents
 * 
 * @param agents an array in which each entry represents the valuation of a single agent.
 * The valuation of an agent is represented by points with fields {x,y}. Each point has the same value.
 *    Each agent may also have a field "color", that is copied to the rectangle.
 * 
 * @param envelope object with fields {minx,miny, maxx,maxy}; defines the boundaries for the shapes.
 * 
 * @param maxAspectRatio maximum aspect ratio allowed for the pieces.
 * 
 * @return a list of rectangles; each rectangle is {minx,miny, maxx,maxy [,color]}.
 */



/************ NORMALIZATION *******************/

jsts.algorithm.halfProportionalDivision = function(normalizedDivisionFunction, agents, envelope, maxAspectRatio) {
	var numOfAgents = agents.length;
	if (agents.length==0) 
		return [];
	if (!envelope)  envelope = DEFAULT_ENVELOPE;
	if (!maxAspectRatio) maxAspectRatio=1;
	
	// here there are at least two agents:
	var width = envelope.maxx-envelope.minx, height = envelope.maxy-envelope.miny;
	var scaleFactor = 1/Math.min(width,height);
	var yLength = Math.max(width,height)*scaleFactor;

	// transform the system so that the envelope is [0,1]x[0,L], where L>=1:
	var transformation = {
		translateX: -envelope.minx,
		translateY: -envelope.miny,
		scale: scaleFactor,
		transpose: (width>height),
	};

	var assumedValue = 2*numOfAgents;
	
	agents = agents.map(function(pointsOfAgent) {
		// transform the points of the agent to the envelope [0,1]x[0,L]:
		var newPoints = jsts.algorithm.pointsInEnvelope(pointsOfAgent,envelope).map(jsts.algorithm.transformedPoint.bind(0,transformation));
		if (pointsOfAgent.color)  newPoints.color = pointsOfAgent.color;
		
		// Calculate the y-cuts of the agent:
		var yVals = _.pluck(newPoints,"y");
		yVals.sort(function(a,b){return a-b});
		newPoints.yCuts = utils.cutPoints(yVals, assumedValue);
		newPoints.yCuts.unshift(0);
		
		return newPoints;
	});
	
	var shapes = normalizedDivisionFunction(agents, yLength, maxAspectRatio);
	console.dir(shapes);
	
	// transform the system back:
	var reverseTransformation = jsts.algorithm.reverseTransformation(transformation);
	console.dir(reverseTransformation)
	shapes.forEach(
		jsts.algorithm.transformAxisParallelRectangle.bind(reverseTransformation));

	console.dir(shapes);

	return shapes;
}




/************ 4-walls *******************/

/**
 * A subroutine where:
 * - agents.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength], where yLength>=1
 * - maxAspectRatio>=1
 */
jsts.algorithm.halfProportionalDivision4WallsNormalized = function(agents, yLength, maxAspectRatio) {
	var numOfAgents = agents.length;
	TRACE("4 Walls Algorithm with n="+numOfAgents+" agents");
	if (numOfAgents==0) 
		return [];

	if (numOfAgents==1) { // base case - single agent - find a square covering
		var agent = agents[0];
		var envelope = {minx:0,maxx:1, miny:0,maxy:yLength};
		var shape = jsts.algorithm.squareWithMaxNumOfPoints(
					agent, envelope, maxAspectRatio);
		if (agent.color)
			shape.color = agent.color;
		return [shape];
	}
	
	// Here there are at least 2 agents:

	var yCuts_2k = [], yCuts_2k_minus1 = [];
	for (var v=1; v<=assumedValue; ++v) { // complexity O(n^2 log n)
//		console.log("v="+v)
		agents.sort(function(a,b){return a.yCuts[v]-b.yCuts[v]}); // order the agents by their v-line. complexity O(n log n)
		if (v&1) { // v is odd -  v = 2k-1
			var k = (v+1)>>1;
//			console.log("k="+k)
			yCuts_2k_minus1[k] = agents[k-1].yCuts[v];
		} else {     // v is even - v = 2k
			var k = v>>1;
//			console.log("k="+k)
			yCuts_2k[k] = agents[k-1].yCuts[v];
		}
	}

//	console.dir(agents);
//	console.dir(yCuts_2k_minus1);
//	console.dir(yCuts_2k);
	var shapes = [];
	for (var k=1; k<=numOfAgents-1; ++k) {
		var y_2k = yCuts_2k[k];
		if (0.5 <= y_2k && y_2k <= yLength-0.5) {  // both North and South are 2-fat
			var south = {minx:0, maxx:1, miny:0, maxy:y_2k},
			    north = {minx:0, maxx:1, miny:y_2k, maxy:yLength};
			var agentPartition = _.partition(agents, function(agent) {
				return agent.yCuts[2*k]<=y_2k;
			});
			var southAgents = agentPartition[0],
			    northAgents = agentPartition[1];
			TRACE("\tPartition to two 2-fat pieces: k="+k+", "+southAgents.length+" south agents and "+northAgents+" north agents.");
			if (southAgents.length==0 || northAgents.length==0)  {
				console.dir(agentPartition);
				throw new Error("Empty partition of agents for k="+k+", y_2k="+y_2k);
			}
			var southPlots = this.halfProportionalDivision4Walls(southAgents, south, maxAspectRatio),
			    northPlots = this.halfProportionalDivision4Walls(northAgents, north, maxAspectRatio);
			shapes = southPlots.concat(northPlots);
		}
	}
	TRACE("\tNo partition to two 2-fat pieces: yCuts_2k="+yCuts_2k);
	return shapes;
}




// Create versions for non-normalized envelopes by binding the normalized functios to the generic function:
jsts.algorithm.halfProportionalDivision4Walls = jsts.algorithm.halfProportionalDivision.bind(0, jsts.algorithm.halfProportionalDivision4WallsNormalized);
