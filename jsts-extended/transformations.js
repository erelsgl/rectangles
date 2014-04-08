/**
 * Adds to jsts.algorithm some utility functions related to affine transformations.
 * 
 * The following fields are supported: 
 * - translateX (real) - added to the x value.
 * - translateY (real) - added to the y value.
 * - scale      (real) - multiplies the x and y values after translation.
 * - transpose  (boolean) - true to swap x with y after scaling.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

/**
 * Transforms a point using the given transformation.
 * @param point {x,y}
 * @param transformation {translateX, translateY, scale, transpose}
 */
jsts.algorithm.transformedPoint = function(transformation, point) {
	var newX = (point.x + transformation.translateX)*transformation.scale;
	var newY = (point.y + transformation.translateY)*transformation.scale;
	return transformation.transpose? {x:newY, y:newX}: {x:newX, y:newY};
};

/**
 * Transforms an AxisParallelRectangle using the given transformation.
 * @param rect class AxisParallelRectangle
 * @param transformation {translateX, translateY, scale, transpose}
 */
jsts.algorithm.transformedAxisParallelRectangle = function(transformation, rect) {
	var newminx = (rect.minx + transformation.translateX)*transformation.scale;
	var newminy = (rect.miny + transformation.translateY)*transformation.scale;
	var newmaxx = (rect.maxx + transformation.translateX)*transformation.scale;
	var newmaxy = (rect.maxy + transformation.translateY)*transformation.scale;
	return transformation.transpose?
			rect.factory.createAxisParallelRectangle(newminy,newminx, newmaxy,newmaxx):
			rect.factory.createAxisParallelRectangle(newminx,newminy, newmaxx,newmaxy);
};

/**
 * Transforms an AxisParallelRectangle using the given transformation.
 * @param rect class AxisParallelRectangle
 * @param transformation {translateX, translateY, scale, transpose}
 */
jsts.algorithm.transformAxisParallelRectangle = function(transformation, rect) {
	var newminx = (rect.minx + transformation.translateX)*transformation.scale;
	var newminy = (rect.miny + transformation.translateY)*transformation.scale;
	var newmaxx = (rect.maxx + transformation.translateX)*transformation.scale;
	var newmaxy = (rect.maxy + transformation.translateY)*transformation.scale;
	if (transformation.transpose) {
		rect.miny = newminx;
		rect.maxy = newmaxx;
		rect.minx = newminy;
		rect.maxx = newmaxy;
	} else {
		rect.minx = newminx;
		rect.maxx = newmaxx;
		rect.miny = newminy;
		rect.maxy = newmaxy;
	}
};

jsts.algorithm.reverseTransformation = function(t) {
	return {
		translateX: t.transpose? -t.translateY*t.scale: -t.translateX*t.scale,
		translateY: t.transpose? -t.translateX*t.scale: -t.translateY*t.scale,
		scale:      1/t.scale,
		transpose:  t.transpose
	}
};
