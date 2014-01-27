(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Utilities related to rectangles and collections of rectangles.
 * 
 * Can be used both in js client and node.js server.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01-27
 */
//(function(exports){

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
	exports.numContainingRect= function(rectangles, rect) {
		return rectangles.reduce(function(prev,cur) {
			return prev + (cur.xmin<rect.xmax && rect.xmin<cur.xmax && cur.ymin<rect.ymax && rect.ymin<cur.ymax);
		}, 0);
	}

//})(typeof exports === 'undefined'? this['rectutils']={}: exports);



},{}]},{},[1])