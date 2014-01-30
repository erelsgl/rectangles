var rectutils = require('./rectutils');

/**
 * Find a set of candidate squares based on a given set of points.
 * 
 * @param points an array of points.
 * Each point should contain the fields: x, y.
 * 
 * @return a set of squares such that:
 * a. Each square touches two points: one at a corner and one anywhere at the boundary.
 * b. No square contains a point.
 * @note the output can be used as input to maximum-disjoint-set.js.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */
function squaresTouchingPoints(points) {
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
				var square1 = {xmin: xmin, ymin: ymax-xdist, xmax: xmax, ymax: ymax};
				var square2 = {xmin: xmin, ymin: ymin, xmax: xmax, ymax: ymin+xdist};
			} else {
				var square1 = {xmin: xmax-ydist, ymin: ymin, xmax: xmax, ymax: ymax};
				var square2 = {xmin: xmin, ymin: ymin, xmax: xmin+ydist, ymax: ymax};
			}

			square1.color = square2.color = color(squares.length);
			if (rectutils.numPointsInRect(points,square1)==0)  // don't add a square that contains a point.
				squares.push(square1);
			if (rectutils.numPointsInRect(points,square2)==0)
				squares.push(square2);
		}
	}
	return squares;
}


var colors = ['#000','#f00','#0f0','#ff0','#088','#808','#880'];
function color(i) {return colors[i % colors.length]}


module.exports = squaresTouchingPoints;
