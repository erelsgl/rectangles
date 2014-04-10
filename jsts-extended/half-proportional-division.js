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
var util = require("util");
var ValueFunction = require("./ValueFunction");

var DEFAULT_ENVELOPE = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,Infinity);

var TRACE = function(n, s) {
	console.log(Array(10-n).join("  ")+s);
};

var roundFields3 = jsts.algorithm.roundFields.bind(0, 3);
var round2 = function(x) { 	return Math.round(x*100)/100; }

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
	TRACE(10,"")
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
	TRACE(10,"")
	var southernSide = (openSide+2)%4;  // the southern side is opposite to the open side.
	var valueFunctions = ValueFunction.createArray(2*agentsValuePoints.length-1, agentsValuePoints)
	var landplots = runDivisionAlgorithm(
			norm3Walls, southernSide,
			valueFunctions, envelope, maxAspectRatio);
	landplots.forEach(roundFields3);
	return landplots;
};

/**
 * Test the given algorithm (jsts.algorithm.halfProportionalDivision4Walls or jsts.algorithm.halfProportionalDivision3Walls)
 * with the given args (array) 
 * and make sure that every agent gets the required num of points.
 */
jsts.algorithm.testAlgorithm = function(algorithm, args, requiredNum)  {
	var landplots = algorithm.apply(0, args);
	var setsOfPoints = args[0];
	
	if (landplots.length<setsOfPoints.length) {
		setsOfPoints.forEach(function(points) {
			console.log(jsts.algorithm.pointsToString(points, points.color)+",");
		});
		throw new Error("Not enough land-plots: "+JSON.stringify(landplots));
	}
	setsOfPoints.forEach(function(points) {
		landplots.forEach(function(landplot) {
			if (points.color == landplot.color) {
				var pointsInLandplot = jsts.algorithm.numPointsInEnvelope(points, landplot);
				if (pointsInLandplot<requiredNum) {
					throw new Error("Not enough points for "+landplot.color+": expected "+requiredNum+" but found only "+pointsInLandplot+" from "+JSON.stringify(points)+" in landplot "+JSON.stringify(landplot));
				}
			}
		})
	})
 }




/************ NORMALIZATION *******************/

var runDivisionAlgorithm = function(normalizedDivisionFunction, southernSide, valueFunctions, envelope, maxAspectRatio) {
	if (valueFunctions.length==0) 
		return [];
	if (!maxAspectRatio) maxAspectRatio=1;

	var rotateTransformation = {rotateQuarters: southernSide - jsts.Side.South};
	enveloper = jsts.algorithm.transformAxisParallelRectangle(rotateTransformation, {minx:envelope.minx, maxx:envelope.maxx, miny:envelope.miny, maxy:envelope.maxy});
	
	var width = enveloper.maxx-enveloper.minx, height = enveloper.maxy-enveloper.miny;
	if (height<=0 && width<=0)
		throw new Error("Zero-sized envelope: "+JSON.stringify(enveloper));
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
//	console.log("Original valueFunctions: "); console.log(util.inspect(valueFunctions,{depth:3}));
//	console.log("transformation: "); console.dir(transformation);
//	console.log("Transformed valueFunctions: "); console.log(util.inspect(transformedvalueFunctions,{depth:3}));
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
	TRACE(numOfAgents,numOfAgents+" agents ("+_.pluck(valueFunctions,"color")+"): 4 Walls Algorithm");

	if (numOfAgents==1) { // base case - single agent:
		var valueFunction = valueFunctions[0];
		var landplot = null;
		//console.dir(valueFunction.yCuts);
		for (var k=1; k<valueFunction.yCuts.length; ++k) {
			var yCutDiff = valueFunction.yCuts[k]-valueFunction.yCuts[k-1];
			if (yCutDiff<=maxAspectRatio) {
				var miny = Math.min(valueFunction.yCuts[k-1], yLength-maxAspectRatio);
				var maxy = miny+maxAspectRatio;
				landplot = {minx:0, maxx:1, miny:miny, maxy:maxy};
				TRACE(numOfAgents,"  -- Landplot to a single agent with >="+valueFunction.pointsPerUnitValue+" points at k="+k+": "+JSON.stringify(landplot));
				break;
			}
		}
		if (!landplot) {
			TRACE(numOfAgents,"  -- No landplot with value 1: "/*+JSON.stringify(valueFunction)*/);
			return [];
		}
		if (valueFunction.color) landplot.color = valueFunction.color;
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


	// A. Look for a vertical partition to two rectangles that are not too thin vertically.
	// This part is only for efficiency. It can be removed without affecting correctness. 

	for (var k=1; k<=numOfAgents-1; ++k) {
		var y_2k = yCuts_2k[k];           // the k-th 2k line
		var y_2k_next = yCuts_2k_next[k]; // the k+1-th 2k line
		if (0.5 <= y_2k_next && y_2k <= yLength-0.5) {  // both North and South are 2-fat
			var y = Math.max(y_2k,0.5);
			var south = {minx:0, maxx:1, miny:0, maxy:y},
			    north = {minx:0, maxx:1, miny:y, maxy:yLength};
			ValueFunction.orderArrayByYcut(valueFunctions, 2*k);
			var southAgents = valueFunctions.slice(0, k),
			    northAgents = valueFunctions.slice(k, numOfAgents);
			TRACE(numOfAgents,"  -- Success: Partition to two 2-fat pieces at y="+round2(y)+" in ["+round2(y_2k)+","+round2(y_2k_next)+"]: k="+k+", "+southAgents.length+" south agents and "+northAgents.length+" north agents.");
			var southPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(y>1? jsts.Side.South: jsts.Side.East),            southAgents, south, maxAspectRatio),
			    northPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(yLength-y>1? jsts.Side.South: jsts.Side.East),    northAgents, north, maxAspectRatio);
			return southPlots.concat(northPlots);
		}
	}

	// HERE, for every k, EITHER yCuts_2k[k] and yCuts_2k_next[k] are both smaller than 0.5,
	//                        OR yCuts_2k[k] and yCuts_2k_next[k] are both larger than yLength-0.5, 

	// B. Look for any vertical partition to two rectangles that may work:

	for (var k=1; k<=numOfAgents-1; ++k) {
		var y_2k = yCuts_2k[k];           // the k-th 2k line
		var y_2k_next = yCuts_2k_next[k]; // the k+1-th 2k line
		ValueFunction.orderArrayByYcut(valueFunctions, 2*k);
		if (y_2k <= yLength-0.5) {  // North will be 2-fat; South may be 2-thin.
			var y = Math.min(y_2k_next, yLength-0.5);
			var south = {minx:0, maxx:1, miny:0, maxy:y};
			var southAgents = valueFunctions.slice(0, k);
			var southPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(y>1? jsts.Side.South: jsts.Side.East),            southAgents, south, maxAspectRatio);
			if (southPlots.length==southAgents.length) {
				var north = {minx:0, maxx:1, miny:y, maxy:yLength};
				var northAgents = valueFunctions.slice(k, numOfAgents);
				var northPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(yLength-y>1? jsts.Side.South: jsts.Side.East),    northAgents, north, maxAspectRatio);
				TRACE(numOfAgents,"  -- Success: Partition to two 2-fat pieces at y="+round2(y)+" in ["+round2(y_2k)+","+round2(y_2k_next)+"]: k="+k+", "+southAgents.length+" south agents and "+northAgents.length+" north agents.");
				return southPlots.concat(northPlots);
			} else {
				TRACE(numOfAgents,"  -- Failure: Closed-south partition at y="+round2(y)+" in ["+round2(y_2k)+","+round2(y_2k_next)+"] failed: k="+k+", "+southAgents.length+" south agents but only "+southPlots.length+" south plots found.");
			}
		} else { // y_2k_next >= y_2k > L-0.5; South will be 2-fat; North may be 2-thin.
			var y = Math.max(y_2k,0.5);
			var north = {minx:0, maxx:1, miny:y, maxy:yLength};
			var northAgents = valueFunctions.slice(k, numOfAgents);
			var northPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(yLength-y>1? jsts.Side.South: jsts.Side.East),    northAgents, north, maxAspectRatio);
			if (northPlots.length==northAgents.length) {
				var south = {minx:0, maxx:1, miny:0, maxy:y};
				var southAgents = valueFunctions.slice(0, k);
				var southPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(y>1? jsts.Side.South: jsts.Side.East),            southAgents, south, maxAspectRatio);
				TRACE(numOfAgents,"  -- Success: Partition to two 2-fat pieces at y="+round2(y)+" in ["+round2(y_2k)+","+round2(y_2k_next)+"]: k="+k+", "+southAgents.length+" south agents and "+northAgents.length+" north agents.");
				return southPlots.concat(northPlots);
			} else {
				TRACE(numOfAgents,"  -- Failure: Closed-north partition at y="+round2(y)+" in ["+round2(y_2k)+","+round2(y_2k_next)+"] k="+k+", "+northAgents.length+" north agents but only "+northPlots.length+" north plots found.");
			}
		}
	}

	TRACE(numOfAgents,"  -- Failure: No vertical partition found. yCuts_2k="+yCuts_2k.map(round2)+", L="+round2(yLength));


	// C. Look for a rotated partition:

	for (var k=1; k<=numOfAgents-1; ++k) {
		var y_2k = yCuts_2k[k];           // the k-th 2k line
		var y_2k_next = yCuts_2k_next[k]; // the k+1-th 2k line
		ValueFunction.orderArrayByYcut(valueFunctions, 2*k);
		if (y_2k <= yLength-0.5) {  // South is 2-thin (y_2k<y_2k_next<0.5)
			var y = y_2k_next;
			var south = {minx:0, maxx:1, miny:0, maxy:y};
			var southAgents = valueFunctions.slice(0, k+1);
			var southPlots = runDivisionAlgorithm(norm3WallsThin, /*open side=north, previous side= */jsts.Side.East, southAgents, south, maxAspectRatio);
			if (southPlots.length==southAgents.length) {
				var highestSouthPlot = _.max(southPlots, function(plot){return plot.maxy});
				TRACE(numOfAgents,"  -- Success: Open-south partition for k="+k+" at y="+round2(y)+" for "+southAgents.length+" agents yielded "+southPlots.length+" plots "+JSON.stringify(southPlots)+" up to y="+round2(highestSouthPlot.maxy));
				var north = {minx:0, maxx:1, miny:highestSouthPlot.maxy, maxy:yLength};
				var northAgents = valueFunctions.slice(k+1, numOfAgents);
				var northPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(yLength-highestSouthPlot.maxy>1? jsts.Side.South: jsts.Side.East),    northAgents, north, maxAspectRatio);
				if (northPlots.length==northAgents.length) {
					TRACE(numOfAgents,"  -- Success: Open-north Partition for k="+k+" at y="+round2(highestSouthPlot.maxy)+" for "+northAgents.length+" agents yielded "+northPlots.length+" plots.");
					return southPlots.concat(northPlots);
				} else {
					TRACE(numOfAgents,"  -- Failure: Open-north Partition for k="+k+" at y="+round2(highestSouthPlot.maxy)+" for "+northAgents.length+" agents yielded only "+northPlots.length+" plots.");
				}
			} else {
				TRACE(numOfAgents,"  -- Failure: Open-south partition at y="+round2(y)+" for "+southAgents.length+" agents yielded only "+southPlots.length+" plots.");
			}
		} else { // North is 2-thin (y_2k_next >= y_2k > L-0.5)
			var y = y_2k;
			var north = {minx:0, maxx:1, miny:y, maxy:yLength};
			var northAgents = valueFunctions.slice(k-1, numOfAgents);
			var northPlots = runDivisionAlgorithm(norm3WallsThin, /*open side=south, previous side = */jsts.Side.West, northAgents, north, maxAspectRatio);
			if (northPlots.length==northAgents.length) {
				var lowestNorthPlots = _.min(northPlots, function(plot){return plot.miny});
				TRACE(numOfAgents,"  -- Success: Open-north partition for k="+k+" at y="+round2(y)+" for "+northAgents.length+" agents yielded "+northPlots.length+" plots down to y="+round2(lowestNorthPlots.miny));
				var south = {minx:0, maxx:1, miny:0, maxy:lowestNorthPlots.miny};
				var southAgents = valueFunctions.slice(0, k-1);
				var southPlots = runDivisionAlgorithm(norm4Walls, /*shorter side = */(lowestNorthPlots.miny>1? jsts.Side.South: jsts.Side.East),    southAgents, south, maxAspectRatio);
				if (southPlots.length==southAgents.length) {
					TRACE(numOfAgents,"  -- Success: Open-south Partition for k="+k+" at y="+round2(lowestNorthPlots.miny)+" for "+southAgents.length+" agents yielded "+southPlots.length+" plots.");
					return southPlots.concat(northPlots);
				} else {
					TRACE(numOfAgents,"  -- Failure: Open-south Partition for k="+k+" at y="+round2(lowestNorthPlots.miny)+" for "+southAgents.length+" agents yielded only "+southPlots.length+" plots.");
				}
			} else {
				TRACE(numOfAgents,"  -- Failure: Open-north partition at y="+round2(y)+" for "+northAgents.length+" agents yielded only "+northPlots.length+" plots.");
			}
		}
	}
	
	return [];
}


/**
 * Normalized 3-walls algorithm:
 * - valueFunctions.length>=2
 * - The envelope is normalized to [0,1]x[0,yLength]
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n-1
 * - Landplots may overflow the northern border
 */
var norm3Walls = function(valueFunctions, yLength, maxAspectRatio) {
	var numOfAgents = valueFunctions.length;
	var assumedValue = 2*numOfAgents-1;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"): 3 Walls Algorithm");

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
	TRACE(numOfAgents,"  -- Partition at y="+y+": k="+k+", "+southAgents.length+" south valueFunctions and 1 north agent.");
	var south = {minx:0, maxx:1, miny:0, maxy:y};
	var southPlots = runDivisionAlgorithm(norm4Walls, (y>1? jsts.Side.South: jsts.Side.East),   southAgents, south, maxAspectRatio);
	if (southPlots.length==southAgents.length) {
		northPlot = {minx:0,maxx:1, miny:y,maxy:y+1};
		if (northAgent.color)
			northPlot.color = northAgent.color;
		southPlots.push(northPlot);
		return southPlots;
	}

	TRACE(numOfAgents,"  -- No partition to 1:(n-1).");
	
	var plots = runDivisionAlgorithm(norm3WallsThin, /*open side=north, previous side=*/ jsts.Side.East,   valueFunctions, south, maxAspectRatio);
	
	return plots;
}

/**
 * Normalized 3-walls thin algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength], yLength>=2
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n-2
 * - Landplots may overflow the eastern border
 */
var norm3WallsThin = function(valueFunctions, yLength, maxAspectRatio) {
	var numOfAgents = valueFunctions.length;
	var assumedValue = 2*numOfAgents-2;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"): 3 Walls Thin Algorithm");
	
	// HERE: numOfAgents >= 2

	var yCuts_2k = [], yCuts_2k_next = [], yCuts_2k_minus1 = [], yCuts_2k_minus1_next = [];
	yCuts_2k[0] = yCuts_2k_minus1[0] = yCuts_2k_next[0] = yCuts_2k_minus1_next[0] = 0;
	for (var v=1; v<=assumedValue; ++v) { // complexity O(n^2 log n)
		ValueFunction.orderArrayByYcut(valueFunctions, v);
		if (v&1) { // v is odd -  v = 2k-1
			var k = (v+1)>>1;
			yCuts_2k_minus1[k] = valueFunctions[k-1].yCuts[v];
			if (k<numOfAgents)
				yCuts_2k_minus1_next[k] = valueFunctions[k].yCuts[v];
		} else {     // v is even - v = 2k
			var k = v>>1;
			yCuts_2k[k] = valueFunctions[k-1].yCuts[v];
			if (k<numOfAgents)
				yCuts_2k_next[k] = valueFunctions[k].yCuts[v];
		}
	}
	yCuts_2k_next[numOfAgents] = yLength;
	
	
	// Look for a partition to two 3-walls pieces open to the east

	for (var k=1; k<=numOfAgents-1; ++k) {
		var y_2k_1 = yCuts_2k_minus1[k];            // the k-th (2k-1) line
		var y_2k_1_next = yCuts_2k_minus1_next[k];  // the (k+1)-th (2k-1) line
		if (1 <= y_2k_1_next && y_2k_1 <= yLength-1) {  // both North and South are 2-fat
			//var y = y_2k_1;
			var y = Math.max(y_2k_1,1);
			
			var south = {minx:0, maxx:1, miny:0, maxy:y},
			    north = {minx:0, maxx:1, miny:y, maxy:yLength};
			
			ValueFunction.orderArrayByYcut(valueFunctions, 2*k-1);
			var southAgents = valueFunctions.slice(0, k),
			    northAgents = valueFunctions.slice(k, numOfAgents);
			TRACE(numOfAgents,"  -- Partition to two 3-walls pieces at y="+y+", k="+k+", "+southAgents.length+" south agents and "+northAgents.length+" north agents.");
			var southPlots = runDivisionAlgorithm(norm3Walls, jsts.Side.West,   southAgents, south, maxAspectRatio),
			    northPlots = runDivisionAlgorithm(norm3Walls, jsts.Side.West,    northAgents, north, maxAspectRatio);
			return southPlots.concat(northPlots);
		}
	}

	TRACE(numOfAgents,"  -- No partition to two 3-walls pieces: yCuts_2k_minus1="+yCuts_2k_minus1.map(round2)+", L="+round2(yLength)+", agents="+JSON.stringify(valueFunctions));
	return [];
}


