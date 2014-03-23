/**
 * Adds to jsts.algorithm some simple utility functions related to intersection of shapes.
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

/**
 * Define the relation "interior-disjoint" (= overlaps or covers or coveredBy)
 */
jsts.geom.Geometry.prototype.interiorDisjoint = function(other) {
	return this.relate(other, "F********");
}

/**
 * @return true iff no pair of shapes in the given array intersect each other.
 */
jsts.algorithm.arePairwiseNotIntersecting = function(shapes) {
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
 * @return true iff no pair of shapes in the given array overlap each other.
 */
jsts.algorithm.arePairwiseNotOverlapping = function(shapes) {
	for (var i=0; i<shapes.length; ++i) {
		var shape1 = shapes[i];
		for (var j=0; j<i; ++j) {
			var shape2 = shapes[j];
			if (shape1.overlaps(shape2))
				return false;
		}
	}
	return true;
}

/**
 * @return true iff all pairs of shapes in the given array are interior-disjoint
 */
jsts.algorithm.arePairwiseInteriorDisjoint = function(shapes) {
	for (var i=0; i<shapes.length; ++i) {
		var shape1 = shapes[i];
		for (var j=0; j<i; ++j) {
			var shape2 = shapes[j];
			if (!shape1.interiorDisjoint(shape2))
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
 * @return the number of shapes from the "shapes" array that intersect "referenceShape".
 */
jsts.algorithm.numOverlapping = function(shapes, referenceShape) {
	return shapes.reduce(function(prev,cur) {
		return prev + cur.overlaps(referenceShape)
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
 * @return all shapes from the "shapes" array that do not overlap any of the shapes in the "referenceShapes" array.
 */
jsts.algorithm.calcNotOverlapping = function(shapes, referenceShapes) {
	return shapes.filter(function(cur) {
		return (jsts.algorithm.numOverlapping(referenceShapes,cur)==0);
	});
}

/**
 * @return all shapes from the "shapes" array that do not overlap any of the shapes in the "referenceShapes" array.
 */
jsts.algorithm.calcNotIntersecting = function(shapes, referenceShapes) {
	return shapes.filter(function(cur) {
		return (jsts.algorithm.numIntersecting(referenceShapes,cur)==0);
	});
}
