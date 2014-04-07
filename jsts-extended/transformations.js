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
	var newXmin = (rect.xmin + transformation.translateX)*transformation.scale;
	var newYmin = (rect.ymin + transformation.translateY)*transformation.scale;
	var newXmax = (rect.xmax + transformation.translateX)*transformation.scale;
	var newYmax = (rect.ymax + transformation.translateY)*transformation.scale;
	return transformation.transpose?
			rect.factory.createAxisParallelRectangle(newYmin,newXmin, newYmax,newXmax):
			rect.factory.createAxisParallelRectangle(newXmin,newYmin, newXmax,newYmax);
};

/**
 * Transforms an AxisParallelRectangle using the given transformation.
 * @param rect class AxisParallelRectangle
 * @param transformation {translateX, translateY, scale, transpose}
 */
jsts.algorithm.transformAxisParallelRectangle = function(transformation, rect) {
	var newXmin = (rect.xmin + transformation.translateX)*transformation.scale;
	var newYmin = (rect.ymin + transformation.translateY)*transformation.scale;
	var newXmax = (rect.xmax + transformation.translateX)*transformation.scale;
	var newYmax = (rect.ymax + transformation.translateY)*transformation.scale;
	if (transformation.transpose) {
		rect.ymin = newXmin;
		rect.ymax = newXmax;
		rect.xmin = newYmin;
		rect.xmax = newYmax;
	} else {
		rect.xmin = newXmin;
		rect.xmax = newXmax;
		rect.ymin = newYmin;
		rect.ymax = newYmax;
	}
};

jsts.algorithm.reverseTransformation = function(transformation) {
	return {
		translateX: -transformation.translateX,
		translateY: -transformation.translateY,
		scale:      1/transformation.scale,
		transpose:  transformation.transpose
	}
};
