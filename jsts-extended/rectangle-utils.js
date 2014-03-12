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

/**
 * Constructs a <code>Polygon</code> that is an axis-parallel rectangle with the given x and y values.
 * 
 * Can be called either with 4 parameters (xmin,ymin, xmax,ymax)
 * or with a single parameter with 4 fields (xmin,ymin, xmax,ymax).
 */
jsts.geom.GeometryFactory.prototype.createAxisParallelRectangle = function(xmin,ymin, xmax,ymax) {
	if (arguments.length==4)
		return this.createPolygon(this.createLinearRing([
			coord(xmin,ymin), coord(xmax,ymin), coord(xmax,ymax), coord(xmin,ymax), coord(xmin,ymin)
		]));
	else if (arguments.length==1) 
		return this.createAxisParallelRectangle(xmin.xmin, xmin.ymin, xmin.xmax, xmin.ymax);
};
