/**
 * Adds to jsts.algorithm some utility functions related to collections of points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */
var _ = require('underscore');

var TOLERANCE=1.01

jsts.algorithm.isPointInXY = function isPointInXY(point, minx,miny,maxx,maxy) {
	return minx<=point.x*TOLERANCE && point.x<=maxx*TOLERANCE && 
	       miny<=point.y*TOLERANCE && point.y<=maxy*TOLERANCE ;
}

jsts.algorithm.isPointInEnvelope = function (point,envelope) {
	return jsts.algorithm.isPointInXY(point, envelope.minx,envelope.miny,envelope.maxx,envelope.maxy);
}

jsts.algorithm.numPointsInXY = function(points, minx,miny,maxx,maxy) {
	return points.reduce(function(num,point) {
		return num + jsts.algorithm.isPointInXY(point, minx,miny,maxx,maxy);
	}, 0);	
}

jsts.algorithm.numPointsInEnvelope = function(points, envelope) {
	return jsts.algorithm.numPointsInXY(points, envelope.minx,envelope.miny,envelope.maxx,envelope.maxy);
}

jsts.algorithm.pointsInXY = function(points, minx,miny,maxx,maxy) {
	return points.filter(function(point) {
		return jsts.algorithm.isPointInXY(point, minx,miny,maxx,maxy)
	});
}

jsts.algorithm.pointsInEnvelope = function(points, envelope) {
	return jsts.algorithm.pointsInXY(points, envelope.minx,envelope.miny,envelope.maxx,envelope.maxy);
}
