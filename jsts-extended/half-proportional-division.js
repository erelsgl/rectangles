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

var round2 = function(x) {
	return Math.round(x*100)/100;
}

var Side = {
	South: 1,
	East: 2,
	North: 3,
	West: 4
};


/**
 * Find a set of axis-parallel fat rectangles representing a fair-and-square division for the agents
 * 
 * @param agents an array in which each entry represents the valuation of a single agent.
 * The valuation of an agent is represented by points with fields {x,y}. Each point has the same value.
 *    Each agent may also have a field "color", that is copied to the rectangle.
 * 
 * @param envelope object with fields {minx,miny, maxx,maxy}; defines the boundaries for the landplots.
 * 
 * @param maxAspectRatio maximum aspect ratio allowed for the pieces.
 * 
 * @return a list of rectangles; each rectangle is {minx,miny, maxx,maxy [,color]}.
 */
jsts.geom.GeometryFactory.prototype.createHalfProportionalDivision = function(agents, envelope, maxAspectRatio) {
	var landplots = jsts.algorithm.halfProportionalDivision4Walls(agents, envelope, maxAspectRatio);
	return landplots.map(function(landplot) {
		var rect = new jsts.geom.AxisParallelRectangle(landplot.minx, landplot.miny, landplot.maxx, landplot.maxy, this);
		rect.color = landplot.color;
		return rect;
	});
};

jsts.algorithm.halfProportionalDivision4Walls = function(agents, envelope, maxAspectRatio) {
	var width = envelope.maxx-envelope.minx, height = envelope.maxy-envelope.miny;
	var landplots = runDivisionAlgorithm(
			norm4Walls, agents.length*2, (width<=height? Side.South: Side.East),
			agents, envelope, maxAspectRatio);
	landplots.forEach(function(landplot) {
		for (var field in landplot)
			if (typeof landplot[field] === 'number')
				landplot[field]=round2(landplot[field]);
	});
	return landplots;
}



/************ NORMALIZATION *******************/

var runDivisionAlgorithm = function(normalizedDivisionFunction, assumedValue, southernSide, agents, envelope, maxAspectRatio) {
	if (agents.length==0) 
		return [];
	if (!maxAspectRatio) maxAspectRatio=1;
	
	var rotateTransformation = {rotateQuarters: southernSide - Side.South};
	enveloper = jsts.algorithm.transformAxisParallelRectangle(rotateTransformation, {minx:envelope.minx, maxx:envelope.maxx, miny:envelope.miny, maxy:envelope.maxy});
	
	var width = enveloper.maxx-enveloper.minx, height = enveloper.maxy-enveloper.miny;
	var scaleFactor = 1/Math.min(width,height);
	var yLength = Math.max(width,height)*scaleFactor;

	// transform the system so that the envelope is [0,1]x[0,L], where L>=1:
	var transformation = 
		[rotateTransformation,
		 {translate: [-enveloper.minx,-enveloper.miny]},
		 {scale: scaleFactor}];
	
	var transformedAgents = agents.map(function(pointsOfAgent) {
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
	
	var landplots = normalizedDivisionFunction(transformedAgents, yLength, maxAspectRatio);

	// transform the system back:
	var reverseTransformation = jsts.algorithm.reverseTransformation(transformation);
//	console.dir(envelope);
//	console.dir(agents);
//	console.dir(landplots);
//	console.dir(reverseTransformation);
	landplots.forEach(
		jsts.algorithm.transformAxisParallelRectangle.bind(0,reverseTransformation));
//	console.dir(landplots);

	return landplots;
}





/**
 * Normalized 4-walls algorithm:
 * - agents.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength], where yLength>=1
 * - maxAspectRatio>=1
 */
var norm4Walls = function(agents, yLength, maxAspectRatio) {
	var numOfAgents = agents.length;
	var assumedValue = 2*numOfAgents;
	TRACE("4 Walls Algorithm with n="+numOfAgents+" agents, Val="+assumedValue);

	if (numOfAgents==1) { // base case - single agent - find a square covering
		var agent = agents[0];
		var envelope = {minx:0,maxx:1, miny:0,maxy:yLength};
		var landplot = jsts.algorithm.squareWithMaxNumOfPoints(
					agent, envelope, maxAspectRatio);
		if (agent.color)
			landplot.color = agent.color;
		return [landplot];
	}
	
	// HERE: numOfAgents >= 2

	var yCuts_2k = [], yCuts_2k_minus1 = [], yCuts_2k_next = [];
	yCuts_2k[0] = yCuts_2k_minus1[0] = yCuts_2k_next[0] = yCuts_2k_next[1] = 0;
	for (var v=1; v<=assumedValue; ++v) { // complexity O(n^2 log n)
		agents.sort(function(a,b){return a.yCuts[v]-b.yCuts[v]}); // order the agents by their v-line. complexity O(n log n)
		if (v&1) { // v is odd -  v = 2k-1
			var k = (v+1)>>1;
			yCuts_2k_minus1[k] = agents[k-1].yCuts[v];
		} else {     // v is even - v = 2k
			var k = v>>1;
			yCuts_2k[k] = agents[k-1].yCuts[v];
			if (k<numOfAgents)
				yCuts_2k_next[k] = agents[k].yCuts[v];
		}
	}
	yCuts_2k_next[numOfAgents] = yLength;
	

	// Look for a partition to two 2-fat rectangles:

	for (var k=1; k<=numOfAgents-1; ++k) {
		var y_2k = yCuts_2k[k];           // the k-th 2k line
		var y_2k_next = yCuts_2k_next[k]; // the k+1-th 2k line
		if (!(y_2k<=y_2k_next)) {
			console.error("BUG: y_2k="+y_2k+" y_2k_next="+y_2k_next+"  L="+yLength);
			console.dir(agents);
			return [];
		}
		if (0.5 <= y_2k_next && y_2k <= yLength-0.5) {  // both North and South are 2-fat
			var y = Math.max(y_2k,0.5);
			var south = {minx:0, maxx:1, miny:0, maxy:y},
			    north = {minx:0, maxx:1, miny:y, maxy:yLength};
			
			var k2 = 2*k;
			agents.sort(function(a,b){return a.yCuts[k2]-b.yCuts[k2]}); // order the agents by their k2-line.
			var southAgents = agents.slice(0, k),
			    northAgents = agents.slice(k, numOfAgents);
			TRACE("\tPartition to two 2-fat pieces at y="+y+" in ["+y_2k+","+y_2k_next+"]: k="+k+", "+southAgents.length+" south agents and "+northAgents.length+" north agents.");
			var southPlots = runDivisionAlgorithm(norm4Walls, 2*k,               Side.East,   southAgents, south, maxAspectRatio),
			    northPlots = runDivisionAlgorithm(norm4Walls, 2*(numOfAgents-k), Side.East,    northAgents, north, maxAspectRatio);
			return southPlots.concat(northPlots);
		}
	}

	console.dir(agents);
	TRACE("\tNo partition to two 2-fat pieces: yCuts_2k="+yCuts_2k.map(round2)+", L="+round2(yLength));

	// HERE, for every k, EITHER yCuts_2k[k] and yCuts_2k_next[k] are both smaller than 0.5,
	//                        OR yCuts_2k[k] and yCuts_2k_next[k] are both larger than yLength-0.5, 
	
	// Look for a partition in the "shelves" method:
	
	for (var k=1; k<=numOfAgents-1; ++k) {
		var y_2k = yCuts_2k[k];           // the k-th 2k line
		var y_2k_next = yCuts_2k_next[k]; // the k+1-th 2k line
		if (y_2k_next <= 0.5) {  // South is 2-thin
			
		}
	}
	return [];
}


/**
 * Normalized 4-walls thin algorithm:
 * - agents.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength], where yLength>=1
 * - maxAspectRatio>=1
 */
var norm4WallsThin = function(agents, yLength, maxAspectRatio) {
	var numOfAgents = agents.length;
	var assumedValue = 2*numOfAgents;
	TRACE("4 Walls Thin Algorithm with n="+numOfAgents+" agents, Val="+assumedValue);

	if (numOfAgents==1) { // base case - single agent - find a square covering
		var agent = agents[0];
		var envelope = {minx:0,maxx:1, miny:0,maxy:yLength};
		var landplot = jsts.algorithm.squareWithMaxNumOfPoints(
					agent, envelope, maxAspectRatio);
		if (agent.color)
			landplot.color = agent.color;
		return [landplot];
	}

	// HERE: numOfAgents >= 2

	var yCuts_2k = [], yCuts_2k_minus1 = [], yCuts_2k_next = [];
	yCuts_2k[0] = yCuts_2k_minus1[0] = yCuts_2k_next[0] = yCuts_2k_next[1] = 0;
	for (var v=1; v<=assumedValue; ++v) { // complexity O(n^2 log n)
		agents.sort(function(a,b){return a.yCuts[v]-b.yCuts[v]}); // order the agents by their v-line. complexity O(n log n)
		if (v&1) { // v is odd -  v = 2k-1
			var k = (v+1)>>1;
			yCuts_2k_minus1[k] = agents[k-1].yCuts[v];
		} else {     // v is even - v = 2k
			var k = v>>1;
			yCuts_2k[k] = agents[k-1].yCuts[v];
			if (k<numOfAgents)
				yCuts_2k_next[k] = agents[k].yCuts[v];
		}
	}
	yCuts_2k_next[numOfAgents] = yLength;

	// Look for a partition to two 2-fat rectangles:

	for (var k=1; k<=numOfAgents-1; ++k) {
		var y_2km1 = yCuts_2k_minus1[k];  // the k-th 2k line
		var y_2k_next = yCuts_2k_next[k]; // the k+1-th 2k line
		if (!(y_2k<=y_2k_next)) {
			console.error("BUG: y_2k="+y_2k+" y_2k_next="+y_2k_next+"  L="+yLength);
			console.dir(agents);
			return [];
		}
		if (0.5 <= y_2k_next && y_2k <= yLength-0.5) {  // both North and South are 2-fat
			var y = Math.max(y_2k,0.5);
			var south = {minx:0, maxx:1, miny:0, maxy:y},
			    north = {minx:0, maxx:1, miny:y, maxy:yLength};
			
			var k2 = 2*k;
			agents.sort(function(a,b){return a.yCuts[k2]-b.yCuts[k2]}); // order the agents by their k2-line.
			var southAgents = agents.slice(0, k),
			    northAgents = agents.slice(k, numOfAgents);
			TRACE("\tPartition to two 2-fat pieces at y="+y+" in ["+y_2k+","+y_2k_next+"]: k="+k+", "+southAgents.length+" south agents and "+northAgents.length+" north agents.");
			var southPlots = runDivisionAlgorithm(norm4Walls, 2*k,              southAgents, south, maxAspectRatio),
			    northPlots = runDivisionAlgorithm(norm4Walls, 2*(numOfAgents-k), northAgents, north, maxAspectRatio);
			return southPlots.concat(northPlots);
		}
	}

	console.dir(agents);
	TRACE("\tNo partition to two 2-fat pieces: yCuts_2k="+yCuts_2k.map(round2)+", L="+round2(yLength));

	return [];
}


