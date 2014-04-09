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

var transformPoint1 = function(t, point) {
	if (t.translate) {
		point.x += t.translate[0];
		point.y += t.translate[1];
	}
	if (t.scale) {
		point.x *= t.scale;
		point.y *= t.scale;
	}
	if (t.rotateRadians) {  // PROBLEM: rounding errors
		var sin = Math.sin(t.rotateRadians);
		var cos = Math.cos(t.rotateRadians);
		var newX = cos*point.x - sin*point.y;
		var newY = sin*point.x + cos*point.y;
		point.x = newX;
		point.y = newY;
	}
	if (t.rotateQuarters) {
		var q = (t.rotateQuarters+4)%4;
		var sin = q==1? 1: q==3? -1: 0;
		var cos = q==0? 1: q==2? -1: 0;
		var newX = cos*point.x - sin*point.y;
		var newY = sin*point.x + cos*point.y;
		point.x = newX;
		point.y = newY;
	}
	if (t.reflectXaxis) {
		point.y = -point.y;
	}
	if (t.reflectYaxis) {
		point.x = -point.x;
	}
	if (t.reflectXY) {
		var z = point.x;
		point.x = point.y;
		point.y = z;
	}
}


/**
 * Transforms a point using the given transformation.
 * @param point {x,y}
 * @param transformation array with objects {translate, scale, reflectXaxis, reflectYaxis, reflectXY}
 */
jsts.algorithm.transformPoint = function(transformation, point) {
	if (transformation.forEach)
		transformation.forEach(function(t) {
			transformPoint1(t,point);
		});
	else
		transformPoint1(transformation,point);
	return point;
};

/**
 * Transforms a point using the given transformation.
 * @param point {x,y}
 * @param transformation array with objects {translate, scale, rotateRadians}
 */
jsts.algorithm.transformedPoint = function(transformation, point) {
	return jsts.algorithm.transformPoint(transformation, {x:point.x, y:point.y});
};

/**
 * Transforms an AxisParallelRectangle using the given transformation.
 * @param rect class AxisParallelRectangle
 * @param transformation {translateX, translateY, scale, transpose}
 */
jsts.algorithm.transformAxisParallelRectangle = function(transformation, rect) {
	var newMin = jsts.algorithm.transformPoint(transformation, {x:rect.minx, y:rect.miny});
	var newMax = jsts.algorithm.transformPoint(transformation, {x:rect.maxx, y:rect.maxy});
	rect.minx = Math.min(newMin.x,newMax.x);	rect.miny = Math.min(newMin.y,newMax.y);
	rect.maxx = Math.max(newMin.x,newMax.x);	rect.maxy = Math.max(newMin.y,newMax.y);
	return rect;
};

/**
 * Transforms an AxisParallelRectangle using the given transformation.
 * @param rect class AxisParallelRectangle
 * @param transformation array with objects {translate, scale, rotateRadians}
 */
jsts.algorithm.transformedAxisParallelRectangle = function(transformation, rect) {
	var newMin = jsts.algorithm.transformPoint(transformation, {x:rect.minx, y:rect.miny});
	var newMax = jsts.algorithm.transformPoint(transformation, {x:rect.maxx, y:rect.maxy});
	return 	rect.factory.createAxisParallelRectangle(newMin.x,newMin.Y, newMax.x,newMax.y);
};

var reverseSingleTransformation = function(t) {
	var r = {};
	if (t.translate) 
		r.translate = [-t.translate[0], -t.translate[1]];
	if (t.scale)
		r.scale = 1/t.scale;
	if (t.rotateRadians)
		r.rotateRadians = -t.rotateRadians;
	if (t.rotateQuarters)
		r.rotateQuarters = (4-t.rotateQuarters)%4;
	if (t.reflectXaxis)
		r.reflectXaxis = t.reflectXaxis;
	if (t.reflectYaxis)
		r.reflectYaxis = t.reflectYaxis;
	if (t.reflectXY)
		r.reflectXY = t.reflectXY;
	return r;
}

jsts.algorithm.reverseTransformation = function(transformation) {
	var reverseTransformation = transformation.map(reverseSingleTransformation);
	reverseTransformation.reverse();
	return reverseTransformation;
};


Math.log10 = function(x) {
	return Math.log(x) / Math.LN10;
}

// By Pyrolistical: http://stackoverflow.com/a/1581007/827927
Math.roundToSignificantFigures = function(significantFigures, num) {
	if(num == 0) return 0;
	
	var d = Math.ceil(Math.log10(num < 0 ? -num: num));
	var power = significantFigures - d;
	
	var magnitude = Math.pow(10, power);
	var shifted = Math.round(num*magnitude);
	return shifted/magnitude;
}

jsts.algorithm.roundFields = function(significantFigures, object) {
	for (var field in object)
		if (typeof object[field] === 'number')
			object[field]=Math.roundToSignificantFigures(significantFigures, object[field]);
}
