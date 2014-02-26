/**
 * Utilities related to rectangles and collections of rectangles.
 * 
 * Can be used both in js client and node.js server.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01-27
 */
(function(exports){
	
	/**
	 * @param rect1, rect2 - rectangles containing xmin, xmax, ymin and ymax.
	 * @return true if they intersect; false if not.
	 */
	exports.areIntersecting = function(rect1, rect2) {
		return (rect1.xmin<rect2.xmax && rect2.xmin<rect1.xmax && rect1.ymin<rect2.ymax && rect2.ymin<rect1.ymax);
	},

	/**
	 * @param rectangles a list of rectangles containing xmin and xmax values.
	 * @return a sorted list of all X values related to the rectangles.
	 */
	exports.sortedXValues = function (rectangles) {
		var xvalues = {};
		for (var i=0; i<rectangles.length; ++i) {
			var r = rectangles[i];
			xvalues[r.xmin]=xvalues[r.xmax]=true;
		}
		var xlist = Object.keys(xvalues);
		xlist.sort(function(a,b){return a-b});
		return xlist;
	},

	/**
	 * @param rectangles a list of rectangles containing ymin and ymax values.
	 * @return a sorted list of all Y values related to the rectangles.
	 */
	exports.sortedYValues= function (rectangles) {
		var yvalues = {};
		for (var i=0; i<rectangles.length; ++i) {
			var r = rectangles[i];
			yvalues[r.ymin]=yvalues[r.ymax]=true;
		}
		var ylist = Object.keys(yvalues);
		ylist.sort(function(a,b){return a-b});
		return ylist;
	},
	
	/**
	 * @param rectangles a list of rectangles containing xmin and xmax values.
	 * @param x a number.
	 * @return the number of rectangles that interior-contain the given x value.
	 */
	exports.numContainingX= function(rectangles, x) {
		return rectangles.reduce(function(prev,cur) {
			return prev + (cur.xmin<x && x<cur.xmax)
		}, 0);
	},
	
	/**
	 * @param rectangles a list of rectangles containing xmin and xmax values.
	 * @param x a number.
	 * @return the a list of the rectangles that interior-contain the given x value.
	 */
	exports.rectsContainingX= function(rectangles, x) {
		return rectangles.filter(function(cur) {
			return (cur.xmin<x && x<cur.xmax);
		}, []);
	},
	
	/**
	 * @param rectangles a list of rectangles containing xmin and xmax values.
	 * @param x a number.
	 * @return the a list of the rectangles that interior-contain the given x value.
	 */
	exports.partitionByX= function(rectangles, x) {
		var beforeX = [];
		var intersectedByX = [];
		var afterX = [];
		rectangles.forEach(function(cur) {
			if (cur.xmax<=x)
				beforeX.push(cur);
			else if (x<=cur.xmin)
				afterX.push(cur);
			else
				intersectedByX.push(cur);
		});
		return [beforeX, intersectedByX, afterX];
	},
	
	
	/**
	 * @param rectangles a list of rectangles containing ymin and ymax values.
	 * @param y a number.
	 * @return the number of rectangles that interior-contain the given y value.
	 */
	exports.numContainingY= function(rectangles, y) {
		return rectangles.reduce(function(prev,cur) {
			return prev + (cur.ymin<y && y<cur.ymax)
		}, 0);
	},
	
	
	/**
	 * @param rectangles a list of rectangles containing ymin and ymax values.
	 * @param y a number.
	 * @return the a list of the rectangles that interior-contain the given y value.
	 */
	exports.rectsContainingY= function(rectangles, y) {
		return rectangles.filter(function(cur) {
			return (cur.ymin<y && y<cur.ymax);
		}, []);
	},
	
	/**
	 * @param rectangles a list of rectangles containing xmin and xmax values.
	 * @param x a number.
	 * @return the a list of the rectangles that interior-contain the given x value.
	 */
	exports.partitionByY= function(rectangles, y) {
		var beforeY = [];
		var intersectedByY = [];
		var afterY = [];
		rectangles.forEach(function(cur) {
			if (cur.ymax<=y)
				beforeY.push(cur);
			else if (y<=cur.ymin)
				afterY.push(cur);
			else
				intersectedByY.push(cur);
		});
		return [beforeY, intersectedByY, afterY];
	},
	
	
	/**
	 * @param rectangles a list of rectangles defined by xmin, xmax, ymin, ymax.
	 * @param rect another rectangle.
	 * @return the number of 'rectangles' that interior-intersect 'rect'.
	 */
	exports.numRectsIntersectingRect = function(rectangles, rect) {
		return rectangles.reduce(function(prev,cur) {
			return prev + exports.areIntersecting(cur, rect)
		}, 0);
	},
	
	/**
	 * @param rectangles a list of points defined by x, y.
	 * @param rect a rectangle.
	 * @return the number of 'points' in the interior of 'rect'.
	 */
	exports.numPointsInRect = function(points, rect) {
		return points.reduce(function(prev,cur) {
			return prev + 
				(rect.xmin<cur.x && cur.x<rect.xmax && rect.ymin<cur.y && cur.y<rect.ymax)
		}, 0);
	},
	
	/**
	 * @param rectangles a list of rectangles containing ymin,ymax,xmin,xmax.
	 * @param ironRects a list of rectangles that must not be intersected.
	 * @return the list of candidate rectangles that do not intersect any of the ironRects.
	 */
	exports.rectsNotEmpty = function(rectangles) {
		return rectangles.filter(function(cur) {
			return (cur.xmin<cur.xmax && cur.ymin<cur.ymax);
		}, []);
	},

	/**
	 * @param rectangles a list of rectangles containing ymin,ymax,xmin,xmax.
	 * @param ironRects a list of rectangles that must not be intersected.
	 * @return the list of candidate rectangles that do not intersect any of the ironRects.
	 */
	exports.rectsNotIntersecting = function(rectangles, ironRects) {
		return rectangles.filter(function(cur) {
			return (exports.numRectsIntersectingRect(ironRects,cur)==0);
		}, []);
	},
	
	
	/**
	 * @param rectangles a list of rectangles defined by xmin, xmax, ymin, ymax.
	 * @return true if the rectangles are all pairwise disjoint; false otherwise.
	 */
	exports.arePairwiseDisjoint = function(rectangles) {
		for (var i=0; i<rectangles.length; ++i) {
			var rect1 = rectangles[i];
			for (var j=0; j<i; ++j) {
				var rect2 = rectangles[j];
				if (exports.areIntersecting(rect1, rect2))
					return false;
			}
		}
		return true;
	}
})(typeof exports === 'undefined'? this['rectutils']={}: exports);
