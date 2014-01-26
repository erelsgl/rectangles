/**
 * Utilities related to rectangles and collections of rectangles.
 */

function Rectangle(x1,y1, x2,y2) {
	this.xmin = Math.min(x1,x2);
	this.xmax = Math.max(x1,x2);
	this.ymin = Math.min(y1,y2);
	this.ymax = Math.max(y1,y2);
}

module.exports = {

	/**
	 * @param rectangles a list of rectangles containing xmin and xmax values.
	 * @return a sorted list of all X values related to the rectangles.
	 */
	sortedXValues: function (rectangles) {
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
	sortedYValues: function (rectangles) {
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
	numContainingX: function(rectangles, x) {
		var num=0;
		for (var i=0; i<rectangles.length; ++i) {
			var r = rectangles[i];
			num += (r.xmin<x && x<r.xmax);
		}
		return num;
	},
	
	/**
	 * @param rectangles a list of rectangles containing xmin and xmax values.
	 * @param x a number.
	 * @return the a list of the rectangles that interior-contain the given x value.
	 */
	rectsContainingX: function(rectangles, x) {
		var rects=[];
		for (var i=0; i<rectangles.length; ++i) {
			var r = rectangles[i];
			if (r.xmin<x && x<r.xmax)
				rects.push(r);
		}
		return rects;
	},
	
	
	/**
	 * @param rectangles a list of rectangles containing ymin and ymax values.
	 * @param y a number.
	 * @return the number of rectangles that interior-contain the given y value.
	 */
	numContainingY: function(rectangles, y) {
		var num=0;
		for (var i=0; i<rectangles.length; ++i) {
			var r = rectangles[i];
			num += (r.ymin<y && y<r.ymax);
		}
		return num;
	},
	
	
	/**
	 * @param rectangles a list of rectangles containing ymin and ymax values.
	 * @param y a number.
	 * @return the a list of the rectangles that interior-contain the given y value.
	 */
	rectsContainingY: function(rectangles, y) {
		var rects=[];
		for (var i=0; i<rectangles.length; ++i) {
			var r = rectangles[i];
			if (r.ymin<y && y<r.ymax)
				rects.push(r);
		}
		return rects;
	},
}
