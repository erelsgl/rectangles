/**
 * Divide a cake such that each color gets a fair number of points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('jsts');
require("./factory-utils");
require("./AxisParallelRectangle");
var _ = require("underscore");

function coord(x,y)  {  return new jsts.geom.Coordinate(x,y); }

var DEFAULT_ENVELOPE = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,Infinity);

jsts.geom.GeometryFactory.prototype.createSquareWithMaxNumOfPoints = function(points, envelope, maxSlimness) {
	if (!maxSlimness) maxSlimness=1;
	var width = envelope.getWidth(), height = envelope.getHeight();
//	var minPointsX = _.min(points1, function(cur){return cur.x});
//	var maxPointsX = _.max(points1, function(cur){return cur.x});
//	var minPointsY = _.min(points1, function(cur){return cur.y});
//	var maxPointsY = _.max(points1, function(cur){return cur.y});
	var shape = null;
	var slimmestHeight = maxSlimness*height;
	var slimmestWidth = maxSlimness*width;
	if (width<=slimmestHeight && height<=slimmestWidth) {  // the envelope is R-fat - give it entirely to agent 1
		shape = this.createAxisParallelRectangle(envelope.getMinX(),envelope.getMinY(),envelope.getMaxX(),envelope.getMaxY());
	} else if (width>slimmestHeight) {
		var numOfSquaresInCovering = Math.ceil(width/slimmestHeight);  // at least 2
		var stepSize = (width-slimmestHeight)/(numOfSquaresInCovering-1);
		var ymin = envelope.getMinY();
		var ymax = envelope.getMaxY();
		var bestValue = 0;
		var iBestValue = 0;
		for (var i=0; i<numOfSquaresInCovering; ++i) {
			var xmin = envelope.getMinX()+i*stepSize;
			var xmax = xmin+slimmestHeight;
			var curValue = numPointsWithinXY(points, xmin,ymin,xmax,ymax);
			if (curValue>bestValue) {
				bestValue = curValue;
				iBestValue = i;
			}
		}
		var xmin = envelope.getMinX()+iBestValue*stepSize;
		var xmax = xmin+slimmestHeight;
		shape = this.createAxisParallelRectangle(xmin,ymin,xmax,ymax);
	} else {  // height>slimmestWidth
		var numOfSquaresInCovering = Math.ceil(height/slimmestWidth);  // at least 2
		var stepSize = (height-slimmestWidth)/(numOfSquaresInCovering-1);
		var xmin = envelope.getMinX();
		var xmax = envelope.getMaxX();
		var bestValue = 0;
		var iBestValue = 0;
		for (var i=0; i<numOfSquaresInCovering; ++i) {
			var ymin = envelope.getMinY()+i*stepSize;
			var ymax = ymin+slimmestWidth;
			var curValue = numPointsWithinXY(points, xmin,ymin,xmax,ymax);
			if (curValue>bestValue) {
				bestValue = curValue;
				iBestValue = i;
			}
		}
		var ymin = envelope.getMinY()+iBestValue*stepSize;
		var ymax = ymin+slimmestWidth;
		shape = this.createAxisParallelRectangle(xmin,ymin,xmax,ymax);
	}
	if (points.color)
		shape.color = points.color;
	return shape;
}

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
jsts.geom.GeometryFactory.prototype.createFairAndSquareDivision = function(setsOfPoints, envelope, maxSlimness) {
	if (!maxSlimness) maxSlimness=1;
	var numOfAgents = setsOfPoints.length;
	if (numOfAgents==0) 
		return [];
	if (!envelope)  envelope = DEFAULT_ENVELOPE;
	if (numOfAgents==1)   // base case - single agent - find a square covering
		return [this.createSquareWithMaxNumOfPoints(setsOfPoints[0],envelope,maxSlimness)];
	
	// here there are at least two agents.
	
	var width = envelope.getWidth(), height = envelope.getHeight();
	
	var piece1, piece2;
	if (width>=height) {
		var cutPoint = (envelope.getMaxX()+envelope.getMinX())/2;
		var piece1 = new jsts.geom.Envelope(envelope.getMinX(),cutPoint, envelope.getMinY(),envelope.getMaxY());
		var piece2 = new jsts.geom.Envelope(cutPoint,envelope.getMaxX(), envelope.getMinY(),envelope.getMaxY());
	} else {  // width<height
		var cutPoint = (envelope.getMaxY()+envelope.getMinY())/2;
		var piece1 = new jsts.geom.Envelope(envelope.getMinX(),envelope.getMaxX(), envelope.getMinY(),cutPoint);
		var piece2 = new jsts.geom.Envelope(envelope.getMinX(),envelope.getMaxX(), cutPoint,envelope.getMaxY());
	}
	var partners1 = [], partners2 = [];
	for (var i=0; i<setsOfPoints.length; ++i) {
		partners1[i] = [i,numPartners(setsOfPoints[i],piece1,numOfAgents,maxSlimness)];
		partners2[i] = [i,numPartners(setsOfPoints[i],piece2,numOfAgents,maxSlimness)];
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
		var fairDivision1 = this.createFairAndSquareDivision(agentsForPiece1, piece1, maxSlimness);
		var fairDivision2 = this.createFairAndSquareDivision(agentsForPiece2, piece2, maxSlimness);
		return fairDivision1.concat(fairDivision2);
//	} else {
//		return [];
//	}
}


/*---------------- UTILS ---------------*/

var numPointsWithinXY = function(points, xmin,ymin,xmax,ymax) {
	return points.reduce(function(prev,cur) {
		return prev + (xmin<=cur.x && cur.x<=xmax && ymin<=cur.y && cur.y<=ymax);
	}, 0);
}

var numPointsWithinEnvelope = function(points, envelope) {
	return points.reduce(function(prev,cur) {
		return prev + envelope.containsValues(cur.x,cur.y);
	}, 0);
}

var numPartners = function(points, envelope, n, maxSlimness) {
	var A, B, T;
	if (maxSlimness<2) {
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
