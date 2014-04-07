/**
 * Divide a square cake such that each color gets a square with 1/2n of its points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('jsts');
require("./factory-utils");
require("./AxisParallelRectangle");
require("./square-with-max-points");
var _ = require("underscore");

var DEFAULT_ENVELOPE = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,Infinity);

/**
 * Find a set of axis-parallel squares based on a given set of points.>
 * 
 * @param points an array of points. Each point should contain the fields: x, y.
 * @param envelope a jsts.geom.Envelope, defining the boundaries for the shapes.
 * 
 * @return a set of shapes (Polygon's) such that:
 * a. Each square touches two points: one at a corner and one anywhere at the boundary.
 * b. No square contains a point.
 */
jsts.geom.GeometryFactory.prototype.createFairAndSquareDivision = function(setsOfPoints, envelope, maxAspectRatio) {
	var numOfAgents = setsOfPoints.length;
	if (numOfAgents==0) 
		return [];

	if (!envelope)  envelope = DEFAULT_ENVELOPE;
	if (!maxAspectRatio) maxAspectRatio=1;
	if (numOfAgents==1) { // base case - single agent - find a square covering
		var shape = this.createAxisParallelRectangle(jsts.algorithm.squareWithMaxNumOfPoints(setsOfPoints[0],envelope,maxAspectRatio));
		if (points.color)
			shape.color = points.color;
		return [shape];
	}
	
	// here there are at least two agents.
	
	var width = envelope.maxx-envelope.minx, height = envelope.maxy-envelope.miny;

	var piece1, piece2;
	if (width>=height) {
		var cutPoint = (envelope.c+envelope.minx)/2;
		var piece1 = new jsts.geom.Envelope(envelope.minx,cutPoint, envelope.miny,envelope.maxy);
		var piece2 = new jsts.geom.Envelope(cutPoint,envelope.maxx, envelope.miny,envelope.maxy);
	} else {  // width<height
		var cutPoint = (envelope.maxy+envelope.miny)/2;
		var piece1 = new jsts.geom.Envelope(envelope.minx,envelope.maxx, envelope.miny,cutPoint);
		var piece2 = new jsts.geom.Envelope(envelope.minx,envelope.maxx, cutPoint,envelope.maxy);
	}
	var partners1 = [], partners2 = [];
	for (var i=0; i<setsOfPoints.length; ++i) {
		partners1[i] = [i,numPartners(setsOfPoints[i],piece1,numOfAgents,maxAspectRatio)];
		partners2[i] = [i,numPartners(setsOfPoints[i],piece2,numOfAgents,maxAspectRatio)];
	}
	var sortByPartnersDecreasingOrder = function(a,b) { return b[1]-a[1]; }
	partners1.sort(sortByPartnersDecreasingOrder);
	
	var agentsForPiece1 = [], agentsForPiece2 = [];
	for (var i=0; i<partners1.length; ++i) {
		var agentIndex = partners1[i][0];
		if (agentsForPiece1.length<partners1[i][1])
			agentsForPiece1.push(setsOfPoints[agentIndex]);
		else
			agentsForPiece2.push(setsOfPoints[agentIndex]);
	}
//	if (agentsForPiece1.length<numOfAgents && agentsForPiece2<numOfAgents) {
		var fairDivision1 = this.createFairAndSquareDivision(agentsForPiece1, piece1, maxAspectRatio);
		var fairDivision2 = this.createFairAndSquareDivision(agentsForPiece2, piece2, maxAspectRatio);
		return fairDivision1.concat(fairDivision2);
//	} else {
//		return [];
//	}
}


/*---------------- UTILS ---------------*/


var numPointsWithinEnvelope = function(points, envelope) {
	return points.reduce(function(prev,cur) {
		return prev + envelope.containsValues(cur.x,cur.y);
	}, 0);
}


var yCuts = function(points, numOfPieces) {
	var A, B, T;
	if (maxAspectRatio<2) {
		A=6; B=8; T=2;
	} else {
		A=4; B=5; T=1;
	}
	var pointsInside = numPointsWithinEnvelope(points, envelope);
	var normalizedValue = (pointsInside/points.length*(A*n-B));
	if (normalizedValue<T)
		return 0;

	for (var k=1; k<=n-2; k++) {
		if (A*k-B<=normalizedValue && normalizedValue<A*(k+1)-B)
			return k;
	}

	if (A*(n-1)-B<=normalizedValue && normalizedValue<=A*n-B-T)
		return n-1;

	return n;
}
