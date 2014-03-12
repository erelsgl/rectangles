var jsts = require('jsts');
require("./rectangle-utils");

/**
 * Find a set of candidate squares based on a given set of points.
 * 
 * @param points an array of points. Each point should contain the fields: x, y.
 * @param envelope a jsts.geom.Envelope, defining the boundaries for the squares.
 * 
 * @return a set of squares (Polygon's) such that:
 * a. Each square touches two points: one at a corner and one anywhere at the boundary.
 * b. No square contains a point.
 * @note the output can be used as input to jsts.algorithm.maximumDisjointSet
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */
jsts.geom.GeometryFactory.prototype.createSquaresTouchingPoints = function(points, envelope) {
	var xminWall, yminWall, xmaxWall, ymaxWall;
	if (!envelope) {
		xminWall = yminWall = -Infinity;
		xmaxWall = ymaxWall = Infinity;
	} else {
		xminWall = envelope.getMinX();
		yminWall = envelope.getMinY();
		xmaxWall = envelope.getMaxX();
		ymaxWall = envelope.getMaxY();
	}
	var pointObjects = this.createPoints(points);
	var squares = [];
	var slide = 0.1;
	for (var i=0; i<points.length; ++i) {
		for (var j=0; j<i; ++j) {
			var p1 = points[i];
			var p2 = points[j];
			var xmin = Math.min(p1.x,p2.x);
			var xmax = Math.max(p1.x,p2.x);
			var xdist = xmax-xmin;
			var ymin = Math.min(p1.y,p2.y);
			var ymax = Math.max(p1.y,p2.y);
			var ydist = ymax-ymin;

			if (xdist>ydist) {
				var ySmall = Math.max(ymax-xdist, yminWall);
				var yLarge = Math.min(ymin+xdist, ymaxWall);
				var square1 = this.createAxisParallelRectangle({xmin: xmin, ymin: ySmall, xmax: xmax, ymax: ySmall+xdist});
				var square2 = this.createAxisParallelRectangle({xmin: xmin, ymin: yLarge-xdist, xmax: xmax, ymax: yLarge});
			} else {
				var xSmall = Math.max(xmax-ydist, xminWall);
				var xLarge = Math.min(xmin+ydist, xmaxWall);
				var square1 = this.createAxisParallelRectangle({xmin: xSmall, ymin: ymin, xmax: xSmall+ydist, ymax: ymax});
				var square2 = this.createAxisParallelRectangle({xmin: xLarge-ydist, ymin: ymin, xmax: xLarge, ymax: ymax});
			}

			square1.color = square2.color = color(squares.length);
			if (jsts.algorithm.numWithin(pointObjects,square1)==0)  // don't add a square that contains a point.
				squares.push(square1);
			if (jsts.algorithm.numWithin(pointObjects,square2)==0)  // don't add a square that contains a point.
				squares.push(square2);
		}
	}
	return squares;
}


var colors = ['#000','#f00','#0f0','#ff0','#088','#808','#880'];
function color(i) {return colors[i % colors.length]}
