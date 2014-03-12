/**
 * Adds to jsts.algorithm some simple utility functions related to intersection of shapes.
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

/**
 * @return true iff no pair of shapes in the given array intersect each other.
 */
jsts.algorithm.arePairwiseDisjoint = function(shapes) {
	for (var i=0; i<shapes.length; ++i) {
		var shape1 = shapes[i];
		for (var j=0; j<i; ++j) {
			var shape2 = shapes[j];
			if (shape1.intersects(shape2))
				return false;
		}
	}
	return true;
}

/**
 * @return the number of shapes from the "shapes" array that intersect "referenceShape".
 */
jsts.algorithm.numIntersecting = function(shapes, referenceShape) {
	return shapes.reduce(function(prev,cur) {
		return prev + cur.intersects(referenceShape)
	}, 0);
}

/**
 * @return the number of shapes from the "shapes" array that are within the interior of "referenceShape".
 */
jsts.algorithm.numWithin = function(shapes, referenceShape) {
	return shapes.reduce(function(prev,cur) {
		return prev + cur.within(referenceShape)
	}, 0);
}


/**
 * @return all shapes from the "shapes" array that do not intersect any of the shapes in the "referenceShapes" array.
 */
jsts.algorithm.calcDisjoint = function(shapes, referenceShapes) {
	return shapes.filter(function(cur) {
		return (jsts.algorithm.numIntersecting(referenceShapes,cur)==0);
	}, []);
}
