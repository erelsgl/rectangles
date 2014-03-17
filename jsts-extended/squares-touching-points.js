var jsts = require('jsts');
require("./factory-utils");
require("./AxisParallelRectangle");

function coord(x,y)  {  return new jsts.geom.Coordinate(x,y); }

var DEFAULT_ENVELOPE = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,Infinity);

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
	if (!envelope)  envelope = DEFAULT_ENVELOPE;
	var pointObjects = this.createPoints(points);
	var squares = [];
	for (var i=0; i<points.length; ++i) {
		for (var j=0; j<i; ++j) {
			var p1 = points[i];
			var p2 = points[j];
			var xmin = Math.min(p1.x,p2.x);
			var xmax = Math.max(p1.x,p2.x);
			var dist_x = xmax-xmin;
			var ymin = Math.min(p1.y,p2.y);
			var ymax = Math.max(p1.y,p2.y);
			var dist_y = ymax-ymin;

			if (dist_x>dist_y) {
				var ySmall = Math.max(ymax-dist_x, envelope.getMinY());
				var yLarge = Math.min(ymin+dist_x, envelope.getMaxY());
				var square1 = this.createAxisParallelRectangle({xmin: xmin, ymin: ySmall, xmax: xmax, ymax: ySmall+dist_x});
				var square2 = this.createAxisParallelRectangle({xmin: xmin, ymin: yLarge-dist_x, xmax: xmax, ymax: yLarge});
			} else {
				var xSmall = Math.max(xmax-dist_y, envelope.getMinX());
				var xLarge = Math.min(xmin+dist_y, envelope.getMaxX());
				var square1 = this.createAxisParallelRectangle({xmin: xSmall, ymin: ymin, xmax: xSmall+dist_y, ymax: ymax});
				var square2 = this.createAxisParallelRectangle({xmin: xLarge-dist_y, ymin: ymin, xmax: xLarge, ymax: ymax});
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

jsts.geom.GeometryFactory.prototype.createRotatedSquaresTouchingPoints = function(coordinates, envelope) {
	if (!envelope)  envelope = DEFAULT_ENVELOPE;
	coordinates = this.createCoordinates(coordinates);
	var pointObjects = this.createPoints(coordinates);
	var squares = [];
	for (var i=0; i<coordinates.length; ++i) {
		var c1 = coordinates[i];
		for (var j=0; j<i; ++j) {
			var c2 = coordinates[j];
			var dist_x = c2.x-c1.x;
			var dist_y = c2.y-c1.y;
			var mid_x = (c1.x+c2.x)/2;
			var mid_y = (c1.y+c2.y)/2;

			var coords = [];
			coords.push([c1, c2, coord(c2.x-dist_y,c2.y+dist_x), coord(c1.x-dist_y,c1.y+dist_x), c1]);
			coords.push([c1, coord(mid_x-dist_y/2,mid_y+dist_x/2), c2, coord(mid_x+dist_y/2,mid_y-dist_x/2), c1]);
			coords.push([c1, c2, coord(c2.x+dist_y,c2.y-dist_x), coord(c1.x+dist_y,c1.y-dist_x), c1]);

			var groupId = squares.length;
			var groupColor = color(groupId);
			for (var k=0; k<coords.length; ++k) {
				newsquare = this.createPolygon(this.createLinearRing(coords[k]));
				newsquare.groupId = groupId;
				newsquare.color = groupColor;
				if (jsts.algorithm.numWithin(pointObjects,newsquare)==0)  // don't add a square that contains a point.
					squares.push(newsquare);
			}
		}
	}
	return squares;
}


var colors = ['#000','#f00','#0f0','#ff0','#088','#808','#880'];
function color(i) {return colors[i % colors.length]}
