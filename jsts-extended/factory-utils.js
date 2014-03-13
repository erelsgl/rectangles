/**
 * Adds to jsts.geom some simple utility functions related to rectangles.
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

function coord(x,y)  {  return new jsts.geom.Coordinate(x,y); }

/**
 * Constructs an array of <code>Point</code>s from a given array of {x,y} points.
 */
jsts.geom.GeometryFactory.prototype.createPoints = function(points) {
	return points.map(function(point) {
		return this.createPoint(coord(point.x, point.y));
	}, this);
};
