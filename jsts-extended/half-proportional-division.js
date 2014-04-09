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
var ValueFunction = require("./ValueFunction");

var DEFAULT_ENVELOPE = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,Infinity);

var TRACE = function(s) {
	console.log(s);
};

var roundFields3 = jsts.algorithm.roundFields.bind(0, 3);

var round2 = function(x) {
	return Math.round(x*100)/100;
}

jsts.Side = {
	South: 0,
	West: 1,
	North: 2,
	East: 3
};





/**
 * Find a set of axis-parallel fat rectangles representing a fair-and-square division for the valueFunctions
 * 
 * @param valueFunctions an array in which each entry represents the valuation of a single agent.
 * The valuation of an agent is represented by points with fields {x,y}. Each point has the same value.
 *    Each agent may also have a field "color", that is copied to the rectangle.
 * 
 * @param envelope object with fields {minx,miny, maxx,maxy}; defines the boundaries for the landplots.
 * 
 * @param maxAspectRatio maximum aspect ratio allowed for the pieces.
 * 
 * @return a list of rectangles; each rectangle is {minx,miny, maxx,maxy [,color]}.
 */
jsts.geom.GeometryFactory.prototype.createHalfProportionalDivision = function(valueFunctions, envelope, maxAspectRatio) {
	var landplots;
	if (isFinite(envelope.minx) && isFinite(envelope.maxx) && isFinite(envelope.miny) && isFinite(envelope.maxy))
		landplots = jsts.algorithm.halfProportionalDivision4Walls(valueFunctions, envelope, maxAspectRatio);
	else {
		var openSide;
		if (envelope.minx==-Infinity) {
			openSide = jsts.Side.West;
//			envelope.minx = -1000;
		} else if (envelope.miny==-Infinity) {
			openSide = jsts.Side.South;
//			envelope.miny = -1000;
		} else if (envelope.maxx==Infinity) {
			openSide = jsts.Side.East;
//			envelope.maxx = 1000;
		} else if (envelope.maxy==Infinity) {
			openSide = jsts.Side.North;
//			envelope.maxy = 1000;
		} else {
			throw new Error("Couldn't understand the envelope: "+JSON.stringify(envelope));
		}
		landplots = jsts.algorithm.halfProportionalDivision3Walls(valueFunctions, envelope, maxAspectRatio, openSide);
	}
	return landplots.map(function(landplot) {
		var rect = new jsts.geom.AxisParallelRectangle(landplot.minx, landplot.miny, landplot.maxx, landplot.maxy, this);
		rect.color = landplot.color;
		return rect;
	});
};

jsts.algorithm.halfProportionalDivision4Walls = function(agentsValuePoints, envelope, maxAspectRatio) {
	var width = envelope.maxx-envelope.minx, height = envelope.maxy-envelope.miny;
	var shorterSide = (width<=height? jsts.Side.South: jsts.Side.East);
	var valueFunctions = ValueFunction.createArray(2*agentsValuePoints.length, agentsValuePoints)
	var landplots = runDivisionAlgorithm(
			norm4Walls, shorterSide /* The norm4walls algorithm assumes that the southern side is shorter */,
			valueFunctions, envelope, maxAspectRatio);
	landplots.forEach(roundFields3);
	return landplots;
}


jsts.algorithm.halfProportionalDivision3Walls = function(agentsValuePoints, envelope, maxAspectRatio, openSide) {
	var southernSide = (openSide+2)%4;  // the southern side is opposite to the open side.
	var valueFunctions = ValueFunction.createArray(2*agentsValuePoints.length-1, agentsValuePoints)
	var landplots = runDivisionAlgorithm(
			norm3Walls, southernSide,
			valueFunctions, envelope, maxAspectRatio);
	landplots.forEach(roundFields3);
	return landplots;
}


/************ NORMALIZATION *******************/

var runDivisionAlgorithm = function(normalizedDivisionFunction, southernSide, valueFunctions, envelope, maxAspectRatio) {
	if (valueFunctions.length==0) 
		return [];
	if (!maxAspectRatio) maxAspectRatio=1;

	var rotateTransformation = {rotateQuarters: southernSide - jsts.Side.South};
	enveloper = jsts.algorithm.transformAxisParallelRectangle(rotateTransformation, {minx:envelope.minx, maxx:envelope.maxx, miny:envelope.miny, maxy:envelope.maxy});
	
	var width = enveloper.maxx-enveloper.minx, height = enveloper.maxy-enveloper.miny;
	if (height<=0)
		throw new Error("Zero height is not allowed: "+JSON.stringify(enveloper));
	if (width<=0)
		width = height/1000;
	var scaleFactor = 1/width;
	var yLength = height*scaleFactor;

	// transform the system so that the envelope is [0,1]x[0,L], where L>=1:
	var transformation = 
		[rotateTransformation,
		 {translate: [-enveloper.minx,-enveloper.miny]},
		 {scale: scaleFactor}];
	
	var transformedvalueFunctions = valueFunctions.map(function(valueFunction) {
		// transform the points of the agent to the envelope [0,1]x[0,L]:
		return valueFunction.cloneWithNewPoints(
			jsts.algorithm.pointsInEnvelope(valueFunction.points, envelope)
			.map(jsts.algorithm.transformedPoint.bind(0,transformation)));
	});
	
	var landplots = normalizedDivisionFunction(transformedvalueFunctions, yLength, maxAspectRatio);

	// transform the system back:
	var reverseTransformation = jsts.algorithm.reverseTransformation(transformation);
//	console.log("Original envelope: "); console.dir(envelope);
//	console.log("Original valueFunctions: "); console.dir(valueFunctions);
//	console.log("transformation: "); console.dir(transformation);
//	console.log("Transformed valueFunctions: "); console.dir(transformedvalueFunctions);
//	console.log("Transformed landplots: "); console.dir(landplots);
//	console.log("reverseTransformation: "); console.dir(reverseTransformation);
	landplots.forEach(
		jsts.algorithm.transformAxisParallelRectangle.bind(0,reverseTransformation));
//	console.log("Reverse-transformed landplots: "); console.dir(landplots);

	return landplots;
}





/**
 * Normalized 4-walls algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength], where yLength>=1 (- the southern side is shorter than the eastern side)
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n
 */
var norm4Walls = function(valueFunctions, yLength, maxAspectRatio) {
	var numOfAgents = valueFunctions.length;
	var assumedValue = 2*numOfAgents;
	TRACE("4 Walls Algorithm with n="+numOfAgents+" valueFunctions, Val="+assumedValue);

	if (numOfAgents==1) { // base case - single agent - find a square covering
		var agent = valueFunctions[0];
		var envelope = {minx:0,maxx:1, miny:0,maxy:yLength};
		var landplot = jsts.algorithm.squareWithMaxNumOfPoints(
					agent.points, envelope, maxAspectRatio);
		if (agent.color) landplot.color = agent.color;
		return [landplot];
	}
	
	// HERE: numOfAgents >= 2

	var yCuts_2k = [], yCuts_2k_minus1 = [], yCuts_2k_next = [];
	yCuts_2k[0] = yCuts_2k_minus1[0] = yCuts_2k_next[0] = yCuts_2k_next[1] = 0;
	for (var v=1; v<=assumedValue; ++v) { // complexity O(n^2 log n)
		ValueFunction.orderArrayByYcut(valueFunctions, v);
		if (v&1) { // v is odd -  v = 2k-1
			var k = (v+1)>>1;
			yCuts_2k_minus1[k] = valueFunctions[k-1].yCuts[v];
		} else {     // v is even - v = 2k
			var k = v>>1;
			yCuts_2k[k] = valueFunctions[k-1].yCuts[v];
			if (k<numOfAgents)
				yCuts_2k_next[k] = valueFunctions[k].yCuts[v];
		}
	}
	yCuts_2k_next[numOfAgents] = yLength;
	

	// Look for a partition to two 2-fat rectangles:

	for (var k=1; k<=numOfAgents-1; ++k) {
		var y_2k = yCuts_2k[k];           // the k-th 2k line
		var y_2k_next = yCuts_2k_next[k]; // the k+1-th 2k line
		if (!(y_2k<=y_2k_next)) {
			console.error("BUG: y_2k="+y_2k+" y_2k_next="+y_2k_next+"  L="+yLength);
			console.dir(valueFunctions);
			return [];
		}
		if (0.5 <= y_2k_next && y_2k <= yLength-0.5) {  // both North and South are 2-fat
			var y = Math.max(y_2k,0.5);
			var south = {minx:0, maxx:1, miny:0, maxy:y},
			    north = {minx:0, maxx:1, miny:y, maxy:yLength};
			
			ValueFunction.orderArrayByYcut(valueFunctions, 2*k);
			var southAgents = valueFunctions.slice(0, k),
			    northAgents = valueFunctions.slice(k, numOfAgents);
			TRACE("\tPartition to two 2-fat pieces at y="+y+" in ["+y_2k+","+y_2k_next+"]: k="+k+", "+southAgents.length+" south valueFunctions and "+northAgents.length+" north valueFunctions.");
			var southPlots = runDivisionAlgorithm(norm4Walls, jsts.Side.East,   southAgents, south, maxAspectRatio),
			    northPlots = runDivisionAlgorithm(norm4Walls, jsts.Side.East,    northAgents, north, maxAspectRatio);
			return southPlots.concat(northPlots);
		}
	}

	console.dir(valueFunctions);
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
 * Normalized 3-walls algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength].
 * - maxAspectRatio>=1.
 * - Value per agent: at least 2*n-1.
 * - Landplots may overflow the northern border.
 */
var norm3Walls = function(valueFunctions, yLength, maxAspectRatio) {
	var numOfAgents = valueFunctions.length;
	var assumedValue = 2*numOfAgents-1;
	TRACE("3 Walls Algorithm with n="+numOfAgents+" valueFunctions, Val="+assumedValue);

	if (numOfAgents==1) { // base case - single agent - give all to the single agent
		var agent = valueFunctions[0];
		var landplot;
		if (yLength<=1) {
			landplot = {minx:0,maxx:1, miny:0,maxy:1};
		} else {
			var envelope = {minx:0,maxx:1, miny:0,maxy:yLength};
			points = jsts.algorithm.pointsInEnvelope(agent.points, envelope);
			envelope.maxy = Math.max(2,envelope.maxy);
			landplot = jsts.algorithm.squareWithMaxNumOfPoints(
				points, envelope, maxAspectRatio);
		}
		if (agent.color)
			landplot.color = agent.color;
		return [landplot];
	}

	// HERE: numOfAgents >= 2
	
	var k = numOfAgents-1;
	ValueFunction.orderArrayByYcut(valueFunctions, assumedValue-1);
	var southAgents = valueFunctions.slice(0,k),
	    northAgent = valueFunctions[k];
	var y = northAgent.yCuts[assumedValue-1];
	TRACE("\tPartition at y="+y+": k="+k+", "+southAgents.length+" south valueFunctions and 1 north agent.");
	var south = {minx:0, maxx:1, miny:0, maxy:y};
	var southPlots = runDivisionAlgorithm(norm4Walls, (y>1? jsts.Side.South: jsts.Side.East),   southAgents, south, maxAspectRatio);
	if (southPlots.length==southAgents.length) {
		northPlot = {minx:0,maxx:1, miny:y,maxy:y+1};
		if (northAgent.color)
			northPlot.color = northAgent.color;
		southPlots.push(northPlot);
		return southPlots;
	}

	console.dir(valueFunctions);
	TRACE("\tNo partition to 1:(n-1)");
	return [];
}


/**
 * Normalized 4-walls thin algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength], where yLength>=1
 * - maxAspectRatio>=1
 */
var norm4WallsThin = function(valueFunctions, yLength, maxAspectRatio) {
	var numOfAgents = valueFunctions.length;
	var assumedValue = 2*numOfAgents;
	TRACE("4 Walls Thin Algorithm with n="+numOfAgents+" valueFunctions, Val="+assumedValue);

	if (numOfAgents==1) { // base case - single agent - find a square covering
		var agent = valueFunctions[0];
		var envelope = {minx:0,maxx:1, miny:0,maxy:yLength};
		var landplot = jsts.algorithm.squareWithMaxNumOfPoints(
					agent.points, envelope, maxAspectRatio);
		if (agent.color)
			landplot.color = agent.color;
		return [landplot];
	}

	// HERE: numOfAgents >= 2

	var yCuts_2k = [], yCuts_2k_minus1 = [], yCuts_2k_next = [];
	yCuts_2k[0] = yCuts_2k_minus1[0] = yCuts_2k_next[0] = yCuts_2k_next[1] = 0;
	for (var v=1; v<=assumedValue; ++v) { // complexity O(n^2 log n)
		valueFunctions.sort(function(a,b){return a.yCuts[v]-b.yCuts[v]}); // order the valueFunctions by their v-line. complexity O(n log n)
		if (v&1) { // v is odd -  v = 2k-1
			var k = (v+1)>>1;
			yCuts_2k_minus1[k] = valueFunctions[k-1].yCuts[v];
		} else {     // v is even - v = 2k
			var k = v>>1;
			yCuts_2k[k] = valueFunctions[k-1].yCuts[v];
			if (k<numOfAgents)
				yCuts_2k_next[k] = valueFunctions[k].yCuts[v];
		}
	}
	yCuts_2k_next[numOfAgents] = yLength;

	// Look for a partition to two 2-fat rectangles:

	for (var k=1; k<=numOfAgents-1; ++k) {
		var y_2km1 = yCuts_2k_minus1[k];  // the k-th 2k line
		var y_2k_next = yCuts_2k_next[k]; // the k+1-th 2k line
		if (!(y_2k<=y_2k_next)) {
			console.error("BUG: y_2k="+y_2k+" y_2k_next="+y_2k_next+"  L="+yLength);
			console.dir(valueFunctions);
			return [];
		}
		if (0.5 <= y_2k_next && y_2k <= yLength-0.5) {  // both North and South are 2-fat
			var y = Math.max(y_2k,0.5);
			var south = {minx:0, maxx:1, miny:0, maxy:y},
			    north = {minx:0, maxx:1, miny:y, maxy:yLength};
			
			var k2 = 2*k;
			valueFunctions.sort(function(a,b){return a.yCuts[k2]-b.yCuts[k2]}); // order the valueFunctions by their k2-line.
			var southAgents = valueFunctions.slice(0, k),
			    northAgents = valueFunctions.slice(k, numOfAgents);
			TRACE("\tPartition to two 2-fat pieces at y="+y+" in ["+y_2k+","+y_2k_next+"]: k="+k+", "+southAgents.length+" south valueFunctions and "+northAgents.length+" north valueFunctions.");
			var southPlots = runDivisionAlgorithm(norm4Walls, southAgents, south, Side.South/*southSide*/, maxAspectRatio),
			    northPlots = runDivisionAlgorithm(norm4Walls, northAgents, north, Side.South/*southSide*/, maxAspectRatio);
			return southPlots.concat(northPlots);
		}
	}

	console.dir(valueFunctions);
	TRACE("\tNo partition to two 2-fat pieces: yCuts_2k="+yCuts_2k.map(round2)+", L="+round2(yLength));

	return [];
}

