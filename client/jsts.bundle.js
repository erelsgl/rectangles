(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./lib");

},{"./lib":12}],2:[function(require,module,exports){
/**
 * Adds to jsts.algorithm some utility functions related to affine transformations.
 * 
 * The following fields are supported: 
 * - translate[0] (real)  - added to the x value.
 * - translate[1] (real)  - added to the y value.
 * - scale      (real)    - multiplies the x and y values after translation.
 * - rotateRadians        - rotate in positive directions by given number of radians.
 * - rotateQuarters       - rotate in positive directions by given number of quarters (=90 degrees).
 * - reflectXaxis  (boolean) - convert y to minus y.
 * - reflectYaxis  (boolean) - convert x to minus x.
 * - reflectXY  (boolean) - true to swap x with y after scaling.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

/**
 * Apply a single transformation on a single point.
 * @param t a transformation-description object with one or more fields from {translate, scale, rotateRadians, rotateQuarters, reflectXaxis, reflectYaxis, reflectXY}
 * @param point {x:..,y:..}
 */


var jsts = require('jsts');

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
		var newX = (cos==0? 0: cos*point.x) - (sin==0? 0: sin*point.y);
		var newY = (sin==0? 0: sin*point.x) + (cos==0? 0: cos*point.y);
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
 * Apply an array of transformations on a single point.
 * @param transformation array with transformation-description objects.
 * @param the changed point object.
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
 * @return the given point after the application of the given transformations.
 * @param transformation array with transformation-description objects.
 * @param point {x,y}
 * @note the input point is NOT changed.
 */
jsts.algorithm.transformedPoint = function(transformation, point) {
	return jsts.algorithm.transformPoint(transformation, {x:point.x, y:point.y});
};

/**
 * Transforms an AxisParallelRectangle using the given transformation.
 * @param rect of class AxisParallelRectangle
 * @param transformation an array of transformation-description objects.
 */
jsts.algorithm.transformAxisParallelRectangle = function(transformation, rect) {
	var newMin = jsts.algorithm.transformPoint(transformation, {x:rect.minx, y:rect.miny});
	var newMax = jsts.algorithm.transformPoint(transformation, {x:rect.maxx, y:rect.maxy});
	rect.minx = Math.min(newMin.x,newMax.x);	rect.miny = Math.min(newMin.y,newMax.y);
	rect.maxx = Math.max(newMin.x,newMax.x);	rect.maxy = Math.max(newMin.y,newMax.y);
	return rect;
};

/**
 * @return the given rectangle after the application of the given transformations.
 * @param rect class AxisParallelRectangle
 * @param transformation an array of transformation-description objects.
 */
jsts.algorithm.transformedAxisParallelRectangle = function(transformation, rect) {
	var newMin = jsts.algorithm.transformPoint(transformation, {x:rect.minx, y:rect.miny});
	var newMax = jsts.algorithm.transformPoint(transformation, {x:rect.maxx, y:rect.maxy});
	return 	rect.factory.createAxisParallelRectangle(newMin.x,newMin.y, newMax.x,newMax.y);
};

/**
 * @return a transformation that reverses the effects of the given transformation.
 */
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

/**
 * @return an array of transformations that reverses the effects of the given array of transformations.
 */
jsts.algorithm.reverseTransformation = function(transformation) {
	var reverseTransformation = transformation.map(reverseSingleTransformation);
	reverseTransformation.reverse();
	return reverseTransformation;
};

},{"jsts":30}],3:[function(require,module,exports){
(function() {

  /**
   * Represents an axis-parallel rectangle.
   * Defined by: minx, miny, maxx, maxy.
   * @author Erel Segal-Halevi
   * @since 2014-03
   */


  /**
   * @requires jsts/geom/Geometry.js
   */

  /**
   * @extends {jsts.geom.Geometry}
   * @constructor
   */
  jsts.geom.AxisParallelRectangle = function(minx,miny, maxx,maxy, factory) {
	  this.minx = Math.min(minx,maxx);
	  this.miny = Math.min(miny,maxy);
	  this.maxx = Math.max(minx,maxx);
	  this.maxy = Math.max(miny,maxy);
      this.factory = factory;
  };

  jsts.geom.AxisParallelRectangle.prototype = new jsts.geom.Geometry();
  jsts.geom.AxisParallelRectangle.constructor = jsts.geom.AxisParallelRectangle;

  jsts.geom.AxisParallelRectangle.prototype.getCoordinates = function() {
	  throw new Error("not implemented");
  }
  
  jsts.geom.AxisParallelRectangle.prototype.getCoordinates = function() {
	  throw new Error("not implemented");
	  return [];
  };

  /**
   * @return {boolean}
   */
  jsts.geom.AxisParallelRectangle.prototype.isEmpty = function() {
    return (this.minx==this.maxx || this.miny==this.maxy);
  };

  jsts.geom.AxisParallelRectangle.prototype.getExteriorRing = function() {
	  return this;
  };

  jsts.geom.AxisParallelRectangle.prototype.getInteriorRingN = function(n) {
	  throw new Error("not implemented");
  };

  jsts.geom.AxisParallelRectangle.prototype.getNumInteriorRing = function() {
    return 0;
  };

  /**
   * Returns the area of this <code>Polygon</code>
   *
   * @return the area of the polygon.
   */
  jsts.geom.AxisParallelRectangle.prototype.getArea = function() {
	  if (!this.area)  {
		  this.area = (this.maxx-this.minx)*(this.maxy-this.miny);
	  }
	  return this.area;
  };

  /**
   * Returns the perimeter of this <code>Polygon</code>
   *
   * @return the perimeter of the polygon.
   */
  jsts.geom.AxisParallelRectangle.prototype.getLength = function() {
	  if (!this.length)  {
		  this.length = 2*((maxx-minx)+(maxy-miny));
	  }
	  return this.length;
  };

  /**
   * Computes the boundary of this geometry
   *
   * @return {Geometry} a linear geometry (which may be empty).
   * @see Geometry#getBoundary
   */
  jsts.geom.AxisParallelRectangle.prototype.getBoundary = function() {
	  return this;
  };

  jsts.geom.AxisParallelRectangle.prototype.computeEnvelopeInternal = function() {
    return new jsts.geom.Envelope(this.minx, this.maxx, this.miny, this.maxy);
  };

  jsts.geom.AxisParallelRectangle.prototype.getDimension = function() {
    return 2;
  };

  jsts.geom.AxisParallelRectangle.prototype.getBoundaryDimension = function() {
    return 1;
  };


  /**
   * @param {Geometry}
   *          other
   * @param {number}
   *          tolerance
   * @return {boolean}
   */
  jsts.geom.AxisParallelRectangle.prototype.equalsExact = function(other, tolerance) {
    if (!this.isEquivalentClass(other)) {
      return false;
    }
    if (this.isEmpty() && other.isEmpty()) {
      return true;
    }
    if (this.isEmpty() !== other.isEmpty()) {
      return false;
    }
    return this.minx==other.minx && this.maxx==other.maxx && this.miny==other.miny && this.maxy==other.maxy;
  };

  jsts.geom.AxisParallelRectangle.prototype.compareToSameClass = function(o) {
	  return this.minx==other.minx && this.maxx==other.maxx && this.miny==other.miny && this.maxy==other.maxy;
  };

  jsts.geom.AxisParallelRectangle.prototype.apply = function(filter) {
	  throw new "not implemented";
  };

  jsts.geom.AxisParallelRectangle.prototype.apply2 = function(filter) {
	  throw new "not implemented";
  };

  /**
   * Creates and returns a full copy of this {@link Polygon} object. (including
   * all coordinates contained by it).
   *
   * @return a clone of this instance.
   */
  jsts.geom.AxisParallelRectangle.prototype.clone = function() {
    return new jsts.geom.AxisParallelRectangle(this.minx, this.miny, this.maxx, this.maxy, this.factory);
  };

  jsts.geom.AxisParallelRectangle.prototype.normalize = function() {
  };
  
  jsts.geom.AxisParallelRectangle.prototype.intersects = function(other) {
	  if (other instanceof jsts.geom.AxisParallelRectangle) {
		  return (
				  this.maxx>=other.minx && other.maxx>=this.minx && 
				  this.maxy>=other.miny && other.maxy>=this.miny
				 )
	  } else {
		  throw new "not implemented for "+other;
	  }
  }

  var Location = jsts.geom.Location;

//  jsts.geom.AxisParallelRectangle.prototype.relate2 = function(other) {
//	var im = new jsts.geom.IntersectionMatrix();
//	var II = (
//			  this.maxx>other.minx && other.maxx>this.minx && 
//			  this.maxy>other.miny && other.maxy>this.miny
//			 );
//    im.setAtLeast('FFFFFFFFF');
//	im.set(Location.INTERIOR, Location.INTERIOR, II? "2": "F");
//	return im;
//  }
  
  jsts.geom.AxisParallelRectangle.prototype.overlaps = function(other) {
	  if (other instanceof jsts.geom.AxisParallelRectangle) {
		  return !this.interiorDisjoint(other) && !this.contains(other) && !other.contains(this);
	  } else {
		  throw new "not implemented for "+other;
	  }
  }
  
  jsts.geom.AxisParallelRectangle.prototype.interiorDisjoint = function(other) {
	  if (other instanceof jsts.geom.AxisParallelRectangle) {
		  return (
				  this.maxx<=other.minx || other.maxx<=this.minx || 
				  this.maxy<=other.miny || other.maxy<=this.miny
				 );
	  } else {
		  throw new "not implemented for "+other;
	  }
  }
  
  jsts.geom.AxisParallelRectangle.prototype.contains = function(other) {
	  if (other.coordinate) {
		  var x = other.coordinate.x;
		  var y = other.coordinate.y;
		  return (
				  this.minx<x && x<this.maxx &&
				  this.miny<y && y<this.maxy
				 )
	  } else {
		  throw new "not implemented for "+other;
	  }
  }

  /**
   * @return {String} String representation of Polygon type.
   */
  jsts.geom.AxisParallelRectangle.prototype.getGeometryType = function() {
    return 'Polygon';
  };

  /**
   * @return {String} String representation of Polygon type.
   */
  jsts.geom.AxisParallelRectangle.prototype.toString = function() {
    return 'RECTANGLE(['+this.minx+","+this.maxx+"]x["+this.miny+","+this.maxy+"])";
  };
  
  jsts.geom.AxisParallelRectangle.prototype.CLASS_NAME = 'jsts.geom.AxisParallelRectangle';


  /**
   * Constructs a <code>Polygon</code> that is an axis-parallel rectangle with the given x and y values.
   * 
   * Can be called either with 4 parameters (minx,miny, maxx,maxy)
   * or with a single parameter with 4 fields (minx,miny, maxx,maxy).
   */
  jsts.geom.GeometryFactory.prototype.createAxisParallelRectangle = function(minx,miny, maxx,maxy) {
	if (arguments.length==1) {
		var envelope = minx;
		return new jsts.geom.AxisParallelRectangle(envelope.minx, envelope.miny, envelope.maxx, envelope.maxy, this);
	} else if (arguments.length==4) {
		return new jsts.geom.AxisParallelRectangle(minx,miny, maxx,maxy, this);
	} else {
		throw new Error("createAxisParallelRectangle expected 1 or 4 arguments, but found "+arguments.length)
	}
  };
})();



},{}],4:[function(require,module,exports){
/**
 * Add some extensions to the doubly-linked list of the JSClass library.
 */

var DoublyLinkedList = require('jsclass/src/linked_list').LinkedList.Doubly.Circular;

DoublyLinkedList.prototype.toString = function() {
		var s = "";
		this.forEach(function(node, i) {
			var sfield = "";
			for (var field in node) {
				if (node.hasOwnProperty(field) && field!='prev' && field !='next' && field !='list') {
					if (sfield) sfield+=",";
					sfield += field+":"+node[field];
				}
			}

			if (s) s+=",\n ";
			s +="{"+sfield+"}"
		});
		return "["+s+"]";
}

DoublyLinkedList.prototype.pluck = function(field) {
		var values = [];
		this.forEach(function(node) {
			values.push(node[field]);
		})
		return values;
}
	
DoublyLinkedList.prototype.isEmpty = function() {
		return this.length == 0; 
}

},{"jsclass/src/linked_list":26}],5:[function(require,module,exports){
/**
 * Calculate a largest subset of interior-disjoint shapes from a given set of candidates.
 * 
 * Asynchronous version, with option to interrupt.
 * 
 * @note For a synchronous function, see MaxDisjointSetSync.js
 * 
 * CREDITS:
 * * barry-johnson: http://stackoverflow.com/a/22593680/827927
 * * vkurchatkin:   http://stackoverflow.com/a/22604420/827927
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var Combinatorics = require('js-combinatorics').Combinatorics;
var _ = require('underscore');

var jsts = require('jsts');
require("./intersection-cache");
require("./partition-utils");
var async = require("async");

var TRACE_PERFORMANCE = false; 



/*--- Main Algorithm ---*/

/**
 * Calculate a largest subset of non-intersecting shapes from a given set of candidates.
 * @param candidates a set of shapes (geometries).
 * @param stopAtCount - After finding this number of disjoint shapes, don't look further (default: infinity)
 * @return a subset of these shapes, that are guaranteed to be pairwise disjoint.
 * 
 * @note uses a simple exact divide-and-conquer algorithm that can be exponential in the worst case.
 * For more complicated algorithms that are provably more efficient (in theory) see: https://en.wikipedia.org/wiki/Maximum_disjoint_set 
 */
jsts.algorithm.MaximumDisjointSetSolver = function(candidates, stopAtCount) {
	if (TRACE_PERFORMANCE) var startTime = new Date();
	candidates = jsts.algorithm.prepareDisjointCache(jsts.algorithm.prepareShapesToPartition(candidates));
	if (TRACE_PERFORMANCE) 	console.log("Preparation time = "+(new Date()-startTime)+" [ms]");
	
	this.candidates = candidates;
	this.stopAtCount = stopAtCount? stopAtCount: Infinity;
	this.interrupted = false;
}

jsts.algorithm.MaximumDisjointSetSolver.prototype.interrupt = function(){
    this.interrupted = true;
};


/**
 * Find a largest interior-disjoint set of rectangles, from the given set of candidates.
 * 
 * @param callback(err,result) - asynchronously called with the result.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */
jsts.algorithm.MaximumDisjointSetSolver.prototype.solve = function (callback) {
	if (TRACE_PERFORMANCE) this.numRecursiveCalls = 0;
	this.maximumDisjointSetRec(this.candidates, this.stopAtCount, callback);
	if (TRACE_PERFORMANCE) console.log("numRecursiveCalls="+this.numRecursiveCalls);
}


/*--- Recursive functions ---*/

jsts.algorithm.MaximumDisjointSetSolver.prototype.maximumDisjointSetRec = function(candidates, stopAtCount, callback) {
	if (TRACE_PERFORMANCE) ++numRecursiveCalls;
	if (candidates.length<=1)
		return async.nextTick(callback.bind(null,null,candidates));
	if (this.interrupted)
		return async.nextTick(callback.bind(null,null,[]));

	var partition = jsts.algorithm.partitionShapes(candidates);
			//	partition[0] - on one side of separator;
			//	partition[1] - intersected by separator;
			//	partition[2] - on the other side of separator (- guaranteed to be disjoint from rectangles in partition[0]);
	var t = new Date();
	var allSubsetsOfIntersectedShapes = Combinatorics.power(partition[1]);

	var self = this;
	var currentMaxDisjointSet = [];
	var subsetOfIntersectedShapes = null;
	async.whilst(
			function loopCondition() { 
				if (self.interrupted) return false;
				if (currentMaxDisjointSet.length >= stopAtCount) return false;
				subsetOfIntersectedShapes = allSubsetsOfIntersectedShapes.next();
				if (!subsetOfIntersectedShapes) return false;
				return true;
			},
			function loopBody(loopIterationFinished) {
				if (!jsts.algorithm.arePairwiseDisjointByCache(subsetOfIntersectedShapes))
					return async.nextTick(loopIterationFinished);

				var candidatesOnSideOne = jsts.algorithm.calcDisjointByCache(partition[0], subsetOfIntersectedShapes);
				var candidatesOnSideTwo = jsts.algorithm.calcDisjointByCache(partition[2], subsetOfIntersectedShapes);

				// Make sure candidatesOnSideOne is larger than candidatesOnSideTwo - to enable heuristics
				if (candidatesOnSideOne.length<candidatesOnSideTwo.length) {
					var temp = candidatesOnSideOne;
					candidatesOnSideOne = candidatesOnSideTwo;
					candidatesOnSideTwo = temp;
				}

				// branch-and-bound (advice by D.W.):
				var upperBoundOnNewDisjointSetSize = candidatesOnSideOne.length+candidatesOnSideTwo.length+subsetOfIntersectedShapes.length;
				if (upperBoundOnNewDisjointSetSize<=currentMaxDisjointSet.length)
					return async.nextTick(loopIterationFinished);
				
				async.parallel(
						[self.maximumDisjointSetRec.bind(self, candidatesOnSideOne, stopAtCount),
						 self.maximumDisjointSetRec.bind(self, candidatesOnSideTwo, stopAtCount)],
						function processResults(err, results) {
							if (err) {
								console.dir(err);
								throw new Error(err);
							}
							var maxDisjointSetOnSideOne = results[0];
							var maxDisjointSetOnSideTwo = results[1];
							if (!maxDisjointSetOnSideOne || !maxDisjointSetOnSideTwo) {
								console.dir(results);
								throw new Error("undefined results");
							}
							var newDisjointSet = maxDisjointSetOnSideOne.concat(maxDisjointSetOnSideTwo).concat(subsetOfIntersectedShapes);
							if (newDisjointSet.length>currentMaxDisjointSet.length)
								currentMaxDisjointSet = newDisjointSet;
							async.nextTick(loopIterationFinished);
						}
				)
			}, // end function loopBody
			function loopEnd(err) {
				callback(err, currentMaxDisjointSet);
			}
	); // end of async.whilst
} // end of function maximumDisjointSetRec

},{"./intersection-cache":13,"./partition-utils":15,"async":19,"js-combinatorics":20,"jsts":30,"underscore":34}],6:[function(require,module,exports){
/**
 * Calculate a largest subset of interior-disjoint shapes from a given set of candidates.
 * 
 * Synchronous version.
 * 
 * @note For an asynchronous version that can be interrupted, see MaxDisjointSetAsync.js
 * 
 * CREDITS:
 * * D.W.: http://cs.stackexchange.com/a/20140/1342
 * 
 * @author Erel Segal-Halevi
 * @since 2014-02
 */

var Combinatorics = require('js-combinatorics').Combinatorics;
var _ = require('underscore');

var jsts = require('jsts');
require("./intersection-cache");
require("./partition-utils");

var TRACE_PERFORMANCE = false; 
var numRecursiveCalls;// a measure of performance 


/*--- Main Algorithm ---*/

/**
 * Calculate a largest subset of non-intersecting shapes from a given set of candidates.
 * @param candidates a set of shapes (geometries).
 * @param stopAtCount - After finding this number of disjoint shapes, don't look further (default: infinity)
 * @return a subset of these shapes, that are guaranteed to be pairwise disjoint.
 */
jsts.algorithm.maximumDisjointSet = function(candidates, stopAtCount) {
	if (!stopAtCount) stopAtCount = Infinity;

	if (TRACE_PERFORMANCE) var startTime = new Date();
	candidates = jsts.algorithm.prepareDisjointCache(jsts.algorithm.prepareShapesToPartition(candidates));
	if (TRACE_PERFORMANCE) 	console.log("Preparation time = "+(new Date()-startTime)+" [ms]");
	//	console.dir(candidates);

	if (TRACE_PERFORMANCE) numRecursiveCalls = 0;
	var maxDisjointSet = maximumDisjointSetRec(candidates,stopAtCount);
	if (TRACE_PERFORMANCE) console.log("numRecursiveCalls="+numRecursiveCalls);
	return maxDisjointSet;
}



/*--- Recursive function ---*/

/**
 * Find a largest interior-disjoint set of shapes, from the given set of candidates.
 * 
 * @param candidates an array of candidate rectangles from which to select the MDS.
 * Each rectangle should contain the fields: minx, maxx, miny, maxy.
 * 
 * @return a largest set of rectangles that do not interior-intersect.
 * 
 * @note uses a simple exact divide-and-conquer algorithm that can be exponential in the worst case.
 * For more complicated algorithms that are provably more efficient (in theory) see: https://en.wikipedia.org/wiki/Maximum_disjoint_set 
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */
function maximumDisjointSetRec(candidates,stopAtCount) {
	if (TRACE_PERFORMANCE) ++numRecursiveCalls;
	if (candidates.length<=1) 
		return candidates;

	var currentMaxDisjointSet = [];
	var partition = jsts.algorithm.partitionShapes(candidates);
			//	partition[0] - on one side of separator;
			//	partition[1] - intersected by separator;
			//	partition[2] - on the other side of separator (- guaranteed to be disjoint from rectangles in partition[0]);

	var allSubsetsOfIntersectedShapes = Combinatorics.power(partition[1]);
	var subsetOfIntersectedShapes;
	while (subsetOfIntersectedShapes = allSubsetsOfIntersectedShapes.next()) {
//		console.log("subsetOfIntersectedShapes="+subsetOfIntersectedShapes)
		if (!jsts.algorithm.arePairwiseDisjointByCache(subsetOfIntersectedShapes))
			continue;

		var candidatesOnSideOne = jsts.algorithm.calcDisjointByCache(partition[0], subsetOfIntersectedShapes);
		var candidatesOnSideTwo = jsts.algorithm.calcDisjointByCache(partition[2], subsetOfIntersectedShapes);

		// Make sure candidatesOnSideOne is larger than candidatesOnSideTwo - to enable heuristics
		if (candidatesOnSideOne.length<candidatesOnSideTwo.length) {
			var temp = candidatesOnSideOne;
			candidatesOnSideOne = candidatesOnSideTwo;
			candidatesOnSideTwo = temp;
		}

		// branch-and-bound (advice by D.W.):
		var upperBoundOnNewDisjointSetSize = candidatesOnSideOne.length+candidatesOnSideTwo.length+subsetOfIntersectedShapes.length;
		if (upperBoundOnNewDisjointSetSize<=currentMaxDisjointSet.length)
			continue;

		var maxDisjointSetOnSideOne = maximumDisjointSetRec(candidatesOnSideOne, stopAtCount);
		var upperBoundOnNewDisjointSetSize = maxDisjointSetOnSideOne.length+candidatesOnSideTwo.length+subsetOfIntersectedShapes.length;
		if (upperBoundOnNewDisjointSetSize<=currentMaxDisjointSet.length)
			continue;

		var maxDisjointSetOnSideTwo = maximumDisjointSetRec(candidatesOnSideTwo, stopAtCount-maxDisjointSetOnSideOne.length);

		var newDisjointSet = maxDisjointSetOnSideOne.concat(maxDisjointSetOnSideTwo).concat(subsetOfIntersectedShapes);
		if (newDisjointSet.length > currentMaxDisjointSet.length) 
			currentMaxDisjointSet = newDisjointSet;
		if (currentMaxDisjointSet.length >= stopAtCount)
			break;
	}; // end of while loop
	return currentMaxDisjointSet;
}



},{"./intersection-cache":13,"./partition-utils":15,"js-combinatorics":20,"jsts":30,"underscore":34}],7:[function(require,module,exports){
/**
 * Calculate the minimum square covering of a SimpleRectilinearPolygon.
 * Based on Bar-Yehuda, R. and Ben-Hanoch, E. (1996). A linear-time algorithm for covering simple polygons with similar rectangles. International Journal of Computational Geometry & Applications, 6.01:79-102.
 * 	http://www.citeulike.org/user/erelsegal-halevi/article/12475038
 * 
 * 
 * USAGE EXAMPLE:
 * 
 * var jsts = require("computational-geometry");
 * ...
 * var polygonXY = [0,0, 15,5, 20,20];
 * console.dir(jsts.minSquareCovering(polygonXY));
 * 
 * 
 * @author Erel Segal-Halevi
 * @since 2014-09
 */



var jsts = require("jsts");
require("./SimpleRectilinearPolygon");
require("./Side");

var LinkedList = require('jsclass/src/linked_list').LinkedList;
var ListNode = LinkedList.Node;
var DoublyLinkedList = LinkedList.Doubly.Circular;
require('./DoublyLinkedList');

var almostEqual = require("almost-equal")

function TRACE(s) {
//	console.log(s);
};


var error = function(msg) {throw new Error(msg);}

Math.compare = function(a,b) { return (a<b)-(a>b); }


/*-************ SEGMENT *******************-*/

/**
 * Construct a segment between two corners of a rectilinear polygon
 */
var Segment = function(c0, c1) {
	this.c0 = c0;
	this.c1 = c1;
	this.direction = (
		c0.y<c1.y? jsts.Side.North:
		c0.y>c1.y? jsts.Side.South:
		c0.x<c1.x? jsts.Side.East:
		c0.x>c1.x? jsts.Side.West:
		error("cannot detect the direction: "+JSON.stringify(c0)+", "+JSON.stringify(c1))
	);
	
	this.coveringSquares = new DoublyLinkedList();	 // All squares s selected for the cover and having the following properties:
		// a. s intersects the segment. (Note: every intersection of a square with the segment is on an original concave point???)
		// b. The two edges of s which are orthogonal to the segment are exposed.
		// c. There is a point in the polygon which is covered only by s (and not by any other square selected so far).
		// The squares for each segment are kept sorted by their appearance order.
}

Segment.prototype.initializeProjectionList = function() {
	this.projectionList = new DoublyLinkedList();	 // All vertices visible to this segment; filled during initialization of polygon
}

// this is a function because the corners change!
Segment.prototype.length = function() {
	return Math.abs(this.c0.x-this.c1.x)+Math.abs(this.c0.y-this.c1.y);
}

Segment.prototype.addVisibleCorner = function(corner)	 {	
	var node = new ListNode(corner);   // we need a node because the same corner participates in two different projection lists - positive and negative
	this.projectionList.push(node);
	return node;
}

Segment.prototype.isVertical = function()	 {	return jsts.isVertical(this.direction);	}
Segment.prototype.isHorizontal = function() {	return jsts.isHorizontal(this.direction);	}

Segment.prototype.isKnob = function() {
	return this.c0.isConvex && this.c1.isConvex;
}

Segment.prototype.xSign = function() {	return Math.compare(this.c0.x,this.c1.x);	}
Segment.prototype.ySign = function() {	return Math.compare(this.c0.y,this.c1.y);	}

Segment.prototype.setX = function(x) {
	if (!this.isVertical()) throw new Error("Set X is valid only for a vertical knob");
	this.c0.x = this.c1.x = x;
}

Segment.prototype.setY = function(y) {
	if (!this.isHorizontal()) throw new Error("Set Y is valid only for a horizontal knob");
	this.c0.y = this.c1.y = y;
}

Segment.prototype.getX = function() { return  this.isVertical()? this.c0.x: "["+this.c0.x+","+this.c1.x+"]"; }
Segment.prototype.getY = function() { return  this.isHorizontal()? this.c0.y: "["+this.c0.y+","+this.c1.y+"]"; }

Segment.prototype.yContains = function(point) {
	return 	(this.c0.y >= point.y && point.y >= this.c1.y) ||
			(this.c0.y <= point.y && point.y <= this.c1.y);
}

Segment.prototype.xContains = function(point) {
	return 	(this.c0.x >= point.x && point.x >= this.c1.x) ||
			(this.c0.x <= point.x && point.x <= this.c1.x);
}

Segment.prototype.contains = function(point) {
	if (this.isVertical()) 
		return this.c0.x == point.x && this.yContains(point);
	else 
		return this.c0.y == point.y && this.xContains(point);
}

Segment.prototype.isVerticalEastOf = function(point) {
	return (this.c0.x==this.c1.x) && (this.c0.x > point.x) && this.yContains(point);	}
Segment.prototype.isVerticalWestOf = function(point) {
	return (this.c0.x==this.c1.x) && (this.c0.x < point.x) && this.yContains(point);	}
Segment.prototype.isHorizontalNorthOf = function(point) {
	return (this.c0.y==this.c1.y) && (this.c0.y > point.y) && this.xContains(point);	}
Segment.prototype.isHorizontalSouthOf = function(point) {
	return (this.c0.y==this.c1.y) && (this.c0.y < point.y) && this.xContains(point);	}

Segment.prototype.isInDirectionOf = function(direction,point) {
	switch (direction) {
	case jsts.Side.East: return this.isVerticalEastOf(point);
	case jsts.Side.West: return this.isVerticalWestOf(point);
	case jsts.Side.South: return this.isHorizontalSouthOf(point);
	case jsts.Side.North: return this.isHorizontalNorthOf(point);
	}
}

Segment.prototype.isInDirectionOfSegment = function(direction,segment) {
	switch (direction) {
	case jsts.Side.East: return this.c0.x>segment.c0.x;  // vertical
	case jsts.Side.West: return this.c0.x<segment.c0.x;  // vertical
	case jsts.Side.North: return this.c0.y>segment.c0.y;  // horizontal
	case jsts.Side.South: return this.c0.y<segment.c0.y;  // horizontal
	}
}

Segment.prototype.distanceToCorner = function(corner) {
	return (this.isVertical()? 	
			Math.abs(corner.x-this.c0.x):
			Math.abs(corner.y-this.c0.y));
}

Segment.prototype.distanceToNearestConcaveCorner = function() {
	var nearestSoFar = Infinity;
	this.projectionList.forEach(function(node) {
		var corner = node.data;
		var distance = this.distanceToCorner(corner);
		if (distance<nearestSoFar)
			nearestSoFar = distance;
	}, this);
	return nearestSoFar;
}

/**
 * @return the distance to the nearest side of the polygon.
 * relevant mainly for knobs
 */
Segment.prototype.distanceToNearestBorder = function() {
	return Math.min(
		this.distanceToNearestConcaveCorner(),
		Math.min(
			this.c0.distanceToNearestSegment(jsts.inverseSide(this.prev.direction)),
			this.c1.distanceToNearestSegment(this.next.direction)
		)
	);
}

Segment.prototype.signOfPolygonInterior = function() {
	if (this.isVertical()) 
		return this.next.direction==jsts.Side.East? 1: -1;
	else
		return this.next.direction==jsts.Side.North? 1: -1;
}

/**
 * @return the square adjacent to this segment which is contained in the polygon.
 */
Segment.prototype.getAdjacentSquareInPolygon = function() {
	var x0, x1, y0, y1;
	if (this.isVertical()) {
		x0 = this.c0.x;
		x1 = x0 + this.signOfPolygonInterior() * this.length();
		y0 = this.c0.y;
		y1 = this.c1.y;
	} else {
		x0 = this.c0.x;
		x1 = this.c1.x;
		y0 = this.c0.y;
		y1 = y0 + this.signOfPolygonInterior() * this.length();
	}
	return {
		minx: Math.min(x0,x1),
		maxx: Math.max(x0,x1),
		miny: Math.min(y0,y1),
		maxy: Math.max(y0,y1),
	}
}

Segment.prototype.isAxisParallel = function() {
	return (this.c0.x==this.c1.x || this.c0.y==this.c1.y);
}

Segment.prototype.toString = function() {
	if (this.prev==null) 
		console.warn("this.prev is null!");
	if (this.next==null) 
		console.warn("this.next is null!");
	return "["+
		this.c0+" - "+this.c1+
		" , len="+this.length()+
		" , dir="+this.direction+
		(this.prev && this.next? ", tocorner="+this.distanceToNearestConcaveCorner()+", toborder="+this.distanceToNearestBorder(): "")+
		(this.knobCount? ", knobCount="+this.knobCount: "") +
		"]";
}





/*-************ CORNER *******************-*/

/**
 * Construct a corner structure for a given vertex
 */
var Corner = function(point) {
	this.x = point.x;
	this.y = point.y;
}

/**
 * Set the two segments that meet at the corner, and calculate the turn direction
 */
Corner.prototype.setSegments = function(s0,s1) {
	this.s0 = s0;  // incoming segment
	this.s1 = s1;  // outgoing segment
}

Corner.prototype.calculateConvexity = function(polygonTurnDirection) {
	this.isConvex = (this.turnDirection() == polygonTurnDirection);
}

Corner.prototype.turnDirection = function() {
	return jsts.turn(this.s0.direction, this.s1.direction); // left=-1, right=1
}

/**
 * @return the direction of the polygon interior relative to this (convex) corner. 
 * The direction is returned as a string: SW, SE, NW or NE.
 */
Corner.prototype.directionOfPolygonInterior = function() {
	var northSouth, eastWest;
	
	var dir0 = jsts.sideToLetter[jsts.inverseSide(this.s0.direction)];
	var dir1 = jsts.sideToLetter[this.s1.direction];
	
	if (this.s0.isVertical())
		return dir0+dir1;
	else
		return dir1+dir0;
}

Corner.prototype.signOfPolygonInteriorX = function() {
	return this.s0.isVertical()? this.s0.signOfPolygonInterior(): this.s1.signOfPolygonInterior();
}

Corner.prototype.signOfPolygonInteriorY = function() {
	return this.s0.isHorizontal()? this.s0.signOfPolygonInterior(): this.s1.signOfPolygonInterior();
}

Corner.prototype.distanceToSegment = function(segment) {
	return segment.distanceToCorner(this);
}

/**
 * Set the two segments that see this (concave) corner, and remember our location in their projection lists.
 */
Corner.prototype.setVisibilityInfo = function(positiveVisibilitySegment,negativeVisibilitySegment) {
	if (this.isConvex)
		throw new Error("setVisibilityInfo should be called only for concave corners")
	
	this.positiveVisibilitySegment = positiveVisibilitySegment; // The segment visible to us in the direction of the incoming segment (s0). It contains the point p+.
	this.positiveVisibilityNode = positiveVisibilitySegment.addVisibleCorner(this);  // pointer to the node, in the list of positiveVisibilitySegment, which contains us.
	
	this.negativeVisibilitySegment = negativeVisibilitySegment; // The segment visible to us in the opposite direction to the outgoing segment (s1).  It contains the point p-.
	this.negativeVisibilityNode = negativeVisibilitySegment.addVisibleCorner(this);  // pointer to the node, in the list of negativeVisibilitySegment, which contains us.
}


// remove this corner from ALL lists it participates in:
Corner.prototype.remove = function() {
	this.list.remove(this);
	if (this.positiveVisibilityNode)
		this.positiveVisibilityNode.list.remove(this.positiveVisibilityNode);
	if (this.negativeVisibilityNode)
		this.negativeVisibilityNode.list.remove(this.negativeVisibilityNode);
}

Corner.prototype.distanceToNearestSegment = function(direction) {
	if (this.isConvex) {
		if (direction==jsts.inverseSide(this.s0.direction)) {
			var knobLength = this.s0.length();
			var nextCorner = this.s0.c0;
		} else if (direction==this.s1.direction) {
			var knobLength = this.s1.length();
			var nextCorner = this.s1.c1;
		} else {
			return 0;
		}
		return knobLength + 
			(nextCorner.isConvex? 0: nextCorner.distanceToNearestSegment(direction));
	} else {  // concave corner - use the visibility information:
		if (direction==this.s0.direction) {
			if (!this.positiveVisibilitySegment) throw new Error("missing positive visibility information");
			return this.distanceToSegment(this.positiveVisibilitySegment);
		}
		if (direction==jsts.inverseSide(this.s1.direction)) {
			if (!this.negativeVisibilitySegment) throw new Error("missing negative visibility information");
			return this.distanceToSegment(this.negativeVisibilitySegment);
		}
		return 0;
	}
}

Corner.prototype.toString = function() {
	return "("+this.x+","+this.y+"; "+this.turnDirection()+","+(this.isConvex?"convex":"concave")+")";
}



/*-************ MinSquareCoveringData Structure *******************-*/

var MinSquareCoveringData = jsts.algorithm.MinSquareCoveringData = function(thePolygon) {
	/* Clone the sequence of corners in order to add more information: */
	var points = thePolygon.points;
	var corners = new DoublyLinkedList();
	for (var i=0; i<points.length-1; ++i) 
		corners.push(new Corner(points[i]));
	this.corners = corners;
	
	/* Calculate the sequence of segments and the turn directions of the corners: */
	var segments = new DoublyLinkedList();
	var previousSegment = null;
	var totalTurn = 0;
	corners.forEach(function(corner) {
		var segment = new Segment(corner, corner.next);
		segments.push(segment);
		if (previousSegment) {
			corner.setSegments(previousSegment,segment);
			totalTurn += corner.turnDirection();
		}
		previousSegment = segment;
	}, this);
	this.segments = segments;
	corners.first.setSegments(segments.last, segments.first);
	totalTurn += corners.first.turnDirection();
	this.turnDirection = jsts.turnDirection(totalTurn);
	this.calculateConvexityAndVisibility();
	
	this.factory = thePolygon.factory;
}


MinSquareCoveringData.prototype.isEmpty = function() {
	return this.corners.isEmpty();
}

MinSquareCoveringData.prototype.calculateConvexityAndVisibility = function() {
	/* Decide whether the corners are convex or concave, and calculate visibility information: */
	
	TRACE("calculateConvexityAndVisibility: "+this.corners.length+" corners")
	this.segments.forEach(function(segment) {
		segment.initializeProjectionList();
	});
	this.corners.forEach(function(corner) {
		corner.calculateConvexity(this.turnDirection);
		if (!corner.isConvex) {   // concave corner - calculate visibility information:
			var positiveVisibilitySegment = this.findClosestSegment(corner.s0.direction, corner);
			if (!positiveVisibilitySegment) throw new Error("findClosestSegment returned null for positive visibility of "+corner.toString());
			var negativeVisibilitySegment = this.findClosestSegment(jsts.inverseSide(corner.s1.direction), corner);
			if (!negativeVisibilitySegment) throw new Error("findClosestSegment returned null for negative visibility of "+corner.toString());
			corner.setVisibilityInfo(positiveVisibilitySegment,negativeVisibilitySegment);
		}
	}, this);
	this.checkValid();
}

MinSquareCoveringData.prototype.findClosestSegment = function(direction, point) {
//	console.log("fcs "+point.toString())
	var closestSoFar = null;
	this.segments.forEach(function(segment) {
//		console.log("\tfcs "+point.toString()+" "+segment.isInDirectionOf(direction,point))
		if (segment && segment.isInDirectionOf(direction,point)) {
			if (!closestSoFar || closestSoFar.isInDirectionOfSegment(direction,segment))
				closestSoFar = segment;
		}
	});
//	console.log("\tfcs "+point.toString()+" end");
//	if (!closestSoFar)	throw new Error("findClosestSegment returned null")
	return closestSoFar;
}

/**
 * @param point {x,y}
 * @return true if the point is in the interior of the polygon.
 * Uses the "even-odd rule" algorithm: https://en.wikipedia.org/wiki/Point_in_polygon
 */
MinSquareCoveringData.prototype.contains = function(point) {
	var intersections = 0;
	var onBoundary = false;
	this.segments.forEach(function(segment) {
		//console.dir(segment.c0+" - "+segment.c1);
		if (segment.contains(point))
			onBoundary = true; // point is on the boundary.
		else if (segment.isVerticalEastOf(point))
			intersections++;
	});
	if (onBoundary) return false;
	else return (intersections%2==1); // odd = internal; even = external
}





Segment.prototype.hasContinuator = function() {
	if (!this.isKnob())
		return false;
	if (this.distanceToNearestBorder() < this.length())
		return false;
//	if (this.distanceToNearestBorder() < this.length())
//		return false;
	return true;
}

/**
 * Decide if a given knob-chain supports a continuator.
 * @param knobCount (int) number of knobs in chain: 1, 2, 3 or 4.
 * @param knobStartingChain, knobEndingChain (Segment)
 * 
 */
function hasContinuator(knobCount, knobStartingChain, knobEndingChain) {
	var knobLength = knobStartingChain.length();
	var beforeChain = knobStartingChain.prev;
	var afterChain = knobEndingChain.next;
	switch (knobCount) {
	case 4: 
		return true;
	case 3: 
		var Aprev = beforeChain.c0;
		var Dnext = afterChain.c1;
		//console.log("Aprev:"+Aprev+" Dnext:"+Dnext);
		var Aprev_sees_Dnext = (!Aprev.isConvex && !Dnext.isConvex && Dnext.positiveVisibilitySegment.c1==Aprev);
		return Aprev_sees_Dnext;
	case 2:
		var A = knobStartingChain.c0;
		var Aprev = beforeChain.c0;
		var C = knobEndingChain.c1;
		var Cnext = afterChain.c1;
		
		var AAprev = knobStartingChain.prev.length();
		var A_Aprev = Aprev.isConvex? AAprev: A.distanceToSegment(Aprev.negativeVisibilitySegment);
		var CCnext = knobEndingChain.next.length();
		var C_Cnext = Cnext.isConvex? CCnext: C.distanceToSegment(Cnext.positiveVisibilitySegment);

		//console.log("Aprev:"+Aprev+" Cnext:"+Cnext+" AAprev:"+AAprev+" A_Aprev:"+A_Aprev+" CCnext:"+CCnext+" C_Cnext:"+C_Cnext);

		return (A_Aprev>knobLength && C_Cnext>knobLength) ||
		                (AAprev>=knobLength && C_Cnext==knobLength) ||
		                (A_Aprev==knobLength && CCnext>=knobLength);
	case 1:
		return (knobStartingChain.distanceToNearestBorder() > knobLength+almostEqual.FLT_EPSILON);
	default: 
		throw new Error("Invalid knobCount: "+knobCount);
	}
}

/**
 * @return the first segment, unless it is a knob in the middle of a knob-chain, in which case it returns the first knob in that chain.
 */
MinSquareCoveringData.prototype.firstInChain = function() {
	var segment = this.segments.first;
	
	if (segment.isKnob()) {
		var knobLength = segment.length();
		// Make sure "segment" is the first in a knob chain:
		while (almostEqual(segment.prev.length(),knobLength,0,0.001) && 
				segment.prev.isKnob() && 
				segment.prev!=this.segments.first)  {
			segment = segment.prev;
		}
	}
	
	return segment;
}


/**
 * @return the first knob in a chain supporting a continuator.
 */
MinSquareCoveringData.prototype.findSegmentWithContinuator = function() {
	TRACE("\nfindSegmentWithContinuator: "+this.segments.length+" segments")

	var firstSegment = this.firstInChain();
	var segment = firstSegment;
	for (;;) {
		if (segment.isKnob()) {
			var knobStartingChain = segment;
			var knobLength = knobStartingChain.length();
			
			// Calculate the length of the knob-chain:
			var knobCount = 1;
			var knobEndingChain = segment;
			while (almostEqual(knobEndingChain.next.length(),knobLength,0,0.001) && 
					knobEndingChain.next.isKnob() && 
					knobEndingChain.next!=firstSegment)  {
				knobEndingChain = knobEndingChain.next;
				knobCount++;
			}
			knobStartingChain.knobCount = knobCount;
			
			// Check if there is a continuator starting at knobStartingChain:
			if (hasContinuator(knobCount, knobStartingChain, knobEndingChain))
				return knobStartingChain;

			segment = knobEndingChain.next; // ...and continue searching
		} else {
			segment = segment.next;  // ...and continue searching
		}
		
		if (segment==firstSegment) {
			console.log(this.segments.toString());
			throw new Error("No continuator found - this is against the Theorem!");
		}
	}
}

/**
 * @return a list of all first-knobs with continuators.
 */
MinSquareCoveringData.prototype.findAllSegmentsWithContinuators = function() {
	TRACE("\findAllSegmentsWithContinuators: "+this.segments.length+" segments")
	
	var theSegments = [];

	var firstSegment = this.firstInChain();
	var segment = firstSegment;
	for (;;) {
		if (segment.isKnob()) {
			var knobStartingChain = segment;
			var knobLength = knobStartingChain.length();

			// Calculate the length of the knob-chain:
			var knobCount = 1;
			var knobEndingChain = segment;
			while (almostEqual(knobEndingChain.next.length(),knobLength,0,0.001) && 
					knobEndingChain.next.isKnob() && 
					knobEndingChain.next!=firstSegment)  {
				knobEndingChain = knobEndingChain.next;
				knobCount++;
			}
			knobStartingChain.knobCount = knobCount;

			// Check if there is a continuator starting at knobStartingChain:
			if (hasContinuator(knobCount, knobStartingChain, knobEndingChain))
				theSegments.push(knobStartingChain);
			
			segment = knobEndingChain.next; // ...and continue searching
		} else {
			segment = segment.next;  // ...and continue searching
		}

		if (segment==firstSegment) 
			break;
	}

	if (!theSegments.length) {
		console.log(this.segments.toString());
		throw new Error("No continuator found - this is against the Theorem!");
	}
	
	return theSegments;
}

/**
 *  remove the given segments and their c0/c1 corners.
 *  Segments must be in increasing order.
 */
MinSquareCoveringData.prototype.removeSegments = function(segments, removeCornersBeforeSegments) {
	var prev = segments[0].prev;
	var next = segments[segments.length-1].next;
	for (var i=0; i<segments.length; ++i) {
		var segmentToRemove = segments[i];
		this.segments.remove(segmentToRemove);
		var cornerToRemove = removeCornersBeforeSegments? segmentToRemove.c0: segmentToRemove.c1;
		cornerToRemove.remove();
	}
	if (removeCornersBeforeSegments)  // prev.c1 is before segments[0] and hence removed:
		prev.c1 = next.c0;
	else                              // next.c0 is after segments.last and hence removed:
		next.c0 = prev.c1;
	prev.c1.s1 = next;
	next.c0.s0 = prev;
}


/**
 * @param knob a segment in this.segments.
 * @param knobCount a number between 1 and 4 describing the number of adjacent knobs (starting from knob)
 */
MinSquareCoveringData.prototype.removeErasableRegion = function(knob) {
	if (!knob.isKnob()) {
		console.dir(knob);
		throw new Error("non-knob disguised as a knob!")
	}
	
	var knobCount = knob.knobCount;

	if (knobCount<1 || 4<knobCount) {
		console.dir(knob);
		throw new Error("illegal knobCount "+knobCount);
	}

	if (knobCount==4) {
		this.removeAll();
		TRACE("\t4 knobs: removing all: "+this.isEmpty());
		return;
	}
	
	else if (knobCount==3) {  // a room with a door; remove the "balcony" of the room.
		var knob1=knob, knob2=knob.next, knob3=knob.next.next;
//			console.log("*** 3 knobs - remove balcony ***");
//			console.log("knob1="+knob1.toString()+"\nknob2="+knob2.toString()+"\nknob3="+knob3.toString());
		if (knob1.isVertical()) {
			var doorWidth = Math.abs(knob1.prev.c0.x - knob3.next.c1.x);
			knob1.setX(knob1.prev.c0.x);
			knob1.c1.y = knob1.c0.y + knob1.ySign()*doorWidth;
			knob1.c0.y = knob1.prev.prev.c0.y;
			knob3.setX(knob3.next.c1.x);
			knob3.c0.y = knob3.c1.y - knob3.ySign()*doorWidth;
			knob3.c1.y = knob3.next.next.c1.y;
		} else {
			var doorWidth = Math.abs(knob1.prev.c0.y - knob3.next.c1.y);
			knob1.setY(knob1.prev.c0.y);
			knob1.c1.x = knob1.c0.x + knob1.xSign()*doorWidth;
			knob1.c0.x = knob1.prev.prev.c0.x;
			knob3.setY(knob3.next.c1.y);
			knob3.c0.x = knob3.c1.x - knob3.xSign()*doorWidth;
			knob3.c1.x = knob3.next.next.c1.x;
		}
		this.removeSegments([knob1.prev.prev,knob1.prev], /*removeCornersBeforeSegments=*/true);
		this.removeSegments([knob3.next,knob3.next.next], /*removeCornersBeforeSegments=*/false);
		
		knob = knob2;  // this is a 1-knob continuator
		this.calculateConvexityAndVisibility();
		this.checkValid();
	}
	
	else if (knobCount==2) {     // a room with a wide opening; remove the "balcony" of the room.
		var knob1=knob, knob2=knob.next;
		var knobLength = knob.length(), prevLength = knob1.prev.length(), nextLength = knob2.next.length();
		TRACE("\t2 knobs: remove balcony");
		TRACE("\t\tprevLength="+prevLength+"\n\t\tknob1="+knob1.toString()+"\n\t\tknob2="+knob2.toString()+"\n\t\tknobLength="+knobLength+"\n\t\tnextLength="+nextLength);
		if ((almostEqual(prevLength,nextLength,0,0.001) && nextLength<=knobLength)) {      // type #1
			var doorWidth = knobLength-prevLength;
			if (knob1.isVertical()) {
				knob1.setX(knob1.prev.c0.x);  // also sets knob2.c0.x
				knob2.setY(knob2.next.c1.y);  // also sets knob1.c1.y
				knob1.c0.y = knob1.prev.prev.c0.y;
				knob2.c1.x = knob2.next.next.c1.x;
			} else {
				knob1.setY(knob1.prev.c0.y);  // also sets knob2.c0.y
				knob2.setX(knob2.next.c1.x);  // also sets knob1.c1.x
				knob1.c0.x = knob1.prev.prev.c0.x;
				knob2.c1.y = knob2.next.next.c1.y;
			}
			this.removeSegments([knob1.prev.prev,knob1.prev], /*removeCornersBeforeSegments=*/true);
			this.removeSegments([knob2.next,knob2.next.next], /*removeCornersBeforeSegments=*/false);
			knob = null;  // no 1-knob continuator (???)
		} else if ((prevLength<nextLength && nextLength<=knobLength) ||    // type #2
 		    (prevLength<=knobLength && knobLength<=nextLength)) {      // type #1
			var doorWidth = knobLength-prevLength;
			if (knob1.isVertical()) {
				knob1.setX(knob1.prev.c0.x);
				knob1.c1.y = knob1.c0.y + knob1.ySign()*doorWidth;
				knob1.c0.y = knob1.prev.prev.c0.y;
				knob2.c1.y = knob2.c0.y; // = knob1.c1.y
			} else {
				knob1.setY(knob1.prev.c0.y);
				knob1.c1.x = knob1.c0.x + knob1.xSign()*doorWidth;
				knob1.c0.x = knob1.prev.prev.c0.x;
				knob2.c1.x = knob2.c0.x; // = knob1.c1.x
			}		
			this.removeSegments([knob1.prev.prev,knob1.prev], /*removeCornersBeforeSegments=*/true);
			knob = knob2;  // this is a 1-knob continuator
		} else if (	(nextLength<prevLength && prevLength<=knobLength) ||  // type #2
			        (nextLength<=knobLength && knobLength<=prevLength))  {  // type #1
			var doorWidth = knobLength-nextLength;
			if (knob2.isVertical()) {
				knob2.setX(knob2.next.c1.x);
				knob2.c0.y = knob2.c1.y - knob2.ySign()*doorWidth;
				knob2.c1.y = knob2.next.next.c1.y;
				knob1.c0.y = knob1.c1.y; // = knob2.c0.y
			} else {
				knob2.setY(knob2.next.c1.y);
				knob2.c0.x = knob2.c1.x - knob2.xSign()*doorWidth;
				knob2.c1.x = knob2.next.next.c1.x;
				knob1.c0.x = knob1.c1.x; // = knob2.c0.x
			}
			this.removeSegments([knob2.next,knob2.next.next], /*removeCornersBeforeSegments=*/true);
			knob = knob1;  // this is a 1-knob continuator
		} 
		TRACE("\t2 knobs: removeD balcony");
		TRACE("\t\tknob1="+knob1.toString()+"\n\t\tknob2="+knob2.toString());

		this.calculateConvexityAndVisibility();
		this.checkValid();
	}

	if (!knob)  return;
	
	// handle remaining 1-knob continuator:
	var exposedDistance0 = knob.prev.length();
	if (knobCount==1 && exposedDistance0<almostEqual.FLT_EPSILON || exposedDistance0<0) {console.log("knob="+knob.toString());  throw new Error("exposedDistance at knob.prev = "+exposedDistance0)}
	var exposedDistance1 = knob.next.length();
	if (knobCount==1 && exposedDistance1<almostEqual.FLT_EPSILON || exposedDistance1<0) {console.log("knob="+knob.toString()); throw new Error("exposedDistance at knob.next = "+exposedDistance0)}
	var exposedDistance = Math.min(exposedDistance0,exposedDistance1);
	var coveredDistance = knob.length(); // TODO: calculate the actual covering distance
	if (knobCount==1 && coveredDistance<almostEqual.FLT_EPSILON || coveredDistance<0) {console.log("knob="+knob.toString()); throw new Error("coveredDistance = "+coveredDistance)}
	var securityDistance = knob.distanceToNearestBorder() - knob.length();
	if (knobCount==1 && securityDistance<almostEqual.FLT_EPSILON || securityDistance<0) {console.log("knob="+knob.toString()); throw new Error("securityDistance = "+securityDistance)}
	var nonExposedDistance = Math.min(coveredDistance,securityDistance);
	TRACE("nonExposedDistance=min("+coveredDistance+","+securityDistance+")="+nonExposedDistance+" exposedDistance=min("+exposedDistance0+","+exposedDistance1+")="+exposedDistance);
	
	if (nonExposedDistance>0 && nonExposedDistance < exposedDistance) { // The knob just moves into the polygon:
		if (knob.isVertical())
			knob.c0.x = knob.c1.x = knob.c1.x + knob.signOfPolygonInterior()*nonExposedDistance;
		else 
			knob.c0.y = knob.c1.y = knob.c1.y + knob.signOfPolygonInterior()*nonExposedDistance;
	} else if (exposedDistance>0 && exposedDistance <= nonExposedDistance){  // some corners should be removed:
		if (exposedDistance0<exposedDistance1) {
			// shorten the next segment:
			if (knob.isVertical()) 
				knob.next.c0.x=knob.prev.c0.x;
			else 
				knob.next.c0.y=knob.prev.c0.y;
			this.removeSegments([knob.prev,knob], /*removeCornersBeforeSegments=*/true);
		} else if (exposedDistance1<exposedDistance0) {
			// shorten the previous segment:
			if (knob.isVertical()) 
				knob.prev.c1.x=knob.next.c1.x;
			 else 
				knob.prev.c1.y=knob.next.c1.y;
			this.removeSegments([knob, knob.next], /*removeCornersBeforeSegments=*/false);
		} else {
			if (knob.isVertical()) 
				knob.prev.prev.c1.y=knob.next.next.c1.y;
			else 
				knob.prev.prev.c1.x=knob.next.next.c1.x;
			this.removeSegments([knob.prev, knob, knob.next, knob.next.next], /*removeCornersBeforeSegments=*/true);
		}
	}
	this.checkValid();
}

MinSquareCoveringData.prototype.removeAll = function() {
	this.segments.initialize();
	this.corners.initialize();
}

MinSquareCoveringData.prototype.checkValid = function() {
	this.segments.forEach(function(segment){
		if (!segment.isAxisParallel())
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tOne of the segments is not axis parallel: "+segment.toString());
		if (segment.isKnob() && segment.distanceToNearestBorder()==0)
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tOne of the segments is adjacent to the border: "+segment.toString());
		if (segment.prev===null)
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tsegment.prev is null: "+segment.toString());
		if (segment.next===null)
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tsegment.next is null: "+segment.toString());
	},this)

	this.corners.forEach(function(corner){
		if (!corner.s0.isAxisParallel()) 
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tSegment before corner "+corner.toString()+" is not axis parallel: "+corner.s0);
		if (!corner.s1.isAxisParallel()) 
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tSegment after corner "+corner.toString()+" is not axis parallel: "+corner.s1);
		if (corner.s0.prev===null)
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tSegment before corner "+corner.toString()+" has null prev: "+corner.s0);
		if (corner.s1.prev===null)
			throw new Error("Invalid polygon: "+this.corners.toString()+"\n\tSegment after corner "+corner.toString()+" has null prev: "+corner.s1);
	},this)
}



var cornerToKey = function(corner) {
	return corner.x+","+corner.y;
}

MinSquareCoveringData.prototype.hasConvexCorner = function(corner) {
	if (!this.hashOfConvexCorners) {
		this.hashOfConvexCorners = {};
		this.corners.forEach(function(point) {
			if (point.isConvex) 
				this.hashOfConvexCorners[cornerToKey(point)]=true;
		},this)
	}
	return this.hashOfConvexCorners[cornerToKey(corner)];
}

MinSquareCoveringData.prototype.getResidualPolygon = function() {
	var residualPolygonPoints = this.corners.map(function(corner) {
		return {x:corner.x, y:corner.y}
	});
	residualPolygonPoints.push(residualPolygonPoints[0]);
	return this.factory.createSimpleRectilinearPolygon(residualPolygonPoints);
}

/**
 * Iterates the squares covering this polygon.
 * 
 * @param iterator a function with a single argument which is the current covering square.
 * The function should return a truthy value; if it returns a falsy value, the iteration stops immediately.
 */
MinSquareCoveringData.prototype.iterateMinimumCovering = function(iterator) {
	var P = this;   // P is the residual polygon.
	var maxIterations = Math.max(2*P.corners.length,200);
	while (!P.isEmpty()) {
		TRACE("\nP="+P.corners.toString())
		var knob = P.findSegmentWithContinuator(); // returns the first knob in a continuator.
		var continuator = knob.getAdjacentSquareInPolygon();
		TRACE("\tprocessing knob "+knob.toString()+"\twith continuator "+JSON.stringify(continuator))
		P.removeErasableRegion(knob);

		var balconyOfContinuatorIsCovered = false; // TODO: check whether the balcony is really covered, to avoid redundant squares.!
		if (!balconyOfContinuatorIsCovered) {
			var shouldWeContinue = iterator(continuator);
			if (!shouldWeContinue)
				break;
		}
	
		maxIterations--;
		if (maxIterations<=0) 
			throw new Error("Covering not found after many iterations!");
	}

}

/**
 * @return a list of squares covering this polygon.
 */
MinSquareCoveringData.prototype.findMinimumCovering = function() {
	var covering = [];       // C is the current covering.
	this.iterateMinimumCovering(function(square) {
		covering.push(square); 
		return true;
	});
	return covering;
}



/**
 * A shorthand function for directly calculating the minimal square covering of a polygon defined by the given xy values.
 * Useful for testing and demonstrations.
 * 
 * @param arg A SimpleRectilinearPolygon
 * @return an array with a minimal square covering of that polygon.
 */
jsts.algorithm.minSquareCovering = function(arg, factory) {
	var srp = arg;
	var srpc = new jsts.algorithm.MinSquareCoveringData(srp);
	var covering = srpc.findMinimumCovering();
	if (factory) {
		return covering.map(function(square) {
			return factory.createAxisParallelRectangle(square);
		});
	} else {
		return covering;
	}
}

},{"./DoublyLinkedList":4,"./Side":9,"./SimpleRectilinearPolygon":10,"almost-equal":18,"jsclass/src/linked_list":26,"jsts":30}],8:[function(require,module,exports){
/**
 * Calculate a largest subset of interior-disjoint representative shapes from given sets of candidates.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var Combinatorics = require('js-combinatorics').Combinatorics;
var _ = require('underscore');

var jsts = require('jsts');
require("./intersection-cache");
require("./partition-utils");


/*--- Main Algorithm ---*/

/**
 * Calculate a largest subset of non-intersecting shapes from a given set of candidates.
 * @param candidates a set of shapes (geometries).
 * @param stopAtCount - After finding this number of disjoint shapes, don't look further (default: infinity)
 * @return a subset of these shapes, that are guaranteed to be pairwise disjoint.
 */
jsts.algorithm.representativeDisjointSet = function(candidateSets) {
	if (!candidateSets) 	return [];
	
	candidateSets = candidateSets.filter(function(set){return set.length>0});
	if (!candidateSets.length) return [];

	candidateSets = candidateSets.map(jsts.algorithm.prepareShapesToPartition);
	
	var allCandidates = candidateSets.reduce(function(a, b) { return a.concat(b); });
	jsts.algorithm.prepareDisjointCache(allCandidates);

	var repDisjointSet = representativeDisjointSetSub(candidateSets);
	if (repDisjointSet) return repDisjointSet;

	// If a set of n representatives is not found, we should return null,
	//    but for the sake of presentation to users 
	//    we try to find a set of n-1 representatives.
	//    this is not optimized as this is not the main goal of the algorithm.
	else return jsts.algorithm.representativeDisjointSet(candidateSets.slice(1));
}


/**
 * Find an interior-disjoint set of representative shapes, from the given set of candidates,
 * or null if not found.
 * 
 * @param candidateSets an array of arrays of candidate shapes.
 * 
 * @return a set of shapes that do not interior-intersect, or null if not found.
 *
 * @author Erel Segal-Halevi
 * @since 2014-03
 */
function representativeDisjointSetSub(candidateSets) {
	var allSets = Combinatorics.cartesianProduct.apply(null,candidateSets);
	while (subset = allSets.next()) {
		if (jsts.algorithm.arePairwiseDisjointByCache(subset))
			return subset;
	}
	return null;
}





},{"./intersection-cache":13,"./partition-utils":15,"js-combinatorics":20,"jsts":30,"underscore":34}],9:[function(require,module,exports){
/**
 * Enums related to sides
 */

var jsts = require('jsts');

/**
 * angle relative to x axis: 90*(3-Side)
 */
jsts.Side = {
	South: 0,
	West: 1,
	North: 2,
	East: 3
};

jsts.sideToLetter = {};

for (var i in jsts.Side)
	jsts.sideToLetter[jsts.Side[i]] = i[0];

jsts.inverseSide = function(side) {
	return (side+2)%4;
}

jsts.Turn = {
	Left: -1,
	Right: 1
};

jsts.isVertical = function(side) { return side%2==0; }
jsts.isHorizontal = function(side) { return side%2==1; }

jsts.turn = function(side1, side2) {
	var t = side2-side1;
	if (t>1) t-=4;
	if (t<-1) t+=4;
	return t;
}

jsts.turnDirection = function(turn) {
	return turn>0? 1: -1;
}

},{"jsts":30}],10:[function(require,module,exports){
/**
 * The SimpleRectilinearPolygon class represents a hole-free (simply-connected) rectilinear polygon.
 * Contains special data structures for calculating the minimum square covering.
 * Based on Bar-Yehuda, R. and Ben-Hanoch, E. (1996). A linear-time algorithm for covering simple polygons with similar rectangles. International Journal of Computational Geometry & Applications, 6.01:79-102.
 * 	http://www.citeulike.org/user/erelsegal-halevi/article/12475038
 * 
 * @author Erel Segal-Halevi
 * @since 2014-07
 */


var jsts = require('jsts');


/**
 * Constructs a simply-connected rectilinear polygon.
 * @param xy an array of alternating x and y values. 
 * The points of the polygon are: (xy[0],xy[1]), (xy[2],xy[1]), (xy[2],xy[3]), ...
 * @note the first side is always horizontal.
 * @constructor
 */
var SimpleRectilinearPolygon = jsts.geom.SimpleRectilinearPolygon = function(xy, factory) {
	if (!Array.isArray(xy))
		throw new Error("xy should be an array but is "+JSON.stringify(xy));
	if (xy.length==0)
		throw new Error("xy is empty: "+JSON.stringify(xy));
	if (!factory)
		throw new Error("factory is empty");

	var points;
	var first = xy[0];
	if ((typeof first === 'object') && ('x' in first)) {
		points = xy;	// xy is already an array of points
		if (points.length<5)
			throw new Error("only "+points.length+" points: "+JSON.stringify(points));
		if (points.length%2==0)
			throw new Error("even number of points: "+JSON.stringify(points));
		
		if (SimpleRectilinearPolygon.FORCE_FIRST_SEGMENT_HORIZONTAL && points[0].x==points[1].x) {
			points.shift();
			points.push(points[0]);
		}

	} else {
		if (xy.length%2==1)
			throw new Error("odd number of xy values: "+JSON.stringify(xy));
		points = [];	// xy is an array of x-y-x-y-x-y-...
		for (var i=0; i<xy.length; i+=2) {
			points.push({x:xy[i], y:xy[i+1]});
			points.push({x:xy[i+2<xy.length? i+2: 0], y:xy[i+1]});
		}
		point = {x:xy[0], y:xy[1]};	points.push(point);	// last point is identical to first point
	}
	
	jsts.geom.LinearRing.apply(this, [factory.createCoordinates(points), factory]);
};

SimpleRectilinearPolygon.prototype = new jsts.geom.LinearRing();
SimpleRectilinearPolygon.constructor = SimpleRectilinearPolygon;
SimpleRectilinearPolygon.FORCE_FIRST_SEGMENT_HORIZONTAL = true;


SimpleRectilinearPolygon.prototype.getPolygon = function() {
	if (!this.polygon)
		this.polygon = this.factory.createPolygon(this);
	return this.polygon;
}

/**
 * Creates and returns a full copy of this {@link Polygon} object. (including
 * all coordinates contained by it).
 *
 * @return a clone of this instance.
 */
SimpleRectilinearPolygon.prototype.clone = function() {
	return new SimpleRectilinearPolygon(this.points, this.factory);
};

SimpleRectilinearPolygon.prototype.relate2 = function(g) {
	return this.getPolygon().relate2(g)
}

/**
 * @return {String} String representation of Polygon type.
 */
SimpleRectilinearPolygon.prototype.toString = function() {
	return 'SimpleRectilinearPolygon with '+(this.points.length-1)+' corners: '+this.points;
};

var cornerToKey = function(corner) {
	return corner.x+","+corner.y;
}


SimpleRectilinearPolygon.prototype.hasCorner = function(corner) {
	if (!this.hashOfCorners) {
		this.hashOfCorners = {};
		this.points.forEach(function(point) {
			this.hashOfCorners[cornerToKey(point)]=true;
		}, this);
	}
	
	return this.hashOfCorners[cornerToKey(corner)];
}

SimpleRectilinearPolygon.prototype.pushIfNotMyCorner = function(newPoints, corner) {
	if (!this.hasCorner(corner))
		newPoints.push(corner);
}


function isCornerOf(point, rectangle) {
	return (
		(point.x==rectangle.minx || point.x==rectangle.maxx) &&
		(point.y==rectangle.miny || point.y==rectangle.maxy) );
}


/**
 * @author http://engblog.nextdoor.com/post/86430627239/fast-polygon-self-intersection-detection-in-javascript
 */
SimpleRectilinearPolygon.prototype.selfIntersectionPoints = function() {
	var jstsPolygon = this.getPolygon();
	var res = [];

	// if the geometry is aleady a simple linear ring, do not
	// try to find self intersection points.
	var validator = new jsts.operation.IsSimpleOp(jstsPolygon);
	if (validator.isSimpleLinearGeometry(jstsPolygon)) {
		return [];
	}
		 
	var graph = new jsts.geomgraph.GeometryGraph(0, jstsPolygon);
	var cat = new jsts.operation.valid.ConsistentAreaTester(graph);
	var r = cat.isNodeConsistentArea();
	if (!r) {
		var pt = cat.getInvalidPoint();
		res.push([pt.x, pt.y]);
	}
	return res;
}


/**
 * Remove a certain rectangular land-plot from this polygon.
 * 
 * @param landplot a rectangle {minx:,maxx:,miny:,maxy:} contained in the polygon and adjacent to the border.
 * @return this SimpleRectilinearPolygon with the landplot removed.
 * (this polygon is not changed).
 */
SimpleRectilinearPolygon.prototype.removeRectangle = function(landplot) {
		var newPoints = [];
		var landplotIsAdjacentToBorder = false;  // If this flag remains false, this is an error since the result is not simply-connected.
		
		var thisPolygon = this;
		
		var setLandplotAdjacentToBorder = function()  {
			if (landplotIsAdjacentToBorder) { 
				throw new Error("landplot meets the border more than once - the result will be disconnected!\n\tthis.points="+JSON.stringify(thisPolygon.points)+"\n\tremoveRectangle("+JSON.stringify(landplot)+"):");
			}
			landplotIsAdjacentToBorder = true;
		}
		
		for (var i=1; i<this.points.length; ++i) {
			var corner0 = this.points[i-1];
			var corner1 = this.points[i];
			var corner0isCornerOfLandplot = isCornerOf(corner0, landplot);
						
			if (corner0isCornerOfLandplot) {
				if (newPoints.length>0) {
					// handle the special case in which landplot covers two adjacent corners:
					lastCornerAdded = newPoints[newPoints.length-1];
					if (corner0.x==lastCornerAdded.x&&corner0.y==lastCornerAdded.y)
						newPoints.pop();
				}
				continue;
			} else {
				newPoints.push(corner0);
			}
			
			if (corner0.x==corner1.x) {  // vertical wall
				var x = corner0.x;       // x value of wall
				if (landplot.minx==x) {  // landplot is adjacent to western vertical wall
					//console.log("\tlandplot is adjacent to western vertical wall");
					if (corner0.y>corner1.y) {   // wall goes from north to south
						if (corner0.y>=landplot.miny && landplot.miny>=corner1.y) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
						} else if (corner1.y==landplot.maxy) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
						}
					} else if (corner0.y<corner1.y) { // wall goes from south to north
						if (corner1.y>=landplot.maxy && landplot.maxy>=corner0.y) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
						} else if (corner1.y==landplot.miny) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
						}
					} else {  // corner0 is identical to corner1 - error:
						throw new Error("Illegal border - two identical corners: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
					}
				} else if (landplot.maxx==x) {  // landplot is adjacent to eastern vertical wall
					//console.log("\tlandplot is adjacent to eastern vertical wall");
					if (corner0.y>corner1.y) {   // wall goes from north to south
						if (corner0.y>=landplot.miny && landplot.miny>=corner1.y) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
						} else if (corner1.y==landplot.maxy) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
						}
					} else if (corner0.y<corner1.y) { // wall goes from south to north
						if (corner1.y>=landplot.maxy && landplot.maxy>=corner0.y) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
						} else if (corner1.y==landplot.miny) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
						}
					} else {  // corner0 is identical to corner1 - error:
						throw new Error("Illegal border - two identical corners: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
					}
				} // else, landplot is not adjacent to current wall.
			} else if (corner0.y==corner1.y) {  // horizontal wall
				var y = corner0.y;       //  value of wall
				if (landplot.miny==y) {  
					//console.log("\tlandplot is adjacent to southern horizontal wall")
					if (corner0.x>corner1.x) {   // wall goes from east to west
						if (corner0.x>=landplot.minx && landplot.minx>=corner1.x) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
						} else if (corner1.x==landplot.maxx) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
						}
					} else if (corner0.x<corner1.x) { // wall goes from west to east
						if (corner0.x<=landplot.maxx && landplot.maxx<=corner1.x) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
						} else if (corner1.x==landplot.minx) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
						}
					} else {  // corner0 is identical to corner1 - error:
						throw new Error("Illegal border - two identical corners: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
					}
				} else if (landplot.maxy==y) {  // landplot is adjacent to northern horizontal wall
					//console.log("\tlandplot is adjacent to northern horizontal wall")
					if (corner0.x>corner1.x) {   // wall goes from east to west
						if (corner0.x>=landplot.minx && landplot.minx>=corner1.x) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
						} else if (corner1.x==landplot.maxx) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
						}
					} else if (corner0.x<corner1.x) { // wall goes from west to east
						if (corner0.x<=landplot.maxx && landplot.maxx<=corner1.x) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.minx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
						} else if (corner1.x==landplot.minx) {
							setLandplotAdjacentToBorder();
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.maxy})
							this.pushIfNotMyCorner(newPoints, {x:landplot.maxx,y:landplot.miny})
						}
					} else {  // corner0 is identical to corner1 - error:
						throw new Error("Illegal border - two identical corners: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
					}
				} // else, landplot is not adjacent to current wall
			} else {   // corner0 and corner1 are different in both coordinates - not an axis-parallel polygon
				throw new Error("Illegal border - not an axis-parallel polygon: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
			}
		}
		
		if (!landplotIsAdjacentToBorder) {
			throw new Error("Landplot is not adjacent to border - the result is not a simply-connected polygon")
		}
		
		// remove redundant corners of the landplot, that overlap corners of the polygon:
		lastCornerAdded = newPoints[newPoints.length-1];
		if (corner1.x==lastCornerAdded.x&&corner1.y==lastCornerAdded.y)
			newPoints.pop();
		if (this.points[1].x==lastCornerAdded.x && this.points[1].y==lastCornerAdded.y)
			newPoints.pop();

		// keep the border cyclic:
		newPoints.push(newPoints[0]);
		
		var newPolygon = this.factory.createSimpleRectilinearPolygon(newPoints);
		
		// check validity of new polygon:
		var newPolygonIntersectionPoints = newPolygon.selfIntersectionPoints();
		if (newPolygonIntersectionPoints.length>0) {
			console.dir("this.points="+JSON.stringify(this.points));
			console.dir("removeRectangle("+JSON.stringify(landplot)+") returns:");
			console.dir(JSON.stringify(newPolygon.points));
			throw new Error("New polygon has self-intersections at: "+JSON.stringify(newPolygonIntersectionPoints));
		}
		
		return newPolygon;
}


SimpleRectilinearPolygon.prototype.CLASS_NAME = 'SimpleRectilinearPolygon';

/**
 * Constructs a <code>Polygon</code> that is an axis-parallel rectangle with the given x and y values.
 * 
 * Can be called either with 4 parameters (minx,miny, maxx,maxy)
 * or with a single parameter with 4 fields (minx,miny, maxx,maxy).
 */
jsts.geom.GeometryFactory.prototype.createSimpleRectilinearPolygon = function(xy) {
	return new SimpleRectilinearPolygon(xy, this);
};



},{"jsts":30}],11:[function(require,module,exports){
/**
 * Adds to jsts.geom.GeometryFactory some simple utility functions related to points.
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

function coord(x,y)  {  return new jsts.geom.Coordinate(x,y); }

/**
 * Constructs an array of <code>Coordinate</code>s from a given array of {x,y} values.
 */
jsts.geom.GeometryFactory.prototype.createCoordinates = function(xy) {
	return xy.map(function(point) {
		return coord(point.x, point.y);
	}, this);
};


var oldCreatePoint = jsts.geom.GeometryFactory.prototype.createPoint;

/**
 * Constructs a point from x and y values.
 */
jsts.geom.GeometryFactory.prototype.createPoint = function(x,y) {
	if (!isNaN(x) && !isNaN(y))
		return oldCreatePoint.call(this, coord(x,y));
	else if (!isNaN(x.x) && !isNaN(x.y))
		return oldCreatePoint.call(this, coord(x.x, x.y));
	else if (point instanceof jsts.geom.Coordinate)
		return oldCreatePoint.call(this, x);
	else
		throw new Error("Illegal arguments to createPoint: "+JSON.stringify(x)+", "+JSON.stringify(y))
};


/**
 * Constructs an array of <code>Point</code>s from a given array of {x,y} points.
 */
jsts.geom.GeometryFactory.prototype.createPoints = function(xy) {
	return xy.map(function(point) {
		return 	this.createPoint(point);
	}, this);
};

},{}],12:[function(require,module,exports){
var jsts = require("jsts");
require("./AffineTransformations");
require("./AxisParallelRectangle");
require("./SimpleRectilinearPolygon");
require("./Side");
require("./MinSquareCovering");
require("./MaxDisjointSetSync");
require("./MaxDisjointSetAsync");
require("./RepresentativeDisjointSetSync");

require("./shapes-touching-points");
require("./numeric-utils");
require("./partition-utils");
require("./point-utils");
require("./factory-utils");

jsts.stringify = function(object) {
	if (object instanceof Array) {
		return object.map(function(cur) {
			return cur.toString();
		});
	}
	else return object.toString();
}
module.exports = jsts;

},{"./AffineTransformations":2,"./AxisParallelRectangle":3,"./MaxDisjointSetAsync":5,"./MaxDisjointSetSync":6,"./MinSquareCovering":7,"./RepresentativeDisjointSetSync":8,"./Side":9,"./SimpleRectilinearPolygon":10,"./factory-utils":11,"./numeric-utils":14,"./partition-utils":15,"./point-utils":16,"./shapes-touching-points":17,"jsts":30}],13:[function(require,module,exports){
/**
 * Create the interiorDisjoint relation, and a cache for keeping previous results of this relation.
 * 
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
 * Adds to each geometric shape a unique object id, for use by the cache.
 */
var id = 1;
jsts.geom.Geometry.prototype.id = function() {
	if (!this.__uniqueid) 
		this.__uniqueid = id++;
	return this.__uniqueid;
}


/*--- Interior-Disjoint Cache ---*/

jsts.algorithm.prepareDisjointCache = function(candidates) {
	for (var ii=0; ii<candidates.length; ++ii) {
		var cur = candidates[ii];
		
		// pre-calculate interior-disjoint relations with other shapes, to save time:
		cur.disjointCache = [];
		cur.disjointCache[cur.id()] = false; // a shape overlaps itself
		for (var jj=0; jj<ii; jj++) {
			var other = candidates[jj];
			var disjoint = ('groupId' in cur && 'groupId' in other && cur.groupId==other.groupId?
				false:
				disjoint = cur.interiorDisjoint(other));
			if (typeof disjoint==='undefined') {
				console.dir(cur);
				console.dir(other);
				throw new Error("interiorDisjoint returned an undefined value");
			}
			cur.disjointCache[other.id()] = other.disjointCache[cur.id()] = disjoint;
		}
	}
	return candidates;
}

/**
 * @return true iff all pairs of shapes in the given array are interior-disjoint
 */
jsts.algorithm.arePairwiseDisjointByCache = function(shapes) {
	for (var i=0; i<shapes.length; ++i) {
		var shape_i_id = shapes[i].id();
		for (var j=0; j<i; ++j) 
			if (!shapes[j].disjointCache[shape_i_id])
				return false;
	}
	return true;
}


/**
 * @return true if shape is disjoint from any of the shapes in the "referenceShapes" array.
 */
jsts.algorithm.isDisjointByCache = function(shape, referenceShapes) {
	var referenceShapesIds = referenceShapes.map(function(cur){return cur.id()});
	for (var i=0; i<referenceShapesIds.length; ++i) 
		if (!shape.disjointCache[referenceShapesIds[i]])
			return false;
	return true;
}


/**
 * @return all shapes from the "shapes" array that do not overlap any of the shapes in the "referenceShapes" array.
 */
jsts.algorithm.calcDisjointByCache = function(shapes, referenceShapes) {
	var referenceShapesIds = referenceShapes.map(function(cur){return cur.id()});
	return shapes.filter(function(shape) {
		for (var i=0; i<referenceShapesIds.length; ++i) 
			if (!shape.disjointCache[referenceShapesIds[i]])
				return false;
		return true;
	});
}



},{}],14:[function(require,module,exports){
/**
 * Some utils for structs of numbers.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */



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

Math.roundFields = function(significantFigures, object) {
	for (var field in object)
		if (typeof object[field] === 'number')
			object[field]=Math.roundToSignificantFigures(significantFigures, object[field]);
}



module.exports = {
	sortedUniqueValues: function(structs, fieldNames) {
		var values = {};
		for (var i=0; i<structs.length; ++i) {
			var cur = structs[i];
			for (var f=0; f<fieldNames.length; ++f) {
				fieldName = fieldNames[f];
				if (fieldName in cur)
					values[cur[fieldName]]=true;
			}
		}
		var list = Object.keys(values);
		for (var i=0; i<list.length; ++i)
			list[i] = parseFloat(list[i]);
		list.sort(function(a,b){return a-b});
		return list;
	},

	/**
	 * @param points a sorted array of numbers.
	 * @param numOfPieces a positive integer.
	 * @return an array of numbers that partition "points" such that each piece has the same amount of (fractions of) points
	 */
	cutPoints: function(points, numOfPieces) {
		var cuts = [];
		var pointsPerPiece = points.length/numOfPieces;
		var curPointsInPiece = 0;
		for (var i=0; i<points.length; ++i) {
			curPointsInPiece += 1;
			while (curPointsInPiece>=pointsPerPiece) {
				cuts.push(points[i]);
				curPointsInPiece -= pointsPerPiece;
			}
		}
		return cuts;
	},
}

},{}],15:[function(require,module,exports){
/**
 * Adds to jsts.algorithm some utility functions related to partitioning collections of shapes.
 * 
 * These utility functions are used mainly by the maximum-disjoint-set algorithm.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */
var _ = require('underscore');
var utils = require('./numeric-utils');


jsts.algorithm.prepareShapesToPartition = function(candidates) {
	candidates = candidates.filter(function(cur) { return (cur.getArea() > 0); })  	// remove empty candidates
	candidates.forEach(function(cur) {
		cur.normalize();
		var envelope = cur.getEnvelopeInternal();
		cur.minx = envelope.getMinX(); cur.maxx = envelope.getMaxX();
		cur.miny = envelope.getMinY(); cur.maxy = envelope.getMaxY();
	});
	return _.uniq(candidates, function(cur) { return cur.toString(); })    // remove duplicates
}

/**
 * Subroutine of maximumDisjointSet.
 * 
 * @param candidates an array of candidate rectangles to add to the MDS. 
 * 	Must have length at least 2.
 * @return a partition of the rectangles to three groups:
		partition[0] - on one side of separator;
		partition[1] - intersected by separator;
		partition[2] - on the other side of separator (- guaranteed to be disjoint from rectangles in partition[0]);
	@note Tries to maximize the quality of the partition, as defined by the function partitionQuality.
 * 
 */
jsts.algorithm.partitionShapes = function(candidates) {
	if (candidates.length<=1)
		throw new Error("less than two candidate rectangles - nothing to partition!");

	var bestXPartition = null;
	var xValues = utils.sortedUniqueValues(candidates, ['minx','maxx']).slice(1,-1);
	
	if (xValues.length>0) {
		var bestX = _.max(xValues, function(x) {
			return partitionQuality(partitionByX(candidates, x));
		});
		bestXPartition = partitionByX(candidates, bestX);
	}

	var bestYPartition = null;
	var yValues = utils.sortedUniqueValues(candidates, ['miny','maxy']).slice(1,-1);
	if (yValues.length>0) {
		var bestY = _.max(yValues, function(y) {
			return partitionQuality(partitionByY(candidates, y));
		});
		bestYPartition = partitionByY(candidates, bestY);
	}
	
	if (!bestYPartition && !bestXPartition) {
		console.dir(candidates.map(function(cur){return cur.toString()}));
		console.warn("Warning: no x partition and no y partition!");
		return [[],candidates,[]];
	}

	if (partitionQuality(bestXPartition,true)>=partitionQuality(bestYPartition,true)) {
//		console.log("\t\tBest separator line: x="+bestX+" "+partitionDescription(bestXPartition));
		return bestXPartition;
	} else {
//		console.log("\t\tBest separator line: y="+bestY+" "+partitionDescription(bestYPartition));
		return bestYPartition;
	}
}



/**
 * @param shapes an array of shapes, each of which contains pre-calculated "minx" and "maxx" fields.
 * @param x a number.
 * @return a partitioning of shapes to 3 lists: before, intersecting, after x.
 */
function partitionByX(shapes, x) {
	var beforeX = [];
	var intersectedByX = [];
	var afterX = [];
	shapes.forEach(function(cur) {
		if (cur.maxx<x)
			beforeX.push(cur);
		else if (x<=cur.minx)
			afterX.push(cur);
		else
			intersectedByX.push(cur);
	});
	return [beforeX, intersectedByX, afterX];
}

/**
 * @param shapes an array of shapes, each of which contains pre-calculated "miny" and "maxy" fields.
 * @param y a number.
 * @return a partitioning of shapes to 3 lists: before, intersecting, after y.
 */
function partitionByY(shapes, y) {
	var beforeY = [];
	var intersectedByY = [];
	var afterY = [];
	shapes.forEach(function(cur) {
		if (cur.maxy<y)
			beforeY.push(cur);
		else if (y<=cur.miny)
			afterY.push(cur);
		else
			intersectedByY.push(cur);
	});
	return [beforeY, intersectedByY, afterY];
}




/**
 * Calculate a quality factor for the given partition of squares.
 * 
 * @see http://cs.stackexchange.com/questions/20126
 * 
 * @param partition contains three parts; see partitionShapes.
 */
function partitionQuality(partition, log) {
	if (!partition) return -1; // worst quality
	var numIntersected = partition[1].length; // the smaller - the better
	var smallestPart = Math.min(partition[2].length,partition[0].length);  // the larger - the better
	if (!numIntersected && !smallestPart)
		throw new Error("empty partition - might lead to endless recursion!");

//	if (log) console.log ("smallestPart="+smallestPart+" numIntersected="+numIntersected);

//	return 1/numIntersected; 
//	return smallestPart; 
//	return (smallestPart+1)/(numIntersected^2);  // see http://cs.stackexchange.com/a/20260/1342
	return (smallestPart+1)/(numIntersected);  // see http://cs.stackexchange.com/a/20260/1342
}

function partitionDescription(partition) {
	return "side1="+partition[0].length+" intersect="+partition[1].length+" side2="+partition[2].length;
}


},{"./numeric-utils":14,"underscore":34}],16:[function(require,module,exports){
/**
 * Adds to jsts.algorithm some utility functions related to collections of points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */
var _ = require('underscore');
var jsts = require('jsts');

var TOLERANCE=1.01

jsts.algorithm.isPointInXY = function isPointInXY(point, minx,miny,maxx,maxy) {
	return minx<=point.x*TOLERANCE && point.x<=maxx*TOLERANCE && 
	       miny<=point.y*TOLERANCE && point.y<=maxy*TOLERANCE ;
}

jsts.algorithm.isPointInEnvelope = function (point,envelope) {
	return jsts.algorithm.isPointInXY(point, envelope.minx,envelope.miny,envelope.maxx,envelope.maxy);
}

jsts.algorithm.numPointsInXY = function(points, minx,miny,maxx,maxy) {
	return points.reduce(function(num,point) {
		return num + jsts.algorithm.isPointInXY(point, minx,miny,maxx,maxy);
	}, 0);	
}

jsts.algorithm.numPointsInEnvelope = function(points, envelope) {
	return jsts.algorithm.numPointsInXY(points, envelope.minx,envelope.miny,envelope.maxx,envelope.maxy);
}

jsts.algorithm.pointsInXY = function(points, minx,miny,maxx,maxy) {
	return points.filter(function(point) {
		return jsts.algorithm.isPointInXY(point, minx,miny,maxx,maxy)
	});
}

jsts.algorithm.pointsInEnvelope = function(points, envelope) {
	if (!Array.isArray(points))
		throw new Error("points: expected an array but got "+JSON.stringify(points));
	return jsts.algorithm.pointsInXY(points, envelope.minx,envelope.miny,envelope.maxx,envelope.maxy);
}

jsts.algorithm.pointsToString = function(points, color) {
	var s = "";
	for (var p=0; p<points.length; ++p) {
		if (s.length>0)
			s+=":";
		s += points[p].x + "," + points[p].y+","+color;
	}
	return s;
}

jsts.algorithm.agentsValuePointsToString = function(agentsValuePoints) {
	var s = "";
	agentsValuePoints.forEach(function(points) {
		s += jsts.algorithm.pointsToString(points, points.color)+":";
	});
	return s;
}


},{"jsts":30,"underscore":34}],17:[function(require,module,exports){
/**
 * Find a set of candidate shapes based on a given set of points.
 * 
 * @param points an array of points. Each point should contain the fields: x, y.
 * @param envelope a jsts.geom.Envelope, defining the boundaries for the shapes.
 * 
 * @return a set of shapes such that:
 * a. Each shape touches two points.
 * b. No shape contains a point.
 * @note the output can be used as input to jsts.algorithm.maximumDisjointSet
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */

var jsts = require("jsts");
require("./factory-utils");
require("./AxisParallelRectangle");


function coord(x,y)  {  return new jsts.geom.Coordinate(x,y); }

var DEFAULT_ENVELOPE = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,Infinity);

jsts.geom.Envelope.prototype.checkValid = function() {
	if (this.maxx<this.minx) throw new Error("maxx<minx: "+JSON.stringify(this));
	if (this.maxy<this.miny) throw new Error("maxy<miny: "+JSON.stringify(this));
}

	
/**
 * Find a set of shapes based on a given set of points.
 * 
 * @param shapeName (string) name of string to create. Current options are: axisParallelSquares, rotatedSquares, RAITs.
 * @param points an array of points. Each point should contain the fields: x, y.
 * @param envelope a jsts.geom.Envelope, defining the boundaries for the shapes.
 * 
 * @return a set of shapes such that:
 * a. Each shape touches two points: one at a corner and one anywhere at the boundary.
 * b. No shape contains a point.
 */
jsts.geom.GeometryFactory.prototype.createShapesTouchingPoints = function(shapeName, points, envelope) {
	envelope.checkValid();
	var shapes = (
			shapeName==="rotatedSquares"? this.createRotatedSquaresTouchingPoints(points, envelope):
			shapeName==="RAITs"? this.createRAITsTouchingPoints(points, envelope):
			shapeName==="axisParallelSquares"? this.createSquaresTouchingPoints(points, envelope):
			[]);
	return shapes;
}


/**
 * Find a set of axis-parallel squares based on a given set of points.
 * 
 * @param points an array of points. Each point should contain the fields: x, y.
 * @param envelope a jsts.geom.Envelope, defining the boundaries for the shapes.
 * 
 * @return a set of shapes (Polygon's) such that:
 * a. Each square touches two points: one at a corner and one anywhere at the boundary.
 * b. No square contains a point.
 */
jsts.geom.GeometryFactory.prototype.createSquaresTouchingPoints = function(points, envelope) {
	if (!envelope)  envelope = DEFAULT_ENVELOPE;
	var pointObjects = this.createPoints(points);
	var shapes = [];
	for (var i=0; i<points.length; ++i) {
		for (var j=0; j<i; ++j) {
			var p1 = points[i];
			var p2 = points[j];
			var minx = Math.min(p1.x,p2.x);
			var maxx = Math.max(p1.x,p2.x);
			var dist_x = maxx-minx;
			var miny = Math.min(p1.y,p2.y);
			var maxy = Math.max(p1.y,p2.y);
			var dist_y = maxy-miny;

			if (dist_x>dist_y) {
				var ySmall = Math.max(maxy-dist_x, envelope.getMinY());
				var yLarge = Math.min(miny+dist_x, envelope.getMaxY());
				var square1 = this.createAxisParallelRectangle({minx: minx, miny: ySmall, maxx: maxx, maxy: ySmall+dist_x});
				var square2 = this.createAxisParallelRectangle({minx: minx, miny: yLarge-dist_x, maxx: maxx, maxy: yLarge});
			} else {
				var xSmall = Math.max(maxx-dist_y, envelope.getMinX());
				var xLarge = Math.min(minx+dist_y, envelope.getMaxX());
				var square1 = this.createAxisParallelRectangle({minx: xSmall, miny: miny, maxx: xSmall+dist_y, maxy: maxy});
				var square2 = this.createAxisParallelRectangle({minx: xLarge-dist_y, miny: miny, maxx: xLarge, maxy: maxy});
			}

			square1.groupId = square2.groupId = shapes.length;
			if (jsts.algorithm.numWithin(pointObjects,square1)==0)  // don't add a square that contains a point.
				shapes.push(square1);
			if (jsts.algorithm.numWithin(pointObjects,square2)==0)  // don't add a square that contains a point.
				shapes.push(square2);
		}
	}
	return colorByGroupId(shapes);
}

/**
 * Find a set of shapes based on a given set of points.
 * 
 * @param points an array of points. Each point should contain the fields: x, y.
 * @param envelope a jsts.geom.Envelope, defining the boundaries for the shapes.
 * @param createShapesTouchingTwoPoints a function that creates shapes touching two given points.
 * 
 * @return a set of shapes (of type jsts.geom.Polygon), such that:
 * a. Each shape touches two points, based on the function createShapesTouchingTwoPoints.
 * b. No shape contains a point.
 */
jsts.geom.GeometryFactory.prototype.createPolygonsTouchingPoints = function(coordinates, envelope, createShapesTouchingTwoPoints) {
	if (!envelope)  envelope = DEFAULT_ENVELOPE;
	coordinates = this.createCoordinates(coordinates);
	var pointObjects = this.createPoints(coordinates);
	var shapes = [];
	for (var i=0; i<coordinates.length; ++i) {
		var c1 = coordinates[i];
		for (var j=0; j<i; ++j) {
			var c2 = coordinates[j];
			var coords = createShapesTouchingTwoPoints(c1,c2);
			var groupId = shapes.length;
			for (var k=0; k<coords.length; ++k) {
				var curCoords = coords[k];

				// don't add a shape outside the envelope:
				var numPointsOutsideEnvelope = 0;
				for (var c=0; c<curCoords.length; ++c) {
					if (!envelope.intersects(curCoords[c]))
						numPointsOutsideEnvelope++;
				}
				if (numPointsOutsideEnvelope>0) 	continue;

				newShape = this.createPolygon(this.createLinearRing(curCoords));
				newShape.groupId = groupId;
				
				// don't add a shape that contains a point:
				var numPointsWithinNewShape = 0;
				for (var p=0; p<pointObjects.length; ++p) {
					if (p!=i && p!=j && pointObjects[p].within(newShape))
						numPointsWithinNewShape++;
				}
				if (numPointsWithinNewShape>0) continue;
				
				shapes.push(newShape);
			}
		}
	}
	return colorByGroupId(shapes);
}



jsts.geom.GeometryFactory.prototype.createRotatedSquaresTouchingPoints = function(coordinates, envelope) {
	return this.createPolygonsTouchingPoints(coordinates, envelope, 
		function squaresTouchingTwoPoints(c1, c2) {
			var dist_x = c2.x-c1.x;
			var dist_y = c2.y-c1.y;
			var mid_x = (c1.x+c2.x)/2;
			var mid_y = (c1.y+c2.y)/2;
			return [
			        [c1, c2, coord(c2.x-dist_y,c2.y+dist_x), coord(c1.x-dist_y,c1.y+dist_x), c1],
			        [c1, coord(mid_x-dist_y/2,mid_y+dist_x/2), c2, coord(mid_x+dist_y/2,mid_y-dist_x/2), c1],
			        [c1, c2, coord(c2.x+dist_y,c2.y-dist_x), coord(c1.x+dist_y,c1.y-dist_x), c1],
			];
		}
	);
}

// RAIT = Right-Angled-Isosceles-Triangle
jsts.geom.GeometryFactory.prototype.createRAITsTouchingPoints = function(coordinates, envelope) {
	return this.createPolygonsTouchingPoints(coordinates, envelope, 
		function RAITsTouchingTwoPoints(c1, c2) {
			var dist_x = c2.x-c1.x;
			var dist_y = c2.y-c1.y;
			var mid_x = (c1.x+c2.x)/2;
			var mid_y = (c1.y+c2.y)/2;

			return [
					[c1, c2, coord(c2.x-dist_y,c2.y+dist_x), c1],
					[c1, c2, coord(c1.x-dist_y,c1.y+dist_x), c1],
					[c1, coord(mid_x-dist_y/2,mid_y+dist_x/2), c2, c1],
					[c1, c2, coord(mid_x+dist_y/2,mid_y-dist_x/2), c1],
					[c1, c2, coord(c2.x+dist_y,c2.y-dist_x), c1],
					[c1, c2, coord(c1.x+dist_y,c1.y-dist_x), c1],
		        ];
		}
	);
}



/*---------------- UTILS ---------------*/


/**
 * @return the number of shapes from the "shapes" array that are within the interior of "referenceShape".
 */
jsts.algorithm.numWithin = function(shapes, referenceShape) {
	return shapes.reduce(function(prev,cur) {
		return prev + cur.within(referenceShape)
	}, 0);
};


var colors = ['#000','#f00','#0f0','#ff0','#088','#808','#880'];
function color(i) {return colors[i % colors.length]}
function colorByGroupId(shapes) {
	shapes.forEach(function(shape) {
		shape.color = color(shape.groupId);
	});
	return shapes;
}
},{"./AxisParallelRectangle":3,"./factory-utils":11,"jsts":30}],18:[function(require,module,exports){
"use strict"

var abs = Math.abs
  , min = Math.min

function almostEqual(a, b, absoluteError, relativeError) {
  var d = abs(a - b)
  if(d <= absoluteError) {
    return true
  }
  if(d <= relativeError * min(abs(a), abs(b))) {
    return true
  }
  return a === b
}

almostEqual.FLT_EPSILON = 1.19209290e-7
almostEqual.DBL_EPSILON = 2.2204460492503131e-16

module.exports = almostEqual

},{}],19:[function(require,module,exports){
var process=require("__browserify_process");/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(done) );
        });
        function done(err) {
          if (err) {
              callback(err);
              callback = function () {};
          }
          else {
              completed += 1;
              if (completed >= arr.length) {
                  callback();
              }
          }
        }
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        if (!callback) {
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err) {
                    callback(err);
                });
            });
        } else {
            var results = [];
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        var remainingTasks = keys.length
        if (!remainingTasks) {
            return callback();
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            remainingTasks--
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (!remainingTasks) {
                var theCallback = callback;
                // prevent final callback from calling itself if it errors
                callback = function () {};

                theCallback(null, results);
            }
        });

        _each(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var attempts = [];
        // Use defaults if times not passed
        if (typeof times === 'function') {
            callback = task;
            task = times;
            times = DEFAULT_TIMES;
        }
        // Make sure times is a number
        times = parseInt(times, 10) || DEFAULT_TIMES;
        var wrappedTask = function(wrappedCallback, wrappedResults) {
            var retryAttempt = function(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            };
            while (times) {
                attempts.push(retryAttempt(task, !(times-=1)));
            }
            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || callback)(data.err, data.result);
            });
        }
        // If a callback is passed, run this as a controll flow
        return callback ? wrappedTask() : wrappedTask
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!_isArray(tasks)) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (test.apply(null, args)) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (!test.apply(null, args)) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            started: false,
            paused: false,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            kill: function () {
              q.drain = null;
              q.tasks = [];
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                if (q.paused === true) { return; }
                q.paused = true;
                q.process();
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                q.process();
            }
        };
        return q;
    };
    
    async.priorityQueue = function (worker, concurrency) {
        
        function _compareTasks(a, b){
          return a.priority - b.priority;
        };
        
        function _binarySearch(sequence, item, compare) {
          var beg = -1,
              end = sequence.length - 1;
          while (beg < end) {
            var mid = beg + ((end - beg + 1) >>> 1);
            if (compare(item, sequence[mid]) >= 0) {
              beg = mid;
            } else {
              end = mid - 1;
            }
          }
          return beg;
        }
        
        function _insert(q, data, priority, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  priority: priority,
                  callback: typeof callback === 'function' ? callback : null
              };
              
              q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }
        
        // Start with a normal queue
        var q = async.queue(worker, concurrency);
        
        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
          _insert(q, data, priority, callback);
        };
        
        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            drained: true,
            push: function (data, callback) {
                if (!_isArray(data)) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    cargo.drained = false;
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain && !cargo.drained) cargo.drain();
                    cargo.drained = true;
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0, tasks.length);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    async.compose = function (/* functions... */) {
      return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

},{"__browserify_process":48}],20:[function(require,module,exports){
/*
 * $Id: combinatorics.js,v 0.25 2013/03/11 15:42:14 dankogai Exp dankogai $
 *
 *  Licensed under the MIT license.
 *  http://www.opensource.org/licenses/mit-license.php
 *
 *  References:
 *    http://www.ruby-doc.org/core-2.0/Array.html#method-i-combination
 *    http://www.ruby-doc.org/core-2.0/Array.html#method-i-permutation
 *    http://en.wikipedia.org/wiki/Factorial_number_system
 */
(function(global) {
    'use strict';
    if (global.Combinatorics) return;
    var version = "0.3.0";
    /* combinatory arithmetics */
    var P = function(m, n) {
        var t, p = 1;
        if (m < n) {
            t = m;
            m = n;
            n = t;
        }
        while (n--) p *= m--;
        return p;
    };
    var C = function(m, n) {
        return P(m, n) / P(n, n);
    };
    var factorial = function(n) {
        return P(n, n);
    };
    var factoradic = function(n, d) {
        var f = 1;
        if (!d) {
            for (d = 1; f < n; f *= ++d);
            if (f > n) f /= d--;
        } else {
            f = factorial(d);
        }
        var result = [0];
        for (; d; f /= d--) {
            result[d] = Math.floor(n / f);
            n %= f;
        }
        return result;
    };
    /* common methods */
    var addProperties = function(dst, src) {
        Object.keys(src).forEach(function(p) {
            Object.defineProperty(dst, p, {
                value: src[p]
            });
        });
    };
    var hideProperty = function(o, p) {
        Object.defineProperty(o, p, {
            writable: true
        });
    };
    var toArray = function(f) {
        var e, result = [];
        this.init();
        while (e = this.next()) result.push(f ? f(e) : e);
        this.init();
        return result;
    };
    var common = {
        toArray: toArray,
        map: toArray,
        forEach: function(f) {
            var e;
            this.init();
            while (e = this.next()) f(e);
            this.init();
        },
        filter: function(f) {
            var e, result = [];
            this.init();
            while (e = this.next()) if (f(e)) result.push(e);
            this.init();
            return result;
        }

    };
    /* power set */
    var power = function(ary, fun) {
        if (ary.length > 32) throw new RangeError;
        var size = 1 << ary.length,
            sizeOf = function() {
                return size;
            },
            that = Object.create(ary.slice(), {
                length: {
                    get: sizeOf
                }
            });
        hideProperty(that, 'index');
        addProperties(that, {
            valueOf: sizeOf,
            init: function() {
                that.index = 0;
            },
            nth: function(n) {
                if (n >= size) return;
                var i = 0,
                    result = [];
                for (; n; n >>>= 1, i++) if (n & 1) result.push(this[i]);
                return result;
            },
            next: function() {
                return this.nth(this.index++);
            }
        });
        addProperties(that, common);
        that.init();
        return (typeof (fun) === 'function') ? that.map(fun) : that;
    };
    /* combination */
    var nextIndex = function(n) {
        var smallest = n & -n,
            ripple = n + smallest,
            new_smallest = ripple & -ripple,
            ones = ((new_smallest / smallest) >> 1) - 1;
        return ripple | ones;
    };
    var combination = function(ary, nelem, fun) {
        if (ary.length > 32) throw new RangeError;
        if (!nelem) nelem = ary.length;
        if (nelem < 1) throw new RangeError;
        if (nelem > ary.length) throw new RangeError;
        var first = (1 << nelem) - 1,
            size = C(ary.length, nelem),
            maxIndex = 1 << ary.length,
            sizeOf = function() {
                return size;
            },
            that = Object.create(ary.slice(), {
                length: {
                    get: sizeOf
                }
            });
        hideProperty(that, 'index');
        addProperties(that, {
            valueOf: sizeOf,
            init: function() {
                this.index = first;
            },
            next: function() {
                if (this.index >= maxIndex) return;
                var i = 0,
                    n = this.index,
                    result = [];
                for (; n; n >>>= 1, i++) if (n & 1) result.push(this[i]);
                this.index = nextIndex(this.index);
                return result;
            }
        });
        addProperties(that, common);
        that.init();
        return (typeof (fun) === 'function') ? that.map(fun) : that;
    };
    /* permutation */
    var _permutation = function(ary) {
        var that = ary.slice(),
            size = factorial(that.length);
        that.index = 0;
        that.next = function() {
            if (this.index >= size) return;
            var copy = this.slice(),
                digits = factoradic(this.index, this.length),
                result = [],
                i = this.length - 1;
            for (; i >= 0; --i) result.push(copy.splice(digits[i], 1)[0]);
            this.index++;
            return result;
        };
        return that;
    };
    // which is really a permutation of combination
    var permutation = function(ary, nelem, fun) {
        if (!nelem) nelem = ary.length;
        if (nelem < 1) throw new RangeError;
        if (nelem > ary.length) throw new RangeError;
        var size = P(ary.length, nelem),
            sizeOf = function() {
                return size;
            },
            that = Object.create(ary.slice(), {
                length: {
                    get: sizeOf
                }
            });
        hideProperty(that, 'cmb');
        hideProperty(that, 'per');
        addProperties(that, {
            valueOf: function() {
                return size;
            },
            init: function() {
                this.cmb = combination(ary, nelem);
                this.per = _permutation(this.cmb.next());
            },
            next: function() {
                var result = this.per.next();
                if (!result) {
                    var cmb = this.cmb.next();
                    if (!cmb) return;
                    this.per = _permutation(cmb);
                    return this.next();
                }
                return result;
            }
        });
        addProperties(that, common);
        that.init();
        return (typeof (fun) === 'function') ? that.map(fun) : that;
    };

    var PC = function(m) {
        var total = 0;
        for (var n = 1; n <= m; n++) {
            var p = P(m,n);
            total += p;
        };
        return total;
    };

    // which is really a permutation of combination
    var permutationCombination = function(ary, fun) {
        // if (!nelem) nelem = ary.length;
        // if (nelem < 1) throw new RangeError;
        // if (nelem > ary.length) throw new RangeError;
        var size = PC(ary.length),
            sizeOf = function() {
                return size;
            },
            that = Object.create(ary.slice(), {
                length: {
                    get: sizeOf
                }
            });
        hideProperty(that, 'cmb');
        hideProperty(that, 'per');
        hideProperty(that, 'nelem');
        addProperties(that, {
            valueOf: function() {
                return size;
            },
            init: function() {
                this.nelem = 1;
                // console.log("Starting nelem: " + this.nelem);
                this.cmb = combination(ary, this.nelem);
                this.per = _permutation(this.cmb.next());
            },
            next: function() {
                var result = this.per.next();
                if (!result) {
                    var cmb = this.cmb.next();
                    if (!cmb) {
                        this.nelem++;
                        // console.log("increment nelem: " + this.nelem + " vs " + ary.length);
                        if (this.nelem > ary.length) return;
                        this.cmb = combination(ary, this.nelem);
                        cmb = this.cmb.next();
                        if (!cmb) return;
                    }
                    this.per = _permutation(cmb);
                    return this.next();
                }
                return result;
            }
        });
        addProperties(that, common);
        that.init();
        return (typeof (fun) === 'function') ? that.map(fun) : that;
    };
    /* Cartesian Product */
    var arraySlice = Array.prototype.slice;
    var cartesianProduct = function() {
        if (!arguments.length) throw new RangeError;
        var args = arraySlice.call(arguments),
            size = args.reduce(function(p, a) {
                return p * a.length;
            }, 1),
            sizeOf = function() {
                return size;
            },
            dim = args.length,
            that = Object.create(args, {
                length: {
                    get: sizeOf
                }
            });
        if (!size) throw new RangeError;
        hideProperty(that, 'index');
        addProperties(that, {
            valueOf: sizeOf,
            dim: dim,
            init: function() {
                this.index = 0;
            },
            get: function() {
                if (arguments.length !== this.length) return;
                var result = [],
                    d = 0;
                for (; d < dim; d++) {
                    var i = arguments[d];
                    if (i >= this[d].length) return;
                    result.push(this[d][i]);
                }
                return result;
            },
            nth: function(n) {
                var result = [],
                    d = 0;
                for (; d < dim; d++) {
                    var l = this[d].length;
                    var i = n % l;
                    result.push(this[d][i]);
                    n -= i;
                    n /= l;
                }
                return result;
            },
            next: function() {
                if (this.index >= size) return;
                var result = this.nth(this.index);
                this.index++;
                return result;
            }
        });
        addProperties(that, common);
        that.init();
        return that;
    };
    /* export */
    addProperties(global.Combinatorics = Object.create(null), {
        C: C,
        P: P,
        factorial: factorial,
        factoradic: factoradic,
        cartesianProduct: cartesianProduct,
        combination: combination,
        permutation: permutation,
        permutationCombination: permutationCombination,
        power: power,
        VERSION: version
    });
})(this);

},{}],21:[function(require,module,exports){
(function(factory) {
  var E  = (typeof exports === 'object'),
      js = (typeof JS === 'undefined') ? require('./core') : JS;

  if (E) exports.JS = exports;
  factory(js, E ? exports : js);

})(function(JS, exports) {
'use strict';

var Comparable = new JS.Module('Comparable', {
  extend: {
    ClassMethods: new JS.Module({
      compare: function(one, another) {
        return one.compareTo(another);
      }
    }),

    included: function(base) {
      base.extend(this.ClassMethods);
    }
  },

  lt: function(other) {
    return this.compareTo(other) < 0;
  },

  lte: function(other) {
    return this.compareTo(other) < 1;
  },

  gt: function(other) {
    return this.compareTo(other) > 0;
  },

  gte: function(other) {
    return this.compareTo(other) > -1;
  },

  eq: function(other) {
    return this.compareTo(other) === 0;
  },

  between: function(a, b) {
    return this.gte(a) && this.lte(b);
  }
});

exports.Comparable = Comparable;
});
},{"./core":23}],22:[function(require,module,exports){
var process=require("__browserify_process");(function(factory) {
  var E  = (typeof exports === 'object'),
      js = (typeof JS === 'undefined') ? require('./core') : JS,

      Enumerable = js.Enumerable || require('./enumerable').Enumerable;

  if (E) exports.JS = exports;
  factory(js, Enumerable, E ? exports : js);

})(function(JS, Enumerable, exports) {
'use strict';

var Console = new JS.Module('Console', {
  extend: {
    nameOf: function(object, root) {
      var results = [], i, n, field, l;

      if (JS.isType(object, Array)) {
        for (i = 0, n = object.length; i < n; i++)
          results.push(this.nameOf(object[i]));
        return results;
      }

      if (object.displayName) return object.displayName;

      field = [{name: null, o: root || JS.ENV}];
      l = 0;
      while (typeof field === 'object' && l < this.MAX_DEPTH) {
        l += 1;
        field = this.descend(field, object);
      }
      if (typeof field == 'string') {
        field = field.replace(/\.prototype\./g, '#');
        object.displayName = field;
        if (object.__meta__) object.__meta__.displayName = field + '.__meta__';
      }
      return object.displayName;
    },

    descend: function(list, needle) {
      var results = [],
          n       = list.length,
          i       = n,
          key, item, name;

      while (i--) {
        item = list[i];
        if (JS.isType(item.o, Array)) continue;
        name = item.name ? item.name + '.' : '';
        for (key in item.o) {
          if (needle && item.o[key] === needle) return name + key;
          results.push({name: name + key, o: item.o[key]});
        }
      }
      return results;
    },

    convert: function(object, stack) {
      if (object === null || object === undefined) return String(object);
      var E = Enumerable, stack = stack || [], items;

      if (JS.indexOf(stack, object) >= 0) return '#circular';

      if (object instanceof Error) {
        return (typeof object.message === 'string' && !object.message)
             ? object.name
             : object.name + (object.message ? ': ' + object.message : '');
      }

      if (object instanceof Array) {
        stack.push(object);
        items = new E.Collection(object).map(function(item) {
            return this.convert(item, stack);
          }, this).join(', ');
        stack.pop();
        return items ? '[ ' + items + ' ]' : '[]';
      }

      if (object instanceof String || typeof object === 'string')
        return '"' + object + '"';

      if (object instanceof Function)
        return object.displayName ||
               object.name ||
              (object.toString().match(/^\s*function ([^\(]+)\(/) || [])[1] ||
               '#function';

      if (object instanceof Date)
        return object.toGMTString();

      if (object.toString &&
          object.toString !== Object.prototype.toString &&
          !object.toString.__traced__)
        return object.toString();

      if (object.nodeType !== undefined) return object.toString();

      stack.push(object);
      items = new E.Collection(E.objectKeys(object, false).sort()).map(function(key) {
          return this.convert(key, stack) + ': ' + this.convert(object[key], stack);
        }, this).join(', ');
      stack.pop();
      return items ? '{ ' + items + ' }' : '{}';
    },

    filterBacktrace: function(stack) {
      if (!stack) return stack;
      stack = stack.replace(/^\S.*\n?/gm, '');
      var filter = this.adapter.backtraceFilter();

      return filter
           ? stack.replace(filter, '')
           : stack;
    },

    ANSI_CSI:       '\u001B[',
    DEFAULT_WIDTH:  78,
    DEFAULT_HEIGHT: 24,
    MAX_DEPTH:      4,
    NO_COLOR:       'NO_COLOR',

    ESCAPE_CODES: {
      cursor: {
        cursorUp:           '%1A',
        cursorDown:         '%1B',
        cursorForward:      '%1C',
        cursorBack:         '%1D',
        cursorNextLine:     '%1E',
        cursorPrevLine:     '%1F',
        cursorColumn:       '%1G',
        cursorPosition:     '%1;%2H',
        cursorHide:         '?25l',
        cursorShow:         '?25h'
      },

      screen: {
        eraseScreenForward: '0J',
        eraseScreenBack:    '1J',
        eraseScreen:        '2J',
        eraseLineForward:   '0K',
        eraseLineBack:      '1K',
        eraseLine:          '2K'
      },

      reset: {
        reset:      '0m'
      },

      weight: {
        bold:       '1m',   normal:     '22m'
      },

      style: {
        italic:     '',     noitalic:   ''
      },

      underline: {
        underline:  '4m',   noline:     '24m'
      },

      blink: {
        blink:      '5m',   noblink:    '25m'
      },

      color: {
        black:      '30m',
        red:        '31m',
        green:      '32m',
        yellow:     '33m',
        blue:       '34m',
        magenta:    '35m',
        cyan:       '36m',
        white:      '37m',
        nocolor:    '39m',
        grey:       '90m'
      },

      background: {
        bgblack:    '40m',
        bgred:      '41m',
        bggreen:    '42m',
        bgyellow:   '43m',
        bgblue:     '44m',
        bgmagenta:  '45m',
        bgcyan:     '46m',
        bgwhite:    '47m',
        bgnocolor:  '49m'
      }
    },

    coloring: function() {
      return this.adapter.coloring();
    },

    envvar: function(name) {
      return this.adapter.envvar(name);
    },

    escape: function(string) {
      return Console.ANSI_CSI + string;
    },

    exit: function(status) {
      this.adapter.exit(status);
    },

    getDimensions: function() {
      return this.adapter.getDimensions();
    }
  },

  consoleFormat: function() {
    this.reset();
    var i = arguments.length;
    while (i--) this[arguments[i]]();
  },

  print: function(string) {
    string = (string === undefined ? '' : string).toString();
    Console.adapter.print(string);
  },

  puts: function(string) {
    string = (string === undefined ? '' : string).toString();
    Console.adapter.puts(string);
  }
});

Console.extend({
  Base: new JS.Class({
    __buffer__: '',
    __format__: '',

    backtraceFilter: function() {
      if (typeof version === 'function' && version() > 100) {
        return /.*/;
      } else {
        return null;
      }
    },

    coloring: function() {
      return !this.envvar(Console.NO_COLOR);
    },

    echo: function(string) {
      if (typeof console !== 'undefined') return console.log(string);
      if (typeof print === 'function')    return print(string);
    },

    envvar: function(name) {
      return null;
    },

    exit: function(status) {
      if (typeof system === 'object' && system.exit) system.exit(status);
      if (typeof quit === 'function')                quit(status);
    },

    format: function(type, name, args) {
      if (!this.coloring()) return;
      var escape = Console.ESCAPE_CODES[type][name];

      for (var i = 0, n = args.length; i < n; i++)
        escape = escape.replace('%' + (i+1), args[i]);

      this.__format__ += Console.escape(escape);
    },

    flushFormat: function() {
      var format = this.__format__;
      this.__format__ = '';
      return format;
    },

    getDimensions: function() {
      var width  = this.envvar('COLUMNS') || Console.DEFAULT_WIDTH,
          height = this.envvar('ROWS')    || Console.DEFAULT_HEIGHT;

      return [parseInt(width, 10), parseInt(height, 10)];
    },

    print: function(string) {
      var coloring = this.coloring(),
          width    = this.getDimensions()[0],
          esc      = Console.escape,
          length, prefix, line;

      while (string.length > 0) {
        length = this.__buffer__.length;
        prefix = (length > 0 && coloring) ? esc('1F') + esc((length + 1) + 'G') : '';
        line   = string.substr(0, width - length);

        this.__buffer__ += line;

        if (coloring) this.echo(prefix + this.flushFormat() + line);

        if (this.__buffer__.length === width) {
          if (!coloring) this.echo(this.__buffer__);
          this.__buffer__ = '';
        }
        string = string.substr(width - length);
      }
    },

    puts: function(string) {
      var coloring = this.coloring(),
          esc      = Console.escape,
          length   = this.__buffer__.length,
          prefix   = (length > 0 && coloring) ? esc('1F') + esc((length + 1) + 'G') : this.__buffer__;

      this.echo(prefix + this.flushFormat() + string);
      this.__buffer__ = '';
    }
  })
});

Console.extend({
  Browser: new JS.Class(Console.Base, {
    backtraceFilter: function() {
      return new RegExp(window.location.href.replace(/(\/[^\/]+)/g, '($1)?') + '/?', 'g');
    },

    coloring: function() {
      if (this.envvar(Console.NO_COLOR)) return false;
      return Console.AIR;
    },

    echo: function(string) {
      if (window.runtime) return window.runtime.trace(string);
      if (window.console) return console.log(string);
      alert(string);
    },

    envvar: function(name) {
      return window[name] || null;
    },

    getDimensions: function() {
      if (Console.AIR) return this.callSuper();
      return [1024, 1];
    }
  })
});

Console.extend({
  BrowserColor: new JS.Class(Console.Browser, {
    COLORS: {
      green: 'limegreen'
    },

    __queue__: [],
    __state__: null,

    format: function(type, name) {
      name = name.replace(/^bg/, '');

      var state = JS.extend({}, this.__state__ || {}),
          color = this.COLORS[name] || name,
          no    = /^no/.test(name);

      if (type === 'reset')
        state = null;
      else if (no)
        delete state[type];
      else if (type === 'weight')
        state.weight = 'font-weight: ' + name;
      else if (type === 'style')
        state.style = 'font-style: ' + name;
      else if (type === 'underline')
        state.underline = 'text-decoration: underline';
      else if (type === 'color')
        state.color = 'color: ' + color;
      else if (type === 'background')
        state.background = 'background-color: ' + color;
      else
        state = undefined;

      if (state !== undefined) {
        this.__state__ = state;
        this.__queue__.push(state);
      }
    },

    print: function(string) {
      this.__queue__.push(string)
    },

    puts: function(string) {
      this.print(string);
      var buffer = '', formats = [], item;
      while ((item = this.__queue__.shift()) !== undefined) {
        if (typeof item === 'string') {
          if (this.__state__) {
            buffer += '%c' + item;
            formats.push(this._serialize(this.__state__));
          } else {
            buffer += item;
          }
        } else {
          this.__state__ = item;
        }
      }
      console.log.apply(console, [buffer].concat(formats));
    },

    _serialize: function(state) {
      var rules = [];
      for (var key in state) rules.push(state[key]);
      return rules.join('; ');
    }
  })
});

Console.extend({
  Node: new JS.Class(Console.Base, {
    backtraceFilter: function() {
      return new RegExp(process.cwd() + '/', 'g');
    },

    coloring: function() {
      return !this.envvar(Console.NO_COLOR) && require('tty').isatty(1);
    },

    envvar: function(name) {
      return process.env[name] || null;
    },

    exit: function(status) {
      process.exit(status);
    },

    getDimensions: function() {
      var width, height, dims;
      if (process.stdout.getWindowSize) {
        dims   = process.stdout.getWindowSize();
        width  = dims[0];
        height = dims[1];
      } else {
        dims   = process.binding('stdio').getWindowSize();
        width  = dims[1];
        height = dims[0];
      }
      return [width, height];
    },

    print: function(string) {
      process.stdout.write(this.flushFormat() + string);
    },

    puts: function(string) {
      console.log(this.flushFormat() + string);
    }
  })
});

Console.extend({
  Phantom: new JS.Class(Console.Base, {
    echo: function(string) {
      console.log(string);
    },

    envvar: function(name) {
      return require('system').env[name] || null;
    },

    exit: function(status) {
      phantom.exit(status);
    }
  })
});

Console.extend({
  Rhino: new JS.Class(Console.Base, {
    backtraceFilter: function() {
      return new RegExp(java.lang.System.getProperty('user.dir') + '/', 'g');
    },

    envvar: function(name) {
      var env = java.lang.System.getenv();
      return env.get(name) || null;
    },

    getDimensions: function() {
      var proc = java.lang.Runtime.getRuntime().exec(['sh', '-c', 'stty -a < /dev/tty']),
          is   = proc.getInputStream(),
          bite = 0,
          out  = '',
          width, height;

      while (bite >= 0) {
        bite = is.read();
        if (bite >= 0) out += String.fromCharCode(bite);
      }

      var match = out.match(/rows\s+(\d+);\s+columns\s+(\d+)/);
      if (!match) return this._dimCache || this.callSuper();

      return this._dimCache = [parseInt(match[2], 10), parseInt(match[1], 10)];
    },

    print: function(string) {
      java.lang.System.out.print(this.flushFormat() + string);
    },

    puts: function(string) {
      java.lang.System.out.println(this.flushFormat() + string);
    }
  })
});

Console.extend({
  Windows: new JS.Class(Console.Base, {
    coloring: function() {
      return false;
    },

    echo: function(string) {
      WScript.Echo(string);
    },

    exit: function(status) {
      WScript.Quit(status);
    }
  })
});

Console.BROWSER = (typeof window !== 'undefined');
Console.NODE    = (typeof process === 'object') && !Console.BROWSER;
Console.PHANTOM = (typeof phantom !== 'undefined');
Console.AIR     = (Console.BROWSER && typeof runtime !== 'undefined');
Console.RHINO   = (typeof java !== 'undefined' && typeof java.lang !== 'undefined');
Console.WSH     = (typeof WScript !== 'undefined');

var useColor = false, ua;
if (Console.BROWSER) {
  ua = navigator.userAgent;
  if (window.console && /Chrome/.test(ua))
    useColor = true;
}

if (Console.PHANTOM)      Console.adapter = new Console.Phantom();
else if (useColor)        Console.adapter = new Console.BrowserColor();
else if (Console.BROWSER) Console.adapter = new Console.Browser();
else if (Console.NODE)    Console.adapter = new Console.Node();
else if (Console.RHINO)   Console.adapter = new Console.Rhino();
else if (Console.WSH)     Console.adapter = new Console.Windows();
else                      Console.adapter = new Console.Base();

for (var type in Console.ESCAPE_CODES) {
  for (var key in Console.ESCAPE_CODES[type]) (function(type, key) {
    Console.define(key, function() {
      Console.adapter.format(type, key, arguments);
    });
  })(type, key);
}

Console.extend(Console);

exports.Console = Console;
});
},{"./core":23,"./enumerable":24,"__browserify_process":48,"system":33,"tty":50}],23:[function(require,module,exports){
var JS = (typeof this.JS === 'undefined') ? {} : this.JS;

(function(factory) {
  var $ = (typeof this.global === 'object') ? this.global : this,
      E = (typeof exports === 'object');

  if (E) {
    exports.JS = exports;
    JS = exports;
  } else {
    $.JS = JS;
  }
  factory($, JS);

})(function(global, exports) {
'use strict';

var JS = {ENV: global};

JS.END_WITHOUT_DOT = /([^\.])$/;

JS.array = function(enumerable) {
  var array = [], i = enumerable.length;
  while (i--) array[i] = enumerable[i];
  return array;
};

JS.bind = function(method, object) {
  return function() {
    return method.apply(object, arguments);
  };
};

JS.Date = JS.ENV.Date;

JS.extend = function(destination, source, overwrite) {
  if (!destination || !source) return destination;
  for (var field in source) {
    if (destination[field] === source[field]) continue;
    if (overwrite === false && destination.hasOwnProperty(field)) continue;
    destination[field] = source[field];
  }
  return destination;
};

JS.indexOf = function(list, item) {
  if (list.indexOf) return list.indexOf(item);
  var i = list.length;
  while (i--) {
    if (list[i] === item) return i;
  }
  return -1;
};

JS.isType = function(object, type) {
  if (typeof type === 'string')
    return typeof object === type;

  if (object === null || object === undefined)
    return false;

  return (typeof type === 'function' && object instanceof type) ||
         (object.isA && object.isA(type)) ||
         object.constructor === type;
};

JS.makeBridge = function(parent) {
  var bridge = function() {};
  bridge.prototype = parent.prototype;
  return new bridge();
};

JS.makeClass = function(parent) {
  parent = parent || Object;

  var constructor = function() {
    return this.initialize
         ? this.initialize.apply(this, arguments) || this
         : this;
  };
  constructor.prototype = JS.makeBridge(parent);

  constructor.superclass = parent;

  constructor.subclasses = [];
  if (parent.subclasses) parent.subclasses.push(constructor);

  return constructor;
};

JS.match = function(category, object) {
  if (object === undefined) return false;
  return typeof category.test === 'function'
       ? category.test(object)
       : category.match(object);
};

JS.Method = JS.makeClass();

JS.extend(JS.Method.prototype, {
  initialize: function(module, name, callable) {
    this.module   = module;
    this.name     = name;
    this.callable = callable;

    this._words = {};
    if (typeof callable !== 'function') return;

    this.arity  = callable.length;

    var matches = callable.toString().match(/\b[a-z\_\$][a-z0-9\_\$]*\b/ig),
        i       = matches.length;

    while (i--) this._words[matches[i]] = true;
  },

  setName: function(name) {
    this.callable.displayName =
    this.displayName = name;
  },

  contains: function(word) {
    return this._words.hasOwnProperty(word);
  },

  call: function() {
    return this.callable.call.apply(this.callable, arguments);
  },

  apply: function(receiver, args) {
    return this.callable.apply(receiver, args);
  },

  compile: function(environment) {
    var method     = this,
        trace      = method.module.__trace__ || environment.__trace__,
        callable   = method.callable,
        words      = method._words,
        allWords   = JS.Method._keywords,
        i          = allWords.length,
        keywords   = [],
        keyword;

    while  (i--) {
      keyword = allWords[i];
      if (words[keyword.name]) keywords.push(keyword);
    }
    if (keywords.length === 0 && !trace) return callable;

    var compiled = function() {
      var N = keywords.length, j = N, previous = {}, keyword, existing, kwd;

      while (j--) {
        keyword  = keywords[j];
        existing = this[keyword.name];

        if (existing && !existing.__kwd__) continue;

        previous[keyword.name] = {
          _value: existing,
          _own:   this.hasOwnProperty(keyword.name)
        };
        kwd = keyword.filter(method, environment, this, arguments);
        if (kwd) kwd.__kwd__ = true;
        this[keyword.name] = kwd;
      }
      var returnValue = callable.apply(this, arguments),
          j = N;

      while (j--) {
        keyword = keywords[j];
        if (!previous[keyword.name]) continue;
        if (previous[keyword.name]._own)
          this[keyword.name] = previous[keyword.name]._value;
        else
          delete this[keyword.name];
      }
      return returnValue;
    };

    var StackTrace = trace && (exports.StackTrace || require('./stack_trace').StackTrace);
    if (trace) return StackTrace.wrap(compiled, method, environment);
    return compiled;
  },

  toString: function() {
    var name = this.displayName || (this.module.toString() + '#' + this.name);
    return '#<Method:' + name + '>';
  }
});

JS.Method.create = function(module, name, callable) {
  if (callable && callable.__inc__ && callable.__fns__)
    return callable;

  var method = (typeof callable !== 'function')
             ? callable
             : new this(module, name, callable);

  this.notify(method);
  return method;
};

JS.Method.compile = function(method, environment) {
  return (method instanceof this)
      ? method.compile(environment)
      : method;
};

JS.Method.__listeners__ = [];

JS.Method.added = function(block, context) {
  this.__listeners__.push([block, context]);
};

JS.Method.notify = function(method) {
  var listeners = this.__listeners__,
      i = listeners.length,
      listener;

  while (i--) {
    listener = listeners[i];
    listener[0].call(listener[1], method);
  }
};

JS.Method._keywords = [];

JS.Method.keyword = function(name, filter) {
  this._keywords.push({name: name, filter: filter});
};

JS.Method.tracing = function(classes, block, context) {
  var pkg = exports.require ? exports : require('./loader');
  pkg.require('JS.StackTrace', function(StackTrace) {
    var logger = StackTrace.logger,
        active = logger.active;

    classes = [].concat(classes);
    this.trace(classes);
    logger.active = true;
    block.call(context);

    this.untrace(classes);
    logger.active = active;
  }, this);
};

JS.Method.trace = function(classes) {
  var i = classes.length;
  while (i--) {
    classes[i].__trace__ = true;
    classes[i].resolve();
  }
};

JS.Method.untrace = function(classes) {
  var i = classes.length;
  while (i--) {
    classes[i].__trace__ = false;
    classes[i].resolve();
  }
};

JS.Module = JS.makeClass();
JS.Module.__queue__ = [];

JS.extend(JS.Module.prototype, {
  initialize: function(name, methods, options) {
    if (typeof name !== 'string') {
      options = arguments[1];
      methods = arguments[0];
      name    = undefined;
    }
    options = options || {};

    this.__inc__ = [];
    this.__dep__ = [];
    this.__fns__ = {};
    this.__tgt__ = options._target;
    this.__anc__ = null;
    this.__mct__ = {};

    this.setName(name);
    this.include(methods, {_resolve: false});

    if (JS.Module.__queue__)
      JS.Module.__queue__.push(this);
  },

  setName: function(name) {
    this.displayName = name || '';

    for (var field in this.__fns__)
      this.__name__(field);

    if (name && this.__meta__)
      this.__meta__.setName(name + '.');
  },

  __name__: function(name) {
    if (!this.displayName) return;

    var object = this.__fns__[name];
    if (!object) return;

    name = this.displayName.replace(JS.END_WITHOUT_DOT, '$1#') + name;
    if (typeof object.setName === 'function') return object.setName(name);
    if (typeof object === 'function') object.displayName = name;
  },

  define: function(name, callable, options) {
    var method  = JS.Method.create(this, name, callable),
        resolve = (options || {})._resolve;

    this.__fns__[name] = method;
    this.__name__(name);
    if (resolve !== false) this.resolve();
  },

  include: function(module, options) {
    if (!module) return this;

    var options = options || {},
        resolve = options._resolve !== false,
        extend  = module.extend,
        include = module.include,
        extended, field, value, mixins, i, n;

    if (module.__fns__ && module.__inc__) {
      this.__inc__.push(module);
      if ((module.__dep__ || {}).push) module.__dep__.push(this);

      if (extended = options._extended) {
        if (typeof module.extended === 'function')
          module.extended(extended);
      }
      else {
        if (typeof module.included === 'function')
          module.included(this);
      }
    }
    else {
      if (this.shouldIgnore('extend', extend)) {
        mixins = [].concat(extend);
        for (i = 0, n = mixins.length; i < n; i++)
          this.extend(mixins[i]);
      }
      if (this.shouldIgnore('include', include)) {
        mixins = [].concat(include);
        for (i = 0, n = mixins.length; i < n; i++)
          this.include(mixins[i], {_resolve: false});
      }
      for (field in module) {
        if (!module.hasOwnProperty(field)) continue;
        value = module[field];
        if (this.shouldIgnore(field, value)) continue;
        this.define(field, value, {_resolve: false});
      }
      if (module.hasOwnProperty('toString'))
        this.define('toString', module.toString, {_resolve: false});
    }

    if (resolve) this.resolve();
    return this;
  },

  alias: function(aliases) {
    for (var method in aliases) {
      if (!aliases.hasOwnProperty(method)) continue;
      this.define(method, this.instanceMethod(aliases[method]), {_resolve: false});
    }
    this.resolve();
  },

  resolve: function(host) {
    var host   = host || this,
        target = host.__tgt__,
        inc    = this.__inc__,
        fns    = this.__fns__,
        i, n, key, compiled;

    if (host === this) {
      this.__anc__ = null;
      this.__mct__ = {};
      i = this.__dep__.length;
      while (i--) this.__dep__[i].resolve();
    }

    if (!target) return;

    for (i = 0, n = inc.length; i < n; i++)
      inc[i].resolve(host);

    for (key in fns) {
      compiled = JS.Method.compile(fns[key], host);
      if (target[key] !== compiled) target[key] = compiled;
    }
    if (fns.hasOwnProperty('toString'))
      target.toString = JS.Method.compile(fns.toString, host);
  },

  shouldIgnore: function(field, value) {
    return (field === 'extend' || field === 'include') &&
           (typeof value !== 'function' ||
             (value.__fns__ && value.__inc__));
  },

  ancestors: function(list) {
    var cachable = !list,
        list     = list || [],
        inc      = this.__inc__;

    if (cachable && this.__anc__) return this.__anc__.slice();

    for (var i = 0, n = inc.length; i < n; i++)
      inc[i].ancestors(list);

    if (JS.indexOf(list, this) < 0)
      list.push(this);

    if (cachable) this.__anc__ = list.slice();
    return list;
  },

  lookup: function(name) {
    var cached = this.__mct__[name];
    if (cached && cached.slice) return cached.slice();

    var ancestors = this.ancestors(),
        methods   = [],
        fns;

    for (var i = 0, n = ancestors.length; i < n; i++) {
      fns = ancestors[i].__fns__;
      if (fns.hasOwnProperty(name)) methods.push(fns[name]);
    }
    this.__mct__[name] = methods.slice();
    return methods;
  },

  includes: function(module) {
    if (module === this) return true;

    var inc  = this.__inc__;

    for (var i = 0, n = inc.length; i < n; i++) {
      if (inc[i].includes(module))
        return true;
    }
    return false;
  },

  instanceMethod: function(name) {
    return this.lookup(name).pop();
  },

  instanceMethods: function(recursive, list) {
    var methods = list || [],
        fns     = this.__fns__,
        field;

    for (field in fns) {
      if (!JS.isType(this.__fns__[field], JS.Method)) continue;
      if (JS.indexOf(methods, field) >= 0) continue;
      methods.push(field);
    }

    if (recursive !== false) {
      var ancestors = this.ancestors(), i = ancestors.length;
      while (i--) ancestors[i].instanceMethods(false, methods);
    }
    return methods;
  },

  match: function(object) {
    return object && object.isA && object.isA(this);
  },

  toString: function() {
    return this.displayName;
  }
});

JS.Kernel = new JS.Module('Kernel', {
  __eigen__: function() {
    if (this.__meta__) return this.__meta__;
    var name = this.toString() + '.';
    this.__meta__ = new JS.Module(name, null, {_target: this});
    return this.__meta__.include(this.klass, {_resolve: false});
  },

  equals: function(other) {
    return this === other;
  },

  extend: function(module, options) {
    var resolve = (options || {})._resolve;
    this.__eigen__().include(module, {_extended: this, _resolve: resolve});
    return this;
  },

  hash: function() {
    return JS.Kernel.hashFor(this);
  },

  isA: function(module) {
    return (typeof module === 'function' && this instanceof module) ||
           this.__eigen__().includes(module);
  },

  method: function(name) {
    var cache = this.__mct__ = this.__mct__ || {},
        value = cache[name],
        field = this[name];

    if (typeof field !== 'function') return field;
    if (value && field === value._value) return value._bound;

    var bound = JS.bind(field, this);
    cache[name] = {_value: field, _bound: bound};
    return bound;
  },

  methods: function() {
    return this.__eigen__().instanceMethods();
  },

  tap: function(block, context) {
    block.call(context, this);
    return this;
  },

  toString: function() {
    if (this.displayName) return this.displayName;
    var name = this.klass.displayName || this.klass.toString();
    return '#<' + name + ':' + this.hash() + '>';
  }
});

(function() {
  var id = 1;

  JS.Kernel.hashFor = function(object) {
    if (object.__hash__ !== undefined) return object.__hash__;
    object.__hash__ = (new JS.Date().getTime() + id).toString(16);
    id += 1;
    return object.__hash__;
  };
})();

JS.Class = JS.makeClass(JS.Module);

JS.extend(JS.Class.prototype, {
  initialize: function(name, parent, methods, options) {
    if (typeof name !== 'string') {
      options = arguments[2];
      methods = arguments[1];
      parent  = arguments[0];
      name    = undefined;
    }
    if (typeof parent !== 'function') {
      options = methods;
      methods = parent;
      parent  = Object;
    }
    JS.Module.prototype.initialize.call(this, name);
    options = options || {};

    var klass = JS.makeClass(parent);
    JS.extend(klass, this);

    klass.prototype.constructor =
    klass.prototype.klass = klass;

    klass.__eigen__().include(parent.__meta__, {_resolve: options._resolve});
    klass.setName(name);

    klass.__tgt__ = klass.prototype;

    var parentModule = (parent === Object)
                     ? {}
                     : (parent.__fns__ ? parent : new JS.Module(parent.prototype, {_resolve: false}));

    klass.include(JS.Kernel,    {_resolve: false})
         .include(parentModule, {_resolve: false})
         .include(methods,      {_resolve: false});

    if (options._resolve !== false) klass.resolve();

    if (typeof parent.inherited === 'function')
      parent.inherited(klass);

    return klass;
  }
});

(function() {
  var methodsFromPrototype = function(klass) {
    var methods = {},
        proto   = klass.prototype;

    for (var field in proto) {
      if (!proto.hasOwnProperty(field)) continue;
      methods[field] = JS.Method.create(klass, field, proto[field]);
    }
    return methods;
  };

  var classify = function(name, parentName) {
    var klass  = JS[name],
        parent = JS[parentName];

    klass.__inc__ = [];
    klass.__dep__ = [];
    klass.__fns__ = methodsFromPrototype(klass);
    klass.__tgt__ = klass.prototype;

    klass.prototype.constructor =
    klass.prototype.klass = klass;

    JS.extend(klass, JS.Class.prototype);
    klass.include(parent || JS.Kernel);
    klass.setName(name);

    klass.constructor = klass.klass = JS.Class;
  };

  classify('Method');
  classify('Module');
  classify('Class', 'Module');

  var eigen = JS.Kernel.instanceMethod('__eigen__');

  eigen.call(JS.Method).resolve();
  eigen.call(JS.Module).resolve();
  eigen.call(JS.Class).include(JS.Module.__meta__);
})();

JS.NotImplementedError = new JS.Class('NotImplementedError', Error);

JS.Method.keyword('callSuper', function(method, env, receiver, args) {
  var methods    = env.lookup(method.name),
      stackIndex = methods.length - 1,
      params     = JS.array(args);

  if (stackIndex === 0) return undefined;

  var _super = function() {
    var i = arguments.length;
    while (i--) params[i] = arguments[i];

    stackIndex -= 1;
    if (stackIndex === 0) delete receiver.callSuper;
    var returnValue = methods[stackIndex].apply(receiver, params);
    receiver.callSuper = _super;
    stackIndex += 1;

    return returnValue;
  };

  return _super;
});

JS.Method.keyword('blockGiven', function(method, env, receiver, args) {
  var block = Array.prototype.slice.call(args, method.arity),
      hasBlock = (typeof block[0] === 'function');

  return function() { return hasBlock };
});

JS.Method.keyword('yieldWith', function(method, env, receiver, args) {
  var block = Array.prototype.slice.call(args, method.arity);

  return function() {
    if (typeof block[0] !== 'function') return;
    return block[0].apply(block[1] || null, arguments);
  };
});

JS.Interface = new JS.Class('Interface', {
  initialize: function(methods) {
    this.test = function(object, returnName) {
      var n = methods.length;
      while (n--) {
        if (typeof object[methods[n]] !== 'function')
          return returnName ? methods[n] : false;
      }
      return true;
    };
  },

  extend: {
    ensure: function() {
      var args = JS.array(arguments), object = args.shift(), face, result;
      while (face = args.shift()) {
        result = face.test(object, true);
        if (result !== true) throw new Error('object does not implement ' + result + '()');
      }
    }
  }
});

JS.Singleton = new JS.Class('Singleton', {
  initialize: function(name, parent, methods) {
    return new (new JS.Class(name, parent, methods));
  }
});

JS.extend(exports, JS);
if (global.JS) JS.extend(global.JS, JS);
});
},{"./loader":27,"./stack_trace":29}],24:[function(require,module,exports){
(function(factory) {
  var E  = (typeof exports === 'object'),
      js = (typeof JS === 'undefined') ? require('./core') : JS;

  if (E) exports.JS = exports;
  factory(js, E ? exports : js);

})(function(JS, exports) {
'use strict';

var Enumerable = new JS.Module('Enumerable', {
  extend: {
    ALL_EQUAL: {},

    forEach: function(block, context) {
      if (!block) return new Enumerator(this, 'forEach');
      for (var i = 0; i < this.length; i++)
        block.call(context, this[i]);
      return this;
    },

    isComparable: function(list) {
      return list.all(function(item) { return typeof item.compareTo === 'function' });
    },

    areEqual: function(expected, actual) {
      var result;

      if (expected === actual)
        return true;

      if (expected && typeof expected.equals === 'function')
        return expected.equals(actual);

      if (expected instanceof Function)
        return expected === actual;

      if (expected instanceof Array) {
        if (!(actual instanceof Array)) return false;
        for (var i = 0, n = expected.length; i < n; i++) {
          result = this.areEqual(expected[i], actual[i]);
          if (result === this.ALL_EQUAL) return true;
          if (!result) return false;
        }
        if (expected.length !== actual.length) return false;
        return true;
      }

      if (expected instanceof Date) {
        if (!(actual instanceof Date)) return false;
        if (expected.getTime() !== actual.getTime()) return false;
        return true;
      }

      if (expected instanceof Object) {
        if (!(actual instanceof Object)) return false;
        if (this.objectSize(expected) !== this.objectSize(actual)) return false;
        for (var key in expected) {
          if (!this.areEqual(expected[key], actual[key]))
            return false;
        }
        return true;
      }

      return false;
    },

    objectKeys: function(object, includeProto) {
      var keys = [];
      for (var key in object) {
        if (object.hasOwnProperty(key) || includeProto !== false)
          keys.push(key);
      }
      return keys;
    },

    objectSize: function(object) {
      return this.objectKeys(object).length;
    },

    Collection: new JS.Class({
      initialize: function(array) {
        this.length = 0;
        if (array) Enumerable.forEach.call(array, this.push, this);
      },

      push: function(item) {
        Array.prototype.push.call(this, item);
      },

      clear: function() {
        var i = this.length;
        while (i--) delete this[i];
        this.length = 0;
      }
    })
  },

  all: function(block, context) {
    block = Enumerable.toFn(block);
    var truth = true;
    this.forEach(function(item) {
      truth = truth && (block ? block.apply(context, arguments) : item);
    });
    return !!truth;
  },

  any: function(block, context) {
    block = Enumerable.toFn(block);
    var truth = false;
    this.forEach(function(item) {
      truth = truth || (block ? block.apply(context, arguments) : item);
    });
    return !!truth;
  },

  chunk: function(block, context) {
    if (!block) return this.enumFor('chunk');

    var result  = [],
        value   = null,
        started = false;

    this.forEach(function(item) {
      var v = block.apply(context, arguments);
      if (started) {
        if (Enumerable.areEqual(value, v))
          result[result.length - 1][1].push(item);
        else
          result.push([v, [item]]);
      } else {
        result.push([v, [item]]);
        started = true;
      }
      value = v;
    });
    return result;
  },

  count: function(block, context) {
    if (typeof this.size === 'function') return this.size();
    var count = 0, object = block;

    if (block && typeof block !== 'function')
      block = function(x) { return Enumerable.areEqual(x, object) };

    this.forEach(function() {
      if (!block || block.apply(context, arguments))
        count += 1;
    });
    return count;
  },

  cycle: function(n, block, context) {
    if (!block) return this.enumFor('cycle', n);
    block = Enumerable.toFn(block);
    while (n--) this.forEach(block, context);
  },

  drop: function(n) {
    var entries = [];
    this.forEachWithIndex(function(item, i) {
      if (i >= n) entries.push(item);
    });
    return entries;
  },

  dropWhile: function(block, context) {
    if (!block) return this.enumFor('dropWhile');
    block = Enumerable.toFn(block);

    var entries = [],
        drop    = true;

    this.forEach(function(item) {
      if (drop) drop = drop && block.apply(context, arguments);
      if (!drop) entries.push(item);
    });
    return entries;
  },

  forEachCons: function(n, block, context) {
    if (!block) return this.enumFor('forEachCons', n);
    block = Enumerable.toFn(block);

    var entries = this.toArray(),
        size    = entries.length,
        limit   = size - n,
        i;

    for (i = 0; i <= limit; i++)
      block.call(context, entries.slice(i, i+n));

    return this;
  },

  forEachSlice: function(n, block, context) {
    if (!block) return this.enumFor('forEachSlice', n);
    block = Enumerable.toFn(block);

    var entries = this.toArray(),
        size    = entries.length,
        m       = Math.ceil(size/n),
        i;

    for (i = 0; i < m; i++)
      block.call(context, entries.slice(i*n, (i+1)*n));

    return this;
  },

  forEachWithIndex: function(offset, block, context) {
    if (typeof offset === 'function') {
      context = block;
      block   = offset;
      offset  = 0;
    }
    offset = offset || 0;

    if (!block) return this.enumFor('forEachWithIndex', offset);
    block = Enumerable.toFn(block);

    return this.forEach(function(item) {
      var result = block.call(context, item, offset);
      offset += 1;
      return result;
    });
  },

  forEachWithObject: function(object, block, context) {
    if (!block) return this.enumFor('forEachWithObject', object);
    block = Enumerable.toFn(block);

    this.forEach(function() {
      var args = [object].concat(JS.array(arguments));
      block.apply(context, args);
    });
    return object;
  },

  find: function(block, context) {
    if (!block) return this.enumFor('find');
    block = Enumerable.toFn(block);

    var needle = {}, K = needle;
    this.forEach(function(item) {
      if (needle !== K) return;
      needle = block.apply(context, arguments) ? item : needle;
    });
    return needle === K ? null : needle;
  },

  findIndex: function(needle, context) {
    if (needle === undefined) return this.enumFor('findIndex');

    var index = null,
        block = (typeof needle === 'function');

    this.forEachWithIndex(function(item, i) {
      if (index !== null) return;
      if (Enumerable.areEqual(needle, item) || (block && needle.apply(context, arguments)))
        index = i;
    });
    return index;
  },

  first: function(n) {
    var entries = this.toArray();
    return (n === undefined) ? entries[0] : entries.slice(0,n);
  },

  grep: function(pattern, block, context) {
    block = Enumerable.toFn(block);
    var results = [];
    this.forEach(function(item) {
      var match = (typeof pattern.match === 'function') ? pattern.match(item)
                : (typeof pattern.test === 'function')  ? pattern.test(item)
                : JS.isType(item, pattern);

      if (!match) return;
      if (block) item = block.apply(context, arguments);
      results.push(item);
    });
    return results;
  },

  groupBy: function(block, context) {
    if (!block) return this.enumFor('groupBy');
    block = Enumerable.toFn(block);

    var Hash = ((typeof require === 'function') ? require('./hash') : JS).Hash,
        hash = new Hash();

    this.forEach(function(item) {
      var value = block.apply(context, arguments);
      if (!hash.hasKey(value)) hash.store(value, []);
      hash.get(value).push(item);
    });
    return hash;
  },

  inject: function(memo, block, context) {
    var args    = JS.array(arguments),
        counter = 0,
        K       = {};

    switch (args.length) {
      case 1:   memo      = K;
                block     = args[0];
                break;

      case 2:   if (typeof memo === 'function') {
                  memo    = K;
                  block   = args[0];
                  context = args[1];
                }
    }
    block = Enumerable.toFn(block);

    this.forEach(function(item) {
      if (!counter++ && memo === K) return memo = item;
      var args = [memo].concat(JS.array(arguments));
      memo = block.apply(context, args);
    });
    return memo;
  },

  map: function(block, context) {
    if (!block) return this.enumFor('map');
    block = Enumerable.toFn(block);

    var map = [];
    this.forEach(function() {
      map.push(block.apply(context, arguments));
    });
    return map;
  },

  max: function(block, context) {
    return this.minmax(block, context)[1];
  },

  maxBy: function(block, context) {
    if (!block) return this.enumFor('maxBy');
    return this.minmaxBy(block, context)[1];
  },

  member: function(needle) {
    return this.any(function(item) { return Enumerable.areEqual(item, needle) });
  },

  min: function(block, context) {
    return this.minmax(block, context)[0];
  },

  minBy: function(block, context) {
    if (!block) return this.enumFor('minBy');
    return this.minmaxBy(block, context)[0];
  },

  minmax: function(block, context) {
    var list = this.sort(block, context);
    return [list[0], list[list.length - 1]];
  },

  minmaxBy: function(block, context) {
    if (!block) return this.enumFor('minmaxBy');
    var list = this.sortBy(block, context);
    return [list[0], list[list.length - 1]];
  },

  none: function(block, context) {
    return !this.any(block, context);
  },

  one: function(block, context) {
    block = Enumerable.toFn(block);
    var count = 0;
    this.forEach(function(item) {
      if (block ? block.apply(context, arguments) : item) count += 1;
    });
    return count === 1;
  },

  partition: function(block, context) {
    if (!block) return this.enumFor('partition');
    block = Enumerable.toFn(block);

    var ayes = [], noes = [];
    this.forEach(function(item) {
      (block.apply(context, arguments) ? ayes : noes).push(item);
    });
    return [ayes, noes];
  },

  reject: function(block, context) {
    if (!block) return this.enumFor('reject');
    block = Enumerable.toFn(block);

    var map = [];
    this.forEach(function(item) {
      if (!block.apply(context, arguments)) map.push(item);
    });
    return map;
  },

  reverseForEach: function(block, context) {
    if (!block) return this.enumFor('reverseForEach');
    block = Enumerable.toFn(block);

    var entries = this.toArray(),
        n       = entries.length;

    while (n--) block.call(context, entries[n]);
    return this;
  },

  select: function(block, context) {
    if (!block) return this.enumFor('select');
    block = Enumerable.toFn(block);

    var map = [];
    this.forEach(function(item) {
      if (block.apply(context, arguments)) map.push(item);
    });
    return map;
  },

  sort: function(block, context) {
    var comparable = Enumerable.isComparable(this),
        entries    = this.toArray();

    block = block || (comparable
        ? function(a,b) { return a.compareTo(b); }
        : null);
    return block
        ? entries.sort(function(a,b) { return block.call(context, a, b); })
        : entries.sort();
  },

  sortBy: function(block, context) {
    if (!block) return this.enumFor('sortBy');
    block = Enumerable.toFn(block);

    var util       = Enumerable,
        map        = new util.Collection(this.map(block, context)),
        comparable = util.isComparable(map);

    return new util.Collection(map.zip(this).sort(function(a, b) {
      a = a[0]; b = b[0];
      return comparable ? a.compareTo(b) : (a < b ? -1 : (a > b ? 1 : 0));
    })).map(function(item) { return item[1]; });
  },

  take: function(n) {
    var entries = [];
    this.forEachWithIndex(function(item, i) {
      if (i < n) entries.push(item);
    });
    return entries;
  },

  takeWhile: function(block, context) {
    if (!block) return this.enumFor('takeWhile');
    block = Enumerable.toFn(block);

    var entries = [],
        take    = true;
    this.forEach(function(item) {
      if (take) take = take && block.apply(context, arguments);
      if (take) entries.push(item);
    });
    return entries;
  },

  toArray: function() {
    return this.drop(0);
  },

  zip: function() {
    var util    = Enumerable,
        args    = [],
        counter = 0,
        n       = arguments.length,
        block, context;

    if (typeof arguments[n-1] === 'function') {
      block = arguments[n-1]; context = {};
    }
    if (typeof arguments[n-2] === 'function') {
      block = arguments[n-2]; context = arguments[n-1];
    }
    util.forEach.call(arguments, function(arg) {
      if (arg === block || arg === context) return;
      if (arg.toArray) arg = arg.toArray();
      if (JS.isType(arg, Array)) args.push(arg);
    });
    var results = this.map(function(item) {
      var zip = [item];
      util.forEach.call(args, function(arg) {
        zip.push(arg[counter] === undefined ? null : arg[counter]);
      });
      return ++counter && zip;
    });
    if (!block) return results;
    util.forEach.call(results, block, context);
  }
});

// http://developer.mozilla.org/en/docs/index.php?title=Core_JavaScript_1.5_Reference:Global_Objects:Array&oldid=58326
Enumerable.define('forEach', Enumerable.forEach);

Enumerable.alias({
  collect:    'map',
  detect:     'find',
  entries:    'toArray',
  every:      'all',
  findAll:    'select',
  filter:     'select',
  reduce:     'inject',
  some:       'any'
});

Enumerable.extend({
  toFn: function(object) {
    if (!object) return object;
    if (object.toFunction) return object.toFunction();
    if (this.OPS[object]) return this.OPS[object];
    if (JS.isType(object, 'string') || JS.isType(object, String))
    return function() {
        var args   = JS.array(arguments),
            target = args.shift(),
            method = target[object];
        return (typeof method === 'function') ? method.apply(target, args) : method;
      };
    return object;
  },

  OPS: {
    '+':    function(a,b) { return a + b },
    '-':    function(a,b) { return a - b },
    '*':    function(a,b) { return a * b },
    '/':    function(a,b) { return a / b },
    '%':    function(a,b) { return a % b },
    '^':    function(a,b) { return a ^ b },
    '&':    function(a,b) { return a & b },
    '&&':   function(a,b) { return a && b },
    '|':    function(a,b) { return a | b },
    '||':   function(a,b) { return a || b },
    '==':   function(a,b) { return a == b },
    '!=':   function(a,b) { return a != b },
    '>':    function(a,b) { return a > b },
    '>=':   function(a,b) { return a >= b },
    '<':    function(a,b) { return a < b },
    '<=':   function(a,b) { return a <= b },
    '===':  function(a,b) { return a === b },
    '!==':  function(a,b) { return a !== b },
    '[]':   function(a,b) { return a[b] },
    '()':   function(a,b) { return a(b) }
  },

  Enumerator: new JS.Class({
    include: Enumerable,

    extend: {
      DEFAULT_METHOD: 'forEach'
    },

    initialize: function(object, method, args) {
      this._object = object;
      this._method = method || this.klass.DEFAULT_METHOD;
      this._args   = (args || []).slice();
    },

    // this is largely here to support testing since I don't want to make the
    // ivars public
    equals: function(enumerator) {
      return JS.isType(enumerator, this.klass) &&
             this._object === enumerator._object &&
             this._method === enumerator._method &&
             Enumerable.areEqual(this._args, enumerator._args);
          },

          forEach: function(block, context) {
      if (!block) return this;
      var args = this._args.slice();
      args.push(block);
      if (context) args.push(context);
      return this._object[this._method].apply(this._object, args);
    }
  })
});

Enumerable.Enumerator.alias({
  cons:       'forEachCons',
  reverse:    'reverseForEach',
  slice:      'forEachSlice',
  withIndex:  'forEachWithIndex',
  withObject: 'forEachWithObject'
});

Enumerable.Collection.include(Enumerable);

JS.Kernel.include({
  enumFor: function(method) {
    var args   = JS.array(arguments),
        method = args.shift();
    return new Enumerable.Enumerator(this, method, args);
  }
}, {_resolve: false});

JS.Kernel.alias({toEnum: 'enumFor'});

exports.Enumerable = Enumerable;
});
},{"./core":23,"./hash":25}],25:[function(require,module,exports){
(function(factory) {
  var E  = (typeof exports === 'object'),
      js = (typeof JS === 'undefined') ? require('./core') : JS,

      Enumerable = js.Enumerable || require('./enumerable').Enumerable,
      Comparable = js.Comparable || require('./comparable').Comparable;

  if (E) exports.JS = exports;
  factory(js, Enumerable, Comparable, E ? exports : js);

})(function(JS, Enumerable, Comparable, exports) {
'use strict';

var Hash = new JS.Class('Hash', {
  include: Enumerable || {},

  extend: {
    Pair: new JS.Class({
      include: Comparable || {},
      length: 2,

      setKey: function(key) {
        this[0] = this.key = key;
      },

      hasKey: function(key) {
        return Enumerable.areEqual(this.key, key);
      },

      setValue: function(value) {
        this[1] = this.value = value;
      },

      hasValue: function(value) {
        return Enumerable.areEqual(this.value, value);
      },

      compareTo: function(other) {
        return this.key.compareTo
            ? this.key.compareTo(other.key)
            : (this.key < other.key ? -1 : (this.key > other.key ? 1 : 0));
      },

      hash: function() {
        var key   = Hash.codeFor(this.key),
            value = Hash.codeFor(this.value);

        return [key, value].sort().join('/');
      }
    }),

    codeFor: function(object) {
      if (typeof object !== 'object') return String(object);
      return (typeof object.hash === 'function')
          ? object.hash()
          : object.toString();
    }
  },

  initialize: function(object) {
    this.clear();
    if (!JS.isType(object, Array)) return this.setDefault(object);
    for (var i = 0, n = object.length; i < n; i += 2)
      this.store(object[i], object[i+1]);
  },

  forEach: function(block, context) {
    if (!block) return this.enumFor('forEach');
    block = Enumerable.toFn(block);

    var hash, bucket, i;

    for (hash in this._buckets) {
      if (!this._buckets.hasOwnProperty(hash)) continue;
      bucket = this._buckets[hash];
      i = bucket.length;
      while (i--) block.call(context, bucket[i]);
    }
    return this;
  },

  _bucketForKey: function(key, createIfAbsent) {
    var hash   = this.klass.codeFor(key),
        bucket = this._buckets[hash];

    if (!bucket && createIfAbsent)
      bucket = this._buckets[hash] = [];

    return bucket;
  },

  _indexInBucket: function(bucket, key) {
    var i     = bucket.length,
        ident = !!this._compareByIdentity;

    while (i--) {
      if (ident ? (bucket[i].key === key) : bucket[i].hasKey(key))
        return i;
    }
    return -1;
  },

  assoc: function(key, createIfAbsent) {
    var bucket, index, pair;

    bucket = this._bucketForKey(key, createIfAbsent);
    if (!bucket) return null;

    index = this._indexInBucket(bucket, key);
    if (index > -1) return bucket[index];
    if (!createIfAbsent) return null;

    this.size += 1; this.length += 1;
    pair = new this.klass.Pair;
    pair.setKey(key);
    bucket.push(pair);
    return pair;
  },

  rassoc: function(value) {
    var key = this.key(value);
    return key ? this.assoc(key) : null;
  },

  clear: function() {
    this._buckets = {};
    this.length = this.size = 0;
  },

  compareByIdentity: function() {
    this._compareByIdentity = true;
    return this;
  },

  comparesByIdentity: function() {
    return !!this._compareByIdentity;
  },

  setDefault: function(value) {
    this._default = value;
    return this;
  },

  getDefault: function(key) {
    return (typeof this._default === 'function')
        ? this._default(this, key)
        : (this._default || null);
  },

  equals: function(other) {
    if (!JS.isType(other, Hash) || this.length !== other.length)
      return false;
    var result = true;
    this.forEach(function(pair) {
      if (!result) return;
      var otherPair = other.assoc(pair.key);
      if (otherPair === null || !otherPair.hasValue(pair.value)) result = false;
    });
    return result;
  },

  hash: function() {
    var hashes = [];
    this.forEach(function(pair) { hashes.push(pair.hash()) });
    return hashes.sort().join('');
  },

  fetch: function(key, defaultValue, context) {
    var pair = this.assoc(key);
    if (pair) return pair.value;

    if (defaultValue === undefined) throw new Error('key not found');
    if (typeof defaultValue === 'function') return defaultValue.call(context, key);
    return defaultValue;
  },

  forEachKey: function(block, context) {
    if (!block) return this.enumFor('forEachKey');
    block = Enumerable.toFn(block);

    this.forEach(function(pair) {
      block.call(context, pair.key);
    });
    return this;
  },

  forEachPair: function(block, context) {
    if (!block) return this.enumFor('forEachPair');
    block = Enumerable.toFn(block);

    this.forEach(function(pair) {
      block.call(context, pair.key, pair.value);
    });
    return this;
  },

  forEachValue: function(block, context) {
    if (!block) return this.enumFor('forEachValue');
    block = Enumerable.toFn(block);

    this.forEach(function(pair) {
      block.call(context, pair.value);
    });
    return this;
  },

  get: function(key) {
    var pair = this.assoc(key);
    return pair ? pair.value : this.getDefault(key);
  },

  hasKey: function(key) {
    return !!this.assoc(key);
  },

  hasValue: function(value) {
    var has = false, ident = !!this._compareByIdentity;
    this.forEach(function(pair) {
      if (has) return;
      if (ident ? value === pair.value : Enumerable.areEqual(value, pair.value))
        has = true;
    });
    return has;
  },

  invert: function() {
    var hash = new this.klass;
    this.forEach(function(pair) {
      hash.store(pair.value, pair.key);
    });
    return hash;
  },

  isEmpty: function() {
    for (var hash in this._buckets) {
      if (this._buckets.hasOwnProperty(hash) && this._buckets[hash].length > 0)
        return false;
    }
    return true;
  },

  keepIf: function(block, context) {
    return this.removeIf(function() {
      return !block.apply(context, arguments);
    });
  },

  key: function(value) {
    var result = null;
    this.forEach(function(pair) {
      if (!result && Enumerable.areEqual(value, pair.value))
        result = pair.key;
    });
    return result;
  },

  keys: function() {
    var keys = [];
    this.forEach(function(pair) { keys.push(pair.key) });
    return keys;
  },

  merge: function(hash, block, context) {
    var newHash = new this.klass;
    newHash.update(this);
    newHash.update(hash, block, context);
    return newHash;
  },

  rehash: function() {
    var temp = new this.klass;
    temp._buckets = this._buckets;
    this.clear();
    this.update(temp);
  },

  remove: function(key, block) {
    if (block === undefined) block = null;
    var bucket, index, result;

    bucket = this._bucketForKey(key);
    if (!bucket) return (typeof block === 'function')
                      ? this.fetch(key, block)
                      : this.getDefault(key);

    index = this._indexInBucket(bucket, key);
    if (index < 0) return (typeof block === 'function')
                        ? this.fetch(key, block)
                        : this.getDefault(key);

    result = bucket[index].value;
    this._delete(bucket, index);
    this.size -= 1;
    this.length -= 1;

    if (bucket.length === 0)
      delete this._buckets[this.klass.codeFor(key)];

    return result;
  },

  _delete: function(bucket, index) {
    bucket.splice(index, 1);
  },

  removeIf: function(block, context) {
    if (!block) return this.enumFor('removeIf');
    block = Enumerable.toFn(block);

    var toRemove = [];

    this.forEach(function(pair) {
      if (block.call(context, pair))
        toRemove.push(pair.key);
    }, this);

    var i = toRemove.length;
    while (i--) this.remove(toRemove[i]);

    return this;
  },

  replace: function(hash) {
    this.clear();
    this.update(hash);
  },

  shift: function() {
    var keys = this.keys();
    if (keys.length === 0) return this.getDefault();
    var pair = this.assoc(keys[0]);
    this.remove(pair.key);
    return pair;
  },

  store: function(key, value) {
    this.assoc(key, true).setValue(value);
    return value;
  },

  toString: function() {
    return 'Hash:{' + this.map(function(pair) {
      return pair.key.toString() + '=>' + pair.value.toString();
    }).join(',') + '}';
  },

  update: function(hash, block, context) {
    var givenBlock = (typeof block === 'function');
    hash.forEach(function(pair) {
      var key = pair.key, value = pair.value;
      if (givenBlock && this.hasKey(key))
        value = block.call(context, key, this.get(key), value);
      this.store(key, value);
    }, this);
  },

  values: function() {
    var values = [];
    this.forEach(function(pair) { values.push(pair.value) });
    return values;
  },

  valuesAt: function() {
    var i = arguments.length, results = [];
    while (i--) results.push(this.get(arguments[i]));
    return results;
  }
});

Hash.alias({
  includes: 'hasKey',
  index:    'key',
  put:      'store'
});

var OrderedHash = new JS.Class('OrderedHash', Hash, {
  assoc: function(key, createIfAbsent) {
    var _super = Hash.prototype.assoc;

    var existing = _super.call(this, key, false);
    if (existing || !createIfAbsent) return existing;

    var pair = _super.call(this, key, true);

    if (!this._first) {
      this._first = this._last = pair;
    } else {
      this._last._next = pair;
      pair._prev = this._last;
      this._last = pair;
    }
    return pair;
  },

  clear: function() {
    this.callSuper();
    this._first = this._last = null;
  },

  _delete: function(bucket, index) {
    var pair = bucket[index];

    if (pair._prev) pair._prev._next = pair._next;
    if (pair._next) pair._next._prev = pair._prev;

    if (pair === this._first) this._first = pair._next;
    if (pair === this._last) this._last = pair._prev;

    return this.callSuper();
  },

  forEach: function(block, context) {
    if (!block) return this.enumFor('forEach');
    block = Enumerable.toFn(block);

    var pair = this._first;
    while (pair) {
      block.call(context, pair);
      pair = pair._next;
    }
  },

  rehash: function() {
    var pair = this._first;
    this.clear();
    while (pair) {
      this.store(pair.key, pair.value);
      pair = pair._next;
    }
  }
});

exports.Hash = Hash;
exports.OrderedHash = OrderedHash;
});
},{"./comparable":21,"./core":23,"./enumerable":24}],26:[function(require,module,exports){
(function(factory) {
  var E  = (typeof exports === 'object'),
      js = (typeof JS === 'undefined') ? require('./core') : JS,

      Enumerable = js.Enumerable || require('./enumerable').Enumerable;

  if (E) exports.JS = exports;
  factory(js, Enumerable, E ? exports : js);

})(function(JS, Enumerable, exports) {
'use strict';

var LinkedList = new JS.Class('LinkedList', {
  include: Enumerable || {},

  initialize: function(array, useNodes) {
    this.length = 0;
    this.first = this.last = null;
    if (!array) return;
    for (var i = 0, n = array.length; i < n; i++)
      this.push( useNodes ? new this.klass.Node(array[i]) : array[i] );
  },

  forEach: function(block, context) {
    if (!block) return this.enumFor('forEach');
    block = Enumerable.toFn(block);

    var node   = this.first,
        next, i, n;

    for (i = 0, n = this.length; i < n; i++) {
      next = node.next;
      block.call(context, node, i);
      if (node === this.last) break;
      node = next;
    }
    return this;
  },

  at: function(n) {
    if (n < 0 || n >= this.length) return undefined;
    var node = this.first;
    while (n--) node = node.next;
    return node;
  },

  pop: function() {
    return this.length ? this.remove(this.last) : undefined;
  },

  shift: function() {
    return this.length ? this.remove(this.first) : undefined;
  },

  // stubs - should be implemented by concrete list types
  insertAfter:  function() {},
  push:         function() {},
  remove:       function() {},

  extend: {
    Node: new JS.Class({
      initialize: function(data) {
        this.data = data;
        this.prev = this.next = this.list = null;
      }
    })
  }
});

LinkedList.Doubly = new JS.Class('LinkedList.Doubly', LinkedList, {
  insertAt: function(n, newNode) {
    if (n < 0 || n >= this.length) return;
    this.insertBefore(this.at(n), newNode);
  },

  unshift: function(newNode) {
    this.length > 0
        ? this.insertBefore(this.first, newNode)
        : this.push(newNode);
  },

  insertBefore: function() {}
});

LinkedList.insertTemplate = function(prev, next, pos) {
  return function(node, newNode) {
    if (node.list !== this) return;
    newNode[prev] = node;
    newNode[next] = node[next];
    node[next] = (node[next][prev] = newNode);
    if (newNode[prev] === this[pos]) this[pos] = newNode;
    newNode.list = this;
    this.length++;
  };
};

LinkedList.Doubly.Circular = new JS.Class('LinkedList.Doubly.Circular', LinkedList.Doubly, {
  insertAfter: LinkedList.insertTemplate('prev', 'next', 'last'),
  insertBefore: LinkedList.insertTemplate('next', 'prev', 'first'),

  push: function(newNode) {
    if (this.length)
      return this.insertAfter(this.last, newNode);

    this.first = this.last =
        newNode.prev = newNode.next = newNode;

    newNode.list = this;
    this.length = 1;
  },

  remove: function(removed) {
    if (removed.list !== this || this.length === 0) return null;
    if (this.length > 1) {
      removed.prev.next = removed.next;
      removed.next.prev = removed.prev;
      if (removed === this.first) this.first = removed.next;
      if (removed === this.last) this.last = removed.prev;
    } else {
      this.first = this.last = null;
    }
    removed.prev = removed.next = removed.list = null;
    this.length--;
    return removed;
  }
});

exports.LinkedList = LinkedList;
});
},{"./core":23,"./enumerable":24}],27:[function(require,module,exports){
var process=require("__browserify_process");var JS = (typeof this.JS === 'undefined') ? {} : this.JS;
JS.Date = Date;

(function(factory) {
  var $ = (typeof this.global === 'object') ? this.global : this,
      E = (typeof exports === 'object');

  if (E) {
    exports.JS = exports;
    JS = exports;
  } else {
    $.JS = JS;
  }
  factory($, JS);

})(function(global, exports) {
'use strict';

var Package = function(loader) {
  Package._index(this);

  this._loader    = loader;
  this._names     = new OrderedSet();
  this._deps      = new OrderedSet();
  this._uses      = new OrderedSet();
  this._styles    = new OrderedSet();
  this._observers = {};
  this._events    = {};
};

Package.displayName = 'Package';
Package.toString = function() { return Package.displayName };

Package.log = function(message) {
  if (!exports.debug) return;
  if (typeof window === 'undefined') return;
  if (typeof global.runtime === 'object') runtime.trace(message);
  if (global.console && console.info) console.info(message);
};

var resolve = function(filename) {
  if (/^https?:/.test(filename)) return filename;
  var root = exports.ROOT;
  if (root) filename = (root + '/' + filename).replace(/\/+/g, '/');
  return filename;
};

//================================================================
// Ordered list of unique elements, for storing dependencies

var OrderedSet = function(list) {
  this._members = this.list = [];
  this._index = {};
  if (!list) return;

  for (var i = 0, n = list.length; i < n; i++)
    this.push(list[i]);
};

OrderedSet.prototype.push = function(item) {
  var key   = (item.id !== undefined) ? item.id : item,
      index = this._index;

  if (index.hasOwnProperty(key)) return;
  index[key] = this._members.length;
  this._members.push(item);
};

//================================================================
// Wrapper for deferred values

var Deferred = Package.Deferred = function() {
  this._status    = 'deferred';
  this._value     = null;
  this._callbacks = [];
};

Deferred.prototype.callback = function(callback, context) {
  if (this._status === 'succeeded') callback.call(context, this._value);
  else this._callbacks.push([callback, context]);
};

Deferred.prototype.succeed = function(value) {
  this._status = 'succeeded';
  this._value  = value;
  var callback;
  while (callback = this._callbacks.shift())
    callback[0].call(callback[1], value);
};

//================================================================
// Environment settings

Package.ENV = exports.ENV = global;

Package.onerror = function(e) { throw e };

Package._throw = function(message) {
  Package.onerror(new Error(message));
};


//================================================================
// Configuration methods, called by the DSL

var instance = Package.prototype,

    methods = [['requires', '_deps'],
               ['uses',     '_uses']],

    i = methods.length;

while (i--)
  (function(pair) {
    var method = pair[0], list = pair[1];
    instance[method] = function() {
      var n = arguments.length, i;
      for (i = 0; i < n; i++) this[list].push(arguments[i]);
      return this;
    };
  })(methods[i]);

instance.provides = function() {
  var n = arguments.length, i;
  for (i = 0; i < n; i++) {
    this._names.push(arguments[i]);
    Package._getFromCache(arguments[i]).pkg = this;
  }
  return this;
};

instance.styling = function() {
  for (var i = 0, n = arguments.length; i < n; i++)
    this._styles.push(resolve(arguments[i]));
};

instance.setup = function(block) {
  this._onload = block;
  return this;
};

//================================================================
// Event dispatchers, for communication between packages

instance._on = function(eventType, block, context) {
  if (this._events[eventType]) return block.call(context);
  var list = this._observers[eventType] = this._observers[eventType] || [];
  list.push([block, context]);
  this._load();
};

instance._fire = function(eventType) {
  if (this._events[eventType]) return false;
  this._events[eventType] = true;

  var list = this._observers[eventType];
  if (!list) return true;
  delete this._observers[eventType];

  for (var i = 0, n = list.length; i < n; i++)
    list[i][0].call(list[i][1]);

  return true;
};

//================================================================
// Loading frontend and other miscellany

instance._isLoaded = function(withExceptions) {
  if (!withExceptions && this.__isLoaded !== undefined) return this.__isLoaded;

  var names = this._names.list,
      i     = names.length,
      name, object;

  while (i--) { name = names[i];
    object = Package._getObject(name, this._exports);
    if (object !== undefined) continue;
    if (withExceptions)
      return Package._throw('Expected package at ' + this._loader + ' to define ' + name);
    else
      return this.__isLoaded = false;
  }
  return this.__isLoaded = true;
};

instance._load = function() {
  if (!this._fire('request')) return;
  if (!this._isLoaded()) this._prefetch();

  var allDeps = this._deps.list.concat(this._uses.list),
      source  = this._source || [],
      n       = (this._loader || {}).length,
      self    = this;

  Package.when({load: allDeps});

  Package.when({complete: this._deps.list}, function() {
    Package.when({complete: allDeps, load: [this]}, function() {
      this._fire('complete');
    }, this);

    var loadNext = function(exports) {
      if (n === 0) return fireOnLoad(exports);
      n -= 1;
      var index = self._loader.length - n - 1;
      Package.loader.loadFile(self._loader[index], loadNext, source[index]);
    };

    var fireOnLoad = function(exports) {
      self._exports = exports;
      if (self._onload) self._onload();
      self._isLoaded(true);
      self._fire('load');
    };

    if (this._isLoaded()) {
      this._fire('download');
      return this._fire('load');
    }

    if (this._loader === undefined)
      return Package._throw('No load path found for ' + this._names.list[0]);

    if (typeof this._loader === 'function')
      this._loader(fireOnLoad);
    else
      loadNext();

    if (!Package.loader.loadStyle) return;

    var styles = this._styles.list,
        i      = styles.length;

    while (i--) Package.loader.loadStyle(styles[i]);

    this._fire('download');
  }, this);
};

instance._prefetch = function() {
  if (this._source || !(this._loader instanceof Array) || !Package.loader.fetch)
    return;

  this._source = [];

  for (var i = 0, n = this._loader.length; i < n; i++)
    this._source[i] = Package.loader.fetch(this._loader[i]);
};

instance.toString = function() {
  return 'Package:' + this._names.list.join(',');
};

//================================================================
// Class-level event API, handles group listeners

Package.when = function(eventTable, block, context) {
  var eventList = [], objects = {}, event, packages, i;
  for (event in eventTable) {
    if (!eventTable.hasOwnProperty(event)) continue;
    objects[event] = [];
    packages = new OrderedSet(eventTable[event]);
    i = packages.list.length;
    while (i--) eventList.push([event, packages.list[i], i]);
  }

  var waiting = i = eventList.length;
  if (waiting === 0) return block && block.call(context, objects);

  while (i--)
    (function(event) {
      var pkg = Package._getByName(event[1]);
      pkg._on(event[0], function() {
        objects[event[0]][event[2]] = Package._getObject(event[1], pkg._exports);
        waiting -= 1;
        if (waiting === 0 && block) block.call(context, objects);
      });
    })(eventList[i]);
};

//================================================================
// Indexes for fast lookup by path and name, and assigning IDs

var globalPackage = (global.JS || {}).Package || {};

Package._autoIncrement = globalPackage._autoIncrement || 1;
Package._indexByPath   = globalPackage._indexByPath   || {};
Package._indexByName   = globalPackage._indexByName   || {};
Package._autoloaders   = globalPackage._autoloaders   || [];

Package._index = function(pkg) {
  pkg.id = this._autoIncrement;
  this._autoIncrement += 1;
};

Package._getByPath = function(loader) {
  var path = loader.toString(),
      pkg  = this._indexByPath[path];

  if (pkg) return pkg;

  if (typeof loader === 'string')
    loader = [].slice.call(arguments);

  pkg = this._indexByPath[path] = new this(loader);
  return pkg;
};

Package._getByName = function(name) {
  if (typeof name !== 'string') return name;
  var cached = this._getFromCache(name);
  if (cached.pkg) return cached.pkg;

  var autoloaded = this._manufacture(name);
  if (autoloaded) return autoloaded;

  var placeholder = new this();
  placeholder.provides(name);
  return placeholder;
};

Package.remove = function(name) {
  var pkg = this._getByName(name);
  delete this._indexByName[name];
  delete this._indexByPath[pkg._loader];
};

//================================================================
// Auotloading API, generates packages from naming patterns

Package._autoload = function(pattern, options) {
  this._autoloaders.push([pattern, options]);
};

Package._manufacture = function(name) {
  var autoloaders = this._autoloaders,
      n = autoloaders.length,
      i, j, autoloader, path;

  for (i = 0; i < n; i++) {
    autoloader = autoloaders[i];
    if (!autoloader[0].test(name)) continue;

    path = autoloader[1].from;
    if (typeof path === 'string') path = this._convertNameToPath(path);

    var pkg = new this([path(name)]);
    pkg.provides(name);

    if (path = autoloader[1].require) {
      path = [].concat(path);
      j = path.length;
      while (j--) pkg.requires(name.replace(autoloader[0], path[j]));
    }

    return pkg;
  }
  return null;
};

Package._convertNameToPath = function(from) {
  return function(name) {
    return from.replace(/\/?$/, '/') +
           name.replace(/([a-z])([A-Z])/g, function(m,a,b) { return a + '_' + b })
               .replace(/\./g, '/')
               .toLowerCase() + '.js';
  };
};

//================================================================
// Cache for named packages and runtime objects

Package._getFromCache = function(name) {
  return this._indexByName[name] = this._indexByName[name] || {};
};

Package._getObject = function(name, rootObject) {
  if (typeof name !== 'string') return undefined;

  var cached = rootObject ? {} : this._getFromCache(name);
  if (cached.obj !== undefined) return cached.obj;

  var object = rootObject || this.ENV,
      parts  = name.split('.'), part;

  while (part = parts.shift()) object = object && object[part];

  if (rootObject && object === undefined)
    return this._getObject(name);

  return cached.obj = object;
};

Package.CommonJSLoader = {
  usable: function() {
    return typeof require === 'function' &&
           typeof exports === 'object';
  },

  __FILE__: function() {
    return this._currentPath;
  },

  loadFile: function(path, fireCallbacks) {
    var file, module;

    if (typeof process !== 'undefined') {
      module = path.replace(/\.[^\.]+$/g, '');
      file   = require('path').resolve(module);
    }
    else if (typeof phantom !== 'undefined') {
      file = phantom.libraryPath.replace(/\/$/, '') + '/' +
             path.replace(/^\//, '');
    }

    this._currentPath = file + '.js';
    var module = require(file);
    fireCallbacks(module);

    return module;
  }
};

Package.BrowserLoader = {
  HOST_REGEX: /^(https?\:)?\/\/[^\/]+/i,

  usable: function() {
    return !!Package._getObject('window.document.getElementsByTagName') &&
           typeof phantom === 'undefined';
  },

  __FILE__: function() {
    var scripts = document.getElementsByTagName('script'),
        src     = scripts[scripts.length - 1].src,
        url     = window.location.href;

    if (/^\w+\:\/+/.test(src)) return src;
    if (/^\//.test(src)) return window.location.origin + src;
    return url.replace(/[^\/]*$/g, '') + src;
  },

  cacheBust: function(path) {
    if (exports.cache !== false) return path;
    var token = new JS.Date().getTime();
    return path + (/\?/.test(path) ? '&' : '?') + token;
  },

  fetch: function(path) {
    var originalPath = path;
    path = this.cacheBust(path);

    this.HOST = this.HOST || this.HOST_REGEX.exec(window.location.href);
    var host = this.HOST_REGEX.exec(path);

    if (!this.HOST || (host && host[0] !== this.HOST[0])) return null;
    Package.log('[FETCH] ' + path);

    var source = new Package.Deferred(),
        self   = this,
        xhr    = window.ActiveXObject
               ? new ActiveXObject('Microsoft.XMLHTTP')
               : new XMLHttpRequest();

    xhr.open('GET', path, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) return;
      xhr.onreadystatechange = self._K;
      source.succeed(xhr.responseText + '\n//@ sourceURL=' + originalPath);
      xhr = null;
    };
    xhr.send(null);
    return source;
  },

  loadFile: function(path, fireCallbacks, source) {
    if (!source) path = this.cacheBust(path);

    var self   = this,
        head   = document.getElementsByTagName('head')[0],
        script = document.createElement('script');

    script.type = 'text/javascript';

    if (source)
      return source.callback(function(code) {
        Package.log('[EXEC]  ' + path);
        var execute = new Function('code', 'eval(code)');
        execute(code);
        fireCallbacks();
      });

    Package.log('[LOAD] ' + path);
    script.src = path;

    script.onload = script.onreadystatechange = function() {
      var state = script.readyState, status = script.status;
      if ( !state || state === 'loaded' || state === 'complete' ||
           (state === 4 && status === 200) ) {
        fireCallbacks();
        script.onload = script.onreadystatechange = self._K;
        head   = null;
        script = null;
      }
    };
    head.appendChild(script);
  },

  loadStyle: function(path) {
    var link  = document.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = this.cacheBust(path);

    document.getElementsByTagName('head')[0].appendChild(link);
  },

  _K: function() {}
};

Package.RhinoLoader = {
  usable: function() {
    return typeof java === 'object' &&
           typeof require === 'function';
  },

  __FILE__: function() {
    return this._currentPath;
  },

  loadFile: function(path, fireCallbacks) {
    var cwd    = java.lang.System.getProperty('user.dir'),
        module = path.replace(/\.[^\.]+$/g, '');

    var requirePath = new java.io.File(cwd, module).toString();
    this._currentPath = requirePath + '.js';
    var module = require(requirePath);
    fireCallbacks(module);

    return module;
  }
};

Package.ServerLoader = {
  usable: function() {
    return typeof Package._getObject('load') === 'function' &&
           typeof Package._getObject('version') === 'function';
  },

  __FILE__: function() {
    return this._currentPath;
  },

  loadFile: function(path, fireCallbacks) {
    this._currentPath = path;
    load(path);
    fireCallbacks();
  }
};

Package.WshLoader = {
  usable: function() {
    return !!Package._getObject('ActiveXObject') &&
           !!Package._getObject('WScript');
  },

  __FILE__: function() {
    return this._currentPath;
  },

  loadFile: function(path, fireCallbacks) {
    this._currentPath = path;
    var fso = new ActiveXObject('Scripting.FileSystemObject'), file, runner;
    try {
      file   = fso.OpenTextFile(path);
      runner = function() { eval(file.ReadAll()) };
      runner();
      fireCallbacks();
    } finally {
      try { if (file) file.Close() } catch (e) {}
    }
  }
};

Package.XULRunnerLoader = {
  jsloader:   '@mozilla.org/moz/jssubscript-loader;1',
  cssservice: '@mozilla.org/content/style-sheet-service;1',
  ioservice:  '@mozilla.org/network/io-service;1',

  usable: function() {
    try {
      var CC = (Components || {}).classes;
      return !!(CC && CC[this.jsloader] && CC[this.jsloader].getService);
    } catch(e) {
      return false;
    }
  },

  setup: function() {
    var Cc = Components.classes, Ci = Components.interfaces;
    this.ssl = Cc[this.jsloader].getService(Ci.mozIJSSubScriptLoader);
    this.sss = Cc[this.cssservice].getService(Ci.nsIStyleSheetService);
    this.ios = Cc[this.ioservice].getService(Ci.nsIIOService);
  },

  loadFile: function(path, fireCallbacks) {
    Package.log('[LOAD] ' + path);

    this.ssl.loadSubScript(path);
    fireCallbacks();
  },

  loadStyle: function(path) {
    var uri = this.ios.newURI(path, null, null);
    this.sss.loadAndRegisterSheet(uri, this.sss.USER_SHEET);
  }
};

var candidates = [  Package.XULRunnerLoader,
                    Package.RhinoLoader,
                    Package.BrowserLoader,
                    Package.CommonJSLoader,
                    Package.ServerLoader,
                    Package.WshLoader ],

    n = candidates.length,
    i, candidate;

for (i = 0; i < n; i++) {
  candidate = candidates[i];
  if (candidate.usable()) {
    Package.loader = candidate;
    if (candidate.setup) candidate.setup();
    break;
  }
}

var DSL = {
  __FILE__: function() {
    return Package.loader.__FILE__();
  },

  pkg: function(name, path) {
    var pkg = path
        ? Package._getByPath(path)
        : Package._getByName(name);
    pkg.provides(name);
    return pkg;
  },

  file: function(filename) {
    var files = [], i = arguments.length;
    while (i--) files[i] = resolve(arguments[i]);
    return Package._getByPath.apply(Package, files);
  },

  load: function(path, fireCallbacks) {
    Package.loader.loadFile(path, fireCallbacks);
  },

  autoload: function(pattern, options) {
    Package._autoload(pattern, options);
  }
};

DSL.files  = DSL.file;
DSL.loader = DSL.file;

var packages = function(declaration) {
  declaration.call(DSL);
};

var parseLoadArgs = function(args) {
 var files = [], i = 0;

  while (typeof args[i] === 'string'){
    files.push(args[i]);
    i += 1;
  }

  return {files: files, callback: args[i], context: args[i+1]};
};

exports.load = function(path, callback) {
  var args = parseLoadArgs(arguments),
      n    = args.files.length;

  var loadNext = function(index) {
    if (index === n) return args.callback.call(args.context);
    Package.loader.loadFile(args.files[index], function() {
      loadNext(index + 1);
    });
  };
  loadNext(0);
};

exports.require = function() {
  var args = parseLoadArgs(arguments);

  Package.when({complete: args.files}, function(objects) {
    if (!args.callback) return;
    args.callback.apply(args.context, objects && objects.complete);
  });

  return this;
};

exports.Package  = Package;
exports.Packages = exports.packages = packages;
exports.DSL      = DSL;
});

(function() {

var E = (typeof exports === 'object'),
    P = (E ? exports : JS),
    Package = P.Package;

P.packages(function() { with(this) {

    // Debugging
    // JSCLASS_PATH = 'build/min/';

    Package.ENV.JSCLASS_PATH = Package.ENV.JSCLASS_PATH ||
                               __FILE__().replace(/[^\/]*$/g, '');

    var PATH = Package.ENV.JSCLASS_PATH;
    if (!/\/$/.test(PATH)) PATH = PATH + '/';

    var module = function(name) { return file(PATH + name + '.js') };

    module('core')          .provides('JS',
                                      'JS.Module',
                                      'JS.Class',
                                      'JS.Method',
                                      'JS.Kernel',
                                      'JS.Singleton',
                                      'JS.Interface');

    var test = 'JS.Test.Unit';
    module('test')          .provides('JS.Test',
                                      'JS.Test.Context',
                                      'JS.Test.Mocking',
                                      'JS.Test.FakeClock',
                                      'JS.Test.AsyncSteps',
                                      'JS.Test.Helpers',
                                      test,
                                      test + '.Assertions',
                                      test + '.TestCase',
                                      test + '.TestSuite',
                                      test + '.TestResult')
                            .requires('JS.Module',
                                      'JS.Class',
                                      'JS.Console',
                                      'JS.DOM',
                                      'JS.Enumerable',
                                      'JS.SortedSet',
                                      'JS.Range',
                                      'JS.Hash',
                                      'JS.MethodChain',
                                      'JS.Comparable',
                                      'JS.StackTrace')
                            .styling(PATH + 'assets/testui.css');

    module('dom')           .provides('JS.DOM',
                                      'JS.DOM.Builder')
                            .requires('JS.Class');


    module('console')       .provides('JS.Console')
                            .requires('JS.Module',
                                      'JS.Enumerable');

    module('comparable')    .provides('JS.Comparable')
                            .requires('JS.Module');

    module('constant_scope').provides('JS.ConstantScope')
                            .requires('JS.Module');

    module('forwardable')   .provides('JS.Forwardable')
                            .requires('JS.Module');

    module('enumerable')    .provides('JS.Enumerable')
                            .requires('JS.Module',
                                      'JS.Class');

    module('deferrable')    .provides('JS.Deferrable')
                            .requires('JS.Module');

    module('observable')    .provides('JS.Observable')
                            .requires('JS.Module');

    module('hash')          .provides('JS.Hash',
                                      'JS.OrderedHash')
                            .requires('JS.Class',
                                      'JS.Enumerable',
                                      'JS.Comparable');

    module('range')         .provides('JS.Range')
                            .requires('JS.Class',
                                      'JS.Enumerable',
                                      'JS.Hash');

    module('set')           .provides('JS.Set',
                                      'JS.HashSet',
                                      'JS.OrderedSet',
                                      'JS.SortedSet')
                            .requires('JS.Class',
                                      'JS.Enumerable',
                                      'JS.Hash');

    module('linked_list')   .provides('JS.LinkedList',
                                      'JS.LinkedList.Doubly',
                                      'JS.LinkedList.Doubly.Circular')
                            .requires('JS.Class',
                                      'JS.Enumerable');

    module('command')       .provides('JS.Command',
                                      'JS.Command.Stack')
                            .requires('JS.Class',
                                      'JS.Enumerable',
                                      'JS.Observable');

    module('decorator')     .provides('JS.Decorator')
                            .requires('JS.Module',
                                      'JS.Class');

    module('method_chain')  .provides('JS.MethodChain')
                            .requires('JS.Module',
                                      'JS.Kernel');

    module('proxy')         .provides('JS.Proxy',
                                      'JS.Proxy.Virtual')
                            .requires('JS.Module',
                                      'JS.Class');

    module('stack_trace')   .provides('JS.StackTrace')
                            .requires('JS.Module',
                                      'JS.Singleton',
                                      'JS.Observable',
                                      'JS.Enumerable',
                                      'JS.Console');

    module('state')         .provides('JS.State')
                            .requires('JS.Module',
                                      'JS.Class');

    module('tsort')         .provides('JS.TSort')
                            .requires('JS.Module')
                            .requires('JS.Class')
                            .requires('JS.Hash');
}});

})();
},{"__browserify_process":48,"path":49}],28:[function(require,module,exports){
(function(factory) {
  var E  = (typeof exports === 'object'),
      js = (typeof JS === 'undefined') ? require('./core') : JS;

  if (E) exports.JS = exports;
  factory(js, E ? exports : js);

})(function(JS, exports) {
'use strict';

var Observable = new JS.Module('Observable', {
  extend: {
    DEFAULT_METHOD: 'update'
  },

  addObserver: function(observer, context) {
    (this.__observers__ = this.__observers__ || []).push({_block: observer, _context: context});
  },

  removeObserver: function(observer, context) {
    this.__observers__ = this.__observers__ || [];
    context = context;
    var i = this.countObservers();
    while (i--) {
      if (this.__observers__[i]._block === observer && this.__observers__[i]._context === context) {
        this.__observers__.splice(i,1);
        return;
      }
    }
  },

  removeObservers: function() {
    this.__observers__ = [];
  },

  countObservers: function() {
    return (this.__observers__ = this.__observers__ || []).length;
  },

  notifyObservers: function() {
    if (!this.isChanged()) return;
    var i = this.countObservers(), observer, block, context;
    while (i--) {
      observer = this.__observers__[i];
      block    = observer._block;
      context  = observer._context;
      if (typeof block === 'function') block.apply(context, arguments);
      else block[context || Observable.DEFAULT_METHOD].apply(block, arguments);
    }
  },

  setChanged: function(state) {
    this.__changed__ = !(state === false);
  },

  isChanged: function() {
    if (this.__changed__ === undefined) this.__changed__ = true;
    return !!this.__changed__;
  }
});

Observable.alias({
  subscribe:    'addObserver',
  unsubscribe:  'removeObserver'
}, true);

exports.Observable = Observable;
});
},{"./core":23}],29:[function(require,module,exports){
(function(factory) {
  var E  = (typeof exports === 'object'),
      js = (typeof JS === 'undefined') ? require('./core') : JS,

      Observable = js.Observable || require('./observable').Observable,
      Enumerable = js.Enumerable || require('./enumerable').Enumerable,
      Console    = js.Console    || require('./console').Console;

  if (E) exports.JS = exports;
  factory(js, Observable, Enumerable, Console, E ? exports : js);

})(function(JS, Observable, Enumerable, Console, exports) {
'use strict';

var StackTrace = new JS.Module('StackTrace', {
  extend: {
    logger: new JS.Singleton({
      include: Console,
      active: false,

      update: function(event, data) {
        if (!this.active) return;
        switch (event) {
          case 'call':    return this.logEnter(data);
          case 'return':  return this.logExit(data);
          case 'error':   return this.logError(data);
        }
      },

      indent: function() {
        var indent = ' ';
        StackTrace.forEach(function() { indent += '|  ' });
        return indent;
      },

      fullName: function(frame) {
        var C        = Console,
            method   = frame.method,
            env      = frame.env,
            name     = method.name,
            module   = method.module;

        return C.nameOf(env) +
                (module === env ? '' : '(' + C.nameOf(module) + ')') +
                '#' + name;
      },

      logEnter: function(frame) {
        var fullName = this.fullName(frame),
            args = Console.convert(frame.args).replace(/^\[/, '(').replace(/\]$/, ')');

        if (this._open) this.puts();

        this.reset();
        this.print(' ');
        this.consoleFormat('bgblack', 'white');
        this.print('TRACE');
        this.reset();
        this.print(this.indent());
        this.blue();
        this.print(fullName);
        this.red();
        this.print(args);
        this.reset();

        this._open = true;
      },

      logExit: function(frame) {
        var fullName = this.fullName(frame);

        if (frame.leaf) {
          this.consoleFormat('red');
          this.print(' --> ');
        } else {
          this.reset();
          this.print(' ');
          this.consoleFormat('bgblack', 'white');
          this.print('TRACE');
          this.reset();
          this.print(this.indent());
          this.blue();
          this.print(fullName);
          this.red();
          this.print(' --> ');
        }
        this.consoleFormat('yellow');
        this.puts(Console.convert(frame.result));
        this.reset();
        this.print('');
        this._open = false;
      },

      logError: function(e) {
        this.puts();
        this.reset();
        this.print(' ');
        this.consoleFormat('bgred', 'white');
        this.print('ERROR');
        this.consoleFormat('bold', 'red');
        this.print(' ' + Console.convert(e));
        this.reset();
        this.print(' thrown by ');
        this.bold();
        this.print(StackTrace.top().name);
        this.reset();
        this.puts('. Backtrace:');
        this.backtrace();
      },

      backtrace: function() {
        StackTrace.reverseForEach(function(frame) {
          var args = Console.convert(frame.args).replace(/^\[/, '(').replace(/\]$/, ')');
          this.print('      | ');
          this.consoleFormat('blue');
          this.print(frame.name);
          this.red();
          this.print(args);
          this.reset();
          this.puts(' in ');
          this.print('      |  ');
          this.bold();
          this.puts(Console.convert(frame.object));
        }, this);
        this.reset();
        this.puts();
      }
    }),

    include: [Observable, Enumerable],

    wrap: function(func, method, env) {
      var self = StackTrace;
      var wrapper = function() {
        var result;
        self.push(this, method, env, Array.prototype.slice.call(arguments));

        try { result = func.apply(this, arguments) }
        catch (e) { self.error(e) }

        self.pop(result);
        return result;
      };
      wrapper.toString = function() { return func.toString() };
      wrapper.__traced__ = true;
      return wrapper;
    },

    stack: [],

    forEach: function(block, context) {
      Enumerable.forEach.call(this.stack, block, context);
    },

    top: function() {
      return this.stack[this.stack.length - 1] || {};
    },

    push: function(object, method, env, args) {
      var stack = this.stack;
      if (stack.length > 0) stack[stack.length - 1].leaf = false;

      var frame = {
        object: object,
        method: method,
        env:    env,
        args:   args,
        leaf:   true
      };
      frame.name = this.logger.fullName(frame);
      this.notifyObservers('call', frame);
      stack.push(frame);
    },

    pop: function(result) {
      var frame = this.stack.pop();
      frame.result = result;
      this.notifyObservers('return', frame);
    },

    error: function(e) {
      if (e.logged) throw e;
      e.logged = true;
      this.notifyObservers('error', e);
      this.stack = [];
      throw e;
    }
  }
});

StackTrace.addObserver(StackTrace.logger);

exports.StackTrace = StackTrace;
});
},{"./console":22,"./core":23,"./enumerable":24,"./observable":28}],30:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};'use strict';
global.javascript = {};
global.javascript.util = require('javascript.util');
var jsts = require('./lib/jsts');
module.exports = jsts

},{"./lib/jsts":31,"javascript.util":32}],31:[function(require,module,exports){
/* The JSTS Topology Suite is a collection of JavaScript classes that
implement the fundamental operations required to validate a given
geo-spatial data set to a known topological specification.

Copyright (C) 2011 The Authors

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA */
jsts={version:'0.14.0',algorithm:{distance:{},locate:{}},error:{},geom:{util:{}},geomgraph:{index:{}},index:{bintree:{},chain:{},kdtree:{},quadtree:{},strtree:{}},io:{},noding:{snapround:{}},operation:{buffer:{},distance:{},overlay:{snap:{}},polygonize:{},predicate:{},relate:{},union:{},valid:{}},planargraph:{},simplify:{},triangulate:{quadedge:{}},util:{}};if(typeof String.prototype.trim!=='function'){String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,'');};}
jsts.abstractFunc=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.error={};jsts.error.IllegalArgumentError=function(message){this.name='IllegalArgumentError';this.message=message;};jsts.error.IllegalArgumentError.prototype=new Error();jsts.error.TopologyError=function(message,pt){this.name='TopologyError';this.message=pt?message+' [ '+pt+' ]':message;};jsts.error.TopologyError.prototype=new Error();jsts.error.AbstractMethodInvocationError=function(){this.name='AbstractMethodInvocationError';this.message='Abstract method called, should be implemented in subclass.';};jsts.error.AbstractMethodInvocationError.prototype=new Error();jsts.error.NotImplementedError=function(){this.name='NotImplementedError';this.message='This method has not yet been implemented.';};jsts.error.NotImplementedError.prototype=new Error();jsts.error.NotRepresentableError=function(message){this.name='NotRepresentableError';this.message=message;};jsts.error.NotRepresentableError.prototype=new Error();jsts.error.LocateFailureError=function(message){this.name='LocateFailureError';this.message=message;};jsts.error.LocateFailureError.prototype=new Error();if(typeof module!=="undefined")module.exports=jsts;jsts.geom.GeometryFilter=function(){};jsts.geom.GeometryFilter.prototype.filter=function(geom){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.util.PolygonExtracter=function(comps){this.comps=comps;};jsts.geom.util.PolygonExtracter.prototype=new jsts.geom.GeometryFilter();jsts.geom.util.PolygonExtracter.prototype.comps=null;jsts.geom.util.PolygonExtracter.getPolygons=function(geom,list){if(list===undefined){list=[];}
if(geom instanceof jsts.geom.Polygon){list.push(geom);}else if(geom instanceof jsts.geom.GeometryCollection){geom.apply(new jsts.geom.util.PolygonExtracter(list));}
return list;};jsts.geom.util.PolygonExtracter.prototype.filter=function(geom){if(geom instanceof jsts.geom.Polygon)
this.comps.push(geom);};jsts.io.WKTParser=function(geometryFactory){this.geometryFactory=geometryFactory||new jsts.geom.GeometryFactory();this.regExes={'typeStr':/^\s*(\w+)\s*\(\s*(.*)\s*\)\s*$/,'emptyTypeStr':/^\s*(\w+)\s*EMPTY\s*$/,'spaces':/\s+/,'parenComma':/\)\s*,\s*\(/,'doubleParenComma':/\)\s*\)\s*,\s*\(\s*\(/,'trimParens':/^\s*\(?(.*?)\)?\s*$/};};jsts.io.WKTParser.prototype.read=function(wkt){var geometry,type,str;wkt=wkt.replace(/[\n\r]/g,' ');var matches=this.regExes.typeStr.exec(wkt);if(wkt.search('EMPTY')!==-1){matches=this.regExes.emptyTypeStr.exec(wkt);matches[2]=undefined;}
if(matches){type=matches[1].toLowerCase();str=matches[2];if(this.parse[type]){geometry=this.parse[type].apply(this,[str]);}}
if(geometry===undefined)
throw new Error('Could not parse WKT '+wkt);return geometry;};jsts.io.WKTParser.prototype.write=function(geometry){return this.extractGeometry(geometry);};jsts.io.WKTParser.prototype.extractGeometry=function(geometry){var type=geometry.CLASS_NAME.split('.')[2].toLowerCase();if(!this.extract[type]){return null;}
var wktType=type.toUpperCase();var data;if(geometry.isEmpty()){data=wktType+' EMPTY';}else{data=wktType+'('+this.extract[type].apply(this,[geometry])+')';}
return data;};jsts.io.WKTParser.prototype.extract={'coordinate':function(coordinate){return coordinate.x+' '+coordinate.y;},'point':function(point){return point.coordinate.x+' '+point.coordinate.y;},'multipoint':function(multipoint){var array=[];for(var i=0,len=multipoint.geometries.length;i<len;++i){array.push('('+
this.extract.point.apply(this,[multipoint.geometries[i]])+')');}
return array.join(',');},'linestring':function(linestring){var array=[];for(var i=0,len=linestring.points.length;i<len;++i){array.push(this.extract.coordinate.apply(this,[linestring.points[i]]));}
return array.join(',');},'multilinestring':function(multilinestring){var array=[];for(var i=0,len=multilinestring.geometries.length;i<len;++i){array.push('('+
this.extract.linestring.apply(this,[multilinestring.geometries[i]])+')');}
return array.join(',');},'polygon':function(polygon){var array=[];array.push('('+this.extract.linestring.apply(this,[polygon.shell])+')');for(var i=0,len=polygon.holes.length;i<len;++i){array.push('('+this.extract.linestring.apply(this,[polygon.holes[i]])+')');}
return array.join(',');},'multipolygon':function(multipolygon){var array=[];for(var i=0,len=multipolygon.geometries.length;i<len;++i){array.push('('+this.extract.polygon.apply(this,[multipolygon.geometries[i]])+')');}
return array.join(',');},'geometrycollection':function(collection){var array=[];for(var i=0,len=collection.geometries.length;i<len;++i){array.push(this.extractGeometry.apply(this,[collection.geometries[i]]));}
return array.join(',');}};jsts.io.WKTParser.prototype.parse={'point':function(str){if(str===undefined){return this.geometryFactory.createPoint(null);}
var coords=str.trim().split(this.regExes.spaces);return this.geometryFactory.createPoint(new jsts.geom.Coordinate(coords[0],coords[1]));},'multipoint':function(str){if(str===undefined){return this.geometryFactory.createMultiPoint(null);}
var point;var points=str.trim().split(',');var components=[];for(var i=0,len=points.length;i<len;++i){point=points[i].replace(this.regExes.trimParens,'$1');components.push(this.parse.point.apply(this,[point]));}
return this.geometryFactory.createMultiPoint(components);},'linestring':function(str){if(str===undefined){return this.geometryFactory.createLineString(null);}
var points=str.trim().split(',');var components=[];var coords;for(var i=0,len=points.length;i<len;++i){coords=points[i].trim().split(this.regExes.spaces);components.push(new jsts.geom.Coordinate(coords[0],coords[1]));}
return this.geometryFactory.createLineString(components);},'linearring':function(str){if(str===undefined){return this.geometryFactory.createLinearRing(null);}
var points=str.trim().split(',');var components=[];var coords;for(var i=0,len=points.length;i<len;++i){coords=points[i].trim().split(this.regExes.spaces);components.push(new jsts.geom.Coordinate(coords[0],coords[1]));}
return this.geometryFactory.createLinearRing(components);},'multilinestring':function(str){if(str===undefined){return this.geometryFactory.createMultiLineString(null);}
var line;var lines=str.trim().split(this.regExes.parenComma);var components=[];for(var i=0,len=lines.length;i<len;++i){line=lines[i].replace(this.regExes.trimParens,'$1');components.push(this.parse.linestring.apply(this,[line]));}
return this.geometryFactory.createMultiLineString(components);},'polygon':function(str){if(str===undefined){return this.geometryFactory.createPolygon(null);}
var ring,linestring,linearring;var rings=str.trim().split(this.regExes.parenComma);var shell;var holes=[];for(var i=0,len=rings.length;i<len;++i){ring=rings[i].replace(this.regExes.trimParens,'$1');linestring=this.parse.linestring.apply(this,[ring]);linearring=this.geometryFactory.createLinearRing(linestring.points);if(i===0){shell=linearring;}else{holes.push(linearring);}}
return this.geometryFactory.createPolygon(shell,holes);},'multipolygon':function(str){if(str===undefined){return this.geometryFactory.createMultiPolygon(null);}
var polygon;var polygons=str.trim().split(this.regExes.doubleParenComma);var components=[];for(var i=0,len=polygons.length;i<len;++i){polygon=polygons[i].replace(this.regExes.trimParens,'$1');components.push(this.parse.polygon.apply(this,[polygon]));}
return this.geometryFactory.createMultiPolygon(components);},'geometrycollection':function(str){if(str===undefined){return this.geometryFactory.createGeometryCollection(null);}
str=str.replace(/,\s*([A-Za-z])/g,'|$1');var wktArray=str.trim().split('|');var components=[];for(var i=0,len=wktArray.length;i<len;++i){components.push(jsts.io.WKTParser.prototype.read.apply(this,[wktArray[i]]));}
return this.geometryFactory.createGeometryCollection(components);}};jsts.index.ItemVisitor=function(){};jsts.index.ItemVisitor.prototype.visitItem=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.algorithm.CGAlgorithms=function(){};jsts.algorithm.CGAlgorithms.CLOCKWISE=-1;jsts.algorithm.CGAlgorithms.RIGHT=jsts.algorithm.CGAlgorithms.CLOCKWISE;jsts.algorithm.CGAlgorithms.COUNTERCLOCKWISE=1;jsts.algorithm.CGAlgorithms.LEFT=jsts.algorithm.CGAlgorithms.COUNTERCLOCKWISE;jsts.algorithm.CGAlgorithms.COLLINEAR=0;jsts.algorithm.CGAlgorithms.STRAIGHT=jsts.algorithm.CGAlgorithms.COLLINEAR;jsts.algorithm.CGAlgorithms.orientationIndex=function(p1,p2,q){var dx1,dy1,dx2,dy2;dx1=p2.x-p1.x;dy1=p2.y-p1.y;dx2=q.x-p2.x;dy2=q.y-p2.y;return jsts.algorithm.RobustDeterminant.signOfDet2x2(dx1,dy1,dx2,dy2);};jsts.algorithm.CGAlgorithms.isPointInRing=function(p,ring){return jsts.algorithm.CGAlgorithms.locatePointInRing(p,ring)!==jsts.geom.Location.EXTERIOR;};jsts.algorithm.CGAlgorithms.locatePointInRing=function(p,ring){return jsts.algorithm.RayCrossingCounter.locatePointInRing(p,ring);};jsts.algorithm.CGAlgorithms.isOnLine=function(p,pt){var lineIntersector,i,il,p0,p1;lineIntersector=new jsts.algorithm.RobustLineIntersector();for(i=1,il=pt.length;i<il;i++){p0=pt[i-1];p1=pt[i];lineIntersector.computeIntersection(p,p0,p1);if(lineIntersector.hasIntersection()){return true;}}
return false;};jsts.algorithm.CGAlgorithms.isCCW=function(ring){var nPts,hiPt,hiIndex,p,iPrev,iNext,prev,next,i,disc,isCCW;nPts=ring.length-1;if(nPts<3){throw new jsts.IllegalArgumentError('Ring has fewer than 3 points, so orientation cannot be determined');}
hiPt=ring[0];hiIndex=0;i=1;for(i;i<=nPts;i++){p=ring[i];if(p.y>hiPt.y){hiPt=p;hiIndex=i;}}
iPrev=hiIndex;do{iPrev=iPrev-1;if(iPrev<0){iPrev=nPts;}}while(ring[iPrev].equals2D(hiPt)&&iPrev!==hiIndex);iNext=hiIndex;do{iNext=(iNext+1)%nPts;}while(ring[iNext].equals2D(hiPt)&&iNext!==hiIndex);prev=ring[iPrev];next=ring[iNext];if(prev.equals2D(hiPt)||next.equals2D(hiPt)||prev.equals2D(next)){return false;}
disc=jsts.algorithm.CGAlgorithms.computeOrientation(prev,hiPt,next);isCCW=false;if(disc===0){isCCW=(prev.x>next.x);}else{isCCW=(disc>0);}
return isCCW;};jsts.algorithm.CGAlgorithms.computeOrientation=function(p1,p2,q){return jsts.algorithm.CGAlgorithms.orientationIndex(p1,p2,q);};jsts.algorithm.CGAlgorithms.distancePointLine=function(p,A,B){if(!(A instanceof jsts.geom.Coordinate)){jsts.algorithm.CGAlgorithms.distancePointLine2.apply(this,arguments);}
if(A.x===B.x&&A.y===B.y){return p.distance(A);}
var r,s;r=((p.x-A.x)*(B.x-A.x)+(p.y-A.y)*(B.y-A.y))/((B.x-A.x)*(B.x-A.x)+(B.y-A.y)*(B.y-A.y));if(r<=0.0){return p.distance(A);}
if(r>=1.0){return p.distance(B);}
s=((A.y-p.y)*(B.x-A.x)-(A.x-p.x)*(B.y-A.y))/((B.x-A.x)*(B.x-A.x)+(B.y-A.y)*(B.y-A.y));return Math.abs(s)*Math.sqrt(((B.x-A.x)*(B.x-A.x)+(B.y-A.y)*(B.y-A.y)));};jsts.algorithm.CGAlgorithms.distancePointLinePerpendicular=function(p,A,B){var s=((A.y-p.y)*(B.x-A.x)-(A.x-p.x)*(B.y-A.y))/((B.x-A.x)*(B.x-A.x)+(B.y-A.y)*(B.y-A.y));return Math.abs(s)*Math.sqrt(((B.x-A.x)*(B.x-A.x)+(B.y-A.y)*(B.y-A.y)));};jsts.algorithm.CGAlgorithms.distancePointLine2=function(p,line){var minDistance,i,il,dist;if(line.length===0){throw new jsts.error.IllegalArgumentError('Line array must contain at least one vertex');}
minDistance=p.distance(line[0]);for(i=0,il=line.length-1;i<il;i++){dist=jsts.algorithm.CGAlgorithms.distancePointLine(p,line[i],line[i+1]);if(dist<minDistance){minDistance=dist;}}
return minDistance;};jsts.algorithm.CGAlgorithms.distanceLineLine=function(A,B,C,D){if(A.equals(B)){return jsts.algorithm.CGAlgorithms.distancePointLine(A,C,D);}
if(C.equals(D)){return jsts.algorithm.CGAlgorithms.distancePointLine(D,A,B);}
var r_top,r_bot,s_top,s_bot,s,r;r_top=(A.y-C.y)*(D.x-C.x)-(A.x-C.x)*(D.y-C.y);r_bot=(B.x-A.x)*(D.y-C.y)-(B.y-A.y)*(D.x-C.x);s_top=(A.y-C.y)*(B.x-A.x)-(A.x-C.x)*(B.y-A.y);s_bot=(B.x-A.x)*(D.y-C.y)-(B.y-A.y)*(D.x-C.x);if((r_bot===0)||(s_bot===0)){return Math.min(jsts.algorithm.CGAlgorithms.distancePointLine(A,C,D),Math.min(jsts.algorithm.CGAlgorithms.distancePointLine(B,C,D),Math.min(jsts.algorithm.CGAlgorithms.distancePointLine(C,A,B),jsts.algorithm.CGAlgorithms.distancePointLine(D,A,B))));}
s=s_top/s_bot;r=r_top/r_bot;if((r<0)||(r>1)||(s<0)||(s>1)){return Math.min(jsts.algorithm.CGAlgorithms.distancePointLine(A,C,D),Math.min(jsts.algorithm.CGAlgorithms.distancePointLine(B,C,D),Math.min(jsts.algorithm.CGAlgorithms.distancePointLine(C,A,B),jsts.algorithm.CGAlgorithms.distancePointLine(D,A,B))));}
return 0.0;};jsts.algorithm.CGAlgorithms.signedArea=function(ring){if(ring.length<3){return 0.0;}
var sum,i,il,bx,by,cx,cy;sum=0.0;for(i=0,il=ring.length-1;i<il;i++){bx=ring[i].x;by=ring[i].y;cx=ring[i+1].x;cy=ring[i+1].y;sum+=(bx+cx)*(cy-by);}
return-sum/2.0;};jsts.algorithm.CGAlgorithms.signedArea=function(ring){var n,sum,p,bx,by,i,cx,cy;n=ring.length;if(n<3){return 0.0;}
sum=0.0;p=ring[0];bx=p.x;by=p.y;for(i=1;i<n;i++){p=ring[i];cx=p.x;cy=p.y;sum+=(bx+cx)*(cy-by);bx=cx;by=cy;}
return-sum/2.0;};jsts.algorithm.CGAlgorithms.computeLength=function(pts){var n=pts.length,len,x0,y0,x1,y1,dx,dy,p,i,il;if(n<=1){return 0.0;}
len=0.0;p=pts[0];x0=p.x;y0=p.y;i=1,il=n;for(i;i<n;i++){p=pts[i];x1=p.x;y1=p.y;dx=x1-x0;dy=y1-y0;len+=Math.sqrt(dx*dx+dy*dy);x0=x1;y0=y1;}
return len;};jsts.algorithm.CGAlgorithms.length=function(){};jsts.algorithm.Angle=function(){};jsts.algorithm.Angle.PI_TIMES_2=2.0*Math.PI;jsts.algorithm.Angle.PI_OVER_2=Math.PI/2.0;jsts.algorithm.Angle.PI_OVER_4=Math.PI/4.0;jsts.algorithm.Angle.COUNTERCLOCKWISE=jsts.algorithm.CGAlgorithms.COUNTERCLOCKWISE;jsts.algorithm.Angle.CLOCKWISE=jsts.algorithm.CGAlgorithms.CLOCKWISE;jsts.algorithm.Angle.NONE=jsts.algorithm.CGAlgorithms.COLLINEAR;jsts.algorithm.Angle.toDegrees=function(radians){return(radians*180)/Math.PI;};jsts.algorithm.Angle.toRadians=function(angleDegrees){return(angleDegrees*Math.PI)/180.0;};jsts.algorithm.Angle.angle=function(){if(arguments.length===1){return jsts.algorithm.Angle.angleFromOrigo(arguments[0]);}else{return jsts.algorithm.Angle.angleBetweenCoords(arguments[0],arguments[1]);}};jsts.algorithm.Angle.angleBetweenCoords=function(p0,p1){var dx,dy;dx=p1.x-p0.x;dy=p1.y-p0.y;return Math.atan2(dy,dx);};jsts.algorithm.Angle.angleFromOrigo=function(p){return Math.atan2(p.y,p.x);};jsts.algorithm.Angle.isAcute=function(p0,p1,p2){var dx0,dy0,dx1,dy1,dotprod;dx0=p0.x-p1.x;dy0=p0.y-p1.y;dx1=p2.x-p1.x;dy1=p2.y-p1.y;dotprod=dx0*dx1+dy0*dy1;return dotprod>0;};jsts.algorithm.Angle.isObtuse=function(p0,p1,p2){var dx0,dy0,dx1,dy1,dotprod;dx0=p0.x-p1.x;dy0=p0.y-p1.y;dx1=p2.x-p1.x;dy1=p2.y-p1.y;dotprod=dx0*dx1+dy0*dy1;return dotprod<0;};jsts.algorithm.Angle.angleBetween=function(tip1,tail,tip2){var a1,a2;a1=jsts.algorithm.Angle.angle(tail,tip1);a2=jsts.algorithm.Angle.angle(tail,tip2);return jsts.algorithm.Angle.diff(a1,a2);};jsts.algorithm.Angle.angleBetweenOriented=function(tip1,tail,tip2){var a1,a2,angDel;a1=jsts.algorithm.Angle.angle(tail,tip1);a2=jsts.algorithm.Angle.angle(tail,tip2);angDel=a2-a1;if(angDel<=-Math.PI){return angDel+jsts.algorithm.Angle.PI_TIMES_2;}
if(angDel>Math.PI){return angDel-jsts.algorithm.Angle.PI_TIMES_2;}
return angDel;};jsts.algorithm.Angle.interiorAngle=function(p0,p1,p2){var anglePrev,angleNext;anglePrev=jsts.algorithm.Angle.angle(p1,p0);angleNext=jsts.algorithm.Angle.angle(p1,p2);return Math.abs(angleNext-anglePrev);};jsts.algorithm.Angle.getTurn=function(ang1,ang2){var crossproduct=Math.sin(ang2-ang1);if(crossproduct>0){return jsts.algorithm.Angle.COUNTERCLOCKWISE;}
if(crossproduct<0){return jsts.algorithm.Angle.CLOCKWISE;}
return jsts.algorithm.Angle.NONE;};jsts.algorithm.Angle.normalize=function(angle){while(angle>Math.PI){angle-=jsts.algorithm.Angle.PI_TIMES_2;}
while(angle<=-Math.PI){angle+=jsts.algorithm.Angle.PI_TIMES_2;}
return angle;};jsts.algorithm.Angle.normalizePositive=function(angle){if(angle<0.0){while(angle<0.0){angle+=jsts.algorithm.Angle.PI_TIMES_2;}
if(angle>=jsts.algorithm.Angle.PI_TIMES_2){angle=0.0;}}
else{while(angle>=jsts.algorithm.Angle.PI_TIMES_2){angle-=jsts.algorithm.Angle.PI_TIMES_2;}
if(angle<0.0){angle=0.0;}}
return angle;};jsts.algorithm.Angle.diff=function(ang1,ang2){var delAngle;if(ang1<ang2){delAngle=ang2-ang1;}else{delAngle=ang1-ang2;}
if(delAngle>Math.PI){delAngle=(2*Math.PI)-delAngle;}
return delAngle;};jsts.geom.GeometryComponentFilter=function(){};jsts.geom.GeometryComponentFilter.prototype.filter=function(geom){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.util.LinearComponentExtracter=function(lines,isForcedToLineString){this.lines=lines;this.isForcedToLineString=isForcedToLineString;};jsts.geom.util.LinearComponentExtracter.prototype=new jsts.geom.GeometryComponentFilter();jsts.geom.util.LinearComponentExtracter.prototype.lines=null;jsts.geom.util.LinearComponentExtracter.prototype.isForcedToLineString=false;jsts.geom.util.LinearComponentExtracter.getLines=function(geoms,lines){if(arguments.length==1){return jsts.geom.util.LinearComponentExtracter.getLines5.apply(this,arguments);}
else if(arguments.length==2&&typeof lines==='boolean'){return jsts.geom.util.LinearComponentExtracter.getLines6.apply(this,arguments);}
else if(arguments.length==2&&geoms instanceof jsts.geom.Geometry){return jsts.geom.util.LinearComponentExtracter.getLines3.apply(this,arguments);}
else if(arguments.length==3&&geoms instanceof jsts.geom.Geometry){return jsts.geom.util.LinearComponentExtracter.getLines4.apply(this,arguments);}
else if(arguments.length==3){return jsts.geom.util.LinearComponentExtracter.getLines2.apply(this,arguments);}
for(var i=0;i<geoms.length;i++){var g=geoms[i];jsts.geom.util.LinearComponentExtracter.getLines3(g,lines);}
return lines;};jsts.geom.util.LinearComponentExtracter.getLines2=function(geoms,lines,forceToLineString){for(var i=0;i<geoms.length;i++){var g=geoms[i];jsts.geom.util.LinearComponentExtracter.getLines4(g,lines,forceToLineString);}
return lines;};jsts.geom.util.LinearComponentExtracter.getLines3=function(geom,lines){if(geom instanceof LineString){lines.add(geom);}else{geom.apply(new jsts.geom.util.LinearComponentExtracter(lines));}
return lines;};jsts.geom.util.LinearComponentExtracter.getLines4=function(geom,lines,forceToLineString){geom.apply(new jsts.geom.util.LinearComponentExtracter(lines,forceToLineString));return lines;};jsts.geom.util.LinearComponentExtracter.getLines5=function(geom){return jsts.geom.util.LinearComponentExtracter.getLines6(geom,false);};jsts.geom.util.LinearComponentExtracter.getLines6=function(geom,forceToLineString){var lines=[];geom.apply(new jsts.geom.util.LinearComponentExtracter(lines,forceToLineString));return lines;};jsts.geom.util.LinearComponentExtracter.prototype.setForceToLineString=function(isForcedToLineString){this.isForcedToLineString=isForcedToLineString;};jsts.geom.util.LinearComponentExtracter.prototype.filter=function(geom){if(this.isForcedToLineString&&geom instanceof jsts.geom.LinearRing){var line=geom.getFactory().createLineString(geom.getCoordinateSequence());this.lines.push(line);return;}
if(geom instanceof jsts.geom.LineString||geom instanceof jsts.geom.LinearRing)
this.lines.push(geom);};jsts.geom.Location=function(){};jsts.geom.Location.INTERIOR=0;jsts.geom.Location.BOUNDARY=1;jsts.geom.Location.EXTERIOR=2;jsts.geom.Location.NONE=-1;jsts.geom.Location.toLocationSymbol=function(locationValue){switch(locationValue){case jsts.geom.Location.EXTERIOR:return'e';case jsts.geom.Location.BOUNDARY:return'b';case jsts.geom.Location.INTERIOR:return'i';case jsts.geom.Location.NONE:return'-';}
throw new jsts.IllegalArgumentError('Unknown location value: '+
locationValue);};(function(){jsts.io.GeoJSONReader=function(geometryFactory){this.geometryFactory=geometryFactory||new jsts.geom.GeometryFactory();this.precisionModel=this.geometryFactory.getPrecisionModel();this.parser=new jsts.io.GeoJSONParser(this.geometryFactory);};jsts.io.GeoJSONReader.prototype.read=function(geoJson){var geometry=this.parser.read(geoJson);if(this.precisionModel.getType()===jsts.geom.PrecisionModel.FIXED){this.reducePrecision(geometry);}
return geometry;};jsts.io.GeoJSONReader.prototype.reducePrecision=function(geometry){var i,len;if(geometry.coordinate){this.precisionModel.makePrecise(geometry.coordinate);}else if(geometry.points){for(i=0,len=geometry.points.length;i<len;i++){this.precisionModel.makePrecise(geometry.points[i]);}}else if(geometry.geometries){for(i=0,len=geometry.geometries.length;i<len;i++){this.reducePrecision(geometry.geometries[i]);}}};})();jsts.geom.Geometry=function(factory){this.factory=factory;};jsts.geom.Geometry.prototype.envelope=null;jsts.geom.Geometry.prototype.factory=null;jsts.geom.Geometry.prototype.getGeometryType=function(){return'Geometry';};jsts.geom.Geometry.hasNonEmptyElements=function(geometries){var i;for(i=0;i<geometries.length;i++){if(!geometries[i].isEmpty()){return true;}}
return false;};jsts.geom.Geometry.hasNullElements=function(array){var i;for(i=0;i<array.length;i++){if(array[i]===null){return true;}}
return false;};jsts.geom.Geometry.prototype.getFactory=function(){if(this.factory===null||this.factory===undefined){this.factory=new jsts.geom.GeometryFactory();}
return this.factory;};jsts.geom.Geometry.prototype.getNumGeometries=function(){return 1;};jsts.geom.Geometry.prototype.getGeometryN=function(n){return this;};jsts.geom.Geometry.prototype.getPrecisionModel=function(){return this.getFactory().getPrecisionModel();};jsts.geom.Geometry.prototype.getCoordinate=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.getCoordinates=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.getNumPoints=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.isSimple=function(){this.checkNotGeometryCollection(this);var op=new jsts.operation.IsSimpleOp(this);return op.isSimple();};jsts.geom.Geometry.prototype.isValid=function(){var isValidOp=new jsts.operation.valid.IsValidOp(this);return isValidOp.isValid();};jsts.geom.Geometry.prototype.isEmpty=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.distance=function(g){return jsts.operation.distance.DistanceOp.distance(this,g);};jsts.geom.Geometry.prototype.isWithinDistance=function(geom,distance){var envDist=this.getEnvelopeInternal().distance(geom.getEnvelopeInternal());if(envDist>distance){return false;}
return DistanceOp.isWithinDistance(this,geom,distance);};jsts.geom.Geometry.prototype.isRectangle=function(){return false;};jsts.geom.Geometry.prototype.getArea=function(){return 0.0;};jsts.geom.Geometry.prototype.getLength=function(){return 0.0;};jsts.geom.Geometry.prototype.getCentroid=function(){if(this.isEmpty()){return null;}
var cent;var centPt=null;var dim=this.getDimension();if(dim===0){cent=new jsts.algorithm.CentroidPoint();cent.add(this);centPt=cent.getCentroid();}else if(dim===1){cent=new jsts.algorithm.CentroidLine();cent.add(this);centPt=cent.getCentroid();}else{cent=new jsts.algorithm.CentroidArea();cent.add(this);centPt=cent.getCentroid();}
return this.createPointFromInternalCoord(centPt,this);};jsts.geom.Geometry.prototype.getInteriorPoint=function(){var intPt;var interiorPt=null;var dim=this.getDimension();if(dim===0){intPt=new jsts.algorithm.InteriorPointPoint(this);interiorPt=intPt.getInteriorPoint();}else if(dim===1){intPt=new jsts.algorithm.InteriorPointLine(this);interiorPt=intPt.getInteriorPoint();}else{intPt=new jsts.algorithm.InteriorPointArea(this);interiorPt=intPt.getInteriorPoint();}
return this.createPointFromInternalCoord(interiorPt,this);};jsts.geom.Geometry.prototype.getDimension=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.getBoundary=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.getBoundaryDimension=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.getEnvelope=function(){return this.getFactory().toGeometry(this.getEnvelopeInternal());};jsts.geom.Geometry.prototype.getEnvelopeInternal=function(){if(this.envelope===null){this.envelope=this.computeEnvelopeInternal();}
return this.envelope;};jsts.geom.Geometry.prototype.disjoint=function(g){return!this.intersects(g);};jsts.geom.Geometry.prototype.touches=function(g){if(!this.getEnvelopeInternal().intersects(g.getEnvelopeInternal())){return false;}
return this.relate(g).isTouches(this.getDimension(),g.getDimension());};jsts.geom.Geometry.prototype.intersects=function(g){if(!this.getEnvelopeInternal().intersects(g.getEnvelopeInternal())){return false;}
if(this.isRectangle()){return jsts.operation.predicate.RectangleIntersects.intersects(this,g);}
if(g.isRectangle()){return jsts.operation.predicate.RectangleIntersects.intersects(g,this);}
return this.relate(g).isIntersects();};jsts.geom.Geometry.prototype.crosses=function(g){if(!this.getEnvelopeInternal().intersects(g.getEnvelopeInternal())){return false;}
return this.relate(g).isCrosses(this.getDimension(),g.getDimension());};jsts.geom.Geometry.prototype.within=function(g){return g.contains(this);};jsts.geom.Geometry.prototype.contains=function(g){if(!this.getEnvelopeInternal().contains(g.getEnvelopeInternal())){return false;}
if(this.isRectangle()){return jsts.operation.predicate.RectangleContains.contains(this,g);}
return this.relate(g).isContains();};jsts.geom.Geometry.prototype.overlaps=function(g){if(!this.getEnvelopeInternal().intersects(g.getEnvelopeInternal())){return false;}
return this.relate(g).isOverlaps(this.getDimension(),g.getDimension());};jsts.geom.Geometry.prototype.covers=function(g){if(!this.getEnvelopeInternal().covers(g.getEnvelopeInternal())){return false;}
if(this.isRectangle()){return true;}
return this.relate(g).isCovers();};jsts.geom.Geometry.prototype.coveredBy=function(g){return g.covers(this);};jsts.geom.Geometry.prototype.relate=function(g,intersectionPattern){if(arguments.length===1){return this.relate2.apply(this,arguments);}
return this.relate2(g).matches(intersectionPattern);};jsts.geom.Geometry.prototype.relate2=function(g){this.checkNotGeometryCollection(this);this.checkNotGeometryCollection(g);return jsts.operation.relate.RelateOp.relate(this,g);};jsts.geom.Geometry.prototype.equalsTopo=function(g){if(!this.getEnvelopeInternal().equals(g.getEnvelopeInternal())){return false;}
return this.relate(g).isEquals(this.getDimension(),g.getDimension());};jsts.geom.Geometry.prototype.equals=function(o){if(o instanceof jsts.geom.Geometry||o instanceof jsts.geom.LinearRing||o instanceof jsts.geom.Polygon||o instanceof jsts.geom.GeometryCollection||o instanceof jsts.geom.MultiPoint||o instanceof jsts.geom.MultiLineString||o instanceof jsts.geom.MultiPolygon){return this.equalsExact(o);}
return false;};jsts.geom.Geometry.prototype.buffer=function(distance,quadrantSegments,endCapStyle){var params=new jsts.operation.buffer.BufferParameters(quadrantSegments,endCapStyle)
return jsts.operation.buffer.BufferOp.bufferOp2(this,distance,params);};jsts.geom.Geometry.prototype.convexHull=function(){return new jsts.algorithm.ConvexHull(this).getConvexHull();};jsts.geom.Geometry.prototype.intersection=function(other){if(this.isEmpty()){return this.getFactory().createGeometryCollection(null);}
if(other.isEmpty()){return this.getFactory().createGeometryCollection(null);}
if(this.isGeometryCollection(this)){var g2=other;}
this.checkNotGeometryCollection(this);this.checkNotGeometryCollection(other);return jsts.operation.overlay.snap.SnapIfNeededOverlayOp.overlayOp(this,other,jsts.operation.overlay.OverlayOp.INTERSECTION);};jsts.geom.Geometry.prototype.union=function(other){if(arguments.length===0){return jsts.operation.union.UnaryUnionOp.union(this);}
if(this.isEmpty()){return other.clone();}
if(other.isEmpty()){return this.clone();}
this.checkNotGeometryCollection(this);this.checkNotGeometryCollection(other);return jsts.operation.overlay.snap.SnapIfNeededOverlayOp.overlayOp(this,other,jsts.operation.overlay.OverlayOp.UNION);};jsts.geom.Geometry.prototype.difference=function(other){if(this.isEmpty()){return this.getFactory().createGeometryCollection(null);}
if(other.isEmpty()){return this.clone();}
this.checkNotGeometryCollection(this);this.checkNotGeometryCollection(other);return jsts.operation.overlay.snap.SnapIfNeededOverlayOp.overlayOp(this,other,jsts.operation.overlay.OverlayOp.DIFFERENCE);};jsts.geom.Geometry.prototype.symDifference=function(other){if(this.isEmpty()){return other.clone();}
if(other.isEmpty()){return this.clone();}
this.checkNotGeometryCollection(this);this.checkNotGeometryCollection(other);return jsts.operation.overlay.snap.SnapIfNeededOverlayOp.overlayOp(this,other,jsts.operation.overlay.OverlayOp.SYMDIFFERENCE);};jsts.geom.Geometry.prototype.equalsExact=function(other,tolerance){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.equalsNorm=function(g){if(g===null||g===undefined)
return false;return this.norm().equalsExact(g.norm());};jsts.geom.Geometry.prototype.apply=function(filter){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.clone=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.normalize=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.norm=function(){var copy=this.clone();copy.normalize();return copy;};jsts.geom.Geometry.prototype.compareTo=function(o){var other=o;if(this.getClassSortIndex()!==other.getClassSortIndex()){return this.getClassSortIndex()-other.getClassSortIndex();}
if(this.isEmpty()&&other.isEmpty()){return 0;}
if(this.isEmpty()){return-1;}
if(other.isEmpty()){return 1;}
return this.compareToSameClass(o);};jsts.geom.Geometry.prototype.isEquivalentClass=function(other){if(this instanceof jsts.geom.Point&&other instanceof jsts.geom.Point){return true;}else if(this instanceof jsts.geom.LineString&&(other instanceof jsts.geom.LineString|other instanceof jsts.geom.LinearRing)){return true;}else if(this instanceof jsts.geom.LinearRing&&(other instanceof jsts.geom.LineString|other instanceof jsts.geom.LinearRing)){return true;}else if(this instanceof jsts.geom.Polygon&&(other instanceof jsts.geom.Polygon)){return true;}else if(this instanceof jsts.geom.MultiPoint&&(other instanceof jsts.geom.MultiPoint)){return true;}else if(this instanceof jsts.geom.MultiLineString&&(other instanceof jsts.geom.MultiLineString)){return true;}else if(this instanceof jsts.geom.MultiPolygon&&(other instanceof jsts.geom.MultiPolygon)){return true;}else if(this instanceof jsts.geom.GeometryCollection&&(other instanceof jsts.geom.GeometryCollection)){return true;}
return false;};jsts.geom.Geometry.prototype.checkNotGeometryCollection=function(g){if(g.isGeometryCollectionBase()){throw new jsts.error.IllegalArgumentError('This method does not support GeometryCollection');}};jsts.geom.Geometry.prototype.isGeometryCollection=function(){return(this instanceof jsts.geom.GeometryCollection);};jsts.geom.Geometry.prototype.isGeometryCollectionBase=function(){return(this.CLASS_NAME==='jsts.geom.GeometryCollection');};jsts.geom.Geometry.prototype.computeEnvelopeInternal=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.compareToSameClass=function(o){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.compare=function(a,b){var i=a.iterator();var j=b.iterator();while(i.hasNext()&&j.hasNext()){var aElement=i.next();var bElement=j.next();var comparison=aElement.compareTo(bElement);if(comparison!==0){return comparison;}}
if(i.hasNext()){return 1;}
if(j.hasNext()){return-1;}
return 0;};jsts.geom.Geometry.prototype.equal=function(a,b,tolerance){if(tolerance===undefined||tolerance===null||tolerance===0){return a.equals(b);}
return a.distance(b)<=tolerance;};jsts.geom.Geometry.prototype.getClassSortIndex=function(){var sortedClasses=[jsts.geom.Point,jsts.geom.MultiPoint,jsts.geom.LineString,jsts.geom.LinearRing,jsts.geom.MultiLineString,jsts.geom.Polygon,jsts.geom.MultiPolygon,jsts.geom.GeometryCollection];for(var i=0;i<sortedClasses.length;i++){if(this instanceof sortedClasses[i])
return i;}
jsts.util.Assert.shouldNeverReachHere('Class not supported: '+this);return-1;};jsts.geom.Geometry.prototype.toString=function(){return new jsts.io.WKTWriter().write(this);};jsts.geom.Geometry.prototype.createPointFromInternalCoord=function(coord,exemplar){exemplar.getPrecisionModel().makePrecise(coord);return exemplar.getFactory().createPoint(coord);};(function(){jsts.geom.Coordinate=function(x,y){if(typeof x==='number'){this.x=x;this.y=y;}else if(x instanceof jsts.geom.Coordinate){this.x=parseFloat(x.x);this.y=parseFloat(x.y);}else if(x===undefined||x===null){this.x=0;this.y=0;}else if(typeof x==='string'){this.x=parseFloat(x);this.y=parseFloat(y);}};jsts.geom.Coordinate.prototype.setCoordinate=function(other){this.x=other.x;this.y=other.y;};jsts.geom.Coordinate.prototype.clone=function(){return new jsts.geom.Coordinate(this.x,this.y);};jsts.geom.Coordinate.prototype.distance=function(p){var dx=this.x-p.x;var dy=this.y-p.y;return Math.sqrt(dx*dx+dy*dy);};jsts.geom.Coordinate.prototype.equals2D=function(other){if(this.x!==other.x){return false;}
if(this.y!==other.y){return false;}
return true;};jsts.geom.Coordinate.prototype.equals=function(other){if(!other instanceof jsts.geom.Coordinate||other===undefined){return false;}
return this.equals2D(other);};jsts.geom.Coordinate.prototype.compareTo=function(other){if(this.x<other.x){return-1;}
if(this.x>other.x){return 1;}
if(this.y<other.y){return-1;}
if(this.y>other.y){return 1;}
return 0;};jsts.geom.Coordinate.prototype.toString=function(){return'('+this.x+', '+this.y+')';};})();jsts.geom.Envelope=function(){jsts.geom.Envelope.prototype.init.apply(this,arguments);};jsts.geom.Envelope.prototype.minx=null;jsts.geom.Envelope.prototype.maxx=null;jsts.geom.Envelope.prototype.miny=null;jsts.geom.Envelope.prototype.maxy=null;jsts.geom.Envelope.prototype.init=function(){if(typeof arguments[0]==='number'&&arguments.length===4){this.initFromValues(arguments[0],arguments[1],arguments[2],arguments[3]);}else if(arguments[0]instanceof jsts.geom.Coordinate&&arguments.length===1){this.initFromCoordinate(arguments[0]);}else if(arguments[0]instanceof jsts.geom.Coordinate&&arguments.length===2){this.initFromCoordinates(arguments[0],arguments[1]);}else if(arguments[0]instanceof jsts.geom.Envelope&&arguments.length===1){this.initFromEnvelope(arguments[0]);}else{this.setToNull();}};jsts.geom.Envelope.prototype.initFromValues=function(x1,x2,y1,y2){if(x1<x2){this.minx=x1;this.maxx=x2;}else{this.minx=x2;this.maxx=x1;}
if(y1<y2){this.miny=y1;this.maxy=y2;}else{this.miny=y2;this.maxy=y1;}};jsts.geom.Envelope.prototype.initFromCoordinates=function(p1,p2){this.initFromValues(p1.x,p2.x,p1.y,p2.y);};jsts.geom.Envelope.prototype.initFromCoordinate=function(p){this.initFromValues(p.x,p.x,p.y,p.y);};jsts.geom.Envelope.prototype.initFromEnvelope=function(env){this.minx=env.minx;this.maxx=env.maxx;this.miny=env.miny;this.maxy=env.maxy;};jsts.geom.Envelope.prototype.setToNull=function(){this.minx=0;this.maxx=-1;this.miny=0;this.maxy=-1;};jsts.geom.Envelope.prototype.isNull=function(){return this.maxx<this.minx;};jsts.geom.Envelope.prototype.getHeight=function(){if(this.isNull()){return 0;}
return this.maxy-this.miny;};jsts.geom.Envelope.prototype.getWidth=function(){if(this.isNull()){return 0;}
return this.maxx-this.minx;};jsts.geom.Envelope.prototype.getMinX=function(){return this.minx;};jsts.geom.Envelope.prototype.getMaxX=function(){return this.maxx;};jsts.geom.Envelope.prototype.getMinY=function(){return this.miny;};jsts.geom.Envelope.prototype.getMaxY=function(){return this.maxy;};jsts.geom.Envelope.prototype.getArea=function(){return this.getWidth()*this.getHeight();};jsts.geom.Envelope.prototype.expandToInclude=function(){if(arguments[0]instanceof jsts.geom.Coordinate){this.expandToIncludeCoordinate(arguments[0]);}else if(arguments[0]instanceof jsts.geom.Envelope){this.expandToIncludeEnvelope(arguments[0]);}else{this.expandToIncludeValues(arguments[0],arguments[1]);}};jsts.geom.Envelope.prototype.expandToIncludeCoordinate=function(p){this.expandToIncludeValues(p.x,p.y);};jsts.geom.Envelope.prototype.expandToIncludeValues=function(x,y){if(this.isNull()){this.minx=x;this.maxx=x;this.miny=y;this.maxy=y;}else{if(x<this.minx){this.minx=x;}
if(x>this.maxx){this.maxx=x;}
if(y<this.miny){this.miny=y;}
if(y>this.maxy){this.maxy=y;}}};jsts.geom.Envelope.prototype.expandToIncludeEnvelope=function(other){if(other.isNull()){return;}
if(this.isNull()){this.minx=other.getMinX();this.maxx=other.getMaxX();this.miny=other.getMinY();this.maxy=other.getMaxY();}else{if(other.minx<this.minx){this.minx=other.minx;}
if(other.maxx>this.maxx){this.maxx=other.maxx;}
if(other.miny<this.miny){this.miny=other.miny;}
if(other.maxy>this.maxy){this.maxy=other.maxy;}}};jsts.geom.Envelope.prototype.expandBy=function(){if(arguments.length===1){this.expandByDistance(arguments[0]);}else{this.expandByDistances(arguments[0],arguments[1]);}};jsts.geom.Envelope.prototype.expandByDistance=function(distance){this.expandByDistances(distance,distance);};jsts.geom.Envelope.prototype.expandByDistances=function(deltaX,deltaY){if(this.isNull()){return;}
this.minx-=deltaX;this.maxx+=deltaX;this.miny-=deltaY;this.maxy+=deltaY;if(this.minx>this.maxx||this.miny>this.maxy){this.setToNull();}};jsts.geom.Envelope.prototype.translate=function(transX,transY){if(this.isNull()){return;}
this.init(this.minx+transX,this.maxx+transX,this.miny+transY,this.maxy+transY);};jsts.geom.Envelope.prototype.centre=function(){if(this.isNull()){return null;}
return new jsts.geom.Coordinate((this.minx+this.maxx)/2.0,(this.miny+this.maxy)/2.0);};jsts.geom.Envelope.prototype.intersection=function(env){if(this.isNull()||env.isNull()||!this.intersects(env)){return new jsts.geom.Envelope();}
var intMinX=this.minx>env.minx?this.minx:env.minx;var intMinY=this.miny>env.miny?this.miny:env.miny;var intMaxX=this.maxx<env.maxx?this.maxx:env.maxx;var intMaxY=this.maxy<env.maxy?this.maxy:env.maxy;return new jsts.geom.Envelope(intMinX,intMaxX,intMinY,intMaxY);};jsts.geom.Envelope.prototype.intersects=function(){if(arguments[0]instanceof jsts.geom.Envelope){return this.intersectsEnvelope(arguments[0]);}else if(arguments[0]instanceof jsts.geom.Coordinate){return this.intersectsCoordinate(arguments[0]);}else{return this.intersectsValues(arguments[0],arguments[1]);}};jsts.geom.Envelope.prototype.intersectsEnvelope=function(other){if(this.isNull()||other.isNull()){return false;}
var result=!(other.minx>this.maxx||other.maxx<this.minx||other.miny>this.maxy||other.maxy<this.miny);return result;};jsts.geom.Envelope.prototype.intersectsCoordinate=function(p){return this.intersectsValues(p.x,p.y);};jsts.geom.Envelope.prototype.intersectsValues=function(x,y){if(this.isNull()){return false;}
return!(x>this.maxx||x<this.minx||y>this.maxy||y<this.miny);};jsts.geom.Envelope.prototype.contains=function(){if(arguments[0]instanceof jsts.geom.Envelope){return this.containsEnvelope(arguments[0]);}else if(arguments[0]instanceof jsts.geom.Coordinate){return this.containsCoordinate(arguments[0]);}else{return this.containsValues(arguments[0],arguments[1]);}};jsts.geom.Envelope.prototype.containsEnvelope=function(other){return this.coversEnvelope(other);};jsts.geom.Envelope.prototype.containsCoordinate=function(p){return this.coversCoordinate(p);};jsts.geom.Envelope.prototype.containsValues=function(x,y){return this.coversValues(x,y);};jsts.geom.Envelope.prototype.covers=function(){if(arguments[0]instanceof jsts.geom.Envelope){return this.coversEnvelope(arguments[0]);}else if(arguments[0]instanceof jsts.geom.Coordinate){return this.coversCoordinate(arguments[0]);}else{return this.coversValues(arguments[0],arguments[1]);}};jsts.geom.Envelope.prototype.coversValues=function(x,y){if(this.isNull()){return false;}
return x>=this.minx&&x<=this.maxx&&y>=this.miny&&y<=this.maxy;};jsts.geom.Envelope.prototype.coversCoordinate=function(p){return this.coversValues(p.x,p.y);};jsts.geom.Envelope.prototype.coversEnvelope=function(other){if(this.isNull()||other.isNull()){return false;}
return other.minx>=this.minx&&other.maxx<=this.maxx&&other.miny>=this.miny&&other.maxy<=this.maxy;};jsts.geom.Envelope.prototype.distance=function(env){if(this.intersects(env)){return 0;}
var dx=0.0;if(this.maxx<env.minx){dx=env.minx-this.maxx;}
if(this.minx>env.maxx){dx=this.minx-env.maxx;}
var dy=0.0;if(this.maxy<env.miny){dy=env.miny-this.maxy;}
if(this.miny>env.maxy){dy=this.miny-env.maxy;}
if(dx===0.0){return dy;}
if(dy===0.0){return dx;}
return Math.sqrt(dx*dx+dy*dy);};jsts.geom.Envelope.prototype.equals=function(other){if(this.isNull()){return other.isNull();}
return this.maxx===other.maxx&&this.maxy===other.maxy&&this.minx===other.minx&&this.miny===other.miny;};jsts.geom.Envelope.prototype.toString=function(){return'Env['+this.minx+' : '+this.maxx+', '+this.miny+' : '+
this.maxy+']';};jsts.geom.Envelope.intersects=function(p1,p2,q){if(arguments.length===4){return jsts.geom.Envelope.intersectsEnvelope(arguments[0],arguments[1],arguments[2],arguments[3]);}
var xc1=p1.x<p2.x?p1.x:p2.x;var xc2=p1.x>p2.x?p1.x:p2.x;var yc1=p1.y<p2.y?p1.y:p2.y;var yc2=p1.y>p2.y?p1.y:p2.y;if(((q.x>=xc1)&&(q.x<=xc2))&&((q.y>=yc1)&&(q.y<=yc2))){return true;}
return false;};jsts.geom.Envelope.intersectsEnvelope=function(p1,p2,q1,q2){var minq=Math.min(q1.x,q2.x);var maxq=Math.max(q1.x,q2.x);var minp=Math.min(p1.x,p2.x);var maxp=Math.max(p1.x,p2.x);if(minp>maxq){return false;}
if(maxp<minq){return false;}
minq=Math.min(q1.y,q2.y);maxq=Math.max(q1.y,q2.y);minp=Math.min(p1.y,p2.y);maxp=Math.max(p1.y,p2.y);if(minp>maxq){return false;}
if(maxp<minq){return false;}
return true;};jsts.geom.Envelope.prototype.clone=function(){return new jsts.geom.Envelope(this.minx,this.maxx,this.miny,this.maxy);};jsts.geom.util.GeometryCombiner=function(geoms){this.geomFactory=jsts.geom.util.GeometryCombiner.extractFactory(geoms);this.inputGeoms=geoms;};jsts.geom.util.GeometryCombiner.combine=function(geoms){if(arguments.length>1)return this.combine2.apply(this,arguments);var combiner=new jsts.geom.util.GeometryCombiner(geoms);return combiner.combine();};jsts.geom.util.GeometryCombiner.combine2=function(){var arrayList=new javascript.util.ArrayList();Array.prototype.slice.call(arguments).forEach(function(a){arrayList.add(a);});var combiner=new jsts.geom.util.GeometryCombiner(arrayList);return combiner.combine();};jsts.geom.util.GeometryCombiner.prototype.geomFactory=null;jsts.geom.util.GeometryCombiner.prototype.skipEmpty=false;jsts.geom.util.GeometryCombiner.prototype.inputGeoms;jsts.geom.util.GeometryCombiner.extractFactory=function(geoms){if(geoms.isEmpty())return null;return geoms.iterator().next().getFactory();};jsts.geom.util.GeometryCombiner.prototype.combine=function(){var elems=new javascript.util.ArrayList(),i;for(i=this.inputGeoms.iterator();i.hasNext();){var g=i.next();this.extractElements(g,elems);}
if(elems.size()===0){if(this.geomFactory!==null){return this.geomFactory.createGeometryCollection(null);}
return null;}
return this.geomFactory.buildGeometry(elems);};jsts.geom.util.GeometryCombiner.prototype.extractElements=function(geom,elems){if(geom===null){return;}
for(var i=0;i<geom.getNumGeometries();i++){var elemGeom=geom.getGeometryN(i);if(this.skipEmpty&&elemGeom.isEmpty()){continue;}
elems.add(elemGeom);}};jsts.geom.PrecisionModel=function(modelType){if(typeof modelType==='number'){this.modelType=jsts.geom.PrecisionModel.FIXED;this.scale=modelType;return;}
this.modelType=modelType||jsts.geom.PrecisionModel.FLOATING;if(this.modelType===jsts.geom.PrecisionModel.FIXED){this.scale=1.0;}};jsts.geom.PrecisionModel.FLOATING='FLOATING';jsts.geom.PrecisionModel.FIXED='FIXED';jsts.geom.PrecisionModel.FLOATING_SINGLE='FLOATING_SINGLE';jsts.geom.PrecisionModel.prototype.scale=null;jsts.geom.PrecisionModel.prototype.modelType=null;jsts.geom.PrecisionModel.prototype.isFloating=function(){return this.modelType===jsts.geom.PrecisionModel.FLOATING||this.modelType===jsts.geom.PrecisionModel.FLOATING_SINLGE;};jsts.geom.PrecisionModel.prototype.getScale=function(){return this.scale;};jsts.geom.PrecisionModel.prototype.getType=function(){return this.modelType;};jsts.geom.PrecisionModel.prototype.equals=function(other){return true;if(!(other instanceof jsts.geom.PrecisionModel)){return false;}
var otherPrecisionModel=other;return this.modelType===otherPrecisionModel.modelType&&this.scale===otherPrecisionModel.scale;};jsts.geom.PrecisionModel.prototype.makePrecise=function(val){if(val instanceof jsts.geom.Coordinate){this.makePrecise2(val);return;}
if(isNaN(val))
return val;if(this.modelType===jsts.geom.PrecisionModel.FIXED){return Math.round(val*this.scale)/this.scale;}
return val;};jsts.geom.PrecisionModel.prototype.makePrecise2=function(coord){if(this.modelType===jsts.geom.PrecisionModel.FLOATING)
return;coord.x=this.makePrecise(coord.x);coord.y=this.makePrecise(coord.y);};jsts.geom.PrecisionModel.prototype.compareTo=function(o){var other=o;return 0;};jsts.geom.CoordinateFilter=function(){};jsts.geom.CoordinateFilter.prototype.filter=function(coord){throw new jsts.error.AbstractMethodInvocationError();};jsts.simplify.DouglasPeuckerLineSimplifier=function(pts){this.pts=pts;this.seg=new jsts.geom.LineSegment();};jsts.simplify.DouglasPeuckerLineSimplifier.prototype.pts=null;jsts.simplify.DouglasPeuckerLineSimplifier.prototype.usePt=null;jsts.simplify.DouglasPeuckerLineSimplifier.prototype.distanceTolerance=null;jsts.simplify.DouglasPeuckerLineSimplifier.simplify=function(pts,distanceTolerance){var simp=new jsts.simplify.DouglasPeuckerLineSimplifier(pts);simp.setDistanceTolerance(distanceTolerance);return simp.simplify();};jsts.simplify.DouglasPeuckerLineSimplifier.prototype.setDistanceTolerance=function(distanceTolerance){this.distanceTolerance=distanceTolerance;};jsts.simplify.DouglasPeuckerLineSimplifier.prototype.simplify=function(){this.usePt=[];for(var i=0;i<this.pts.length;i++){this.usePt[i]=true;}
this.simplifySection(0,this.pts.length-1);var coordList=new jsts.geom.CoordinateList();for(var j=0;j<this.pts.length;j++){if(this.usePt[j]){coordList.add(new jsts.geom.Coordinate(this.pts[j]));}}
return coordList.toCoordinateArray();};jsts.simplify.DouglasPeuckerLineSimplifier.prototype.seg=null;jsts.simplify.DouglasPeuckerLineSimplifier.prototype.simplifySection=function(i,j){if(i+1==j){return;}
this.seg.p0=this.pts[i];this.seg.p1=this.pts[j];var maxDistance=-1.0;var maxIndex=i;for(var k=i+1;k<j;k++){var distance=this.seg.distance(this.pts[k]);if(distance>maxDistance){maxDistance=distance;maxIndex=k;}}
if(maxDistance<=this.distanceTolerance){for(var l=i+1;l<j;l++){this.usePt[l]=false;}}else{this.simplifySection(i,maxIndex);this.simplifySection(maxIndex,j);}};jsts.geomgraph.EdgeIntersection=function(coord,segmentIndex,dist){this.coord=new jsts.geom.Coordinate(coord);this.segmentIndex=segmentIndex;this.dist=dist;};jsts.geomgraph.EdgeIntersection.prototype.coord=null;jsts.geomgraph.EdgeIntersection.prototype.segmentIndex=null;jsts.geomgraph.EdgeIntersection.prototype.dist=null;jsts.geomgraph.EdgeIntersection.prototype.getCoordinate=function(){return this.coord;};jsts.geomgraph.EdgeIntersection.prototype.getSegmentIndex=function(){return this.segmentIndex;};jsts.geomgraph.EdgeIntersection.prototype.getDistance=function(){return this.dist;};jsts.geomgraph.EdgeIntersection.prototype.compareTo=function(other){return this.compare(other.segmentIndex,other.dist);};jsts.geomgraph.EdgeIntersection.prototype.compare=function(segmentIndex,dist){if(this.segmentIndex<segmentIndex)
return-1;if(this.segmentIndex>segmentIndex)
return 1;if(this.dist<dist)
return-1;if(this.dist>dist)
return 1;return 0;};jsts.geomgraph.EdgeIntersection.prototype.isEndPoint=function(maxSegmentIndex){if(this.segmentIndex===0&&this.dist===0.0)
return true;if(this.segmentIndex===maxSegmentIndex)
return true;return false;};jsts.geomgraph.EdgeIntersection.prototype.toString=function(){return''+this.segmentIndex+this.dist;};(function(){var EdgeIntersection=jsts.geomgraph.EdgeIntersection;var TreeMap=javascript.util.TreeMap;jsts.geomgraph.EdgeIntersectionList=function(edge){this.nodeMap=new TreeMap();this.edge=edge;};jsts.geomgraph.EdgeIntersectionList.prototype.nodeMap=null;jsts.geomgraph.EdgeIntersectionList.prototype.edge=null;jsts.geomgraph.EdgeIntersectionList.prototype.isIntersection=function(pt){for(var it=this.iterator();it.hasNext();){var ei=it.next();if(ei.coord.equals(pt)){return true;}}
return false;};jsts.geomgraph.EdgeIntersectionList.prototype.add=function(intPt,segmentIndex,dist){var eiNew=new EdgeIntersection(intPt,segmentIndex,dist);var ei=this.nodeMap.get(eiNew);if(ei!==null){return ei;}
this.nodeMap.put(eiNew,eiNew);return eiNew;};jsts.geomgraph.EdgeIntersectionList.prototype.iterator=function(){return this.nodeMap.values().iterator();};jsts.geomgraph.EdgeIntersectionList.prototype.addEndpoints=function(){var maxSegIndex=this.edge.pts.length-1;this.add(this.edge.pts[0],0,0.0);this.add(this.edge.pts[maxSegIndex],maxSegIndex,0.0);};jsts.geomgraph.EdgeIntersectionList.prototype.addSplitEdges=function(edgeList)
{this.addEndpoints();var it=this.iterator();var eiPrev=it.next();while(it.hasNext()){var ei=it.next();var newEdge=this.createSplitEdge(eiPrev,ei);edgeList.add(newEdge);eiPrev=ei;}};jsts.geomgraph.EdgeIntersectionList.prototype.createSplitEdge=function(ei0,ei1){var npts=ei1.segmentIndex-ei0.segmentIndex+2;var lastSegStartPt=this.edge.pts[ei1.segmentIndex];var useIntPt1=ei1.dist>0.0||!ei1.coord.equals2D(lastSegStartPt);if(!useIntPt1){npts--;}
var pts=[];var ipt=0;pts[ipt++]=new jsts.geom.Coordinate(ei0.coord);for(var i=ei0.segmentIndex+1;i<=ei1.segmentIndex;i++){pts[ipt++]=this.edge.pts[i];}
if(useIntPt1)pts[ipt]=ei1.coord;return new jsts.geomgraph.Edge(pts,new jsts.geomgraph.Label(this.edge.label));};})();(function(){var AssertionFailedException=function(message){this.message=message;};AssertionFailedException.prototype=new Error();AssertionFailedException.prototype.name='AssertionFailedException';jsts.util.AssertionFailedException=AssertionFailedException;})();(function(){var AssertionFailedException=jsts.util.AssertionFailedException;jsts.util.Assert=function(){};jsts.util.Assert.isTrue=function(assertion,message){if(!assertion){if(message===null){throw new AssertionFailedException();}else{throw new AssertionFailedException(message);}}};jsts.util.Assert.equals=function(expectedValue,actualValue,message){if(!actualValue.equals(expectedValue)){throw new AssertionFailedException('Expected '+expectedValue+' but encountered '+actualValue+
(message!=null?': '+message:''));}};jsts.util.Assert.shouldNeverReachHere=function(message){throw new AssertionFailedException('Should never reach here'+
(message!=null?': '+message:''));};})();(function(){var Location=jsts.geom.Location;var Assert=jsts.util.Assert;var ArrayList=javascript.util.ArrayList;jsts.operation.relate.RelateComputer=function(arg){this.li=new jsts.algorithm.RobustLineIntersector();this.ptLocator=new jsts.algorithm.PointLocator();this.nodes=new jsts.geomgraph.NodeMap(new jsts.operation.relate.RelateNodeFactory());this.isolatedEdges=new ArrayList();this.arg=arg;};jsts.operation.relate.RelateComputer.prototype.li=null;jsts.operation.relate.RelateComputer.prototype.ptLocator=null;jsts.operation.relate.RelateComputer.prototype.arg=null;jsts.operation.relate.RelateComputer.prototype.nodes=null;jsts.operation.relate.RelateComputer.prototype.im=null;jsts.operation.relate.RelateComputer.prototype.isolatedEdges=null;jsts.operation.relate.RelateComputer.prototype.invalidPoint=null;jsts.operation.relate.RelateComputer.prototype.computeIM=function(){var im=new jsts.geom.IntersectionMatrix();im.set(Location.EXTERIOR,Location.EXTERIOR,2);if(!this.arg[0].getGeometry().getEnvelopeInternal().intersects(this.arg[1].getGeometry().getEnvelopeInternal())){this.computeDisjointIM(im);return im;}
this.arg[0].computeSelfNodes(this.li,false);this.arg[1].computeSelfNodes(this.li,false);var intersector=this.arg[0].computeEdgeIntersections(this.arg[1],this.li,false);this.computeIntersectionNodes(0);this.computeIntersectionNodes(1);this.copyNodesAndLabels(0);this.copyNodesAndLabels(1);this.labelIsolatedNodes();this.computeProperIntersectionIM(intersector,im);var eeBuilder=new jsts.operation.relate.EdgeEndBuilder();var ee0=eeBuilder.computeEdgeEnds(this.arg[0].getEdgeIterator());this.insertEdgeEnds(ee0);var ee1=eeBuilder.computeEdgeEnds(this.arg[1].getEdgeIterator());this.insertEdgeEnds(ee1);this.labelNodeEdges();this.labelIsolatedEdges(0,1);this.labelIsolatedEdges(1,0);this.updateIM(im);return im;};jsts.operation.relate.RelateComputer.prototype.insertEdgeEnds=function(ee){for(var i=ee.iterator();i.hasNext();){var e=i.next();this.nodes.add(e);}};jsts.operation.relate.RelateComputer.prototype.computeProperIntersectionIM=function(intersector,im){var dimA=this.arg[0].getGeometry().getDimension();var dimB=this.arg[1].getGeometry().getDimension();var hasProper=intersector.hasProperIntersection();var hasProperInterior=intersector.hasProperInteriorIntersection();if(dimA===2&&dimB===2){if(hasProper)
im.setAtLeast('212101212');}
else if(dimA===2&&dimB===1){if(hasProper)
im.setAtLeast('FFF0FFFF2');if(hasProperInterior)
im.setAtLeast('1FFFFF1FF');}else if(dimA===1&&dimB===2){if(hasProper)
im.setAtLeast('F0FFFFFF2');if(hasProperInterior)
im.setAtLeast('1F1FFFFFF');}
else if(dimA===1&&dimB===1){if(hasProperInterior)
im.setAtLeast('0FFFFFFFF');}};jsts.operation.relate.RelateComputer.prototype.copyNodesAndLabels=function(argIndex){for(var i=this.arg[argIndex].getNodeIterator();i.hasNext();){var graphNode=i.next();var newNode=this.nodes.addNode(graphNode.getCoordinate());newNode.setLabel(argIndex,graphNode.getLabel().getLocation(argIndex));}};jsts.operation.relate.RelateComputer.prototype.computeIntersectionNodes=function(argIndex){for(var i=this.arg[argIndex].getEdgeIterator();i.hasNext();){var e=i.next();var eLoc=e.getLabel().getLocation(argIndex);for(var eiIt=e.getEdgeIntersectionList().iterator();eiIt.hasNext();){var ei=eiIt.next();var n=this.nodes.addNode(ei.coord);if(eLoc===Location.BOUNDARY)
n.setLabelBoundary(argIndex);else{if(n.getLabel().isNull(argIndex))
n.setLabel(argIndex,Location.INTERIOR);}}}};jsts.operation.relate.RelateComputer.prototype.labelIntersectionNodes=function(argIndex){for(var i=this.arg[argIndex].getEdgeIterator();i.hasNext();){var e=i.next();var eLoc=e.getLabel().getLocation(argIndex);for(var eiIt=e.getEdgeIntersectionList().iterator();eiIt.hasNext();){var ei=eiIt.next();var n=this.nodes.find(ei.coord);if(n.getLabel().isNull(argIndex)){if(eLoc===Location.BOUNDARY)
n.setLabelBoundary(argIndex);else
n.setLabel(argIndex,Location.INTERIOR);}}}};jsts.operation.relate.RelateComputer.prototype.computeDisjointIM=function(im){var ga=this.arg[0].getGeometry();if(!ga.isEmpty()){im.set(Location.INTERIOR,Location.EXTERIOR,ga.getDimension());im.set(Location.BOUNDARY,Location.EXTERIOR,ga.getBoundaryDimension());}
var gb=this.arg[1].getGeometry();if(!gb.isEmpty()){im.set(Location.EXTERIOR,Location.INTERIOR,gb.getDimension());im.set(Location.EXTERIOR,Location.BOUNDARY,gb.getBoundaryDimension());}};jsts.operation.relate.RelateComputer.prototype.labelNodeEdges=function(){for(var ni=this.nodes.iterator();ni.hasNext();){var node=ni.next();node.getEdges().computeLabelling(this.arg);}};jsts.operation.relate.RelateComputer.prototype.updateIM=function(im){for(var ei=this.isolatedEdges.iterator();ei.hasNext();){var e=ei.next();e.updateIM(im);}
for(var ni=this.nodes.iterator();ni.hasNext();){var node=ni.next();node.updateIM(im);node.updateIMFromEdges(im);}};jsts.operation.relate.RelateComputer.prototype.labelIsolatedEdges=function(thisIndex,targetIndex){for(var ei=this.arg[thisIndex].getEdgeIterator();ei.hasNext();){var e=ei.next();if(e.isIsolated()){this.labelIsolatedEdge(e,targetIndex,this.arg[targetIndex].getGeometry());this.isolatedEdges.add(e);}}};jsts.operation.relate.RelateComputer.prototype.labelIsolatedEdge=function(e,targetIndex,target){if(target.getDimension()>0){var loc=this.ptLocator.locate(e.getCoordinate(),target);e.getLabel().setAllLocations(targetIndex,loc);}else{e.getLabel().setAllLocations(targetIndex,Location.EXTERIOR);}};jsts.operation.relate.RelateComputer.prototype.labelIsolatedNodes=function(){for(var ni=this.nodes.iterator();ni.hasNext();){var n=ni.next();var label=n.getLabel();Assert.isTrue(label.getGeometryCount()>0,'node with empty label found');if(n.isIsolated()){if(label.isNull(0))
this.labelIsolatedNode(n,0);else
this.labelIsolatedNode(n,1);}}};jsts.operation.relate.RelateComputer.prototype.labelIsolatedNode=function(n,targetIndex){var loc=this.ptLocator.locate(n.getCoordinate(),this.arg[targetIndex].getGeometry());n.getLabel().setAllLocations(targetIndex,loc);};})();(function(){var Assert=jsts.util.Assert;jsts.geomgraph.GraphComponent=function(label){this.label=label;};jsts.geomgraph.GraphComponent.prototype.label=null;jsts.geomgraph.GraphComponent.prototype._isInResult=false;jsts.geomgraph.GraphComponent.prototype._isCovered=false;jsts.geomgraph.GraphComponent.prototype._isCoveredSet=false;jsts.geomgraph.GraphComponent.prototype._isVisited=false;jsts.geomgraph.GraphComponent.prototype.getLabel=function(){return this.label;};jsts.geomgraph.GraphComponent.prototype.setLabel=function(label){if(arguments.length===2){this.setLabel2.apply(this,arguments);return;}
this.label=label;};jsts.geomgraph.GraphComponent.prototype.setInResult=function(isInResult){this._isInResult=isInResult;};jsts.geomgraph.GraphComponent.prototype.isInResult=function(){return this._isInResult;};jsts.geomgraph.GraphComponent.prototype.setCovered=function(isCovered){this._isCovered=isCovered;this._isCoveredSet=true;};jsts.geomgraph.GraphComponent.prototype.isCovered=function(){return this._isCovered;};jsts.geomgraph.GraphComponent.prototype.isCoveredSet=function(){return this._isCoveredSet;};jsts.geomgraph.GraphComponent.prototype.isVisited=function(){return this._isVisited;};jsts.geomgraph.GraphComponent.prototype.setVisited=function(isVisited){this._isVisited=isVisited;};jsts.geomgraph.GraphComponent.prototype.getCoordinate=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geomgraph.GraphComponent.prototype.computeIM=function(im){throw new jsts.error.AbstractMethodInvocationError();};jsts.geomgraph.GraphComponent.prototype.isIsolated=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geomgraph.GraphComponent.prototype.updateIM=function(im){Assert.isTrue(this.label.getGeometryCount()>=2,'found partial label');this.computeIM(im);};})();jsts.geomgraph.Node=function(coord,edges){this.coord=coord;this.edges=edges;this.label=new jsts.geomgraph.Label(0,jsts.geom.Location.NONE);};jsts.geomgraph.Node.prototype=new jsts.geomgraph.GraphComponent();jsts.geomgraph.Node.prototype.coord=null;jsts.geomgraph.Node.prototype.edges=null;jsts.geomgraph.Node.prototype.isIsolated=function(){return(this.label.getGeometryCount()==1);};jsts.geomgraph.Node.prototype.setLabel2=function(argIndex,onLocation){if(this.label===null){this.label=new jsts.geomgraph.Label(argIndex,onLocation);}else
this.label.setLocation(argIndex,onLocation);};jsts.geomgraph.Node.prototype.setLabelBoundary=function(argIndex){var loc=jsts.geom.Location.NONE;if(this.label!==null)
loc=this.label.getLocation(argIndex);var newLoc;switch(loc){case jsts.geom.Location.BOUNDARY:newLoc=jsts.geom.Location.INTERIOR;break;case jsts.geom.Location.INTERIOR:newLoc=jsts.geom.Location.BOUNDARY;break;default:newLoc=jsts.geom.Location.BOUNDARY;break;}
this.label.setLocation(argIndex,newLoc);};jsts.geomgraph.Node.prototype.add=function(e){this.edges.insert(e);e.setNode(this);};jsts.geomgraph.Node.prototype.getCoordinate=function(){return this.coord;};jsts.geomgraph.Node.prototype.getEdges=function(){return this.edges;};jsts.geomgraph.Node.prototype.isIncidentEdgeInResult=function(){for(var it=this.getEdges().getEdges().iterator();it.hasNext();){var de=it.next();if(de.getEdge().isInResult())
return true;}
return false;};jsts.geom.Point=function(coordinate,factory){this.factory=factory;if(coordinate===undefined)
return;this.coordinate=coordinate;};jsts.geom.Point.prototype=new jsts.geom.Geometry();jsts.geom.Point.constructor=jsts.geom.Point;jsts.geom.Point.CLASS_NAME='jsts.geom.Point';jsts.geom.Point.prototype.coordinate=null;jsts.geom.Point.prototype.getX=function(){return this.coordinate.x;};jsts.geom.Point.prototype.getY=function(){return this.coordinate.y;};jsts.geom.Point.prototype.getCoordinate=function(){return this.coordinate;};jsts.geom.Point.prototype.getCoordinates=function(){return this.isEmpty()?[]:[this.coordinate];};jsts.geom.Point.prototype.getCoordinateSequence=function(){return this.isEmpty()?[]:[this.coordinate];};jsts.geom.Point.prototype.isEmpty=function(){return this.coordinate===null;};jsts.geom.Point.prototype.equalsExact=function(other,tolerance){if(!this.isEquivalentClass(other)){return false;}
if(this.isEmpty()&&other.isEmpty()){return true;}
return this.equal(other.getCoordinate(),this.getCoordinate(),tolerance);};jsts.geom.Point.prototype.getNumPoints=function(){return this.isEmpty()?0:1;};jsts.geom.Point.prototype.isSimple=function(){return true;};jsts.geom.Point.prototype.getBoundary=function(){return new jsts.geom.GeometryCollection(null);};jsts.geom.Point.prototype.computeEnvelopeInternal=function(){if(this.isEmpty()){return new jsts.geom.Envelope();}
return new jsts.geom.Envelope(this.coordinate);};jsts.geom.Point.prototype.apply=function(filter){if(filter instanceof jsts.geom.GeometryFilter||filter instanceof jsts.geom.GeometryComponentFilter){filter.filter(this);}else if(filter instanceof jsts.geom.CoordinateFilter){if(this.isEmpty()){return;}
filter.filter(this.getCoordinate());}};jsts.geom.Point.prototype.clone=function(){return new jsts.geom.Point(this.coordinate.clone(),this.factory);};jsts.geom.Point.prototype.getDimension=function(){return 0;};jsts.geom.Point.prototype.getBoundaryDimension=function(){return jsts.geom.Dimension.FALSE;};jsts.geom.Point.prototype.reverse=function(){return this.clone();};jsts.geom.Point.prototype.isValid=function(){if(!jsts.operation.valid.IsValidOp.isValid(this.getCoordinate())){return false;}
return true;};jsts.geom.Point.prototype.normalize=function(){};jsts.geom.Point.prototype.compareToSameClass=function(other){var point=other;return this.getCoordinate().compareTo(point.getCoordinate());};jsts.geom.Point.prototype.getGeometryType=function(){return'Point';};jsts.geom.Point.prototype.hashCode=function(){return'Point_'+this.coordinate.hashCode();};jsts.geom.Point.prototype.CLASS_NAME='jsts.geom.Point';jsts.geom.Dimension=function(){};jsts.geom.Dimension.P=0;jsts.geom.Dimension.L=1;jsts.geom.Dimension.A=2;jsts.geom.Dimension.FALSE=-1;jsts.geom.Dimension.TRUE=-2;jsts.geom.Dimension.DONTCARE=-3;jsts.geom.Dimension.toDimensionSymbol=function(dimensionValue){switch(dimensionValue){case jsts.geom.Dimension.FALSE:return'F';case jsts.geom.Dimension.TRUE:return'T';case jsts.geom.Dimension.DONTCARE:return'*';case jsts.geom.Dimension.P:return'0';case jsts.geom.Dimension.L:return'1';case jsts.geom.Dimension.A:return'2';}
throw new jsts.IllegalArgumentError('Unknown dimension value: '+
dimensionValue);};jsts.geom.Dimension.toDimensionValue=function(dimensionSymbol){switch(dimensionSymbol.toUpperCase()){case'F':return jsts.geom.Dimension.FALSE;case'T':return jsts.geom.Dimension.TRUE;case'*':return jsts.geom.Dimension.DONTCARE;case'0':return jsts.geom.Dimension.P;case'1':return jsts.geom.Dimension.L;case'2':return jsts.geom.Dimension.A;}
throw new jsts.error.IllegalArgumentError('Unknown dimension symbol: '+
dimensionSymbol);};(function(){var Dimension=jsts.geom.Dimension;jsts.geom.LineString=function(points,factory){this.factory=factory;this.points=points||[];};jsts.geom.LineString.prototype=new jsts.geom.Geometry();jsts.geom.LineString.constructor=jsts.geom.LineString;jsts.geom.LineString.prototype.points=null;jsts.geom.LineString.prototype.getCoordinates=function(){return this.points;};jsts.geom.LineString.prototype.getCoordinateSequence=function(){return this.points;};jsts.geom.LineString.prototype.getCoordinateN=function(n){return this.points[n];};jsts.geom.LineString.prototype.getCoordinate=function(){if(this.isEmpty()){return null;}
return this.getCoordinateN(0);};jsts.geom.LineString.prototype.getDimension=function(){return 1;};jsts.geom.LineString.prototype.getBoundaryDimension=function(){if(this.isClosed()){return Dimension.FALSE;}
return 0;};jsts.geom.LineString.prototype.isEmpty=function(){return this.points.length===0;};jsts.geom.LineString.prototype.getNumPoints=function(){return this.points.length;};jsts.geom.LineString.prototype.getPointN=function(n){return this.getFactory().createPoint(this.points[n]);};jsts.geom.LineString.prototype.getStartPoint=function(){if(this.isEmpty()){return null;}
return this.getPointN(0);};jsts.geom.LineString.prototype.getEndPoint=function(){if(this.isEmpty()){return null;}
return this.getPointN(this.getNumPoints()-1);};jsts.geom.LineString.prototype.isClosed=function(){if(this.isEmpty()){return false;}
return this.getCoordinateN(0).equals2D(this.getCoordinateN(this.points.length-1));};jsts.geom.LineString.prototype.isRing=function(){return this.isClosed()&&this.isSimple();};jsts.geom.LineString.prototype.getGeometryType=function(){return'LineString';};jsts.geom.LineString.prototype.getLength=function(){return jsts.algorithm.CGAlgorithms.computeLength(this.points);};jsts.geom.LineString.prototype.getBoundary=function(){return(new jsts.operation.BoundaryOp(this)).getBoundary();};jsts.geom.LineString.prototype.computeEnvelopeInternal=function(){if(this.isEmpty()){return new jsts.geom.Envelope();}
var env=new jsts.geom.Envelope();this.points.forEach(function(component){env.expandToInclude(component);});return env;};jsts.geom.LineString.prototype.equalsExact=function(other,tolerance){if(!this.isEquivalentClass(other)){return false;}
if(this.points.length!==other.points.length){return false;}
if(this.isEmpty()&&other.isEmpty()){return true;}
return this.points.reduce(function(equal,point,i){return equal&&jsts.geom.Geometry.prototype.equal(point,other.points[i],tolerance);});};jsts.geom.LineString.prototype.isEquivalentClass=function(other){return other instanceof jsts.geom.LineString;};jsts.geom.LineString.prototype.compareToSameClass=function(o){var line=o;var i=0,il=this.points.length;var j=0,jl=line.points.length;while(i<il&&j<jl){var comparison=this.points[i].compareTo(line.points[j]);if(comparison!==0){return comparison;}
i++;j++;}
if(i<il){return 1;}
if(j<jl){return-1;}
return 0;};jsts.geom.LineString.prototype.apply=function(filter){if(filter instanceof jsts.geom.GeometryFilter||filter instanceof jsts.geom.GeometryComponentFilter){filter.filter(this);}else if(filter instanceof jsts.geom.CoordinateFilter){for(var i=0,len=this.points.length;i<len;i++){filter.filter(this.points[i]);}}else if(filter instanceof jsts.geom.CoordinateSequenceFilter){this.apply2.apply(this,arguments);}};jsts.geom.LineString.prototype.apply2=function(filter){if(this.points.length===0)
return;for(var i=0;i<this.points.length;i++){filter.filter(this.points,i);if(filter.isDone())
break;}
if(filter.isGeometryChanged()){}};jsts.geom.LineString.prototype.clone=function(){var points=[];for(var i=0,len=this.points.length;i<len;i++){points.push(this.points[i].clone());}
return this.factory.createLineString(points);};jsts.geom.LineString.prototype.normalize=function(){var i,il,j,ci,cj,len;len=this.points.length;il=parseInt(len/2);for(i=0;i<il;i++){j=len-1-i;ci=this.points[i];cj=this.points[j];if(!ci.equals(cj)){if(ci.compareTo(cj)>0){this.points.reverse();}
return;}}};jsts.geom.LineString.prototype.CLASS_NAME='jsts.geom.LineString';})();(function(){jsts.geom.Polygon=function(shell,holes,factory){this.shell=shell||factory.createLinearRing(null);this.holes=holes||[];this.factory=factory;};jsts.geom.Polygon.prototype=new jsts.geom.Geometry();jsts.geom.Polygon.constructor=jsts.geom.Polygon;jsts.geom.Polygon.prototype.getCoordinate=function(){return this.shell.getCoordinate();};jsts.geom.Polygon.prototype.getCoordinates=function(){if(this.isEmpty()){return[];}
var coordinates=[];var k=-1;var shellCoordinates=this.shell.getCoordinates();for(var x=0;x<shellCoordinates.length;x++){k++;coordinates[k]=shellCoordinates[x];}
for(var i=0;i<this.holes.length;i++){var childCoordinates=this.holes[i].getCoordinates();for(var j=0;j<childCoordinates.length;j++){k++;coordinates[k]=childCoordinates[j];}}
return coordinates;};jsts.geom.Polygon.prototype.getNumPoints=function(){var numPoints=this.shell.getNumPoints();for(var i=0;i<this.holes.length;i++){numPoints+=this.holes[i].getNumPoints();}
return numPoints;};jsts.geom.Polygon.prototype.isEmpty=function(){return this.shell.isEmpty();};jsts.geom.Polygon.prototype.isRectangle=function(){if(this.getNumInteriorRing()!=0)return false;if(this.shell==null)return false;if(this.shell.getNumPoints()!=5)return false;var seq=this.shell.getCoordinateSequence();var env=this.getEnvelopeInternal();for(var i=0;i<5;i++){var x=seq[i].x;if(!(x==env.getMinX()||x==env.getMaxX()))return false;var y=seq[i].y;if(!(y==env.getMinY()||y==env.getMaxY()))return false;}
var prevX=seq[0].x;var prevY=seq[0].y;for(var i=1;i<=4;i++){var x=seq[i].x;var y=seq[i].y;var xChanged=x!=prevX;var yChanged=y!=prevY;if(xChanged==yChanged)
return false;prevX=x;prevY=y;}
return true;};jsts.geom.Polygon.prototype.getExteriorRing=function(){return this.shell;};jsts.geom.Polygon.prototype.getInteriorRingN=function(n){return this.holes[n];};jsts.geom.Polygon.prototype.getNumInteriorRing=function(){return this.holes.length;};jsts.geom.Polygon.prototype.getArea=function(){var area=0.0;area+=Math.abs(jsts.algorithm.CGAlgorithms.signedArea(this.shell.getCoordinateSequence()));for(var i=0;i<this.holes.length;i++){area-=Math.abs(jsts.algorithm.CGAlgorithms.signedArea(this.holes[i].getCoordinateSequence()));}
return area;};jsts.geom.Polygon.prototype.getLength=function(){var len=0.0;len+=this.shell.getLength();for(var i=0;i<this.holes.length;i++){len+=this.holes[i].getLength();}
return len;};jsts.geom.Polygon.prototype.getBoundary=function(){if(this.isEmpty()){return this.getFactory().createMultiLineString(null);}
var rings=[];rings[0]=this.shell.clone();for(var i=0,len=this.holes.length;i<len;i++){rings[i+1]=this.holes[i].clone();}
if(rings.length<=1)
return rings[0];return this.getFactory().createMultiLineString(rings);};jsts.geom.Polygon.prototype.computeEnvelopeInternal=function(){return this.shell.getEnvelopeInternal();};jsts.geom.Polygon.prototype.getDimension=function(){return 2;};jsts.geom.Polygon.prototype.getBoundaryDimension=function(){return 1;};jsts.geom.Polygon.prototype.equalsExact=function(other,tolerance){if(!this.isEquivalentClass(other)){return false;}
if(this.isEmpty()&&other.isEmpty()){return true;}
if(this.isEmpty()!==other.isEmpty()){return false;}
if(!this.shell.equalsExact(other.shell,tolerance)){return false;}
if(this.holes.length!==other.holes.length){return false;}
if(this.holes.length!==other.holes.length){return false;}
for(var i=0;i<this.holes.length;i++){if(!(this.holes[i]).equalsExact(other.holes[i],tolerance)){return false;}}
return true;};jsts.geom.Polygon.prototype.compareToSameClass=function(o){return this.shell.compareToSameClass(o.shell);};jsts.geom.Polygon.prototype.apply=function(filter){if(filter instanceof jsts.geom.GeometryComponentFilter){filter.filter(this);this.shell.apply(filter);for(var i=0,len=this.holes.length;i<len;i++){this.holes[i].apply(filter);}}else if(filter instanceof jsts.geom.GeometryFilter){filter.filter(this);}else if(filter instanceof jsts.geom.CoordinateFilter){this.shell.apply(filter);for(var i=0,len=this.holes.length;i<len;i++){this.holes[i].apply(filter);}}else if(filter instanceof jsts.geom.CoordinateSequenceFilter){this.apply2.apply(this,arguments);}};jsts.geom.Polygon.prototype.apply2=function(filter){this.shell.apply(filter);if(!filter.isDone()){for(var i=0;i<this.holes.length;i++){this.holes[i].apply(filter);if(filter.isDone())
break;}}
if(filter.isGeometryChanged()){}};jsts.geom.Polygon.prototype.clone=function(){var holes=[];for(var i=0,len=this.holes.length;i<len;i++){holes.push(this.holes[i].clone());}
return this.factory.createPolygon(this.shell.clone(),holes);};jsts.geom.Polygon.prototype.normalize=function(){this.normalize2(this.shell,true);for(var i=0,len=this.holes.length;i<len;i++){this.normalize2(this.holes[i],false);}
this.holes.sort();};jsts.geom.Polygon.prototype.normalize2=function(ring,clockwise){if(ring.isEmpty()){return;}
var uniqueCoordinates=ring.points.slice(0,ring.points.length-1);var minCoordinate=jsts.geom.CoordinateArrays.minCoordinate(ring.points);jsts.geom.CoordinateArrays.scroll(uniqueCoordinates,minCoordinate);ring.points=uniqueCoordinates.concat();ring.points[uniqueCoordinates.length]=uniqueCoordinates[0];if(jsts.algorithm.CGAlgorithms.isCCW(ring.points)===clockwise){ring.points.reverse();}};jsts.geom.Polygon.prototype.getGeometryType=function(){return'Polygon';};jsts.geom.Polygon.prototype.CLASS_NAME='jsts.geom.Polygon';})();(function(){var Geometry=jsts.geom.Geometry;var TreeSet=javascript.util.TreeSet;var Arrays=javascript.util.Arrays;jsts.geom.GeometryCollection=function(geometries,factory){this.geometries=geometries||[];this.factory=factory;};jsts.geom.GeometryCollection.prototype=new Geometry();jsts.geom.GeometryCollection.constructor=jsts.geom.GeometryCollection;jsts.geom.GeometryCollection.prototype.isEmpty=function(){for(var i=0,len=this.geometries.length;i<len;i++){var geometry=this.getGeometryN(i);if(!geometry.isEmpty()){return false;}}
return true;};jsts.geom.Geometry.prototype.getArea=function(){var area=0.0;for(var i=0,len=this.geometries.length;i<len;i++){area+=this.getGeometryN(i).getArea();}
return area;};jsts.geom.Geometry.prototype.getLength=function(){var length=0.0;for(var i=0,len=this.geometries.length;i<len;i++){length+=this.getGeometryN(i).getLength();}
return length;};jsts.geom.GeometryCollection.prototype.getCoordinate=function(){if(this.isEmpty())
return null;return this.getGeometryN(0).getCoordinate();};jsts.geom.GeometryCollection.prototype.getCoordinates=function(){var coordinates=[];var k=-1;for(var i=0,len=this.geometries.length;i<len;i++){var geometry=this.getGeometryN(i);var childCoordinates=geometry.getCoordinates();for(var j=0;j<childCoordinates.length;j++){k++;coordinates[k]=childCoordinates[j];}}
return coordinates;};jsts.geom.GeometryCollection.prototype.getNumGeometries=function(){return this.geometries.length;};jsts.geom.GeometryCollection.prototype.getGeometryN=function(n){var geometry=this.geometries[n];if(geometry instanceof jsts.geom.Coordinate){geometry=new jsts.geom.Point(geometry);}
return geometry;};jsts.geom.GeometryCollection.prototype.getNumPoints=function(n){var numPoints=0;for(var i=0;i<this.geometries.length;i++){numPoints+=this.geometries[i].getNumPoints();}
return numPoints;}
jsts.geom.GeometryCollection.prototype.equalsExact=function(other,tolerance){if(!this.isEquivalentClass(other)){return false;}
if(this.geometries.length!==other.geometries.length){return false;}
for(var i=0,len=this.geometries.length;i<len;i++){var geometry=this.getGeometryN(i);if(!geometry.equalsExact(other.getGeometryN(i),tolerance)){return false;}}
return true;};jsts.geom.GeometryCollection.prototype.clone=function(){var geometries=[];for(var i=0,len=this.geometries.length;i<len;i++){geometries.push(this.geometries[i].clone());}
return this.factory.createGeometryCollection(geometries);};jsts.geom.GeometryCollection.prototype.normalize=function(){for(var i=0,len=this.geometries.length;i<len;i++){this.getGeometryN(i).normalize();}
this.geometries.sort();};jsts.geom.GeometryCollection.prototype.compareToSameClass=function(o){var theseElements=new TreeSet(Arrays.asList(this.geometries));var otherElements=new TreeSet(Arrays.asList(o.geometries));return this.compare(theseElements,otherElements);};jsts.geom.GeometryCollection.prototype.apply=function(filter){if(filter instanceof jsts.geom.GeometryFilter||filter instanceof jsts.geom.GeometryComponentFilter){filter.filter(this);for(var i=0,len=this.geometries.length;i<len;i++){this.getGeometryN(i).apply(filter);}}else if(filter instanceof jsts.geom.CoordinateFilter){for(var i=0,len=this.geometries.length;i<len;i++){this.getGeometryN(i).apply(filter);}}else if(filter instanceof jsts.geom.CoordinateSequenceFilter){this.apply2.apply(this,arguments);}};jsts.geom.GeometryCollection.prototype.apply2=function(filter){if(this.geometries.length==0)
return;for(var i=0;i<this.geometries.length;i++){this.geometries[i].apply(filter);if(filter.isDone()){break;}}
if(filter.isGeometryChanged()){}};jsts.geom.GeometryCollection.prototype.getDimension=function(){var dimension=jsts.geom.Dimension.FALSE;for(var i=0,len=this.geometries.length;i<len;i++){var geometry=this.getGeometryN(i);dimension=Math.max(dimension,geometry.getDimension());}
return dimension;};jsts.geom.GeometryCollection.prototype.computeEnvelopeInternal=function(){var envelope=new jsts.geom.Envelope();for(var i=0,len=this.geometries.length;i<len;i++){var geometry=this.getGeometryN(i);envelope.expandToInclude(geometry.getEnvelopeInternal());}
return envelope;};jsts.geom.GeometryCollection.prototype.CLASS_NAME='jsts.geom.GeometryCollection';})();jsts.algorithm.Centroid=function(geometry){this.areaBasePt=null;this.triangleCent3=new jsts.geom.Coordinate();this.areasum2=0;this.cg3=new jsts.geom.Coordinate();this.lineCentSum=new jsts.geom.Coordinate();this.totalLength=0;this.ptCount=0;this.ptCentSum=new jsts.geom.Coordinate();this.add(geometry);};jsts.algorithm.Centroid.getCentroid=function(geometry){var cent=new jsts.algorithm.Centroid(geometry);return cent.getCentroid();};jsts.algorithm.Centroid.centroid3=function(p1,p2,p3,c){c.x=p1.x+p2.x+p3.x;c.y=p1.y+p2.y+p3.y;};jsts.algorithm.Centroid.area2=function(p1,p2,p3){return(p2.x-p1.x)*(p3.y-p1.y)-(p3.x-p1.x)*(p2.y-p1.y);};jsts.algorithm.Centroid.prototype.add=function(geom){if(geom.isEmpty()){return;}
if(geom instanceof jsts.geom.Point){this.addPoint(geom.getCoordinate());}else if(geom instanceof jsts.geom.LineString){this.addLineSegments(geom.getCoordinates());}else if(geom instanceof jsts.geom.Polygon){this.addPolygon(geom);}else if(geom instanceof jsts.geom.GeometryCollection){for(var i=0;i<geom.getNumGeometries();i++){this.add(geom.getGeometryN(i));}}};jsts.algorithm.Centroid.prototype.getCentroid=function(){var cent=new jsts.geom.Coordinate();if(Math.abs(this.areasum2)>0){cent.x=this.cg3.x/3/this.areasum2;cent.y=this.cg3.y/3/this.areasum2;}else if(this.totalLength>0){cent.x=this.lineCentSum.x/this.totalLength;cent.y=this.lineCentSum.y/this.totalLength;}else if(this.ptCount>0){cent.x=this.ptCentSum.x/this.ptCount;cent.y=this.ptCentSum.y/this.ptCount;}else{return null;}
return cent;};jsts.algorithm.Centroid.prototype.setBasePoint=function(basePt){if(this.areaBasePt===null){this.areaBasePt=basePt;}};jsts.algorithm.Centroid.prototype.addPolygon=function(poly){this.addShell(poly.getExteriorRing().getCoordinates());for(var i=0;i<poly.getNumInteriorRing();i++){this.addHole(poly.getInteriorRingN(i).getCoordinates());}};jsts.algorithm.Centroid.prototype.addShell=function(pts){if(pts.length>0){this.setBasePoint(pts[0]);}
var isPositiveArea=!jsts.algorithm.CGAlgorithms.isCCW(pts);for(var i=0;i<pts.length-1;i++){this.addTriangle(this.areaBasePt,pts[i],pts[i+1],isPositiveArea);}
this.addLineSegments(pts);};jsts.algorithm.Centroid.prototype.addHole=function(pts){var isPositiveArea=jsts.algorithm.CGAlgorithms.isCCW(pts);for(var i=0;i<pts.length-1;i++){this.addTriangle(this.areaBasePt,pts[i],pts[i+1],isPositiveArea);}
this.addLineSegments(pts);};jsts.algorithm.Centroid.prototype.addTriangle=function(p0,p1,p2,isPositiveArea){var sign=(isPositiveArea)?1:-1;jsts.algorithm.Centroid.centroid3(p0,p1,p2,this.triangleCent3);var area2=jsts.algorithm.Centroid.area2(p0,p1,p2);this.cg3.x+=sign*area2*this.triangleCent3.x;this.cg3.y+=sign*area2*this.triangleCent3.y;this.areasum2+=sign*area2;};jsts.algorithm.Centroid.prototype.addLineSegments=function(pts){var lineLen=0;for(var i=0;i<pts.length-1;i++){var segmentLen=pts[i].distance(pts[i+1]);if(segmentLen===0){continue;}
lineLen+=segmentLen;var midx=(pts[i].x+pts[i+1].x)/2;this.lineCentSum.x+=segmentLen*midx;var midy=(pts[i].y+pts[i+1].y)/2;this.lineCentSum.y+=segmentLen*midy;}
this.totalLength+=lineLen;if(lineLen===0&&pts.length>0){this.addPoint(pts[0]);}};jsts.algorithm.Centroid.prototype.addPoint=function(pt){this.ptCount+=1;this.ptCentSum.x+=pt.x;this.ptCentSum.y+=pt.y;};(function(){var EdgeRing=function(factory){this.deList=new javascript.util.ArrayList();this.factory=factory;};EdgeRing.findEdgeRingContaining=function(testEr,shellList){var testRing=testEr.getRing();var testEnv=testRing.getEnvelopeInternal();var testPt=testRing.getCoordinateN(0);var minShell=null;var minEnv=null;for(var it=shellList.iterator();it.hasNext();){var tryShell=it.next();var tryRing=tryShell.getRing();var tryEnv=tryRing.getEnvelopeInternal();if(minShell!=null)
minEnv=minShell.getRing().getEnvelopeInternal();var isContained=false;if(tryEnv.equals(testEnv))
continue;testPt=jsts.geom.CoordinateArrays.ptNotInList(testRing.getCoordinates(),tryRing.getCoordinates());if(tryEnv.contains(testEnv)&&jsts.algorithm.CGAlgorithms.isPointInRing(testPt,tryRing.getCoordinates()))
isContained=true;if(isContained){if(minShell==null||minEnv.contains(tryEnv)){minShell=tryShell;}}}
return minShell;};EdgeRing.ptNotInList=function(testPts,pts){for(var i=0;i<testPts.length;i++){var testPt=testPts[i];if(!isInList(testPt,pts))
return testPt;}
return null;};EdgeRing.isInList=function(pt,pts){for(var i=0;i<pts.length;i++){if(pt.equals(pts[i]))
return true;}
return false;}
EdgeRing.prototype.factory=null;EdgeRing.prototype.deList=null;EdgeRing.prototype.ring=null;EdgeRing.prototype.ringPts=null;EdgeRing.prototype.holes=null;EdgeRing.prototype.add=function(de){this.deList.add(de);};EdgeRing.prototype.isHole=function(){var ring=this.getRing();return jsts.algorithm.CGAlgorithms.isCCW(ring.getCoordinates());};EdgeRing.prototype.addHole=function(hole){if(this.holes==null)
this.holes=new javascript.util.ArrayList();this.holes.add(hole);};EdgeRing.prototype.getPolygon=function(){var holeLR=null;if(this.holes!=null){holeLR=[];for(var i=0;i<this.holes.size();i++){holeLR[i]=this.holes.get(i);}}
var poly=this.factory.createPolygon(this.ring,holeLR);return poly;};EdgeRing.prototype.isValid=function(){this.getCoordinates();if(this.ringPts.length<=3)
return false;this.getRing();return this.ring.isValid();};EdgeRing.prototype.getCoordinates=function(){if(this.ringPts==null){var coordList=new jsts.geom.CoordinateList();for(var i=this.deList.iterator();i.hasNext();){var de=i.next();var edge=de.getEdge();EdgeRing.addEdge(edge.getLine().getCoordinates(),de.getEdgeDirection(),coordList);}
this.ringPts=coordList.toCoordinateArray();}
return this.ringPts;};EdgeRing.prototype.getLineString=function(){this.getCoordinates();return this.factory.createLineString(this.ringPts);};EdgeRing.prototype.getRing=function(){if(this.ring!=null)
return this.ring;this.getCoordinates();if(this.ringPts.length<3)
console.log(this.ringPts);try{this.ring=this.factory.createLinearRing(this.ringPts);}catch(ex){console.log(this.ringPts);}
return this.ring;};EdgeRing.addEdge=function(coords,isForward,coordList){if(isForward){for(var i=0;i<coords.length;i++){coordList.add(coords[i],false);}}else{for(var i=coords.length-1;i>=0;i--){coordList.add(coords[i],false);}}};jsts.operation.polygonize.EdgeRing=EdgeRing;})();(function(){var GraphComponent=function(){};GraphComponent.setVisited=function(i,visited){while(i.hasNext()){var comp=i.next();comp.setVisited(visited);}};GraphComponent.setMarked=function(i,marked){while(i.hasNext()){var comp=i.next();comp.setMarked(marked);}};GraphComponent.getComponentWithVisitedState=function(i,visitedState){while(i.hasNext()){var comp=i.next();if(comp.isVisited()==visitedState)
return comp;}
return null;};GraphComponent.prototype._isMarked=false;GraphComponent.prototype._isVisited=false;GraphComponent.prototype.data;GraphComponent.prototype.isVisited=function(){return this._isVisited;};GraphComponent.prototype.setVisited=function(isVisited){this._isVisited=isVisited;};GraphComponent.prototype.isMarked=function(){return this._isMarked;};GraphComponent.prototype.setMarked=function(isMarked){this._isMarked=isMarked;};GraphComponent.prototype.setContext=function(data){this.data=data;};GraphComponent.prototype.getContext=function(){return data;};GraphComponent.prototype.setData=function(data){this.data=data;};GraphComponent.prototype.getData=function(){return data;};GraphComponent.prototype.isRemoved=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.planargraph.GraphComponent=GraphComponent;})();(function(){var GraphComponent=jsts.planargraph.GraphComponent;var Edge=function(de0,de1){if(de0===undefined){return;}
this.setDirectedEdges(de0,de1);};Edge.prototype=new GraphComponent();Edge.prototype.dirEdge=null;Edge.prototype.setDirectedEdges=function(de0,de1){this.dirEdge=[de0,de1];de0.setEdge(this);de1.setEdge(this);de0.setSym(de1);de1.setSym(de0);de0.getFromNode().addOutEdge(de0);de1.getFromNode().addOutEdge(de1);};Edge.prototype.getDirEdge=function(i){if(i instanceof jsts.planargraph.Node){this.getDirEdge2(i);}
return this.dirEdge[i];};Edge.prototype.getDirEdge2=function(fromNode){if(this.dirEdge[0].getFromNode()==fromNode)
return this.dirEdge[0];if(this.dirEdge[1].getFromNode()==fromNode)
return this.dirEdge[1];return null;};Edge.prototype.getOppositeNode=function(node){if(this.dirEdge[0].getFromNode()==node)
return this.dirEdge[0].getToNode();if(this.dirEdge[1].getFromNode()==node)
return this.dirEdge[1].getToNode();return null;};Edge.prototype.remove=function(){this.dirEdge=null;};Edge.prototype.isRemoved=function(){return dirEdge==null;};jsts.planargraph.Edge=Edge;})();jsts.operation.polygonize.PolygonizeEdge=function(line){this.line=line;};jsts.operation.polygonize.PolygonizeEdge.prototype=new jsts.planargraph.Edge();jsts.operation.polygonize.PolygonizeEdge.prototype.line=null;jsts.operation.polygonize.PolygonizeEdge.prototype.getLine=function(){return this.line;};(function(){var ArrayList=javascript.util.ArrayList;var GraphComponent=jsts.planargraph.GraphComponent;var DirectedEdge=function(from,to,directionPt,edgeDirection){if(from===undefined){return;}
this.from=from;this.to=to;this.edgeDirection=edgeDirection;this.p0=from.getCoordinate();this.p1=directionPt;var dx=this.p1.x-this.p0.x;var dy=this.p1.y-this.p0.y;this.quadrant=jsts.geomgraph.Quadrant.quadrant(dx,dy);this.angle=Math.atan2(dy,dx);};DirectedEdge.prototype=new GraphComponent();DirectedEdge.toEdges=function(dirEdges){var edges=new ArrayList();for(var i=dirEdges.iterator();i.hasNext();){edges.add((i.next()).parentEdge);}
return edges;};DirectedEdge.prototype.parentEdge=null;DirectedEdge.prototype.from=null;DirectedEdge.prototype.to=null;DirectedEdge.prototype.p0=null;DirectedEdge.prototype.p1=null;DirectedEdge.prototype.sym=null;DirectedEdge.prototype.edgeDirection=null;DirectedEdge.prototype.quadrant=null;DirectedEdge.prototype.angle=null;DirectedEdge.prototype.getEdge=function(){return this.parentEdge;};DirectedEdge.prototype.setEdge=function(parentEdge){this.parentEdge=parentEdge;};DirectedEdge.prototype.getQuadrant=function(){return this.quadrant;};DirectedEdge.prototype.getDirectionPt=function(){return this.p1;};DirectedEdge.prototype.getEdgeDirection=function(){return this.edgeDirection;};DirectedEdge.prototype.getFromNode=function(){return this.from;};DirectedEdge.prototype.getToNode=function(){return this.to;};DirectedEdge.prototype.getCoordinate=function(){return this.from.getCoordinate();};DirectedEdge.prototype.getAngle=function(){return this.angle;};DirectedEdge.prototype.getSym=function(){return this.sym;};DirectedEdge.prototype.setSym=function(sym){this.sym=sym;};DirectedEdge.prototype.remove=function(){this.sym=null;this.parentEdge=null;};DirectedEdge.prototype.isRemoved=function(){return this.parentEdge==null;};DirectedEdge.prototype.compareTo=function(obj){var de=obj;return this.compareDirection(de);};DirectedEdge.prototype.compareDirection=function(e){if(this.quadrant>e.quadrant)
return 1;if(this.quadrant<e.quadrant)
return-1;return jsts.algorithm.CGAlgorithms.computeOrientation(e.p0,e.p1,this.p1);};jsts.planargraph.DirectedEdge=DirectedEdge;})();(function(){var DirectedEdge=jsts.planargraph.DirectedEdge;var PolygonizeDirectedEdge=function(from,to,directionPt,edgeDirection){DirectedEdge.apply(this,arguments);};PolygonizeDirectedEdge.prototype=new DirectedEdge();PolygonizeDirectedEdge.prototype.edgeRing=null;PolygonizeDirectedEdge.prototype.next=null;PolygonizeDirectedEdge.prototype.label=-1;PolygonizeDirectedEdge.prototype.getLabel=function(){return this.label;};PolygonizeDirectedEdge.prototype.setLabel=function(label){this.label=label;};PolygonizeDirectedEdge.prototype.getNext=function(){return this.next;};PolygonizeDirectedEdge.prototype.setNext=function(next){this.next=next;};PolygonizeDirectedEdge.prototype.isInRing=function(){return this.edgeRing!=null;};PolygonizeDirectedEdge.prototype.setRing=function(edgeRing){this.edgeRing=edgeRing;};jsts.operation.polygonize.PolygonizeDirectedEdge=PolygonizeDirectedEdge;})();(function(){var ArrayList=javascript.util.ArrayList;var DirectedEdgeStar=function(){this.outEdges=new ArrayList();};DirectedEdgeStar.prototype.outEdges=null;DirectedEdgeStar.prototype.sorted=false;DirectedEdgeStar.prototype.add=function(de){this.outEdges.add(de);this.sorted=false;};DirectedEdgeStar.prototype.remove=function(de){this.outEdges.remove(de);};DirectedEdgeStar.prototype.iterator=function(){this.sortEdges();return this.outEdges.iterator();};DirectedEdgeStar.prototype.getDegree=function(){return this.outEdges.size();};DirectedEdgeStar.prototype.getCoordinate=function(){var it=iterator();if(!it.hasNext())
return null;var e=it.next();return e.getCoordinate();};DirectedEdgeStar.prototype.getEdges=function(){this.sortEdges();return this.outEdges;};DirectedEdgeStar.prototype.sortEdges=function(){if(!this.sorted){var array=this.outEdges.toArray();array.sort(function(a,b){return a.compareTo(b);});this.outEdges=javascript.util.Arrays.asList(array);this.sorted=true;}};DirectedEdgeStar.prototype.getIndex=function(edge){if(edge instanceof jsts.planargraph.DirectedEdge){return this.getIndex2(edge);}else if(typeof(edge)==='number'){return this.getIndex3(edge);}
this.sortEdges();for(var i=0;i<this.outEdges.size();i++){var de=this.outEdges.get(i);if(de.getEdge()==edge)
return i;}
return-1;};DirectedEdgeStar.prototype.getIndex2=function(dirEdge){this.sortEdges();for(var i=0;i<this.outEdges.size();i++){var de=this.outEdges.get(i);if(de==dirEdge)
return i;}
return-1;};DirectedEdgeStar.prototype.getIndex3=function(i){var modi=toInt(i%this.outEdges.size());if(modi<0)
modi+=this.outEdges.size();return modi;};DirectedEdgeStar.prototype.getNextEdge=function(dirEdge){var i=this.getIndex(dirEdge);return this.outEdges.get(getIndex(i+1));};DirectedEdgeStar.prototype.getNextCWEdge=function(dirEdge){var i=this.getIndex(dirEdge);return this.outEdges.get(getIndex(i-1));};jsts.planargraph.DirectedEdgeStar=DirectedEdgeStar;})();(function(){var GraphComponent=jsts.planargraph.GraphComponent;var DirectedEdgeStar=jsts.planargraph.DirectedEdgeStar;var Node=function(pt,deStar){this.pt=pt;this.deStar=deStar||new DirectedEdgeStar();};Node.prototype=new GraphComponent();Node.getEdgesBetween=function(node0,node1){var edges0=DirectedEdge.toEdges(node0.getOutEdges().getEdges());var commonEdges=new javascript.util.HashSet(edges0);var edges1=DirectedEdge.toEdges(node1.getOutEdges().getEdges());commonEdges.retainAll(edges1);return commonEdges;};Node.prototype.pt=null;Node.prototype.deStar=null;Node.prototype.getCoordinate=function(){return this.pt;};Node.prototype.addOutEdge=function(de){this.deStar.add(de);};Node.prototype.getOutEdges=function(){return this.deStar;};Node.prototype.getDegree=function(){return this.deStar.getDegree();};Node.prototype.getIndex=function(edge){return this.deStar.getIndex(edge);};Node.prototype.remove=function(de){if(de===undefined){return this.remove2();}
this.deStar.remove(de);};Node.prototype.remove2=function(){this.pt=null;};Node.prototype.isRemoved=function(){return this.pt==null;};jsts.planargraph.Node=Node;})();(function(){var NodeMap=function(){this.nodeMap=new javascript.util.TreeMap();};NodeMap.prototype.nodeMap=null;NodeMap.prototype.add=function(n){this.nodeMap.put(n.getCoordinate(),n);return n;};NodeMap.prototype.remove=function(pt){return this.nodeMap.remove(pt);};NodeMap.prototype.find=function(coord){return this.nodeMap.get(coord);};NodeMap.prototype.iterator=function(){return this.nodeMap.values().iterator();};NodeMap.prototype.values=function(){return this.nodeMap.values();};jsts.planargraph.NodeMap=NodeMap;})();(function(){var ArrayList=javascript.util.ArrayList;var PlanarGraph=function(){this.edges=new javascript.util.HashSet();this.dirEdges=new javascript.util.HashSet();this.nodeMap=new jsts.planargraph.NodeMap();};PlanarGraph.prototype.edges=null;PlanarGraph.prototype.dirEdges=null;PlanarGraph.prototype.nodeMap=null;PlanarGraph.prototype.findNode=function(pt){return this.nodeMap.find(pt);};PlanarGraph.prototype.add=function(node){if(node instanceof jsts.planargraph.Edge){return this.add2(node);}else if(node instanceof jsts.planargraph.DirectedEdge){return this.add3(node);}
this.nodeMap.add(node);};PlanarGraph.prototype.add2=function(edge){this.edges.add(edge);this.add(edge.getDirEdge(0));this.add(edge.getDirEdge(1));};PlanarGraph.prototype.add3=function(dirEdge){this.dirEdges.add(dirEdge);};PlanarGraph.prototype.nodeIterator=function(){return this.nodeMap.iterator();};PlanarGraph.prototype.contains=function(e){if(e instanceof jsts.planargraph.DirectedEdge){return this.contains2(e);}
return this.edges.contains(e);};PlanarGraph.prototype.contains2=function(de){return this.dirEdges.contains(de);};PlanarGraph.prototype.getNodes=function(){return this.nodeMap.values();};PlanarGraph.prototype.dirEdgeIterator=function(){return this.dirEdges.iterator();};PlanarGraph.prototype.edgeIterator=function(){return this.edges.iterator();};PlanarGraph.prototype.getEdges=function(){return this.edges;};PlanarGraph.prototype.remove=function(edge){if(edge instanceof jsts.planargraph.DirectedEdge){return this.remove2(edge);}
this.remove(edge.getDirEdge(0));this.remove(edge.getDirEdge(1));this.edges.remove(edge);this.edge.remove();};PlanarGraph.prototype.remove2=function(de){if(de instanceof jsts.planargraph.Node){return this.remove3(de);}
var sym=de.getSym();if(sym!=null)
sym.setSym(null);de.getFromNode().remove(de);de.remove();this.dirEdges.remove(de);};PlanarGraph.prototype.remove3=function(node){var outEdges=node.getOutEdges().getEdges();for(var i=outEdges.iterator();i.hasNext();){var de=i.next();var sym=de.getSym();if(sym!=null)
this.remove(sym);this.dirEdges.remove(de);var edge=de.getEdge();if(edge!=null){this.edges.remove(edge);}}
this.nodeMap.remove(node.getCoordinate());node.remove();};PlanarGraph.prototype.findNodesOfDegree=function(degree){var nodesFound=new ArrayList();for(var i=this.nodeIterator();i.hasNext();){var node=i.next();if(node.getDegree()==degree)
nodesFound.add(node);}
return nodesFound;};jsts.planargraph.PlanarGraph=PlanarGraph;})();(function(){var ArrayList=javascript.util.ArrayList;var Stack=javascript.util.Stack;var HashSet=javascript.util.HashSet;var Assert=jsts.util.Assert;var EdgeRing=jsts.operation.polygonize.EdgeRing;var PolygonizeEdge=jsts.operation.polygonize.PolygonizeEdge;var PolygonizeDirectedEdge=jsts.operation.polygonize.PolygonizeDirectedEdge;var PlanarGraph=jsts.planargraph.PlanarGraph;var Node=jsts.planargraph.Node;var PolygonizeGraph=function(factory){PlanarGraph.apply(this);this.factory=factory;};PolygonizeGraph.prototype=new PlanarGraph();PolygonizeGraph.getDegreeNonDeleted=function(node){var edges=node.getOutEdges().getEdges();var degree=0;for(var i=edges.iterator();i.hasNext();){var de=i.next();if(!de.isMarked())
degree++;}
return degree;};PolygonizeGraph.getDegree=function(node,label){var edges=node.getOutEdges().getEdges();var degree=0;for(var i=edges.iterator();i.hasNext();){var de=i.next();if(de.getLabel()==label)
degree++;}
return degree;};PolygonizeGraph.deleteAllEdges=function(node){var edges=node.getOutEdges().getEdges();for(var i=edges.iterator();i.hasNext();){var de=i.next();de.setMarked(true);var sym=de.getSym();if(sym!=null)
sym.setMarked(true);}};PolygonizeGraph.prototype.factory=null;PolygonizeGraph.prototype.addEdge=function(line){if(line.isEmpty()){return;}
var linePts=jsts.geom.CoordinateArrays.removeRepeatedPoints(line.getCoordinates());if(linePts.length<2){return;}
var startPt=linePts[0];var endPt=linePts[linePts.length-1];var nStart=this.getNode(startPt);var nEnd=this.getNode(endPt);var de0=new PolygonizeDirectedEdge(nStart,nEnd,linePts[1],true);var de1=new PolygonizeDirectedEdge(nEnd,nStart,linePts[linePts.length-2],false);var edge=new PolygonizeEdge(line);edge.setDirectedEdges(de0,de1);this.add(edge);};PolygonizeGraph.prototype.getNode=function(pt){var node=this.findNode(pt);if(node==null){node=new Node(pt);this.add(node);}
return node;};PolygonizeGraph.prototype.computeNextCWEdges=function(){for(var iNode=this.nodeIterator();iNode.hasNext();){var node=iNode.next();PolygonizeGraph.computeNextCWEdges(node);}};PolygonizeGraph.prototype.convertMaximalToMinimalEdgeRings=function(ringEdges){for(var i=ringEdges.iterator();i.hasNext();){var de=i.next();var label=de.getLabel();var intNodes=PolygonizeGraph.findIntersectionNodes(de,label);if(intNodes==null)
continue;for(var iNode=intNodes.iterator();iNode.hasNext();){var node=iNode.next();PolygonizeGraph.computeNextCCWEdges(node,label);}}};PolygonizeGraph.findIntersectionNodes=function(startDE,label){var de=startDE;var intNodes=null;do{var node=de.getFromNode();if(PolygonizeGraph.getDegree(node,label)>1){if(intNodes==null)
intNodes=new ArrayList();intNodes.add(node);}
de=de.getNext();Assert.isTrue(de!=null,'found null DE in ring');Assert.isTrue(de==startDE||!de.isInRing(),'found DE already in ring');}while(de!=startDE);return intNodes;};PolygonizeGraph.prototype.getEdgeRings=function(){this.computeNextCWEdges();PolygonizeGraph.label(this.dirEdges,-1);var maximalRings=PolygonizeGraph.findLabeledEdgeRings(this.dirEdges);this.convertMaximalToMinimalEdgeRings(maximalRings);var edgeRingList=new ArrayList();for(var i=this.dirEdges.iterator();i.hasNext();){var de=i.next();if(de.isMarked())
continue;if(de.isInRing())
continue;var er=this.findEdgeRing(de);edgeRingList.add(er);}
return edgeRingList;};PolygonizeGraph.findLabeledEdgeRings=function(dirEdges){var edgeRingStarts=new ArrayList();var currLabel=1;for(var i=dirEdges.iterator();i.hasNext();){var de=i.next();if(de.isMarked())
continue;if(de.getLabel()>=0)
continue;edgeRingStarts.add(de);var edges=PolygonizeGraph.findDirEdgesInRing(de);PolygonizeGraph.label(edges,currLabel);currLabel++;}
return edgeRingStarts;};PolygonizeGraph.prototype.deleteCutEdges=function(){this.computeNextCWEdges();PolygonizeGraph.findLabeledEdgeRings(this.dirEdges);var cutLines=new ArrayList();for(var i=this.dirEdges.iterator();i.hasNext();){var de=i.next();if(de.isMarked())
continue;var sym=de.getSym();if(de.getLabel()==sym.getLabel()){de.setMarked(true);sym.setMarked(true);var e=de.getEdge();cutLines.add(e.getLine());}}
return cutLines;};PolygonizeGraph.label=function(dirEdges,label){for(var i=dirEdges.iterator();i.hasNext();){var de=i.next();de.setLabel(label);}};PolygonizeGraph.computeNextCWEdges=function(node){var deStar=node.getOutEdges();var startDE=null;var prevDE=null;for(var i=deStar.getEdges().iterator();i.hasNext();){var outDE=i.next();if(outDE.isMarked())
continue;if(startDE==null)
startDE=outDE;if(prevDE!=null){var sym=prevDE.getSym();sym.setNext(outDE);}
prevDE=outDE;}
if(prevDE!=null){var sym=prevDE.getSym();sym.setNext(startDE);}};PolygonizeGraph.computeNextCCWEdges=function(node,label){var deStar=node.getOutEdges();var firstOutDE=null;var prevInDE=null;var edges=deStar.getEdges();for(var i=edges.size()-1;i>=0;i--){var de=edges.get(i);var sym=de.getSym();var outDE=null;if(de.getLabel()==label)
outDE=de;var inDE=null;if(sym.getLabel()==label)
inDE=sym;if(outDE==null&&inDE==null)
continue;if(inDE!=null){prevInDE=inDE;}
if(outDE!=null){if(prevInDE!=null){prevInDE.setNext(outDE);prevInDE=null;}
if(firstOutDE==null)
firstOutDE=outDE;}}
if(prevInDE!=null){Assert.isTrue(firstOutDE!=null);prevInDE.setNext(firstOutDE);}};PolygonizeGraph.findDirEdgesInRing=function(startDE){var de=startDE;var edges=new ArrayList();do{edges.add(de);de=de.getNext();Assert.isTrue(de!=null,'found null DE in ring');Assert.isTrue(de==startDE||!de.isInRing(),'found DE already in ring');}while(de!=startDE);return edges;};PolygonizeGraph.prototype.findEdgeRing=function(startDE){var de=startDE;var er=new EdgeRing(this.factory);do{er.add(de);de.setRing(er);de=de.getNext();Assert.isTrue(de!=null,'found null DE in ring');Assert.isTrue(de==startDE||!de.isInRing(),'found DE already in ring');}while(de!=startDE);return er;};PolygonizeGraph.prototype.deleteDangles=function(){var nodesToRemove=this.findNodesOfDegree(1);var dangleLines=new HashSet();var nodeStack=new Stack();for(var i=nodesToRemove.iterator();i.hasNext();){nodeStack.push(i.next());}
while(!nodeStack.isEmpty()){var node=nodeStack.pop();PolygonizeGraph.deleteAllEdges(node);var nodeOutEdges=node.getOutEdges().getEdges();for(var i=nodeOutEdges.iterator();i.hasNext();){var de=i.next();de.setMarked(true);var sym=de.getSym();if(sym!=null)
sym.setMarked(true);var e=de.getEdge();dangleLines.add(e.getLine());var toNode=de.getToNode();if(PolygonizeGraph.getDegreeNonDeleted(toNode)==1)
nodeStack.push(toNode);}}
return dangleLines;};PolygonizeGraph.prototype.computeDepthParity=function(){while(true){var de=null;if(de==null)
return;this.computeDepthParity(de);}};PolygonizeGraph.prototype.computeDepthParity=function(de){};jsts.operation.polygonize.PolygonizeGraph=PolygonizeGraph;})();jsts.index.strtree.Interval=function(){var other;if(arguments.length===1){other=arguments[0];return jsts.index.strtree.Interval(other.min,other.max);}else if(arguments.length===2){jsts.util.Assert.isTrue(this.min<=this.max);this.min=arguments[0];this.max=arguments[1];}};jsts.index.strtree.Interval.prototype.min=null;jsts.index.strtree.Interval.prototype.max=null;jsts.index.strtree.Interval.prototype.getCentre=function(){return(this.min+this.max)/2;};jsts.index.strtree.Interval.prototype.expandToInclude=function(other){this.max=Math.max(this.max,other.max);this.min=Math.min(this.min,other.min);return this;};jsts.index.strtree.Interval.prototype.intersects=function(other){return!(other.min>this.max||other.max<this.min);};jsts.index.strtree.Interval.prototype.equals=function(o){if(!(o instanceof jsts.index.strtree.Interval)){return false;}
other=o;return this.min===other.min&&this.max===other.max;};jsts.geom.GeometryFactory=function(precisionModel){this.precisionModel=precisionModel||new jsts.geom.PrecisionModel();};jsts.geom.GeometryFactory.prototype.precisionModel=null;jsts.geom.GeometryFactory.prototype.getPrecisionModel=function(){return this.precisionModel;};jsts.geom.GeometryFactory.prototype.createPoint=function(coordinate){var point=new jsts.geom.Point(coordinate,this);return point;};jsts.geom.GeometryFactory.prototype.createLineString=function(coordinates){var lineString=new jsts.geom.LineString(coordinates,this);return lineString;};jsts.geom.GeometryFactory.prototype.createLinearRing=function(coordinates){var linearRing=new jsts.geom.LinearRing(coordinates,this);return linearRing;};jsts.geom.GeometryFactory.prototype.createPolygon=function(shell,holes){var polygon=new jsts.geom.Polygon(shell,holes,this);return polygon;};jsts.geom.GeometryFactory.prototype.createMultiPoint=function(points){if(points&&points[0]instanceof jsts.geom.Coordinate){var converted=[];var i;for(i=0;i<points.length;i++){converted.push(this.createPoint(points[i]));}
points=converted;}
return new jsts.geom.MultiPoint(points,this);};jsts.geom.GeometryFactory.prototype.createMultiLineString=function(lineStrings){return new jsts.geom.MultiLineString(lineStrings,this);};jsts.geom.GeometryFactory.prototype.createMultiPolygon=function(polygons){return new jsts.geom.MultiPolygon(polygons,this);};jsts.geom.GeometryFactory.prototype.buildGeometry=function(geomList){var geomClass=null;var isHeterogeneous=false;var hasGeometryCollection=false;for(var i=geomList.iterator();i.hasNext();){var geom=i.next();var partClass=geom.CLASS_NAME;if(geomClass===null){geomClass=partClass;}
if(!(partClass===geomClass)){isHeterogeneous=true;}
if(geom.isGeometryCollectionBase())
hasGeometryCollection=true;}
if(geomClass===null){return this.createGeometryCollection(null);}
if(isHeterogeneous||hasGeometryCollection){return this.createGeometryCollection(geomList.toArray());}
var geom0=geomList.get(0);var isCollection=geomList.size()>1;if(isCollection){if(geom0 instanceof jsts.geom.Polygon){return this.createMultiPolygon(geomList.toArray());}else if(geom0 instanceof jsts.geom.LineString){return this.createMultiLineString(geomList.toArray());}else if(geom0 instanceof jsts.geom.Point){return this.createMultiPoint(geomList.toArray());}
jsts.util.Assert.shouldNeverReachHere('Unhandled class: '+geom0);}
return geom0;};jsts.geom.GeometryFactory.prototype.createGeometryCollection=function(geometries){return new jsts.geom.GeometryCollection(geometries,this);};jsts.geom.GeometryFactory.prototype.toGeometry=function(envelope){if(envelope.isNull()){return this.createPoint(null);}
if(envelope.getMinX()===envelope.getMaxX()&&envelope.getMinY()===envelope.getMaxY()){return this.createPoint(new jsts.geom.Coordinate(envelope.getMinX(),envelope.getMinY()));}
if(envelope.getMinX()===envelope.getMaxX()||envelope.getMinY()===envelope.getMaxY()){return this.createLineString([new jsts.geom.Coordinate(envelope.getMinX(),envelope.getMinY()),new jsts.geom.Coordinate(envelope.getMaxX(),envelope.getMaxY())]);}
return this.createPolygon(this.createLinearRing([new jsts.geom.Coordinate(envelope.getMinX(),envelope.getMinY()),new jsts.geom.Coordinate(envelope.getMinX(),envelope.getMaxY()),new jsts.geom.Coordinate(envelope.getMaxX(),envelope.getMaxY()),new jsts.geom.Coordinate(envelope.getMaxX(),envelope.getMinY()),new jsts.geom.Coordinate(envelope.getMinX(),envelope.getMinY())]),null);};jsts.geomgraph.NodeFactory=function(){};jsts.geomgraph.NodeFactory.prototype.createNode=function(coord){return new jsts.geomgraph.Node(coord,null);};(function(){jsts.geomgraph.Position=function(){};jsts.geomgraph.Position.ON=0;jsts.geomgraph.Position.LEFT=1;jsts.geomgraph.Position.RIGHT=2;jsts.geomgraph.Position.opposite=function(position){if(position===jsts.geomgraph.Position.LEFT){return jsts.geomgraph.Position.RIGHT;}
if(position===jsts.geomgraph.Position.RIGHT){return jsts.geomgraph.Position.LEFT;}
return position;};})();jsts.geomgraph.TopologyLocation=function(){this.location=[];if(arguments.length===3){var on=arguments[0];var left=arguments[1];var right=arguments[2];this.init(3);this.location[jsts.geomgraph.Position.ON]=on;this.location[jsts.geomgraph.Position.LEFT]=left;this.location[jsts.geomgraph.Position.RIGHT]=right;}else if(arguments[0]instanceof jsts.geomgraph.TopologyLocation){var gl=arguments[0];this.init(gl.location.length);if(gl!=null){for(var i=0;i<this.location.length;i++){this.location[i]=gl.location[i];}}}else if(typeof arguments[0]==='number'){var on=arguments[0];this.init(1);this.location[jsts.geomgraph.Position.ON]=on;}else if(arguments[0]instanceof Array){var location=arguments[0];this.init(location.length);}};jsts.geomgraph.TopologyLocation.prototype.location=null;jsts.geomgraph.TopologyLocation.prototype.init=function(size){this.location[size-1]=null;this.setAllLocations(jsts.geom.Location.NONE);};jsts.geomgraph.TopologyLocation.prototype.get=function(posIndex){if(posIndex<this.location.length)
return this.location[posIndex];return jsts.geom.Location.NONE;};jsts.geomgraph.TopologyLocation.prototype.isNull=function(){for(var i=0;i<this.location.length;i++){if(this.location[i]!==jsts.geom.Location.NONE)
return false;}
return true;};jsts.geomgraph.TopologyLocation.prototype.isAnyNull=function(){for(var i=0;i<this.location.length;i++){if(this.location[i]===jsts.geom.Location.NONE)
return true;}
return false;};jsts.geomgraph.TopologyLocation.prototype.isEqualOnSide=function(le,locIndex){return this.location[locIndex]==le.location[locIndex];};jsts.geomgraph.TopologyLocation.prototype.isArea=function(){return this.location.length>1;};jsts.geomgraph.TopologyLocation.prototype.isLine=function(){return this.location.length===1;};jsts.geomgraph.TopologyLocation.prototype.flip=function(){if(this.location.length<=1)
return;var temp=this.location[jsts.geomgraph.Position.LEFT];this.location[jsts.geomgraph.Position.LEFT]=this.location[jsts.geomgraph.Position.RIGHT];this.location[jsts.geomgraph.Position.RIGHT]=temp;};jsts.geomgraph.TopologyLocation.prototype.setAllLocations=function(locValue){for(var i=0;i<this.location.length;i++){this.location[i]=locValue;}};jsts.geomgraph.TopologyLocation.prototype.setAllLocationsIfNull=function(locValue){for(var i=0;i<this.location.length;i++){if(this.location[i]===jsts.geom.Location.NONE)
this.location[i]=locValue;}};jsts.geomgraph.TopologyLocation.prototype.setLocation=function(locIndex,locValue){if(locValue!==undefined){this.location[locIndex]=locValue;}else{this.setLocation(jsts.geomgraph.Position.ON,locIndex);}};jsts.geomgraph.TopologyLocation.prototype.getLocations=function(){return location;};jsts.geomgraph.TopologyLocation.prototype.setLocations=function(on,left,right){this.location[jsts.geomgraph.Position.ON]=on;this.location[jsts.geomgraph.Position.LEFT]=left;this.location[jsts.geomgraph.Position.RIGHT]=right;};jsts.geomgraph.TopologyLocation.prototype.allPositionsEqual=function(loc){for(var i=0;i<this.location.length;i++){if(this.location[i]!==loc)
return false;}
return true;};jsts.geomgraph.TopologyLocation.prototype.merge=function(gl){if(gl.location.length>this.location.length){var newLoc=[];newLoc[jsts.geomgraph.Position.ON]=this.location[jsts.geomgraph.Position.ON];newLoc[jsts.geomgraph.Position.LEFT]=jsts.geom.Location.NONE;newLoc[jsts.geomgraph.Position.RIGHT]=jsts.geom.Location.NONE;this.location=newLoc;}
for(var i=0;i<this.location.length;i++){if(this.location[i]===jsts.geom.Location.NONE&&i<gl.location.length)
this.location[i]=gl.location[i];}};jsts.geomgraph.Label=function(){this.elt=[];var geomIndex,onLoc,leftLoc,lbl,rightLoc;if(arguments.length===4){geomIndex=arguments[0];onLoc=arguments[1];leftLoc=arguments[2];rightLoc=arguments[3];this.elt[0]=new jsts.geomgraph.TopologyLocation(jsts.geom.Location.NONE,jsts.geom.Location.NONE,jsts.geom.Location.NONE);this.elt[1]=new jsts.geomgraph.TopologyLocation(jsts.geom.Location.NONE,jsts.geom.Location.NONE,jsts.geom.Location.NONE);this.elt[geomIndex].setLocations(onLoc,leftLoc,rightLoc);}else if(arguments.length===3){onLoc=arguments[0];leftLoc=arguments[1];rightLoc=arguments[2];this.elt[0]=new jsts.geomgraph.TopologyLocation(onLoc,leftLoc,rightLoc);this.elt[1]=new jsts.geomgraph.TopologyLocation(onLoc,leftLoc,rightLoc);}else if(arguments.length===2){geomIndex=arguments[0];onLoc=arguments[1];this.elt[0]=new jsts.geomgraph.TopologyLocation(jsts.geom.Location.NONE);this.elt[1]=new jsts.geomgraph.TopologyLocation(jsts.geom.Location.NONE);this.elt[geomIndex].setLocation(onLoc);}else if(arguments[0]instanceof jsts.geomgraph.Label){lbl=arguments[0];this.elt[0]=new jsts.geomgraph.TopologyLocation(lbl.elt[0]);this.elt[1]=new jsts.geomgraph.TopologyLocation(lbl.elt[1]);}else if(typeof arguments[0]==='number'){onLoc=arguments[0];this.elt[0]=new jsts.geomgraph.TopologyLocation(onLoc);this.elt[1]=new jsts.geomgraph.TopologyLocation(onLoc);}};jsts.geomgraph.Label.toLineLabel=function(label){var i,lineLabel=new jsts.geomgraph.Label(jsts.geom.Location.NONE);for(i=0;i<2;i++){lineLabel.setLocation(i,label.getLocation(i));}
return lineLabel;};jsts.geomgraph.Label.prototype.elt=null;jsts.geomgraph.Label.prototype.flip=function(){this.elt[0].flip();this.elt[1].flip();};jsts.geomgraph.Label.prototype.getLocation=function(geomIndex,posIndex){if(arguments.length==1){return this.getLocation2.apply(this,arguments);}
return this.elt[geomIndex].get(posIndex);};jsts.geomgraph.Label.prototype.getLocation2=function(geomIndex){return this.elt[geomIndex].get(jsts.geomgraph.Position.ON);};jsts.geomgraph.Label.prototype.setLocation=function(geomIndex,posIndex,location){if(arguments.length==2){this.setLocation2.apply(this,arguments);return;}
this.elt[geomIndex].setLocation(posIndex,location);};jsts.geomgraph.Label.prototype.setLocation2=function(geomIndex,location){this.elt[geomIndex].setLocation(jsts.geomgraph.Position.ON,location);};jsts.geomgraph.Label.prototype.setAllLocations=function(geomIndex,location){this.elt[geomIndex].setAllLocations(location);};jsts.geomgraph.Label.prototype.setAllLocationsIfNull=function(geomIndex,location){if(arguments.length==1){this.setAllLocationsIfNull2.apply(this,arguments);return;}
this.elt[geomIndex].setAllLocationsIfNull(location);};jsts.geomgraph.Label.prototype.setAllLocationsIfNull2=function(location){this.setAllLocationsIfNull(0,location);this.setAllLocationsIfNull(1,location);};jsts.geomgraph.Label.prototype.merge=function(lbl){var i;for(i=0;i<2;i++){if(this.elt[i]===null&&lbl.elt[i]!==null){this.elt[i]=new jsts.geomgraph.TopologyLocation(lbl.elt[i]);}else{this.elt[i].merge(lbl.elt[i]);}}};jsts.geomgraph.Label.prototype.getGeometryCount=function(){var count=0;if(!this.elt[0].isNull()){count++;}
if(!this.elt[1].isNull()){count++;}
return count;};jsts.geomgraph.Label.prototype.isNull=function(geomIndex){return this.elt[geomIndex].isNull();};jsts.geomgraph.Label.prototype.isAnyNull=function(geomIndex){return this.elt[geomIndex].isAnyNull();};jsts.geomgraph.Label.prototype.isArea=function(){if(arguments.length==1){return this.isArea2(arguments[0]);}
return this.elt[0].isArea()||this.elt[1].isArea();};jsts.geomgraph.Label.prototype.isArea2=function(geomIndex){return this.elt[geomIndex].isArea();};jsts.geomgraph.Label.prototype.isLine=function(geomIndex){return this.elt[geomIndex].isLine();};jsts.geomgraph.Label.prototype.isEqualOnSide=function(lbl,side){return this.elt[0].isEqualOnSide(lbl.elt[0],side)&&this.elt[1].isEqualOnSide(lbl.elt[1],side);};jsts.geomgraph.Label.prototype.allPositionsEqual=function(geomIndex,loc){return this.elt[geomIndex].allPositionsEqual(loc);};jsts.geomgraph.Label.prototype.toLine=function(geomIndex){if(this.elt[geomIndex].isArea()){this.elt[geomIndex]=new jsts.geomgraph.TopologyLocation(this.elt[geomIndex].location[0]);}};jsts.geomgraph.EdgeRing=function(start,geometryFactory){this.edges=[];this.pts=[];this.holes=[];this.label=new jsts.geomgraph.Label(jsts.geom.Location.NONE);this.geometryFactory=geometryFactory;if(start){this.computePoints(start);this.computeRing();}};jsts.geomgraph.EdgeRing.prototype.startDe=null;jsts.geomgraph.EdgeRing.prototype.maxNodeDegree=-1;jsts.geomgraph.EdgeRing.prototype.edges=null;jsts.geomgraph.EdgeRing.prototype.pts=null;jsts.geomgraph.EdgeRing.prototype.label=null;jsts.geomgraph.EdgeRing.prototype.ring=null;jsts.geomgraph.EdgeRing.prototype._isHole=null;jsts.geomgraph.EdgeRing.prototype.shell=null;jsts.geomgraph.EdgeRing.prototype.holes=null;jsts.geomgraph.EdgeRing.prototype.geometryFactory=null;jsts.geomgraph.EdgeRing.prototype.isIsolated=function(){return(this.label.getGeometryCount()==1);};jsts.geomgraph.EdgeRing.prototype.isHole=function(){return this._isHole;};jsts.geomgraph.EdgeRing.prototype.getCoordinate=function(i){return this.pts[i];};jsts.geomgraph.EdgeRing.prototype.getLinearRing=function(){return this.ring;};jsts.geomgraph.EdgeRing.prototype.getLabel=function(){return this.label;};jsts.geomgraph.EdgeRing.prototype.isShell=function(){return this.shell===null;};jsts.geomgraph.EdgeRing.prototype.getShell=function(){return this.shell;};jsts.geomgraph.EdgeRing.prototype.setShell=function(shell){this.shell=shell;if(shell!==null)
shell.addHole(this);};jsts.geomgraph.EdgeRing.prototype.addHole=function(ring){this.holes.push(ring);};jsts.geomgraph.EdgeRing.prototype.toPolygon=function(geometryFactory){var holeLR=[];for(var i=0;i<this.holes.length;i++){holeLR[i]=this.holes[i].getLinearRing();}
var poly=this.geometryFactory.createPolygon(this.getLinearRing(),holeLR);return poly;};jsts.geomgraph.EdgeRing.prototype.computeRing=function(){if(this.ring!==null)
return;var coord=[];for(var i=0;i<this.pts.length;i++){coord[i]=this.pts[i];}
this.ring=this.geometryFactory.createLinearRing(coord);this._isHole=jsts.algorithm.CGAlgorithms.isCCW(this.ring.getCoordinates());};jsts.geomgraph.EdgeRing.prototype.getNext=function(de){throw new jsts.error.AbstractInvocationError();};jsts.geomgraph.EdgeRing.prototype.setEdgeRing=function(de,er){throw new jsts.error.AbstractInvocationError();};jsts.geomgraph.EdgeRing.prototype.getEdges=function(){return this.edges;};jsts.geomgraph.EdgeRing.prototype.computePoints=function(start){this.startDe=start;var de=start;var isFirstEdge=true;do{if(de===null)
throw new jsts.error.TopologyError('Found null DirectedEdge');if(de.getEdgeRing()===this)
throw new jsts.error.TopologyError('Directed Edge visited twice during ring-building at '+
de.getCoordinate());this.edges.push(de);var label=de.getLabel();jsts.util.Assert.isTrue(label.isArea());this.mergeLabel(label);this.addPoints(de.getEdge(),de.isForward(),isFirstEdge);isFirstEdge=false;this.setEdgeRing(de,this);de=this.getNext(de);}while(de!==this.startDe);};jsts.geomgraph.EdgeRing.prototype.getMaxNodeDegree=function(){if(this.maxNodeDegree<0)
this.computeMaxNodeDegree();return this.maxNodeDegree;};jsts.geomgraph.EdgeRing.prototype.computeMaxNodeDegree=function(){this.maxNodeDegree=0;var de=this.startDe;do{var node=de.getNode();var degree=node.getEdges().getOutgoingDegree(this);if(degree>this.maxNodeDegree)
this.maxNodeDegree=degree;de=this.getNext(de);}while(de!==this.startDe);this.maxNodeDegree*=2;};jsts.geomgraph.EdgeRing.prototype.setInResult=function(){var de=this.startDe;do{de.getEdge().setInResult(true);de=de.getNext();}while(de!=this.startDe);};jsts.geomgraph.EdgeRing.prototype.mergeLabel=function(deLabel){this.mergeLabel2(deLabel,0);this.mergeLabel2(deLabel,1);};jsts.geomgraph.EdgeRing.prototype.mergeLabel2=function(deLabel,geomIndex){var loc=deLabel.getLocation(geomIndex,jsts.geomgraph.Position.RIGHT);if(loc==jsts.geom.Location.NONE)
return;if(this.label.getLocation(geomIndex)===jsts.geom.Location.NONE){this.label.setLocation(geomIndex,loc);return;}};jsts.geomgraph.EdgeRing.prototype.addPoints=function(edge,isForward,isFirstEdge){var edgePts=edge.getCoordinates();if(isForward){var startIndex=1;if(isFirstEdge)
startIndex=0;for(var i=startIndex;i<edgePts.length;i++){this.pts.push(edgePts[i]);}}else{var startIndex=edgePts.length-2;if(isFirstEdge)
startIndex=edgePts.length-1;for(var i=startIndex;i>=0;i--){this.pts.push(edgePts[i]);}}};jsts.geomgraph.EdgeRing.prototype.containsPoint=function(p){var shell=this.getLinearRing();var env=shell.getEnvelopeInternal();if(!env.contains(p))
return false;if(!jsts.algorithm.CGAlgorithms.isPointInRing(p,shell.getCoordinates()))
return false;for(var i=0;i<this.holes.length;i++){var hole=this.holes[i];if(hole.containsPoint(p))
return false;}
return true;};(function(){jsts.geom.LinearRing=function(points,factory){jsts.geom.LineString.apply(this,arguments);};jsts.geom.LinearRing.prototype=new jsts.geom.LineString();jsts.geom.LinearRing.constructor=jsts.geom.LinearRing;jsts.geom.LinearRing.prototype.getBoundaryDimension=function(){return jsts.geom.Dimension.FALSE;};jsts.geom.LinearRing.prototype.isSimple=function(){return true;};jsts.geom.LinearRing.prototype.getGeometryType=function(){return'LinearRing';};jsts.geom.LinearRing.MINIMUM_VALID_SIZE=4;jsts.geom.LinearRing.prototype.CLASS_NAME='jsts.geom.LinearRing';})();jsts.index.strtree.Boundable=function(){};jsts.index.strtree.Boundable.prototype.getBounds=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.strtree.AbstractNode=function(level){this.level=level;this.childBoundables=[];};jsts.index.strtree.AbstractNode.prototype=new jsts.index.strtree.Boundable();jsts.index.strtree.AbstractNode.constructor=jsts.index.strtree.AbstractNode;jsts.index.strtree.AbstractNode.prototype.childBoundables=null;jsts.index.strtree.AbstractNode.prototype.bounds=null;jsts.index.strtree.AbstractNode.prototype.level=null;jsts.index.strtree.AbstractNode.prototype.getChildBoundables=function(){return this.childBoundables;};jsts.index.strtree.AbstractNode.prototype.computeBounds=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.strtree.AbstractNode.prototype.getBounds=function(){if(this.bounds===null){this.bounds=this.computeBounds();}
return this.bounds;};jsts.index.strtree.AbstractNode.prototype.getLevel=function(){return this.level;};jsts.index.strtree.AbstractNode.prototype.addChildBoundable=function(childBoundable){this.childBoundables.push(childBoundable);};(function(){jsts.noding.Noder=function(){};jsts.noding.Noder.prototype.computeNodes=jsts.abstractFunc;jsts.noding.Noder.prototype.getNodedSubstrings=jsts.abstractFunc;})();(function(){var Noder=jsts.noding.Noder;jsts.noding.SinglePassNoder=function(){};jsts.noding.SinglePassNoder.prototype=new Noder();jsts.noding.SinglePassNoder.constructor=jsts.noding.SinglePassNoder;jsts.noding.SinglePassNoder.prototype.segInt=null;jsts.noding.SinglePassNoder.prototype.setSegmentIntersector=function(segInt){this.segInt=segInt;};})();jsts.index.SpatialIndex=function(){};jsts.index.SpatialIndex.prototype.insert=function(itemEnv,item){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.SpatialIndex.prototype.query=function(searchEnv,visitor){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.SpatialIndex.prototype.remove=function(itemEnv,item){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.strtree.AbstractSTRtree=function(nodeCapacity){if(nodeCapacity===undefined)
return;this.itemBoundables=[];jsts.util.Assert.isTrue(nodeCapacity>1,'Node capacity must be greater than 1');this.nodeCapacity=nodeCapacity;};jsts.index.strtree.AbstractSTRtree.IntersectsOp=function(){};jsts.index.strtree.AbstractSTRtree.IntersectsOp.prototype.intersects=function(aBounds,bBounds){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.strtree.AbstractSTRtree.prototype.root=null;jsts.index.strtree.AbstractSTRtree.prototype.built=false;jsts.index.strtree.AbstractSTRtree.prototype.itemBoundables=null;jsts.index.strtree.AbstractSTRtree.prototype.nodeCapacity=null;jsts.index.strtree.AbstractSTRtree.prototype.build=function(){jsts.util.Assert.isTrue(!this.built);this.root=this.itemBoundables.length===0?this.createNode(0):this.createHigherLevels(this.itemBoundables,-1);this.built=true;};jsts.index.strtree.AbstractSTRtree.prototype.createNode=function(level){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.strtree.AbstractSTRtree.prototype.createParentBoundables=function(childBoundables,newLevel){jsts.util.Assert.isTrue(!(childBoundables.length===0));var parentBoundables=[];parentBoundables.push(this.createNode(newLevel));var sortedChildBoundables=[];for(var i=0;i<childBoundables.length;i++){sortedChildBoundables.push(childBoundables[i]);}
sortedChildBoundables.sort(this.getComparator());for(var i=0;i<sortedChildBoundables.length;i++){var childBoundable=sortedChildBoundables[i];if(this.lastNode(parentBoundables).getChildBoundables().length===this.getNodeCapacity()){parentBoundables.push(this.createNode(newLevel));}
this.lastNode(parentBoundables).addChildBoundable(childBoundable);}
return parentBoundables;};jsts.index.strtree.AbstractSTRtree.prototype.lastNode=function(nodes){return nodes[nodes.length-1];};jsts.index.strtree.AbstractSTRtree.prototype.compareDoubles=function(a,b){return a>b?1:a<b?-1:0;};jsts.index.strtree.AbstractSTRtree.prototype.createHigherLevels=function(boundablesOfALevel,level){jsts.util.Assert.isTrue(!(boundablesOfALevel.length===0));var parentBoundables=this.createParentBoundables(boundablesOfALevel,level+1);if(parentBoundables.length===1){return parentBoundables[0];}
return this.createHigherLevels(parentBoundables,level+1);};jsts.index.strtree.AbstractSTRtree.prototype.getRoot=function(){if(!this.built)
this.build();return this.root;};jsts.index.strtree.AbstractSTRtree.prototype.getNodeCapacity=function(){return this.nodeCapacity;};jsts.index.strtree.AbstractSTRtree.prototype.size=function(){if(arguments.length===1){return this.size2(arguments[0]);}
if(!this.built){this.build();}
if(this.itemBoundables.length===0){return 0;}
return this.size2(root);};jsts.index.strtree.AbstractSTRtree.prototype.size2=function(node){var size=0;var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(childBoundable instanceof jsts.index.strtree.AbstractNode){size+=this.size(childBoundable);}else if(childBoundable instanceof jsts.index.strtree.ItemBoundable){size+=1;}}
return size;};jsts.index.strtree.AbstractSTRtree.prototype.depth=function(){if(arguments.length===1){return this.depth2(arguments[0]);}
if(!this.built){this.build();}
if(this.itemBoundables.length===0){return 0;}
return this.depth2(root);};jsts.index.strtree.AbstractSTRtree.prototype.depth2=function(){var maxChildDepth=0;var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(childBoundable instanceof jsts.index.strtree.AbstractNode){var childDepth=this.depth(childBoundable);if(childDepth>maxChildDepth)
maxChildDepth=childDepth;}}
return maxChildDepth+1;};jsts.index.strtree.AbstractSTRtree.prototype.insert=function(bounds,item){jsts.util.Assert.isTrue(!this.built,'Cannot insert items into an STR packed R-tree after it has been built.');this.itemBoundables.push(new jsts.index.strtree.ItemBoundable(bounds,item));};jsts.index.strtree.AbstractSTRtree.prototype.query=function(searchBounds){if(arguments.length>1){this.query2.apply(this,arguments);}
if(!this.built){this.build();}
var matches=[];if(this.itemBoundables.length===0){jsts.util.Assert.isTrue(this.root.getBounds()===null);return matches;}
if(this.getIntersectsOp().intersects(this.root.getBounds(),searchBounds)){this.query3(searchBounds,this.root,matches);}
return matches;};jsts.index.strtree.AbstractSTRtree.prototype.query2=function(searchBounds,visitor){if(arguments.length>2){this.query3.apply(this,arguments);}
if(!this.built){this.build();}
if(this.itemBoundables.length===0){jsts.util.Assert.isTrue(this.root.getBounds()===null);}
if(this.getIntersectsOp().intersects(this.root.getBounds(),searchBounds)){this.query4(searchBounds,this.root,visitor);}};jsts.index.strtree.AbstractSTRtree.prototype.query3=function(searchBounds,node,matches){if(!(arguments[2]instanceof Array)){this.query4.apply(this,arguments);}
var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(!this.getIntersectsOp().intersects(childBoundable.getBounds(),searchBounds)){continue;}
if(childBoundable instanceof jsts.index.strtree.AbstractNode){this.query3(searchBounds,childBoundable,matches);}else if(childBoundable instanceof jsts.index.strtree.ItemBoundable){matches.push(childBoundable.getItem());}else{jsts.util.Assert.shouldNeverReachHere();}}};jsts.index.strtree.AbstractSTRtree.prototype.query4=function(searchBounds,node,visitor){var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(!this.getIntersectsOp().intersects(childBoundable.getBounds(),searchBounds)){continue;}
if(childBoundable instanceof jsts.index.strtree.AbstractNode){this.query4(searchBounds,childBoundable,visitor);}else if(childBoundable instanceof jsts.index.strtree.ItemBoundable){visitor.visitItem(childBoundable.getItem());}else{jsts.util.Assert.shouldNeverReachHere();}}};jsts.index.strtree.AbstractSTRtree.prototype.getIntersectsOp=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.strtree.AbstractSTRtree.prototype.itemsTree=function(){if(arguments.length===1){return this.itemsTree2.apply(this,arguments);}
if(!this.built){this.build();}
var valuesTree=this.itemsTree2(this.root);if(valuesTree===null)
return[];return valuesTree;};jsts.index.strtree.AbstractSTRtree.prototype.itemsTree2=function(node){var valuesTreeForNode=[];var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(childBoundable instanceof jsts.index.strtree.AbstractNode){var valuesTreeForChild=this.itemsTree(childBoundable);if(valuesTreeForChild!=null)
valuesTreeForNode.push(valuesTreeForChild);}else if(childBoundable instanceof jsts.index.strtree.ItemBoundable){valuesTreeForNode.push(childBoundable.getItem());}else{jsts.util.Assert.shouldNeverReachHere();}}
if(valuesTreeForNode.length<=0)
return null;return valuesTreeForNode;};jsts.index.strtree.AbstractSTRtree.prototype.remove=function(searchBounds,item){if(!this.built){this.build();}
if(this.itemBoundables.length===0){jsts.util.Assert.isTrue(this.root.getBounds()==null);}
if(this.getIntersectsOp().intersects(this.root.getBounds(),searchBounds)){return this.remove2(searchBounds,this.root,item);}
return false;};jsts.index.strtree.AbstractSTRtree.prototype.remove2=function(searchBounds,node,item){var found=this.removeItem(node,item);if(found)
return true;var childToPrune=null;var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(!this.getIntersectsOp().intersects(childBoundable.getBounds(),searchBounds)){continue;}
if(childBoundable instanceof jsts.index.strtree.AbstractNode){found=this.remove(searchBounds,childBoundable,item);if(found){childToPrune=childBoundable;break;}}}
if(childToPrune!=null){if(childToPrune.getChildBoundables().length===0){childBoundables.splice(childBoundables.indexOf(childToPrune),1);}}
return found;};jsts.index.strtree.AbstractSTRtree.prototype.removeItem=function(node,item){var childToRemove=null;var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(childBoundable instanceof jsts.index.strtree.ItemBoundable){if(childBoundable.getItem()===item)
childToRemove=childBoundable;}}
if(childToRemove!==null){childBoundables.splice(childBoundables.indexOf(childToRemove),1);return true;}
return false;};jsts.index.strtree.AbstractSTRtree.prototype.boundablesAtLevel=function(level){if(arguments.length>1){this.boundablesAtLevel2.apply(this,arguments);return;}
var boundables=[];this.boundablesAtLevel2(level,this.root,boundables);return boundables;};jsts.index.strtree.AbstractSTRtree.prototype.boundablesAtLevel2=function(level,top,boundables){jsts.util.Assert.isTrue(level>-2);if(top.getLevel()===level){boundables.add(top);return;}
var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var boundable=childBoundables[i];if(boundable instanceof jsts.index.strtree.AbstractNode){this.boundablesAtLevel(level,boundable,boundables);}else{jsts.util.Assert.isTrue(boundable instanceof jsts.index.strtree.ItemBoundable);if(level===-1){boundables.add(boundable);}}}
return;};jsts.index.strtree.AbstractSTRtree.prototype.getComparator=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.strtree.STRtree=function(nodeCapacity){nodeCapacity=nodeCapacity||jsts.index.strtree.STRtree.DEFAULT_NODE_CAPACITY;jsts.index.strtree.AbstractSTRtree.call(this,nodeCapacity);};jsts.index.strtree.STRtree.prototype=new jsts.index.strtree.AbstractSTRtree();jsts.index.strtree.STRtree.constructor=jsts.index.strtree.STRtree;jsts.index.strtree.STRtree.prototype.xComparator=function(o1,o2){return jsts.index.strtree.AbstractSTRtree.prototype.compareDoubles(jsts.index.strtree.STRtree.prototype.centreX(o1.getBounds()),jsts.index.strtree.STRtree.prototype.centreX(o2.getBounds()));};jsts.index.strtree.STRtree.prototype.yComparator=function(o1,o2){return jsts.index.strtree.AbstractSTRtree.prototype.compareDoubles(jsts.index.strtree.STRtree.prototype.centreY(o1.getBounds()),jsts.index.strtree.STRtree.prototype.centreY(o2.getBounds()));};jsts.index.strtree.STRtree.prototype.centreX=function(e){return jsts.index.strtree.STRtree.prototype.avg(e.getMinX(),e.getMaxX());};jsts.index.strtree.STRtree.prototype.centreY=function(e){return jsts.index.strtree.STRtree.prototype.avg(e.getMinY(),e.getMaxY());};jsts.index.strtree.STRtree.prototype.avg=function(a,b){return(a+b)/2.0;};jsts.index.strtree.STRtree.prototype.intersectsOp={intersects:function(aBounds,bBounds){return aBounds.intersects(bBounds);}};jsts.index.strtree.STRtree.prototype.createParentBoundables=function(childBoundables,newLevel){jsts.util.Assert.isTrue(!(childBoundables.length===0));var minLeafCount=Math.ceil(childBoundables.length/this.getNodeCapacity());var sortedChildBoundables=[];for(var i=0;i<childBoundables.length;i++){sortedChildBoundables.push(childBoundables[i]);}
sortedChildBoundables.sort(this.xComparator);var verticalSlices=this.verticalSlices(sortedChildBoundables,Math.ceil(Math.sqrt(minLeafCount)));return this.createParentBoundablesFromVerticalSlices(verticalSlices,newLevel);};jsts.index.strtree.STRtree.prototype.createParentBoundablesFromVerticalSlices=function(verticalSlices,newLevel){jsts.util.Assert.isTrue(verticalSlices.length>0);var parentBoundables=[];for(var i=0;i<verticalSlices.length;i++){parentBoundables=parentBoundables.concat(this.createParentBoundablesFromVerticalSlice(verticalSlices[i],newLevel));}
return parentBoundables;};jsts.index.strtree.STRtree.prototype.createParentBoundablesFromVerticalSlice=function(childBoundables,newLevel){return jsts.index.strtree.AbstractSTRtree.prototype.createParentBoundables.call(this,childBoundables,newLevel);};jsts.index.strtree.STRtree.prototype.verticalSlices=function(childBoundables,sliceCount){var sliceCapacity=Math.ceil(childBoundables.length/sliceCount);var slices=[];var i=0,boundablesAddedToSlice,childBoundable;for(var j=0;j<sliceCount;j++){slices[j]=[];boundablesAddedToSlice=0;while(i<childBoundables.length&&boundablesAddedToSlice<sliceCapacity){childBoundable=childBoundables[i++];slices[j].push(childBoundable);boundablesAddedToSlice++;}}
return slices;};jsts.index.strtree.STRtree.DEFAULT_NODE_CAPACITY=10;jsts.index.strtree.STRtree.prototype.createNode=function(level){var abstractNode=new jsts.index.strtree.AbstractNode(level);abstractNode.computeBounds=function(){var bounds=null;var childBoundables=this.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(bounds===null){bounds=new jsts.geom.Envelope(childBoundable.getBounds());}else{bounds.expandToInclude(childBoundable.getBounds());}}
return bounds;};return abstractNode;};jsts.index.strtree.STRtree.prototype.getIntersectsOp=function(){return this.intersectsOp;};jsts.index.strtree.STRtree.prototype.insert=function(itemEnv,item){if(itemEnv.isNull()){return;}
jsts.index.strtree.AbstractSTRtree.prototype.insert.call(this,itemEnv,item);};jsts.index.strtree.STRtree.prototype.query=function(searchEnv,visitor){return jsts.index.strtree.AbstractSTRtree.prototype.query.apply(this,arguments);};jsts.index.strtree.STRtree.prototype.remove=function(itemEnv,item){return jsts.index.strtree.AbstractSTRtree.prototype.remove.call(this,itemEnv,item);};jsts.index.strtree.STRtree.prototype.size=function(){return jsts.index.strtree.AbstractSTRtree.prototype.size.call(this);};jsts.index.strtree.STRtree.prototype.depth=function(){return jsts.index.strtree.AbstractSTRtree.prototype.depth.call(this);};jsts.index.strtree.STRtree.prototype.getComparator=function(){return this.yComparator;};jsts.index.strtree.STRtree.prototype.nearestNeighbour=function(itemDist){var bp=new jsts.index.strtree.BoundablePair(this.getRoot(),this.getRoot(),itemDist);return this.nearestNeighbour4(bp);};jsts.index.strtree.STRtree.prototype.nearestNeighbour2=function(env,item,itemDist){var bnd=new jsts.index.strtree.ItemBoundable(env,item);var bp=new jsts.index.strtree.BoundablePair(this.getRoot(),bnd,itemDist);return this.nearestNeighbour4(bp)[0];};jsts.index.strtree.STRtree.prototype.nearestNeighbour3=function(tree,itemDist){var bp=new jsts.index.strtree.BoundablePair(this.getRoot(),tree.getRoot(),itemDist);return this.nearestNeighbour4(bp);};jsts.index.strtree.STRtree.prototype.nearestNeighbour4=function(initBndPair){return this.nearestNeighbour5(initBndPair,Double.POSITIVE_INFINITY);};jsts.index.strtree.STRtree.prototype.nearestNeighbour5=function(initBndPair,maxDistance){var distanceLowerBound=maxDistance;var minPair=null;var priQ=[];priQ.push(initBndPair);while(!priQ.isEmpty()&&distanceLowerBound>0.0){var bndPair=priQ.pop();var currentDistance=bndPair.getDistance();if(currentDistance>=distanceLowerBound)
break;if(bndPair.isLeaves()){distanceLowerBound=currentDistance;minPair=bndPair;}else{bndPair.expandToQueue(priQ,distanceLowerBound);}}
return[minPair.getBoundable(0).getItem(),minPair.getBoundable(1).getItem()];};jsts.noding.SegmentString=function(){};jsts.noding.SegmentString.prototype.getData=jsts.abstractFunc;jsts.noding.SegmentString.prototype.setData=jsts.abstractFunc;jsts.noding.SegmentString.prototype.size=jsts.abstractFunc;jsts.noding.SegmentString.prototype.getCoordinate=jsts.abstractFunc;jsts.noding.SegmentString.prototype.getCoordinates=jsts.abstractFunc;jsts.noding.SegmentString.prototype.isClosed=jsts.abstractFunc;jsts.noding.NodableSegmentString=function(){};jsts.noding.NodableSegmentString.prototype=new jsts.noding.SegmentString();jsts.noding.NodableSegmentString.prototype.addIntersection=jsts.abstractFunc;jsts.noding.NodedSegmentString=function(pts,data){this.nodeList=new jsts.noding.SegmentNodeList(this);this.pts=pts;this.data=data;};jsts.noding.NodedSegmentString.prototype=new jsts.noding.NodableSegmentString();jsts.noding.NodedSegmentString.constructor=jsts.noding.NodedSegmentString;jsts.noding.NodedSegmentString.getNodedSubstrings=function(segStrings){if(arguments.length===2){jsts.noding.NodedSegmentString.getNodedSubstrings2.apply(this,arguments);return;}
var resultEdgelist=new javascript.util.ArrayList();jsts.noding.NodedSegmentString.getNodedSubstrings2(segStrings,resultEdgelist);return resultEdgelist;};jsts.noding.NodedSegmentString.getNodedSubstrings2=function(segStrings,resultEdgelist){for(var i=segStrings.iterator();i.hasNext();){var ss=i.next();ss.getNodeList().addSplitEdges(resultEdgelist);}};jsts.noding.NodedSegmentString.prototype.nodeList=null;jsts.noding.NodedSegmentString.prototype.pts=null;jsts.noding.NodedSegmentString.prototype.data=null;jsts.noding.NodedSegmentString.prototype.getData=function(){return this.data;};jsts.noding.NodedSegmentString.prototype.setData=function(data){this.data=data;};jsts.noding.NodedSegmentString.prototype.getNodeList=function(){return this.nodeList;};jsts.noding.NodedSegmentString.prototype.size=function(){return this.pts.length;};jsts.noding.NodedSegmentString.prototype.getCoordinate=function(i){return this.pts[i];};jsts.noding.NodedSegmentString.prototype.getCoordinates=function(){return this.pts;};jsts.noding.NodedSegmentString.prototype.isClosed=function(){return this.pts[0].equals(this.pts[this.pts.length-1]);};jsts.noding.NodedSegmentString.prototype.getSegmentOctant=function(index){if(index===this.pts.length-1)
return-1;return this.safeOctant(this.getCoordinate(index),this.getCoordinate(index+1));};jsts.noding.NodedSegmentString.prototype.safeOctant=function(p0,p1){if(p0.equals2D(p1))
return 0;return jsts.noding.Octant.octant(p0,p1);};jsts.noding.NodedSegmentString.prototype.addIntersections=function(li,segmentIndex,geomIndex){for(var i=0;i<li.getIntersectionNum();i++){this.addIntersection(li,segmentIndex,geomIndex,i);}};jsts.noding.NodedSegmentString.prototype.addIntersection=function(li,segmentIndex,geomIndex,intIndex){if(li instanceof jsts.geom.Coordinate){this.addIntersection2.apply(this,arguments);return;}
var intPt=new jsts.geom.Coordinate(li.getIntersection(intIndex));this.addIntersection2(intPt,segmentIndex);};jsts.noding.NodedSegmentString.prototype.addIntersection2=function(intPt,segmentIndex){this.addIntersectionNode(intPt,segmentIndex);};jsts.noding.NodedSegmentString.prototype.addIntersectionNode=function(intPt,segmentIndex){var normalizedSegmentIndex=segmentIndex;var nextSegIndex=normalizedSegmentIndex+1;if(nextSegIndex<this.pts.length){var nextPt=this.pts[nextSegIndex];if(intPt.equals2D(nextPt)){normalizedSegmentIndex=nextSegIndex;}}
var ei=this.nodeList.add(intPt,normalizedSegmentIndex);return ei;};jsts.noding.NodedSegmentString.prototype.toString=function(){var geometryFactory=new jsts.geom.GeometryFactory();return new jsts.io.WKTWriter().write(geometryFactory.createLineString(this.pts));};jsts.index.chain.MonotoneChainBuilder=function(){};jsts.index.chain.MonotoneChainBuilder.toIntArray=function(list){var array=[];for(var i=0;i<list.length;i++){array[i]=list[i];}
return array;};jsts.index.chain.MonotoneChainBuilder.getChains=function(pts){if(arguments.length===2){return jsts.index.chain.MonotoneChainBuilder.getChains2.apply(this,arguments);}
return jsts.index.chain.MonotoneChainBuilder.getChains2(pts,null);};jsts.index.chain.MonotoneChainBuilder.getChains2=function(pts,context){var mcList=[];var startIndex=jsts.index.chain.MonotoneChainBuilder.getChainStartIndices(pts);for(var i=0;i<startIndex.length-1;i++){var mc=new jsts.index.chain.MonotoneChain(pts,startIndex[i],startIndex[i+1],context);mcList.push(mc);}
return mcList;};jsts.index.chain.MonotoneChainBuilder.getChainStartIndices=function(pts){var start=0;var startIndexList=[];startIndexList.push(start);do{var last=jsts.index.chain.MonotoneChainBuilder.findChainEnd(pts,start);startIndexList.push(last);start=last;}while(start<pts.length-1);var startIndex=jsts.index.chain.MonotoneChainBuilder.toIntArray(startIndexList);return startIndex;};jsts.index.chain.MonotoneChainBuilder.findChainEnd=function(pts,start){var safeStart=start;while(safeStart<pts.length-1&&pts[safeStart].equals2D(pts[safeStart+1])){safeStart++;}
if(safeStart>=pts.length-1){return pts.length-1;}
var chainQuad=jsts.geomgraph.Quadrant.quadrant(pts[safeStart],pts[safeStart+1]);var last=start+1;while(last<pts.length){if(!pts[last-1].equals2D(pts[last])){var quad=jsts.geomgraph.Quadrant.quadrant(pts[last-1],pts[last]);if(quad!==chainQuad)
break;}
last++;}
return last-1;};jsts.algorithm.LineIntersector=function(){this.inputLines=[[],[]];this.intPt=[null,null];this.pa=this.intPt[0];this.pb=this.intPt[1];this.result=jsts.algorithm.LineIntersector.NO_INTERSECTION;};jsts.algorithm.LineIntersector.NO_INTERSECTION=0;jsts.algorithm.LineIntersector.POINT_INTERSECTION=1;jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION=2;jsts.algorithm.LineIntersector.prototype.setPrecisionModel=function(precisionModel){this.precisionModel=precisionModel;};jsts.algorithm.LineIntersector.prototype.getEndpoint=function(segmentIndex,ptIndex){return this.inputLines[segmentIndex][ptIndex];};jsts.algorithm.LineIntersector.computeEdgeDistance=function(p,p0,p1){var dx=Math.abs(p1.x-p0.x);var dy=Math.abs(p1.y-p0.y);var dist=-1.0;if(p.equals(p0)){dist=0.0;}else if(p.equals(p1)){if(dx>dy){dist=dx;}else{dist=dy;}}else{var pdx=Math.abs(p.x-p0.x);var pdy=Math.abs(p.y-p0.y);if(dx>dy){dist=pdx;}else{dist=pdy;}
if(dist===0.0&&!p.equals(p0)){dist=Math.max(pdx,pdy);}}
if(dist===0.0&&!p.equals(p0)){throw new jsts.error.IllegalArgumentError('Bad distance calculation');}
return dist;};jsts.algorithm.LineIntersector.nonRobustComputeEdgeDistance=function(p,p1,p2){var dx=p.x-p1.x;var dy=p.y-p1.y;var dist=Math.sqrt(dx*dx+dy*dy);if(!(dist===0.0&&!p.equals(p1))){throw new jsts.error.IllegalArgumentError('Invalid distance calculation');}
return dist;};jsts.algorithm.LineIntersector.prototype.result=null;jsts.algorithm.LineIntersector.prototype.inputLines=null;jsts.algorithm.LineIntersector.prototype.intPt=null;jsts.algorithm.LineIntersector.prototype.intLineIndex=null;jsts.algorithm.LineIntersector.prototype._isProper=null;jsts.algorithm.LineIntersector.prototype.pa=null;jsts.algorithm.LineIntersector.prototype.pb=null;jsts.algorithm.LineIntersector.prototype.precisionModel=null;jsts.algorithm.LineIntersector.prototype.computeIntersection=function(p,p1,p2){throw new jsts.error.AbstractMethodInvocationError();};jsts.algorithm.LineIntersector.prototype.isCollinear=function(){return this.result===jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION;};jsts.algorithm.LineIntersector.prototype.computeIntersection=function(p1,p2,p3,p4){this.inputLines[0][0]=p1;this.inputLines[0][1]=p2;this.inputLines[1][0]=p3;this.inputLines[1][1]=p4;this.result=this.computeIntersect(p1,p2,p3,p4);};jsts.algorithm.LineIntersector.prototype.computeIntersect=function(p1,p2,q1,q2){throw new jsts.error.AbstractMethodInvocationError();};jsts.algorithm.LineIntersector.prototype.isEndPoint=function(){return this.hasIntersection()&&!this._isProper;};jsts.algorithm.LineIntersector.prototype.hasIntersection=function(){return this.result!==jsts.algorithm.LineIntersector.NO_INTERSECTION;};jsts.algorithm.LineIntersector.prototype.getIntersectionNum=function(){return this.result;};jsts.algorithm.LineIntersector.prototype.getIntersection=function(intIndex){return this.intPt[intIndex];};jsts.algorithm.LineIntersector.prototype.computeIntLineIndex=function(){if(this.intLineIndex===null){this.intLineIndex=[[],[]];this.computeIntLineIndex(0);this.computeIntLineIndex(1);}};jsts.algorithm.LineIntersector.prototype.isIntersection=function(pt){var i;for(i=0;i<this.result;i++){if(this.intPt[i].equals2D(pt)){return true;}}
return false;};jsts.algorithm.LineIntersector.prototype.isInteriorIntersection=function(){if(arguments.length===1){return this.isInteriorIntersection2.apply(this,arguments);}
if(this.isInteriorIntersection(0)){return true;}
if(this.isInteriorIntersection(1)){return true;}
return false;};jsts.algorithm.LineIntersector.prototype.isInteriorIntersection2=function(inputLineIndex){var i;for(i=0;i<this.result;i++){if(!(this.intPt[i].equals2D(this.inputLines[inputLineIndex][0])||this.intPt[i].equals2D(this.inputLines[inputLineIndex][1]))){return true;}}
return false;};jsts.algorithm.LineIntersector.prototype.isProper=function(){return this.hasIntersection()&&this._isProper;};jsts.algorithm.LineIntersector.prototype.getIntersectionAlongSegment=function(segmentIndex,intIndex){this.computeIntLineIndex();return this.intPt[intLineIndex[segmentIndex][intIndex]];};jsts.algorithm.LineIntersector.prototype.getIndexAlongSegment=function(segmentIndex,intIndex){this.computeIntLineIndex();return this.intLineIndex[segmentIndex][intIndex];};jsts.algorithm.LineIntersector.prototype.computeIntLineIndex=function(segmentIndex){var dist0=this.getEdgeDistance(segmentIndex,0);var dist1=this.getEdgeDistance(segmentIndex,1);if(dist0>dist1){this.intLineIndex[segmentIndex][0]=0;this.intLineIndex[segmentIndex][1]=1;}else{this.intLineIndex[segmentIndex][0]=1;this.intLineIndex[segmentIndex][1]=0;}};jsts.algorithm.LineIntersector.prototype.getEdgeDistance=function(segmentIndex,intIndex){var dist=jsts.algorithm.LineIntersector.computeEdgeDistance(this.intPt[intIndex],this.inputLines[segmentIndex][0],this.inputLines[segmentIndex][1]);return dist;};jsts.algorithm.RobustLineIntersector=function(){jsts.algorithm.RobustLineIntersector.prototype.constructor.call(this);};jsts.algorithm.RobustLineIntersector.prototype=new jsts.algorithm.LineIntersector();jsts.algorithm.RobustLineIntersector.prototype.computeIntersection=function(p,p1,p2){if(arguments.length===4){jsts.algorithm.LineIntersector.prototype.computeIntersection.apply(this,arguments);return;}
this._isProper=false;if(jsts.geom.Envelope.intersects(p1,p2,p)){if((jsts.algorithm.CGAlgorithms.orientationIndex(p1,p2,p)===0)&&(jsts.algorithm.CGAlgorithms.orientationIndex(p2,p1,p)===0)){this._isProper=true;if(p.equals(p1)||p.equals(p2)){this._isProper=false;}
this.result=jsts.algorithm.LineIntersector.POINT_INTERSECTION;return;}}
this.result=jsts.algorithm.LineIntersector.NO_INTERSECTION;};jsts.algorithm.RobustLineIntersector.prototype.computeIntersect=function(p1,p2,q1,q2){this._isProper=false;if(!jsts.geom.Envelope.intersects(p1,p2,q1,q2)){return jsts.algorithm.LineIntersector.NO_INTERSECTION;}
var Pq1=jsts.algorithm.CGAlgorithms.orientationIndex(p1,p2,q1);var Pq2=jsts.algorithm.CGAlgorithms.orientationIndex(p1,p2,q2);if((Pq1>0&&Pq2>0)||(Pq1<0&&Pq2<0)){return jsts.algorithm.LineIntersector.NO_INTERSECTION;}
var Qp1=jsts.algorithm.CGAlgorithms.orientationIndex(q1,q2,p1);var Qp2=jsts.algorithm.CGAlgorithms.orientationIndex(q1,q2,p2);if((Qp1>0&&Qp2>0)||(Qp1<0&&Qp2<0)){return jsts.algorithm.LineIntersector.NO_INTERSECTION;}
var collinear=Pq1===0&&Pq2===0&&Qp1===0&&Qp2===0;if(collinear){return this.computeCollinearIntersection(p1,p2,q1,q2);}
if(Pq1===0||Pq2===0||Qp1===0||Qp2===0){this._isProper=false;if(p1.equals2D(q1)||p1.equals2D(q2)){this.intPt[0]=p1;}else if(p2.equals2D(q1)||p2.equals2D(q2)){this.intPt[0]=p2;}
else if(Pq1===0){this.intPt[0]=new jsts.geom.Coordinate(q1);}else if(Pq2===0){this.intPt[0]=new jsts.geom.Coordinate(q2);}else if(Qp1===0){this.intPt[0]=new jsts.geom.Coordinate(p1);}else if(Qp2===0){this.intPt[0]=new jsts.geom.Coordinate(p2);}}else{this._isProper=true;this.intPt[0]=this.intersection(p1,p2,q1,q2);}
return jsts.algorithm.LineIntersector.POINT_INTERSECTION;};jsts.algorithm.RobustLineIntersector.prototype.computeCollinearIntersection=function(p1,p2,q1,q2){var p1q1p2=jsts.geom.Envelope.intersects(p1,p2,q1);var p1q2p2=jsts.geom.Envelope.intersects(p1,p2,q2);var q1p1q2=jsts.geom.Envelope.intersects(q1,q2,p1);var q1p2q2=jsts.geom.Envelope.intersects(q1,q2,p2);if(p1q1p2&&p1q2p2){this.intPt[0]=q1;this.intPt[1]=q2;return jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION;}
if(q1p1q2&&q1p2q2){this.intPt[0]=p1;this.intPt[1]=p2;return jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION;}
if(p1q1p2&&q1p1q2){this.intPt[0]=q1;this.intPt[1]=p1;return q1.equals(p1)&&!p1q2p2&&!q1p2q2?jsts.algorithm.LineIntersector.POINT_INTERSECTION:jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION;}
if(p1q1p2&&q1p2q2){this.intPt[0]=q1;this.intPt[1]=p2;return q1.equals(p2)&&!p1q2p2&&!q1p1q2?jsts.algorithm.LineIntersector.POINT_INTERSECTION:jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION;}
if(p1q2p2&&q1p1q2){this.intPt[0]=q2;this.intPt[1]=p1;return q2.equals(p1)&&!p1q1p2&&!q1p2q2?jsts.algorithm.LineIntersector.POINT_INTERSECTION:jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION;}
if(p1q2p2&&q1p2q2){this.intPt[0]=q2;this.intPt[1]=p2;return q2.equals(p2)&&!p1q1p2&&!q1p1q2?jsts.algorithm.LineIntersector.POINT_INTERSECTION:jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION;}
return jsts.algorithm.LineIntersector.NO_INTERSECTION;};jsts.algorithm.RobustLineIntersector.prototype.intersection=function(p1,p2,q1,q2){var intPt=this.intersectionWithNormalization(p1,p2,q1,q2);if(!this.isInSegmentEnvelopes(intPt)){intPt=jsts.algorithm.CentralEndpointIntersector.getIntersection(p1,p2,q1,q2);}
if(this.precisionModel!==null){this.precisionModel.makePrecise(intPt);}
return intPt;};jsts.algorithm.RobustLineIntersector.prototype.intersectionWithNormalization=function(p1,p2,q1,q2){var n1=new jsts.geom.Coordinate(p1);var n2=new jsts.geom.Coordinate(p2);var n3=new jsts.geom.Coordinate(q1);var n4=new jsts.geom.Coordinate(q2);var normPt=new jsts.geom.Coordinate();this.normalizeToEnvCentre(n1,n2,n3,n4,normPt);var intPt=this.safeHCoordinateIntersection(n1,n2,n3,n4);intPt.x+=normPt.x;intPt.y+=normPt.y;return intPt;};jsts.algorithm.RobustLineIntersector.prototype.safeHCoordinateIntersection=function(p1,p2,q1,q2){var intPt=null;try{intPt=jsts.algorithm.HCoordinate.intersection(p1,p2,q1,q2);}catch(e){if(e instanceof jsts.error.NotRepresentableError){intPt=jsts.algorithm.CentralEndpointIntersector.getIntersection(p1,p2,q1,q2);}else{throw e;}}
return intPt;};jsts.algorithm.RobustLineIntersector.prototype.normalizeToMinimum=function(n1,n2,n3,n4,normPt){normPt.x=this.smallestInAbsValue(n1.x,n2.x,n3.x,n4.x);normPt.y=this.smallestInAbsValue(n1.y,n2.y,n3.y,n4.y);n1.x-=normPt.x;n1.y-=normPt.y;n2.x-=normPt.x;n2.y-=normPt.y;n3.x-=normPt.x;n3.y-=normPt.y;n4.x-=normPt.x;n4.y-=normPt.y;};jsts.algorithm.RobustLineIntersector.prototype.normalizeToEnvCentre=function(n00,n01,n10,n11,normPt){var minX0=n00.x<n01.x?n00.x:n01.x;var minY0=n00.y<n01.y?n00.y:n01.y;var maxX0=n00.x>n01.x?n00.x:n01.x;var maxY0=n00.y>n01.y?n00.y:n01.y;var minX1=n10.x<n11.x?n10.x:n11.x;var minY1=n10.y<n11.y?n10.y:n11.y;var maxX1=n10.x>n11.x?n10.x:n11.x;var maxY1=n10.y>n11.y?n10.y:n11.y;var intMinX=minX0>minX1?minX0:minX1;var intMaxX=maxX0<maxX1?maxX0:maxX1;var intMinY=minY0>minY1?minY0:minY1;var intMaxY=maxY0<maxY1?maxY0:maxY1;var intMidX=(intMinX+intMaxX)/2.0;var intMidY=(intMinY+intMaxY)/2.0;normPt.x=intMidX;normPt.y=intMidY;n00.x-=normPt.x;n00.y-=normPt.y;n01.x-=normPt.x;n01.y-=normPt.y;n10.x-=normPt.x;n10.y-=normPt.y;n11.x-=normPt.x;n11.y-=normPt.y;};jsts.algorithm.RobustLineIntersector.prototype.smallestInAbsValue=function(x1,x2,x3,x4){var x=x1;var xabs=Math.abs(x);if(Math.abs(x2)<xabs){x=x2;xabs=Math.abs(x2);}
if(Math.abs(x3)<xabs){x=x3;xabs=Math.abs(x3);}
if(Math.abs(x4)<xabs){x=x4;}
return x;};jsts.algorithm.RobustLineIntersector.prototype.isInSegmentEnvelopes=function(intPt){var env0=new jsts.geom.Envelope(this.inputLines[0][0],this.inputLines[0][1]);var env1=new jsts.geom.Envelope(this.inputLines[1][0],this.inputLines[1][1]);return env0.contains(intPt)&&env1.contains(intPt);};jsts.algorithm.HCoordinate=function(){this.x=0.0;this.y=0.0;this.w=1.0;if(arguments.length===1){this.initFrom1Coordinate(arguments[0]);}else if(arguments.length===2&&arguments[0]instanceof jsts.geom.Coordinate){this.initFrom2Coordinates(arguments[0],arguments[1]);}else if(arguments.length===2&&arguments[0]instanceof jsts.algorithm.HCoordinate){this.initFrom2HCoordinates(arguments[0],arguments[1]);}else if(arguments.length===2){this.initFromXY(arguments[0],arguments[1]);}else if(arguments.length===3){this.initFromXYW(arguments[0],arguments[1],arguments[2]);}else if(arguments.length===4){this.initFromXYW(arguments[0],arguments[1],arguments[2],arguments[3]);}};jsts.algorithm.HCoordinate.intersection=function(p1,p2,q1,q2){var px,py,pw,qx,qy,qw,x,y,w,xInt,yInt;px=p1.y-p2.y;py=p2.x-p1.x;pw=p1.x*p2.y-p2.x*p1.y;qx=q1.y-q2.y;qy=q2.x-q1.x;qw=q1.x*q2.y-q2.x*q1.y;x=py*qw-qy*pw;y=qx*pw-px*qw;w=px*qy-qx*py;xInt=x/w;yInt=y/w;if(!isFinite(xInt)||!isFinite(yInt)){throw new jsts.error.NotRepresentableError();}
return new jsts.geom.Coordinate(xInt,yInt);};jsts.algorithm.HCoordinate.prototype.initFrom1Coordinate=function(p){this.x=p.x;this.y=p.y;this.w=1.0;};jsts.algorithm.HCoordinate.prototype.initFrom2Coordinates=function(p1,p2){this.x=p1.y-p2.y;this.y=p2.x-p1.x;this.w=p1.x*p2.y-p2.x*p1.y;};jsts.algorithm.HCoordinate.prototype.initFrom2HCoordinates=function(p1,p2){this.x=p1.y*p2.w-p2.y*p1.w;this.y=p2.x*p1.w-p1.x*p2.w;this.w=p1.x*p2.y-p2.x*p1.y;};jsts.algorithm.HCoordinate.prototype.initFromXYW=function(x,y,w){this.x=x;this.y=y;this.w=w;};jsts.algorithm.HCoordinate.prototype.initFromXY=function(x,y){this.x=x;this.y=y;this.w=1.0;};jsts.algorithm.HCoordinate.prototype.initFrom4Coordinates=function(p1,p2,q1,q2){var px,py,pw,qx,qy,qw;px=p1.y-p2.y;py=p2.x-p1.x;pw=p1.x*p2.y-p2.x*p1.y;qx=q1.y-q2.y;qy=q2.x-q1.x;qw=q1.x*q2.y-q2.x*q1.y;this.x=py*qw-qy*pw;this.y=qx*pw-px*qw;this.w=px*qy-qx*py;};jsts.algorithm.HCoordinate.prototype.getX=function(){var a=this.x/this.w;if(!isFinite(a)){throw new jsts.error.NotRepresentableError();}
return a;};jsts.algorithm.HCoordinate.prototype.getY=function(){var a=this.y/this.w;if(!isFinite(a)){throw new jsts.error.NotRepresentableError();}
return a;};jsts.algorithm.HCoordinate.prototype.getCoordinate=function(){var p=new jsts.geom.Coordinate();p.x=this.getX();p.y=this.getY();return p;};jsts.geom.LineSegment=function(){if(arguments.length===0){this.p0=new jsts.geom.Coordinate();this.p1=new jsts.geom.Coordinate();}else if(arguments.length===1){this.p0=arguments[0].p0;this.p1=arguments[0].p1;}else if(arguments.length===2){this.p0=arguments[0];this.p1=arguments[1];}else if(arguments.length===4){this.p0=new jsts.geom.Coordinate(arguments[0],arguments[1]);this.p1=new jsts.geom.Coordinate(arguments[2],arguments[3]);}};jsts.geom.LineSegment.prototype.p0=null;jsts.geom.LineSegment.prototype.p1=null;jsts.geom.LineSegment.midPoint=function(p0,p1){return new jsts.geom.Coordinate((p0.x+p1.x)/2,(p0.y+p1.y)/2);};jsts.geom.LineSegment.prototype.getCoordinate=function(i){if(i===0)return this.p0;return this.p1;};jsts.geom.LineSegment.prototype.getLength=function(){return this.p0.distance(this.p1);};jsts.geom.LineSegment.prototype.isHorizontal=function(){return this.p0.y===this.p1.y;};jsts.geom.LineSegment.prototype.isVertical=function(){return this.p0.x===this.p1.x;};jsts.geom.LineSegment.prototype.orientationIndex=function(arg){if(arg instanceof jsts.geom.LineSegment){return this.orientationIndex1(arg);}else if(arg instanceof jsts.geom.Coordinate){return this.orientationIndex2(arg);}};jsts.geom.LineSegment.prototype.orientationIndex1=function(seg){var orient0=jsts.algorithm.CGAlgorithms.orientationIndex(this.p0,this.p1,seg.p0);var orient1=jsts.algorithm.CGAlgorithms.orientationIndex(this.p0,this.p1,seg.p1);if(orient0>=0&&orient1>=0){return Math.max(orient0,orient1);}
if(orient0<=0&&orient1<=0){return Math.max(orient0,orient1);}
return 0;};jsts.geom.LineSegment.prototype.orientationIndex2=function(p){return jsts.algorithm.CGAlgorithms.orientationIndex(this.p0,this.p1,p);};jsts.geom.LineSegment.prototype.reverse=function(){var temp=this.p0;this.p0=this.p1;this.p1=temp;};jsts.geom.LineSegment.prototype.normalize=function(){if(this.p1.compareTo(this.p0)<0)this.reverse();};jsts.geom.LineSegment.prototype.angle=function(){return Math.atan2(this.p1.y-this.p0.y,this.p1.x-this.p0.x);};jsts.geom.LineSegment.prototype.midPoint=function(){return jsts.geom.LineSegment.midPoint(this.p0,this.p1);};jsts.geom.LineSegment.prototype.distance=function(arg){if(arg instanceof jsts.geom.LineSegment){return this.distance1(arg);}else if(arg instanceof jsts.geom.Coordinate){return this.distance2(arg);}};jsts.geom.LineSegment.prototype.distance1=function(ls){return jsts.algorithm.CGAlgorithms.distanceLineLine(this.p0,this.p1,ls.p0,ls.p1);};jsts.geom.LineSegment.prototype.distance2=function(p){return jsts.algorithm.CGAlgorithms.distancePointLine(p,this.p0,this.p1);};jsts.geom.LineSegment.prototype.pointAlong=function(segmentLengthFraction){var coord=new jsts.geom.Coordinate();coord.x=this.p0.x+segmentLengthFraction*(this.p1.x-this.p0.x);coord.y=this.p0.y+segmentLengthFraction*(this.p1.y-this.p0.y);return coord;};jsts.geom.LineSegment.prototype.pointAlongOffset=function(segmentLengthFraction,offsetDistance){var segx=this.p0.x+segmentLengthFraction*(this.p1.x-this.p0.x);var segy=this.p0.y+segmentLengthFraction*(this.p1.y-this.p0.y);var dx=this.p1.x-this.p0.x;var dy=this.p1.y-this.p0.y;var len=Math.sqrt(dx*dx+dy*dy);var ux=0;var uy=0;if(offsetDistance!==0){if(len<=0){throw"Cannot compute offset from zero-length line segment";}
ux=offsetDistance*dx/len;uy=offsetDistance*dy/len;}
var offsetx=segx-uy;var offsety=segy+ux;var coord=new jsts.geom.Coordinate(offsetx,offsety);return coord;};jsts.geom.LineSegment.prototype.projectionFactor=function(p){if(p.equals(this.p0))
return 0.0;if(p.equals(this.p1))
return 1.0;var dx=this.p1.x-this.p0.x;var dy=this.p1.y-this.p0.y;var len2=dx*dx+dy*dy;var r=((p.x-this.p0.x)*dx+(p.y-this.p0.y)*dy)/len2;return r;};jsts.geom.LineSegment.prototype.segmentFraction=function(inputPt){var segFrac=this.projectionFactor(inputPt);if(segFrac<0){segFrac=0;}else if(segFrac>1||isNaN(segFrac)){segFrac=1;}
return segFrac;};jsts.geom.LineSegment.prototype.project=function(arg){if(arg instanceof jsts.geom.Coordinate){return this.project1(arg);}else if(arg instanceof jsts.geom.LineSegment){return this.project2(arg);}};jsts.geom.LineSegment.prototype.project1=function(p){if(p.equals(this.p0)||p.equals(this.p1)){return new jsts.geom.Coordinate(p);}
var r=this.projectionFactor(p);var coord=new jsts.geom.Coordinate();coord.x=this.p0.x+r*(this.p1.x-this.p0.x);coord.y=this.p0.y+r*(this.p1.y-this.p0.y);return coord;};jsts.geom.LineSegment.prototype.project2=function(seg){var pf0=this.projectionFactor(seg.p0);var pf1=this.projectionFactor(seg.p1);if(pf0>=1&&pf1>=1)return null;if(pf0<=0&&pf1<=0)return null;var newp0=this.project(seg.p0);if(pf0<0)newp0=p0;if(pf0>1)newp0=p1;var newp1=this.project(seg.p1);if(pf1<0.0)newp1=p0;if(pf1>1.0)newp1=p1;return new jsts.geom.LineSegment(newp0,newp1);};jsts.geom.LineSegment.prototype.closestPoint=function(p){var factor=this.projectionFactor(p);if(factor>0&&factor<1){return this.project(p);}
var dist0=this.p0.distance(p);var dist1=this.p1.distance(p);if(dist0<dist1)
return this.p0;return this.p1;};jsts.geom.LineSegment.prototype.closestPoints=function(line){var intPt=this.intersection(line);if(intPt!==null){return[intPt,intPt];}
var closestPt=[];var minDistance=Number.MAX_VALUE;var dist;var close00=this.closestPoint(line.p0);minDistance=close00.distance(line.p0);closestPt[0]=close00;closestPt[1]=line.p0;var close01=this.closestPoint(line.p1);dist=close01.distance(line.p1);if(dist<minDistance){minDistance=dist;closestPt[0]=close01;closestPt[1]=line.p1;}
var close10=line.closestPoint(this.p0);dist=close10.distance(this.p0);if(dist<minDistance){minDistance=dist;closestPt[0]=this.p0;closestPt[1]=close10;}
var close11=line.closestPoint(this.p1);dist=close11.distance(this.p1);if(dist<minDistance){minDistance=dist;closestPt[0]=this.p1;closestPt[1]=close11;}
return closestPt;};jsts.geom.LineSegment.prototype.intersection=function(line){var li=new jsts.algorithm.RobustLineIntersector();li.computeIntersection(this.p0,this.p1,line.p0,line.p1);if(li.hasIntersection())
return li.getIntersection(0);return null;};jsts.geom.LineSegment.prototype.setCoordinates=function(ls){if(ls instanceof jsts.geom.Coordinate){this.setCoordinates2.apply(this,arguments);return;}
this.setCoordinates2(ls.p0,ls.p1);};jsts.geom.LineSegment.prototype.setCoordinates2=function(p0,p1){this.p0.x=p0.x;this.p0.y=p0.y;this.p1.x=p1.x;this.p1.y=p1.y;};jsts.geom.LineSegment.prototype.distancePerpendicular=function(p){return jsts.algorithm.CGAlgorithms.distancePointLinePerpendicular(p,this.p0,this.p1);};jsts.geom.LineSegment.prototype.lineIntersection=function(line){try{var intPt=jsts.algorithm.HCoordinate.intersection(this.p0,this.p1,line.p0,line.p1);return intPt;}catch(ex){}
return null;};jsts.geom.LineSegment.prototype.toGeometry=function(geomFactory){return geomFactory.createLineString([this.p0,this.p1]);};jsts.geom.LineSegment.prototype.equals=function(o){if(!(o instanceof jsts.geom.LineSegment)){return false;}
return this.p0.equals(o.p0)&&this.p1.equals(o.p1);};jsts.geom.LineSegment.prototype.compareTo=function(o){var comp0=this.p0.compareTo(o.p0);if(comp0!==0)return comp0;return this.p1.compareTo(o.p1);};jsts.geom.LineSegment.prototype.equalsTopo=function(other){return this.p0.equals(other.p0)&&this.p1.equals(other.p1)||this.p0.equals(other.p1)&&this.p1.equals(other.p0);};jsts.geom.LineSegment.prototype.toString=function(){return"LINESTRING("+
this.p0.x+" "+this.p0.y
+", "+
this.p1.x+" "+this.p1.y+")";};jsts.index.chain.MonotoneChainOverlapAction=function(){this.tempEnv1=new jsts.geom.Envelope();this.tempEnv2=new jsts.geom.Envelope();this.overlapSeg1=new jsts.geom.LineSegment();this.overlapSeg2=new jsts.geom.LineSegment();};jsts.index.chain.MonotoneChainOverlapAction.prototype.tempEnv1=null;jsts.index.chain.MonotoneChainOverlapAction.prototype.tempEnv2=null;jsts.index.chain.MonotoneChainOverlapAction.prototype.overlapSeg1=null;jsts.index.chain.MonotoneChainOverlapAction.prototype.overlapSeg2=null;jsts.index.chain.MonotoneChainOverlapAction.prototype.overlap=function(mc1,start1,mc2,start2){this.mc1.getLineSegment(start1,this.overlapSeg1);this.mc2.getLineSegment(start2,this.overlapSeg2);this.overlap2(this.overlapSeg1,this.overlapSeg2);};jsts.index.chain.MonotoneChainOverlapAction.prototype.overlap2=function(seg1,seg2){};(function(){var MonotoneChainOverlapAction=jsts.index.chain.MonotoneChainOverlapAction;var SinglePassNoder=jsts.noding.SinglePassNoder;var STRtree=jsts.index.strtree.STRtree;var NodedSegmentString=jsts.noding.NodedSegmentString;var MonotoneChainBuilder=jsts.index.chain.MonotoneChainBuilder;var SegmentOverlapAction=function(si){this.si=si;};SegmentOverlapAction.prototype=new MonotoneChainOverlapAction();SegmentOverlapAction.constructor=SegmentOverlapAction;SegmentOverlapAction.prototype.si=null;SegmentOverlapAction.prototype.overlap=function(mc1,start1,mc2,start2){var ss1=mc1.getContext();var ss2=mc2.getContext();this.si.processIntersections(ss1,start1,ss2,start2);};jsts.noding.MCIndexNoder=function(){this.monoChains=[];this.index=new STRtree();};jsts.noding.MCIndexNoder.prototype=new SinglePassNoder();jsts.noding.MCIndexNoder.constructor=jsts.noding.MCIndexNoder;jsts.noding.MCIndexNoder.prototype.monoChains=null;jsts.noding.MCIndexNoder.prototype.index=null;jsts.noding.MCIndexNoder.prototype.idCounter=0;jsts.noding.MCIndexNoder.prototype.nodedSegStrings=null;jsts.noding.MCIndexNoder.prototype.nOverlaps=0;jsts.noding.MCIndexNoder.prototype.getMonotoneChains=function(){return this.monoChains;};jsts.noding.MCIndexNoder.prototype.getIndex=function(){return this.index;};jsts.noding.MCIndexNoder.prototype.getNodedSubstrings=function(){return NodedSegmentString.getNodedSubstrings(this.nodedSegStrings);};jsts.noding.MCIndexNoder.prototype.computeNodes=function(inputSegStrings){this.nodedSegStrings=inputSegStrings;for(var i=inputSegStrings.iterator();i.hasNext();){this.add(i.next());}
this.intersectChains();};jsts.noding.MCIndexNoder.prototype.intersectChains=function(){var overlapAction=new SegmentOverlapAction(this.segInt);for(var i=0;i<this.monoChains.length;i++){var queryChain=this.monoChains[i];var overlapChains=this.index.query(queryChain.getEnvelope());for(var j=0;j<overlapChains.length;j++){var testChain=overlapChains[j];if(testChain.getId()>queryChain.getId()){queryChain.computeOverlaps(testChain,overlapAction);this.nOverlaps++;}
if(this.segInt.isDone())
return;}}};jsts.noding.MCIndexNoder.prototype.add=function(segStr){var segChains=MonotoneChainBuilder.getChains(segStr.getCoordinates(),segStr);for(var i=0;i<segChains.length;i++){var mc=segChains[i];mc.setId(this.idCounter++);this.index.insert(mc.getEnvelope(),mc);this.monoChains.push(mc);}};})();jsts.simplify.LineSegmentIndex=function(){this.index=new jsts.index.quadtree.Quadtree();};jsts.simplify.LineSegmentIndex.prototype.index=null;jsts.simplify.LineSegmentIndex.prototype.add=function(line){if(line instanceof jsts.geom.LineSegment){this.add2(line);return;}
var segs=line.getSegments();for(var i=0;i<segs.length;i++){var seg=segs[i];this.add2(seg);}};jsts.simplify.LineSegmentIndex.prototype.add2=function(seg){this.index.insert(new jsts.geom.Envelope(seg.p0,seg.p1),seg);};jsts.simplify.LineSegmentIndex.prototype.remove=function(seg){this.index.remove(new jsts.geom.Envelope(seg.p0,seg.p1),seg);};jsts.simplify.LineSegmentIndex.prototype.query=function(querySeg){var env=new jsts.geom.Envelope(querySeg.p0,querySeg.p1);var visitor=new jsts.simplify.LineSegmentIndex.LineSegmentVisitor(querySeg);this.index.query(env,visitor);var itemsFound=visitor.getItems();return itemsFound;};jsts.simplify.LineSegmentIndex.LineSegmentVisitor=function(querySeg){this.items=[];this.querySeg=querySeg;};jsts.simplify.LineSegmentIndex.LineSegmentVisitor.prototype=new jsts.index.ItemVisitor();jsts.simplify.LineSegmentIndex.LineSegmentVisitor.prototype.querySeg=null;jsts.simplify.LineSegmentIndex.LineSegmentVisitor.prototype.items=null;jsts.simplify.LineSegmentIndex.LineSegmentVisitor.prototype.visitItem=function(item){var seg=item;if(jsts.geom.Envelope.intersects(seg.p0,seg.p1,this.querySeg.p0,this.querySeg.p1))
this.items.push(item);};jsts.simplify.LineSegmentIndex.LineSegmentVisitor.prototype.getItems=function(){return this.items;};jsts.geomgraph.EdgeEndStar=function(){this.edgeMap=new javascript.util.TreeMap();this.edgeList=null;this.ptInAreaLocation=[jsts.geom.Location.NONE,jsts.geom.Location.NONE];};jsts.geomgraph.EdgeEndStar.prototype.edgeMap=null;jsts.geomgraph.EdgeEndStar.prototype.edgeList=null;jsts.geomgraph.EdgeEndStar.prototype.ptInAreaLocation=null;jsts.geomgraph.EdgeEndStar.prototype.insert=function(e){throw new jsts.error.AbstractMethodInvocationError();};jsts.geomgraph.EdgeEndStar.prototype.insertEdgeEnd=function(e,obj){this.edgeMap.put(e,obj);this.edgeList=null;};jsts.geomgraph.EdgeEndStar.prototype.getCoordinate=function(){var it=this.iterator();if(!it.hasNext())
return null;var e=it.next();return e.getCoordinate();};jsts.geomgraph.EdgeEndStar.prototype.getDegree=function(){return this.edgeMap.size();};jsts.geomgraph.EdgeEndStar.prototype.iterator=function(){return this.getEdges().iterator();};jsts.geomgraph.EdgeEndStar.prototype.getEdges=function(){if(this.edgeList===null){this.edgeList=new javascript.util.ArrayList(this.edgeMap.values());}
return this.edgeList;};jsts.geomgraph.EdgeEndStar.prototype.getNextCW=function(ee){this.getEdges();var i=this.edgeList.indexOf(ee);var iNextCW=i-1;if(i===0)
iNextCW=this.edgeList.length-1;return this.edgeList[iNextCW];};jsts.geomgraph.EdgeEndStar.prototype.computeLabelling=function(geomGraph){this.computeEdgeEndLabels(geomGraph[0].getBoundaryNodeRule());this.propagateSideLabels(0);this.propagateSideLabels(1);var hasDimensionalCollapseEdge=[false,false];for(var it=this.iterator();it.hasNext();){var e=it.next();var label=e.getLabel();for(var geomi=0;geomi<2;geomi++){if(label.isLine(geomi)&&label.getLocation(geomi)===jsts.geom.Location.BOUNDARY)
hasDimensionalCollapseEdge[geomi]=true;}}
for(var it=this.iterator();it.hasNext();){var e=it.next();var label=e.getLabel();for(var geomi=0;geomi<2;geomi++){if(label.isAnyNull(geomi)){var loc=jsts.geom.Location.NONE;if(hasDimensionalCollapseEdge[geomi]){loc=jsts.geom.Location.EXTERIOR;}else{var p=e.getCoordinate();loc=this.getLocation(geomi,p,geomGraph);}
label.setAllLocationsIfNull(geomi,loc);}}}};jsts.geomgraph.EdgeEndStar.prototype.computeEdgeEndLabels=function(boundaryNodeRule){for(var it=this.iterator();it.hasNext();){var ee=it.next();ee.computeLabel(boundaryNodeRule);}};jsts.geomgraph.EdgeEndStar.prototype.getLocation=function(geomIndex,p,geom){if(this.ptInAreaLocation[geomIndex]===jsts.geom.Location.NONE){this.ptInAreaLocation[geomIndex]=jsts.algorithm.locate.SimplePointInAreaLocator.locate(p,geom[geomIndex].getGeometry());}
return this.ptInAreaLocation[geomIndex];};jsts.geomgraph.EdgeEndStar.prototype.isAreaLabelsConsistent=function(geomGraph){this.computeEdgeEndLabels(geomGraph.getBoundaryNodeRule());return this.checkAreaLabelsConsistent(0);};jsts.geomgraph.EdgeEndStar.prototype.checkAreaLabelsConsistent=function(geomIndex){var edges=this.getEdges();if(edges.size()<=0)
return true;var lastEdgeIndex=edges.size()-1;var startLabel=edges.get(lastEdgeIndex).getLabel();var startLoc=startLabel.getLocation(geomIndex,jsts.geomgraph.Position.LEFT);jsts.util.Assert.isTrue(startLoc!=jsts.geom.Location.NONE,'Found unlabelled area edge');var currLoc=startLoc;for(var it=this.iterator();it.hasNext();){var e=it.next();var label=e.getLabel();jsts.util.Assert.isTrue(label.isArea(geomIndex),'Found non-area edge');var leftLoc=label.getLocation(geomIndex,jsts.geomgraph.Position.LEFT);var rightLoc=label.getLocation(geomIndex,jsts.geomgraph.Position.RIGHT);if(leftLoc===rightLoc){return false;}
if(rightLoc!==currLoc){return false;}
currLoc=leftLoc;}
return true;};jsts.geomgraph.EdgeEndStar.prototype.propagateSideLabels=function(geomIndex){var startLoc=jsts.geom.Location.NONE;for(var it=this.iterator();it.hasNext();){var e=it.next();var label=e.getLabel();if(label.isArea(geomIndex)&&label.getLocation(geomIndex,jsts.geomgraph.Position.LEFT)!==jsts.geom.Location.NONE)
startLoc=label.getLocation(geomIndex,jsts.geomgraph.Position.LEFT);}
if(startLoc===jsts.geom.Location.NONE)
return;var currLoc=startLoc;for(var it=this.iterator();it.hasNext();){var e=it.next();var label=e.getLabel();if(label.getLocation(geomIndex,jsts.geomgraph.Position.ON)===jsts.geom.Location.NONE)
label.setLocation(geomIndex,jsts.geomgraph.Position.ON,currLoc);if(label.isArea(geomIndex)){var leftLoc=label.getLocation(geomIndex,jsts.geomgraph.Position.LEFT);var rightLoc=label.getLocation(geomIndex,jsts.geomgraph.Position.RIGHT);if(rightLoc!==jsts.geom.Location.NONE){if(rightLoc!==currLoc)
throw new jsts.error.TopologyError('side location conflict',e.getCoordinate());if(leftLoc===jsts.geom.Location.NONE){jsts.util.Assert.shouldNeverReachHere('found single null side (at '+
e.getCoordinate()+')');}
currLoc=leftLoc;}else{jsts.util.Assert.isTrue(label.getLocation(geomIndex,jsts.geomgraph.Position.LEFT)===jsts.geom.Location.NONE,'found single null side');label.setLocation(geomIndex,jsts.geomgraph.Position.RIGHT,currLoc);label.setLocation(geomIndex,jsts.geomgraph.Position.LEFT,currLoc);}}}};jsts.geomgraph.EdgeEndStar.prototype.findIndex=function(eSearch){this.iterator();for(var i=0;i<this.edgeList.size();i++){var e=this.edgeList.get(i);if(e===eSearch)
return i;}
return-1;};jsts.operation.relate.EdgeEndBundleStar=function(){jsts.geomgraph.EdgeEndStar.apply(this,arguments);};jsts.operation.relate.EdgeEndBundleStar.prototype=new jsts.geomgraph.EdgeEndStar();jsts.operation.relate.EdgeEndBundleStar.prototype.insert=function(e){var eb=this.edgeMap.get(e);if(eb===null){eb=new jsts.operation.relate.EdgeEndBundle(e);this.insertEdgeEnd(e,eb);}
else{eb.insert(e);}};jsts.operation.relate.EdgeEndBundleStar.prototype.updateIM=function(im){for(var it=this.iterator();it.hasNext();){var esb=it.next();esb.updateIM(im);}};jsts.index.ArrayListVisitor=function(){this.items=[];};jsts.index.ArrayListVisitor.prototype.visitItem=function(item){this.items.push(item);};jsts.index.ArrayListVisitor.prototype.getItems=function(){return this.items;};jsts.algorithm.distance.DistanceToPoint=function(){};jsts.algorithm.distance.DistanceToPoint.computeDistance=function(geom,pt,ptDist){if(geom instanceof jsts.geom.LineString){jsts.algorithm.distance.DistanceToPoint.computeDistance2(geom,pt,ptDist);}else if(geom instanceof jsts.geom.Polygon){jsts.algorithm.distance.DistanceToPoint.computeDistance4(geom,pt,ptDist);}else if(geom instanceof jsts.geom.GeometryCollection){var gc=geom;for(var i=0;i<gc.getNumGeometries();i++){var g=gc.getGeometryN(i);jsts.algorithm.distance.DistanceToPoint.computeDistance(g,pt,ptDist);}}else{ptDist.setMinimum(geom.getCoordinate(),pt);}};jsts.algorithm.distance.DistanceToPoint.computeDistance2=function(line,pt,ptDist){var tempSegment=new jsts.geom.LineSegment();var coords=line.getCoordinates();for(var i=0;i<coords.length-1;i++){tempSegment.setCoordinates(coords[i],coords[i+1]);var closestPt=tempSegment.closestPoint(pt);ptDist.setMinimum(closestPt,pt);}};jsts.algorithm.distance.DistanceToPoint.computeDistance3=function(segment,pt,ptDist){var closestPt=segment.closestPoint(pt);ptDist.setMinimum(closestPt,pt);};jsts.algorithm.distance.DistanceToPoint.computeDistance4=function(poly,pt,ptDist){jsts.algorithm.distance.DistanceToPoint.computeDistance2(poly.getExteriorRing(),pt,ptDist);for(var i=0;i<poly.getNumInteriorRing();i++){jsts.algorithm.distance.DistanceToPoint.computeDistance2(poly.getInteriorRingN(i),pt,ptDist);}};jsts.index.strtree.ItemBoundable=function(bounds,item){this.bounds=bounds;this.item=item;};jsts.index.strtree.ItemBoundable.prototype=new jsts.index.strtree.Boundable();jsts.index.strtree.ItemBoundable.constructor=jsts.index.strtree.ItemBoundable;jsts.index.strtree.ItemBoundable.prototype.bounds=null;jsts.index.strtree.ItemBoundable.prototype.item=null;jsts.index.strtree.ItemBoundable.prototype.getBounds=function(){return this.bounds;};jsts.index.strtree.ItemBoundable.prototype.getItem=function(){return this.item;};(function(){var ArrayList=javascript.util.ArrayList;var TreeMap=javascript.util.TreeMap;jsts.geomgraph.EdgeList=function(){this.edges=new ArrayList();this.ocaMap=new TreeMap();};jsts.geomgraph.EdgeList.prototype.edges=null;jsts.geomgraph.EdgeList.prototype.ocaMap=null;jsts.geomgraph.EdgeList.prototype.add=function(e){this.edges.add(e);var oca=new jsts.noding.OrientedCoordinateArray(e.getCoordinates());this.ocaMap.put(oca,e);};jsts.geomgraph.EdgeList.prototype.addAll=function(edgeColl){for(var i=edgeColl.iterator();i.hasNext();){this.add(i.next());}};jsts.geomgraph.EdgeList.prototype.getEdges=function(){return this.edges;};jsts.geomgraph.EdgeList.prototype.findEqualEdge=function(e){var oca=new jsts.noding.OrientedCoordinateArray(e.getCoordinates());var matchEdge=this.ocaMap.get(oca);return matchEdge;};jsts.geomgraph.EdgeList.prototype.getEdges=function(){return this.edges;};jsts.geomgraph.EdgeList.prototype.iterator=function(){return this.edges.iterator();};jsts.geomgraph.EdgeList.prototype.get=function(i){return this.edges.get(i);};jsts.geomgraph.EdgeList.prototype.findEdgeIndex=function(e){for(var i=0;i<this.edges.size();i++){if(this.edges.get(i).equals(e))
return i;}
return-1;};})();jsts.operation.IsSimpleOp=function(geom){this.geom=geom;};jsts.operation.IsSimpleOp.prototype.geom=null;jsts.operation.IsSimpleOp.prototype.isClosedEndpointsInInterior=true;jsts.operation.IsSimpleOp.prototype.nonSimpleLocation=null;jsts.operation.IsSimpleOp.prototype.IsSimpleOp=function(geom){this.geom=geom;};jsts.operation.IsSimpleOp.prototype.isSimple=function(){this.nonSimpleLocation=null;if(this.geom instanceof jsts.geom.LineString){return this.isSimpleLinearGeometry(this.geom);}
if(this.geom instanceof jsts.geom.MultiLineString){return this.isSimpleLinearGeometry(this.geom);}
if(this.geom instanceof jsts.geom.MultiPoint){return this.isSimpleMultiPoint(this.geom);}
return true;};jsts.operation.IsSimpleOp.prototype.isSimpleMultiPoint=function(mp){if(mp.isEmpty())
return true;var points=[];for(var i=0;i<mp.getNumGeometries();i++){var pt=mp.getGeometryN(i);var p=pt.getCoordinate();for(var j=0;j<points.length;j++){var point=points[j];if(p.equals2D(point)){this.nonSimpleLocation=p;return false;}}
points.push(p);}
return true;};jsts.operation.IsSimpleOp.prototype.isSimpleLinearGeometry=function(geom){if(geom.isEmpty())
return true;var graph=new jsts.geomgraph.GeometryGraph(0,geom);var li=new jsts.algorithm.RobustLineIntersector();var si=graph.computeSelfNodes(li,true);if(!si.hasIntersection())
return true;if(si.hasProperIntersection()){this.nonSimpleLocation=si.getProperIntersectionPoint();return false;}
if(this.hasNonEndpointIntersection(graph))
return false;if(this.isClosedEndpointsInInterior){if(this.hasClosedEndpointIntersection(graph))
return false;}
return true;};jsts.operation.IsSimpleOp.prototype.hasNonEndpointIntersection=function(graph){for(var i=graph.getEdgeIterator();i.hasNext();){var e=i.next();var maxSegmentIndex=e.getMaximumSegmentIndex();for(var eiIt=e.getEdgeIntersectionList().iterator();eiIt.hasNext();){var ei=eiIt.next();if(!ei.isEndPoint(maxSegmentIndex)){this.nonSimpleLocation=ei.getCoordinate();return true;}}}
return false;};jsts.operation.IsSimpleOp.prototype.hasClosedEndpointIntersection=function(graph){var endPoints=new javascript.util.TreeMap();for(var i=graph.getEdgeIterator();i.hasNext();){var e=i.next();var maxSegmentIndex=e.getMaximumSegmentIndex();var isClosed=e.isClosed();var p0=e.getCoordinate(0);this.addEndpoint(endPoints,p0,isClosed);var p1=e.getCoordinate(e.getNumPoints()-1);this.addEndpoint(endPoints,p1,isClosed);}
for(var i=endPoints.values().iterator();i.hasNext();){var eiInfo=i.next();if(eiInfo.isClosed&&eiInfo.degree!=2){this.nonSimpleLocation=eiInfo.getCoordinate();return true;}}
return false;};jsts.operation.IsSimpleOp.EndpointInfo=function(pt){this.pt=pt;this.isClosed=false;this.degree=0;};jsts.operation.IsSimpleOp.EndpointInfo.prototype.pt=null;jsts.operation.IsSimpleOp.EndpointInfo.prototype.isClosed=null;jsts.operation.IsSimpleOp.EndpointInfo.prototype.degree=null;jsts.operation.IsSimpleOp.EndpointInfo.prototype.getCoordinate=function(){return this.pt;};jsts.operation.IsSimpleOp.EndpointInfo.prototype.addEndpoint=function(isClosed){this.degree++;this.isClosed=this.isClosed||isClosed;};jsts.operation.IsSimpleOp.prototype.addEndpoint=function(endPoints,p,isClosed){var eiInfo=endPoints.get(p);if(eiInfo===null){eiInfo=new jsts.operation.IsSimpleOp.EndpointInfo(p);endPoints.put(p,eiInfo);}
eiInfo.addEndpoint(isClosed);};(function(){var LineStringSnapper=function(){this.snapTolerance=0.0;this.seg=new jsts.geom.LineSegment();this.allowSnappingToSourceVertices=false;this.isClosed=false;this.srcPts=[];if(arguments[0]instanceof jsts.geom.LineString){this.initFromLine.apply(this,arguments);}else{this.initFromPoints.apply(this,arguments);}};LineStringSnapper.prototype.initFromLine=function(srcLine,snapTolerance){this.initFromPoints(srcLine.getCoordinates(),snapTolerance);};LineStringSnapper.prototype.initFromPoints=function(srcPts,snapTolerance){this.srcPts=srcPts;this.isClosed=this.calcIsClosed(srcPts);this.snapTolerance=snapTolerance;};LineStringSnapper.prototype.setAllowSnappingToSourceVertices=function(allowSnappingToSourceVertices){this.allowSnappingToSourceVertices=allowSnappingToSourceVertices;};LineStringSnapper.prototype.calcIsClosed=function(pts){if(pts.length<=1){return false;}
return pts[0].equals(pts[pts.length-1]);};LineStringSnapper.prototype.snapTo=function(snapPts){var coordList=new jsts.geom.CoordinateList(this.srcPts);this.snapVertices(coordList,snapPts);this.snapSegments(coordList,snapPts);return coordList.toCoordinateArray();};LineStringSnapper.prototype.snapVertices=function(srcCoords,snapPts){var end=this.isClosed?srcCoords.size()-1:srcCoords.size(),i=0,srcPt,snapVert;for(i;i<end;i++){srcPt=srcCoords.get(i);snapVert=this.findSnapForVertex(srcPt,snapPts);if(snapVert!==null){srcCoords.set(i,new jsts.geom.Coordinate(snapVert));if(i===0&&this.isClosed)
srcCoords.set(srcCoords.size()-1,new jsts.geom.Coordinate(snapVert));}}};LineStringSnapper.prototype.findSnapForVertex=function(pt,snapPts){var i=0,il=snapPts.length;for(i=0;i<il;i++){if(pt.equals(snapPts[i])){return null;}
if(pt.distance(snapPts[i])<this.snapTolerance){return snapPts[i];}}
return null;};LineStringSnapper.prototype.snapSegments=function(srcCoords,snapPts){if(snapPts.length===0){return;}
var distinctPtCount=snapPts.length,i,snapPt,index;if(snapPts.length>1&&snapPts[0].equals2D(snapPts[snapPts.length-1])){distinctPtCount=snapPts.length-1;}
i=0;for(i;i<distinctPtCount;i++){snapPt=snapPts[i];index=this.findSegmentIndexToSnap(snapPt,srcCoords);if(index>=0){srcCoords.add(index+1,new jsts.geom.Coordinate(snapPt),false);}}};LineStringSnapper.prototype.findSegmentIndexToSnap=function(snapPt,srcCoords){var minDist=Number.MAX_VALUE,snapIndex=-1,i=0,dist;for(i;i<srcCoords.size()-1;i++){this.seg.p0=srcCoords.get(i);this.seg.p1=srcCoords.get(i+1);if(this.seg.p0.equals(snapPt)||this.seg.p1.equals(snapPt)){if(this.allowSnappingToSourceVertices){continue;}else{return-1;}}
dist=this.seg.distance(snapPt);if(dist<this.snapTolerance&&dist<minDist){minDist=dist;snapIndex=i;}}
return snapIndex;};jsts.operation.overlay.snap.LineStringSnapper=LineStringSnapper;})();(function(){var ArrayList=javascript.util.ArrayList;var GeometryComponentFilter=jsts.geom.GeometryComponentFilter;var LineString=jsts.geom.LineString;var EdgeRing=jsts.operation.polygonize.EdgeRing;var PolygonizeGraph=jsts.operation.polygonize.PolygonizeGraph;var Polygonizer=function(){var that=this;var LineStringAdder=function(){};LineStringAdder.prototype=new GeometryComponentFilter();LineStringAdder.prototype.filter=function(g){if(g instanceof LineString)
that.add(g);};this.lineStringAdder=new LineStringAdder();this.dangles=new ArrayList();this.cutEdges=new ArrayList();this.invalidRingLines=new ArrayList();};Polygonizer.prototype.lineStringAdder=null;Polygonizer.prototype.graph=null;Polygonizer.prototype.dangles=null;Polygonizer.prototype.cutEdges=null;Polygonizer.prototype.invalidRingLines=null;Polygonizer.prototype.holeList=null;Polygonizer.prototype.shellList=null;Polygonizer.prototype.polyList=null;Polygonizer.prototype.add=function(geomList){if(geomList instanceof jsts.geom.LineString){return this.add3(geomList);}else if(geomList instanceof jsts.geom.Geometry){return this.add2(geomList);}
for(var i=geomList.iterator();i.hasNext();){var geometry=i.next();this.add2(geometry);}};Polygonizer.prototype.add2=function(g){g.apply(this.lineStringAdder);};Polygonizer.prototype.add3=function(line){if(this.graph==null)
this.graph=new PolygonizeGraph(line.getFactory());this.graph.addEdge(line);};Polygonizer.prototype.getPolygons=function(){this.polygonize();return this.polyList;};Polygonizer.prototype.getDangles=function(){this.polygonize();return this.dangles;};Polygonizer.prototype.getCutEdges=function(){this.polygonize();return this.cutEdges;};Polygonizer.prototype.getInvalidRingLines=function(){this.polygonize();return this.invalidRingLines;};Polygonizer.prototype.polygonize=function(){if(this.polyList!=null)
return;this.polyList=new ArrayList();if(this.graph==null)
return;this.dangles=this.graph.deleteDangles();this.cutEdges=this.graph.deleteCutEdges();var edgeRingList=this.graph.getEdgeRings();var validEdgeRingList=new ArrayList();this.invalidRingLines=new ArrayList();this.findValidRings(edgeRingList,validEdgeRingList,this.invalidRingLines);this.findShellsAndHoles(validEdgeRingList);Polygonizer.assignHolesToShells(this.holeList,this.shellList);this.polyList=new ArrayList();for(var i=this.shellList.iterator();i.hasNext();){var er=i.next();this.polyList.add(er.getPolygon());}};Polygonizer.prototype.findValidRings=function(edgeRingList,validEdgeRingList,invalidRingList){for(var i=edgeRingList.iterator();i.hasNext();){var er=i.next();if(er.isValid())
validEdgeRingList.add(er);else
invalidRingList.add(er.getLineString());}};Polygonizer.prototype.findShellsAndHoles=function(edgeRingList){this.holeList=new ArrayList();this.shellList=new ArrayList();for(var i=edgeRingList.iterator();i.hasNext();){var er=i.next();if(er.isHole())
this.holeList.add(er);else
this.shellList.add(er);}};Polygonizer.assignHolesToShells=function(holeList,shellList){for(var i=holeList.iterator();i.hasNext();){var holeER=i.next();Polygonizer.assignHoleToShell(holeER,shellList);}};Polygonizer.assignHoleToShell=function(holeER,shellList){var shell=EdgeRing.findEdgeRingContaining(holeER,shellList);if(shell!=null)
shell.addHole(holeER.getRing());};jsts.operation.polygonize.Polygonizer=Polygonizer;})();(function(){var ArrayList=javascript.util.ArrayList;var GeometryTransformer=function(){};GeometryTransformer.prototype.inputGeom=null;GeometryTransformer.prototype.factory=null;GeometryTransformer.prototype.pruneEmptyGeometry=true;GeometryTransformer.prototype.preserveGeometryCollectionType=true;GeometryTransformer.prototype.preserveCollections=false;GeometryTransformer.prototype.reserveType=false;GeometryTransformer.prototype.getInputGeometry=function(){return this.inputGeom;};GeometryTransformer.prototype.transform=function(inputGeom){this.inputGeom=inputGeom;this.factory=inputGeom.getFactory();if(inputGeom instanceof jsts.geom.Point)
return this.transformPoint(inputGeom,null);if(inputGeom instanceof jsts.geom.MultiPoint)
return this.transformMultiPoint(inputGeom,null);if(inputGeom instanceof jsts.geom.LinearRing)
return this.transformLinearRing(inputGeom,null);if(inputGeom instanceof jsts.geom.LineString)
return this.transformLineString(inputGeom,null);if(inputGeom instanceof jsts.geom.MultiLineString)
return this.transformMultiLineString(inputGeom,null);if(inputGeom instanceof jsts.geom.Polygon)
return this.transformPolygon(inputGeom,null);if(inputGeom instanceof jsts.geom.MultiPolygon)
return this.transformMultiPolygon(inputGeom,null);if(inputGeom instanceof jsts.geom.GeometryCollection)
return this.transformGeometryCollection(inputGeom,null);throw new jsts.error.IllegalArgumentException('Unknown Geometry subtype: '+
inputGeom.getClass().getName());};GeometryTransformer.prototype.createCoordinateSequence=function(coords){return this.factory.getCoordinateSequenceFactory().create(coords);};GeometryTransformer.prototype.copy=function(seq){return seq.clone();};GeometryTransformer.prototype.transformCoordinates=function(coords,parent){return this.copy(coords);};GeometryTransformer.prototype.transformPoint=function(geom,parent){return this.factory.createPoint(this.transformCoordinates(geom.getCoordinateSequence(),geom));};GeometryTransformer.prototype.transformMultiPoint=function(geom,parent){var transGeomList=new ArrayList();for(var i=0;i<geom.getNumGeometries();i++){var transformGeom=this.transformPoint(geom.getGeometryN(i),geom);if(transformGeom==null)
continue;if(transformGeom.isEmpty())
continue;transGeomList.add(transformGeom);}
return this.factory.buildGeometry(transGeomList);};GeometryTransformer.prototype.transformLinearRing=function(geom,parent){var seq=this.transformCoordinates(geom.getCoordinateSequence(),geom);var seqSize=seq.length;if(seqSize>0&&seqSize<4&&!this.preserveType)
return this.factory.createLineString(seq);return this.factory.createLinearRing(seq);};GeometryTransformer.prototype.transformLineString=function(geom,parent){return this.factory.createLineString(this.transformCoordinates(geom.getCoordinateSequence(),geom));};GeometryTransformer.prototype.transformMultiLineString=function(geom,parent){var transGeomList=new ArrayList();for(var i=0;i<geom.getNumGeometries();i++){var transformGeom=this.transformLineString(geom.getGeometryN(i),geom);if(transformGeom==null)
continue;if(transformGeom.isEmpty())
continue;transGeomList.add(transformGeom);}
return this.factory.buildGeometry(transGeomList);};GeometryTransformer.prototype.transformPolygon=function(geom,parent){var isAllValidLinearRings=true;var shell=this.transformLinearRing(geom.getExteriorRing(),geom);if(shell==null||!(shell instanceof jsts.geom.LinearRing)||shell.isEmpty())
isAllValidLinearRings=false;var holes=new ArrayList();for(var i=0;i<geom.getNumInteriorRing();i++){var hole=this.transformLinearRing(geom.getInteriorRingN(i),geom);if(hole==null||hole.isEmpty()){continue;}
if(!(hole instanceof jsts.geom.LinearRing))
isAllValidLinearRings=false;holes.add(hole);}
if(isAllValidLinearRings)
return this.factory.createPolygon(shell,holes.toArray());else{var components=new ArrayList();if(shell!=null)
components.add(shell);components.addAll(holes);return this.factory.buildGeometry(components);}};GeometryTransformer.prototype.transformMultiPolygon=function(geom,parent){var transGeomList=new ArrayList();for(var i=0;i<geom.getNumGeometries();i++){var transformGeom=this.transformPolygon(geom.getGeometryN(i),geom);if(transformGeom==null)
continue;if(transformGeom.isEmpty())
continue;transGeomList.add(transformGeom);}
return this.factory.buildGeometry(transGeomList);};GeometryTransformer.prototype.transformGeometryCollection=function(geom,parent){var transGeomList=new ArrayList();for(var i=0;i<geom.getNumGeometries();i++){var transformGeom=this.transform(geom.getGeometryN(i));if(transformGeom==null)
continue;if(this.pruneEmptyGeometry&&transformGeom.isEmpty())
continue;transGeomList.add(transformGeom);}
if(this.preserveGeometryCollectionType)
return this.factory.createGeometryCollection(GeometryFactory.toGeometryArray(transGeomList));return this.factory.buildGeometry(transGeomList);};jsts.geom.util.GeometryTransformer=GeometryTransformer;})();(function(){var LineStringSnapper=jsts.operation.overlay.snap.LineStringSnapper;var PrecisionModel=jsts.geom.PrecisionModel;var TreeSet=javascript.util.TreeSet;var SnapTransformer=function(snapTolerance,snapPts,isSelfSnap){this.snapTolerance=snapTolerance;this.snapPts=snapPts;this.isSelfSnap=isSelfSnap||false;};SnapTransformer.prototype=new jsts.geom.util.GeometryTransformer();SnapTransformer.prototype.snapTolerance=null;SnapTransformer.prototype.snapPts=null;SnapTransformer.prototype.isSelfSnap=false;SnapTransformer.prototype.transformCoordinates=function(coords,parent){var srcPts=coords;var newPts=this.snapLine(srcPts,this.snapPts);return newPts;};SnapTransformer.prototype.snapLine=function(srcPts,snapPts){var snapper=new LineStringSnapper(srcPts,this.snapTolerance);snapper.setAllowSnappingToSourceVertices(this.isSelfSnap);return snapper.snapTo(snapPts);};var GeometrySnapper=function(srcGeom){this.srcGeom=srcGeom;};GeometrySnapper.SNAP_PRECISION_FACTOR=1e-9;GeometrySnapper.computeOverlaySnapTolerance=function(g){if(arguments.length===2){return GeometrySnapper.computeOverlaySnapTolerance2.apply(this,arguments);}
var snapTolerance=this.computeSizeBasedSnapTolerance(g);var pm=g.getPrecisionModel();if(pm.getType()==PrecisionModel.FIXED){var fixedSnapTol=(1/pm.getScale())*2/1.415;if(fixedSnapTol>snapTolerance)
snapTolerance=fixedSnapTol;}
return snapTolerance;};GeometrySnapper.computeSizeBasedSnapTolerance=function(g){var env=g.getEnvelopeInternal();var minDimension=Math.min(env.getHeight(),env.getWidth());var snapTol=minDimension*GeometrySnapper.SNAP_PRECISION_FACTOR;return snapTol;};GeometrySnapper.computeOverlaySnapTolerance2=function(g0,g1){return Math.min(this.computeOverlaySnapTolerance(g0),this.computeOverlaySnapTolerance(g1));};GeometrySnapper.snap=function(g0,g1,snapTolerance){var snapGeom=[];var snapper0=new GeometrySnapper(g0);snapGeom[0]=snapper0.snapTo(g1,snapTolerance);var snapper1=new GeometrySnapper(g1);snapGeom[1]=snapper1.snapTo(snapGeom[0],snapTolerance);return snapGeom;};GeometrySnapper.snapToSelf=function(g0,snapTolerance,cleanResult){var snapper0=new GeometrySnapper(g0);return snapper0.snapToSelf(snapTolerance,cleanResult);};GeometrySnapper.prototype.srcGeom=null;GeometrySnapper.prototype.snapTo=function(snapGeom,snapTolerance){var snapPts=this.extractTargetCoordinates(snapGeom);var snapTrans=new SnapTransformer(snapTolerance,snapPts);return snapTrans.transform(this.srcGeom);};GeometrySnapper.prototype.snapToSelf=function(snapTolerance,cleanResult){var snapPts=this.extractTargetCoordinates(srcGeom);var snapTrans=new SnapTransformer(snapTolerance,snapPts,true);var snappedGeom=snapTrans.transform(srcGeom);var result=snappedGeom;if(cleanResult&&result instanceof Polygonal){result=snappedGeom.buffer(0);}
return result;};GeometrySnapper.prototype.extractTargetCoordinates=function(g){var ptSet=new TreeSet();var pts=g.getCoordinates();for(var i=0;i<pts.length;i++){ptSet.add(pts[i]);}
return ptSet.toArray();};GeometrySnapper.prototype.computeSnapTolerance=function(ringPts){var minSegLen=this.computeMinimumSegmentLength(ringPts);var snapTol=minSegLen/10;return snapTol;};GeometrySnapper.prototype.computeMinimumSegmentLength=function(pts){var minSegLen=Number.MAX_VALUE;for(var i=0;i<pts.length-1;i++){var segLen=pts[i].distance(pts[i+1]);if(segLen<minSegLen)
minSegLen=segLen;}
return minSegLen;};jsts.operation.overlay.snap.GeometrySnapper=GeometrySnapper;})();jsts.algorithm.PointLocator=function(boundaryRule){this.boundaryRule=boundaryRule?boundaryRule:jsts.algorithm.BoundaryNodeRule.OGC_SFS_BOUNDARY_RULE;};jsts.algorithm.PointLocator.prototype.boundaryRule=null;jsts.algorithm.PointLocator.prototype.isIn=null;jsts.algorithm.PointLocator.prototype.numBoundaries=null;jsts.algorithm.PointLocator.prototype.intersects=function(p,geom){return this.locate(p,geom)!==jsts.geom.Location.EXTERIOR;};jsts.algorithm.PointLocator.prototype.locate=function(p,geom){if(geom.isEmpty())
return jsts.geom.Location.EXTERIOR;if(geom instanceof jsts.geom.Point){return this.locate2(p,geom);}else if(geom instanceof jsts.geom.LineString){return this.locate3(p,geom);}else if(geom instanceof jsts.geom.Polygon){return this.locate4(p,geom);}
this.isIn=false;this.numBoundaries=0;this.computeLocation(p,geom);if(this.boundaryRule.isInBoundary(this.numBoundaries))
return jsts.geom.Location.BOUNDARY;if(this.numBoundaries>0||this.isIn)
return jsts.geom.Location.INTERIOR;return jsts.geom.Location.EXTERIOR;};jsts.algorithm.PointLocator.prototype.computeLocation=function(p,geom){if(geom instanceof jsts.geom.Point||geom instanceof jsts.geom.LineString||geom instanceof jsts.geom.Polygon){this.updateLocationInfo(this.locate(p,geom));}else if(geom instanceof jsts.geom.MultiLineString){var ml=geom;for(var i=0;i<ml.getNumGeometries();i++){var l=ml.getGeometryN(i);this.updateLocationInfo(this.locate(p,l));}}else if(geom instanceof jsts.geom.MultiPolygon){var mpoly=geom;for(var i=0;i<mpoly.getNumGeometries();i++){var poly=mpoly.getGeometryN(i);this.updateLocationInfo(this.locate(p,poly));}}else if(geom instanceof jsts.geom.MultiPoint||geom instanceof jsts.geom.GeometryCollection){for(var i=0;i<geom.getNumGeometries();i++){var part=geom.getGeometryN(i);if(part!==geom){this.computeLocation(p,part);}}}};jsts.algorithm.PointLocator.prototype.updateLocationInfo=function(loc){if(loc===jsts.geom.Location.INTERIOR)
this.isIn=true;if(loc===jsts.geom.Location.BOUNDARY)
this.numBoundaries++;};jsts.algorithm.PointLocator.prototype.locate2=function(p,pt){var ptCoord=pt.getCoordinate();if(ptCoord.equals2D(p))
return jsts.geom.Location.INTERIOR;return jsts.geom.Location.EXTERIOR;};jsts.algorithm.PointLocator.prototype.locate3=function(p,l){if(!l.getEnvelopeInternal().intersects(p))
return jsts.geom.Location.EXTERIOR;var pt=l.getCoordinates();if(!l.isClosed()){if(p.equals(pt[0])||p.equals(pt[pt.length-1])){return jsts.geom.Location.BOUNDARY;}}
if(jsts.algorithm.CGAlgorithms.isOnLine(p,pt))
return jsts.geom.Location.INTERIOR;return jsts.geom.Location.EXTERIOR;};jsts.algorithm.PointLocator.prototype.locateInPolygonRing=function(p,ring){if(!ring.getEnvelopeInternal().intersects(p))
return jsts.geom.Location.EXTERIOR;return jsts.algorithm.CGAlgorithms.locatePointInRing(p,ring.getCoordinates());};jsts.algorithm.PointLocator.prototype.locate4=function(p,poly){if(poly.isEmpty())
return jsts.geom.Location.EXTERIOR;var shell=poly.getExteriorRing();var shellLoc=this.locateInPolygonRing(p,shell);if(shellLoc===jsts.geom.Location.EXTERIOR)
return jsts.geom.Location.EXTERIOR;if(shellLoc===jsts.geom.Location.BOUNDARY)
return jsts.geom.Location.BOUNDARY;for(var i=0;i<poly.getNumInteriorRing();i++){var hole=poly.getInteriorRingN(i);var holeLoc=this.locateInPolygonRing(p,hole);if(holeLoc===jsts.geom.Location.INTERIOR)
return jsts.geom.Location.EXTERIOR;if(holeLoc===jsts.geom.Location.BOUNDARY)
return jsts.geom.Location.BOUNDARY;}
return jsts.geom.Location.INTERIOR;};(function(){var Location=jsts.geom.Location;var ArrayList=javascript.util.ArrayList;var TreeMap=javascript.util.TreeMap;jsts.geomgraph.NodeMap=function(nodeFactory){this.nodeMap=new TreeMap();this.nodeFact=nodeFactory;};jsts.geomgraph.NodeMap.prototype.nodeMap=null;jsts.geomgraph.NodeMap.prototype.nodeFact=null;jsts.geomgraph.NodeMap.prototype.addNode=function(arg){var node,coord;if(arg instanceof jsts.geom.Coordinate){coord=arg;node=this.nodeMap.get(coord);if(node===null){node=this.nodeFact.createNode(coord);this.nodeMap.put(coord,node);}
return node;}else if(arg instanceof jsts.geomgraph.Node){var n=arg;coord=n.getCoordinate();node=this.nodeMap.get(coord);if(node===null){this.nodeMap.put(coord,n);return n;}
node.mergeLabel(n);return node;}};jsts.geomgraph.NodeMap.prototype.add=function(e){var p=e.getCoordinate();var n=this.addNode(p);n.add(e);};jsts.geomgraph.NodeMap.prototype.find=function(coord){return this.nodeMap.get(coord);};jsts.geomgraph.NodeMap.prototype.values=function(){return this.nodeMap.values();};jsts.geomgraph.NodeMap.prototype.iterator=function(){return this.values().iterator();};jsts.geomgraph.NodeMap.prototype.getBoundaryNodes=function(geomIndex){var bdyNodes=new ArrayList();for(var i=this.iterator();i.hasNext();){var node=i.next();if(node.getLabel().getLocation(geomIndex)===Location.BOUNDARY){bdyNodes.add(node);}}
return bdyNodes;};})();(function(){var ArrayList=javascript.util.ArrayList;jsts.geomgraph.PlanarGraph=function(nodeFactory){this.edges=new ArrayList();this.edgeEndList=new ArrayList();this.nodes=new jsts.geomgraph.NodeMap(nodeFactory||new jsts.geomgraph.NodeFactory());};jsts.geomgraph.PlanarGraph.prototype.edges=null;jsts.geomgraph.PlanarGraph.prototype.nodes=null;jsts.geomgraph.PlanarGraph.prototype.edgeEndList=null;jsts.geomgraph.PlanarGraph.linkResultDirectedEdges=function(nodes){for(var nodeit=nodes.iterator();nodeit.hasNext();){var node=nodeit.next();node.getEdges().linkResultDirectedEdges();}};jsts.geomgraph.PlanarGraph.prototype.getEdgeIterator=function(){return this.edges.iterator();};jsts.geomgraph.PlanarGraph.prototype.getEdgeEnds=function(){return this.edgeEndList;};jsts.geomgraph.PlanarGraph.prototype.isBoundaryNode=function(geomIndex,coord){var node=this.nodes.find(coord);if(node===null)
return false;var label=node.getLabel();if(label!==null&&label.getLocation(geomIndex)===jsts.geom.Location.BOUNDARY)
return true;return false;};jsts.geomgraph.PlanarGraph.prototype.insertEdge=function(e){this.edges.add(e);};jsts.geomgraph.PlanarGraph.prototype.add=function(e){this.nodes.add(e);this.edgeEndList.add(e);};jsts.geomgraph.PlanarGraph.prototype.getNodeIterator=function(){return this.nodes.iterator();};jsts.geomgraph.PlanarGraph.prototype.getNodes=function(){return this.nodes.values();};jsts.geomgraph.PlanarGraph.prototype.addNode=function(node){return this.nodes.addNode(node);};jsts.geomgraph.PlanarGraph.prototype.addEdges=function(edgesToAdd){for(var it=edgesToAdd.iterator();it.hasNext();){var e=it.next();this.edges.add(e);var de1=new jsts.geomgraph.DirectedEdge(e,true);var de2=new jsts.geomgraph.DirectedEdge(e,false);de1.setSym(de2);de2.setSym(de1);this.add(de1);this.add(de2);}};jsts.geomgraph.PlanarGraph.prototype.linkResultDirectedEdges=function(){for(var nodeit=this.nodes.iterator();nodeit.hasNext();){var node=nodeit.next();node.getEdges().linkResultDirectedEdges();}};jsts.geomgraph.PlanarGraph.prototype.findEdgeInSameDirection=function(p0,p1){var i=0,il=this.edges.size(),e,eCoord;for(i;i<il;i++){e=this.edges.get(i);eCoord=e.getCoordinates();if(this.matchInSameDirection(p0,p1,eCoord[0],eCoord[1])){return e;}
if(this.matchInSameDirection(p0,p1,eCoord[eCoord.length-1],eCoord[eCoord.length-2])){return e;}}
return null;};jsts.geomgraph.PlanarGraph.prototype.matchInSameDirection=function(p0,p1,ep0,ep1){if(!p0.equals(ep0)){return false;}
if(jsts.algorithm.CGAlgorithms.computeOrientation(p0,p1,ep1)===jsts.algorithm.CGAlgorithms.COLLINEAR&&jsts.geomgraph.Quadrant.quadrant(p0,p1)===jsts.geomgraph.Quadrant.quadrant(ep0,ep1)){return true;}
return false;};jsts.geomgraph.PlanarGraph.prototype.findEdgeEnd=function(e){for(var i=this.getEdgeEnds().iterator();i.hasNext();){var ee=i.next();if(ee.getEdge()===e){return ee;}}
return null;};})();jsts.noding.SegmentIntersector=function(){};jsts.noding.SegmentIntersector.prototype.processIntersections=jsts.abstractFunc;jsts.noding.SegmentIntersector.prototype.isDone=jsts.abstractFunc;(function(){var SegmentIntersector=jsts.noding.SegmentIntersector;var ArrayList=javascript.util.ArrayList;jsts.noding.InteriorIntersectionFinder=function(li){this.li=li;this.intersections=new ArrayList();this.interiorIntersection=null;};jsts.noding.InteriorIntersectionFinder.prototype=new SegmentIntersector();jsts.noding.InteriorIntersectionFinder.constructor=jsts.noding.InteriorIntersectionFinder;jsts.noding.InteriorIntersectionFinder.prototype.findAllIntersections=false;jsts.noding.InteriorIntersectionFinder.prototype.isCheckEndSegmentsOnly=false;jsts.noding.InteriorIntersectionFinder.prototype.li=null;jsts.noding.InteriorIntersectionFinder.prototype.interiorIntersection=null;jsts.noding.InteriorIntersectionFinder.prototype.intSegments=null;jsts.noding.InteriorIntersectionFinder.prototype.intersections=null;jsts.noding.InteriorIntersectionFinder.prototype.setFindAllIntersections=function(findAllIntersections){this.findAllIntersections=findAllIntersections;};jsts.noding.InteriorIntersectionFinder.prototype.getIntersections=function(){return intersections;};jsts.noding.InteriorIntersectionFinder.prototype.setCheckEndSegmentsOnly=function(isCheckEndSegmentsOnly){this.isCheckEndSegmentsOnly=isCheckEndSegmentsOnly;}
jsts.noding.InteriorIntersectionFinder.prototype.hasIntersection=function(){return this.interiorIntersection!=null;};jsts.noding.InteriorIntersectionFinder.prototype.getInteriorIntersection=function(){return this.interiorIntersection;};jsts.noding.InteriorIntersectionFinder.prototype.getIntersectionSegments=function(){return this.intSegments;};jsts.noding.InteriorIntersectionFinder.prototype.processIntersections=function(e0,segIndex0,e1,segIndex1){if(this.hasIntersection())
return;if(e0==e1&&segIndex0==segIndex1)
return;if(this.isCheckEndSegmentsOnly){var isEndSegPresent=this.isEndSegment(e0,segIndex0)||isEndSegment(e1,segIndex1);if(!isEndSegPresent)
return;}
var p00=e0.getCoordinates()[segIndex0];var p01=e0.getCoordinates()[segIndex0+1];var p10=e1.getCoordinates()[segIndex1];var p11=e1.getCoordinates()[segIndex1+1];this.li.computeIntersection(p00,p01,p10,p11);if(this.li.hasIntersection()){if(this.li.isInteriorIntersection()){this.intSegments=[];this.intSegments[0]=p00;this.intSegments[1]=p01;this.intSegments[2]=p10;this.intSegments[3]=p11;this.interiorIntersection=this.li.getIntersection(0);this.intersections.add(this.interiorIntersection);}}};jsts.noding.InteriorIntersectionFinder.prototype.isEndSegment=function(segStr,index){if(index==0)
return true;if(index>=segStr.size()-2)
return true;return false;};jsts.noding.InteriorIntersectionFinder.prototype.isDone=function(){if(this.findAllIntersections)
return false;return this.interiorIntersection!=null;};})();(function(){var RobustLineIntersector=jsts.algorithm.RobustLineIntersector;var InteriorIntersectionFinder=jsts.noding.InteriorIntersectionFinder;var MCIndexNoder=jsts.noding.MCIndexNoder;jsts.noding.FastNodingValidator=function(segStrings){this.li=new RobustLineIntersector();this.segStrings=segStrings;};jsts.noding.FastNodingValidator.prototype.li=null;jsts.noding.FastNodingValidator.prototype.segStrings=null;jsts.noding.FastNodingValidator.prototype.findAllIntersections=false;jsts.noding.FastNodingValidator.prototype.segInt=null;jsts.noding.FastNodingValidator.prototype._isValid=true;jsts.noding.FastNodingValidator.prototype.setFindAllIntersections=function(findAllIntersections){this.findAllIntersections=findAllIntersections;};jsts.noding.FastNodingValidator.prototype.getIntersections=function(){return segInt.getIntersections();};jsts.noding.FastNodingValidator.prototype.isValid=function(){this.execute();return this._isValid;};jsts.noding.FastNodingValidator.prototype.getErrorMessage=function(){if(this._isValid)
return'no intersections found';var intSegs=this.segInt.getIntersectionSegments();return'found non-noded intersection between '+
jsts.io.WKTWriter.toLineString(intSegs[0],intSegs[1])+' and '+
jsts.io.WKTWriter.toLineString(intSegs[2],intSegs[3]);};jsts.noding.FastNodingValidator.prototype.checkValid=function(){this.execute();if(!this._isValid)
throw new jsts.error.TopologyError(this.getErrorMessage(),this.segInt.getInteriorIntersection());};jsts.noding.FastNodingValidator.prototype.execute=function(){if(this.segInt!=null)
return;this.checkInteriorIntersections();};jsts.noding.FastNodingValidator.prototype.checkInteriorIntersections=function(){this._isValid=true;this.segInt=new InteriorIntersectionFinder(this.li);this.segInt.setFindAllIntersections(this.findAllIntersections);var noder=new MCIndexNoder();noder.setSegmentIntersector(this.segInt);noder.computeNodes(this.segStrings);if(this.segInt.hasIntersection()){this._isValid=false;return;}};})();(function(){jsts.noding.BasicSegmentString=function(pts,data){this.pts=pts;this.data=data;};jsts.noding.BasicSegmentString.prototype=new jsts.noding.SegmentString();jsts.noding.BasicSegmentString.prototype.pts=null;jsts.noding.BasicSegmentString.prototype.data=null;jsts.noding.BasicSegmentString.prototype.getData=function(){return this.data;}
jsts.noding.BasicSegmentString.prototype.setData=function(data){this.data=data;};jsts.noding.BasicSegmentString.prototype.size=function(){return this.pts.length;};jsts.noding.BasicSegmentString.prototype.getCoordinate=function(i){return this.pts[i];};jsts.noding.BasicSegmentString.prototype.getCoordinates=function(){return this.pts;};jsts.noding.BasicSegmentString.prototype.isClosed=function(){return this.pts[0].equals(this.pts[this.pts.length-1]);};jsts.noding.BasicSegmentString.prototype.getSegmentOctant=function(index){if(index==this.pts.length-1)
return-1;return jsts.noding.Octant.octant(this.getCoordinate(index),this.getCoordinate(index+1));};})();(function(){var FastNodingValidator=jsts.noding.FastNodingValidator;var BasicSegmentString=jsts.noding.BasicSegmentString;var ArrayList=javascript.util.ArrayList;jsts.geomgraph.EdgeNodingValidator=function(edges){this.nv=new FastNodingValidator(jsts.geomgraph.EdgeNodingValidator.toSegmentStrings(edges));};jsts.geomgraph.EdgeNodingValidator.checkValid=function(edges){var validator=new jsts.geomgraph.EdgeNodingValidator(edges);validator.checkValid();};jsts.geomgraph.EdgeNodingValidator.toSegmentStrings=function(edges){var segStrings=new ArrayList();for(var i=edges.iterator();i.hasNext();){var e=i.next();segStrings.add(new BasicSegmentString(e.getCoordinates(),e));}
return segStrings;};jsts.geomgraph.EdgeNodingValidator.prototype.nv=null;jsts.geomgraph.EdgeNodingValidator.prototype.checkValid=function(){this.nv.checkValid();};})();jsts.operation.GeometryGraphOperation=function(g0,g1,boundaryNodeRule){this.li=new jsts.algorithm.RobustLineIntersector();this.arg=[];if(g0===undefined){return;}
if(g1===undefined){this.setComputationPrecision(g0.getPrecisionModel());this.arg[0]=new jsts.geomgraph.GeometryGraph(0,g0);return;}
boundaryNodeRule=boundaryNodeRule||jsts.algorithm.BoundaryNodeRule.OGC_SFS_BOUNDARY_RULE;if(g0.getPrecisionModel().compareTo(g1.getPrecisionModel())>=0)
this.setComputationPrecision(g0.getPrecisionModel());else
this.setComputationPrecision(g1.getPrecisionModel());this.arg[0]=new jsts.geomgraph.GeometryGraph(0,g0,boundaryNodeRule);this.arg[1]=new jsts.geomgraph.GeometryGraph(1,g1,boundaryNodeRule);};jsts.operation.GeometryGraphOperation.prototype.li=null;jsts.operation.GeometryGraphOperation.prototype.resultPrecisionModel=null;jsts.operation.GeometryGraphOperation.prototype.arg=null;jsts.operation.GeometryGraphOperation.prototype.getArgGeometry=function(i){return arg[i].getGeometry();};jsts.operation.GeometryGraphOperation.prototype.setComputationPrecision=function(pm){this.resultPrecisionModel=pm;this.li.setPrecisionModel(this.resultPrecisionModel);};jsts.operation.overlay.OverlayNodeFactory=function(){};jsts.operation.overlay.OverlayNodeFactory.prototype=new jsts.geomgraph.NodeFactory();jsts.operation.overlay.OverlayNodeFactory.constructor=jsts.operation.overlay.OverlayNodeFactory;jsts.operation.overlay.OverlayNodeFactory.prototype.createNode=function(coord){return new jsts.geomgraph.Node(coord,new jsts.geomgraph.DirectedEdgeStar());};jsts.operation.overlay.PolygonBuilder=function(geometryFactory){this.shellList=[];this.geometryFactory=geometryFactory;};jsts.operation.overlay.PolygonBuilder.prototype.geometryFactory=null;jsts.operation.overlay.PolygonBuilder.prototype.shellList=null;jsts.operation.overlay.PolygonBuilder.prototype.add=function(graph){if(arguments.length===2){this.add2.apply(this,arguments);return;}
this.add2(graph.getEdgeEnds(),graph.getNodes());};jsts.operation.overlay.PolygonBuilder.prototype.add2=function(dirEdges,nodes){jsts.geomgraph.PlanarGraph.linkResultDirectedEdges(nodes);var maxEdgeRings=this.buildMaximalEdgeRings(dirEdges);var freeHoleList=[];var edgeRings=this.buildMinimalEdgeRings(maxEdgeRings,this.shellList,freeHoleList);this.sortShellsAndHoles(edgeRings,this.shellList,freeHoleList);this.placeFreeHoles(this.shellList,freeHoleList);};jsts.operation.overlay.PolygonBuilder.prototype.getPolygons=function(){var resultPolyList=this.computePolygons(this.shellList);return resultPolyList;};jsts.operation.overlay.PolygonBuilder.prototype.buildMaximalEdgeRings=function(dirEdges){var maxEdgeRings=[];for(var it=dirEdges.iterator();it.hasNext();){var de=it.next();if(de.isInResult()&&de.getLabel().isArea()){if(de.getEdgeRing()==null){var er=new jsts.operation.overlay.MaximalEdgeRing(de,this.geometryFactory);maxEdgeRings.push(er);er.setInResult();}}}
return maxEdgeRings;};jsts.operation.overlay.PolygonBuilder.prototype.buildMinimalEdgeRings=function(maxEdgeRings,shellList,freeHoleList){var edgeRings=[];for(var i=0;i<maxEdgeRings.length;i++){var er=maxEdgeRings[i];if(er.getMaxNodeDegree()>2){er.linkDirectedEdgesForMinimalEdgeRings();var minEdgeRings=er.buildMinimalRings();var shell=this.findShell(minEdgeRings);if(shell!==null){this.placePolygonHoles(shell,minEdgeRings);shellList.push(shell);}else{freeHoleList=freeHoleList.concat(minEdgeRings);}}else{edgeRings.push(er);}}
return edgeRings;};jsts.operation.overlay.PolygonBuilder.prototype.findShell=function(minEdgeRings){var shellCount=0;var shell=null;for(var i=0;i<minEdgeRings.length;i++){var er=minEdgeRings[i];if(!er.isHole()){shell=er;shellCount++;}}
jsts.util.Assert.isTrue(shellCount<=1,'found two shells in MinimalEdgeRing list');return shell;};jsts.operation.overlay.PolygonBuilder.prototype.placePolygonHoles=function(shell,minEdgeRings){for(var i=0;i<minEdgeRings.length;i++){var er=minEdgeRings[i];if(er.isHole()){er.setShell(shell);}}};jsts.operation.overlay.PolygonBuilder.prototype.sortShellsAndHoles=function(edgeRings,shellList,freeHoleList){for(var i=0;i<edgeRings.length;i++){var er=edgeRings[i];if(er.isHole()){freeHoleList.push(er);}else{shellList.push(er);}}};jsts.operation.overlay.PolygonBuilder.prototype.placeFreeHoles=function(shellList,freeHoleList){for(var i=0;i<freeHoleList.length;i++){var hole=freeHoleList[i];if(hole.getShell()==null){var shell=this.findEdgeRingContaining(hole,shellList);if(shell===null)
throw new jsts.error.TopologyError('unable to assign hole to a shell',hole.getCoordinate(0));hole.setShell(shell);}}};jsts.operation.overlay.PolygonBuilder.prototype.findEdgeRingContaining=function(testEr,shellList){var testRing=testEr.getLinearRing();var testEnv=testRing.getEnvelopeInternal();var testPt=testRing.getCoordinateN(0);var minShell=null;var minEnv=null;for(var i=0;i<shellList.length;i++){var tryShell=shellList[i];var tryRing=tryShell.getLinearRing();var tryEnv=tryRing.getEnvelopeInternal();if(minShell!==null)
minEnv=minShell.getLinearRing().getEnvelopeInternal();var isContained=false;if(tryEnv.contains(testEnv)&&jsts.algorithm.CGAlgorithms.isPointInRing(testPt,tryRing.getCoordinates()))
isContained=true;if(isContained){if(minShell==null||minEnv.contains(tryEnv)){minShell=tryShell;}}}
return minShell;};jsts.operation.overlay.PolygonBuilder.prototype.computePolygons=function(shellList){var resultPolyList=new javascript.util.ArrayList();for(var i=0;i<shellList.length;i++){var er=shellList[i];var poly=er.toPolygon(this.geometryFactory);resultPolyList.add(poly);}
return resultPolyList;};jsts.operation.overlay.PolygonBuilder.prototype.containsPoint=function(p){for(var i=0;i<this.shellList.length;i++){var er=this.shellList[i];if(er.containsPoint(p))
return true;}
return false;};(function(){var Assert=jsts.util.Assert;var ArrayList=javascript.util.ArrayList;var LineBuilder=function(op,geometryFactory,ptLocator){this.lineEdgesList=new ArrayList();this.resultLineList=new ArrayList();this.op=op;this.geometryFactory=geometryFactory;this.ptLocator=ptLocator;};LineBuilder.prototype.op=null;LineBuilder.prototype.geometryFactory=null;LineBuilder.prototype.ptLocator=null;LineBuilder.prototype.lineEdgesList=null;LineBuilder.prototype.resultLineList=null;LineBuilder.prototype.build=function(opCode){this.findCoveredLineEdges();this.collectLines(opCode);this.buildLines(opCode);return this.resultLineList;};LineBuilder.prototype.findCoveredLineEdges=function(){for(var nodeit=this.op.getGraph().getNodes().iterator();nodeit.hasNext();){var node=nodeit.next();node.getEdges().findCoveredLineEdges();}
for(var it=this.op.getGraph().getEdgeEnds().iterator();it.hasNext();){var de=it.next();var e=de.getEdge();if(de.isLineEdge()&&!e.isCoveredSet()){var isCovered=this.op.isCoveredByA(de.getCoordinate());e.setCovered(isCovered);}}};LineBuilder.prototype.collectLines=function(opCode){for(var it=this.op.getGraph().getEdgeEnds().iterator();it.hasNext();){var de=it.next();this.collectLineEdge(de,opCode,this.lineEdgesList);this.collectBoundaryTouchEdge(de,opCode,this.lineEdgesList);}};LineBuilder.prototype.collectLineEdge=function(de,opCode,edges){var label=de.getLabel();var e=de.getEdge();if(de.isLineEdge()){if(!de.isVisited()&&jsts.operation.overlay.OverlayOp.isResultOfOp(label,opCode)&&!e.isCovered()){edges.add(e);de.setVisitedEdge(true);}}};LineBuilder.prototype.collectBoundaryTouchEdge=function(de,opCode,edges){var label=de.getLabel();if(de.isLineEdge())
return;if(de.isVisited())
return;if(de.isInteriorAreaEdge())
return;if(de.getEdge().isInResult())
return;Assert.isTrue(!(de.isInResult()||de.getSym().isInResult())||!de.getEdge().isInResult());if(jsts.operation.overlay.OverlayOp.isResultOfOp(label,opCode)&&opCode===jsts.operation.overlay.OverlayOp.INTERSECTION){edges.add(de.getEdge());de.setVisitedEdge(true);}};LineBuilder.prototype.buildLines=function(opCode){for(var it=this.lineEdgesList.iterator();it.hasNext();){var e=it.next();var label=e.getLabel();var line=this.geometryFactory.createLineString(e.getCoordinates());this.resultLineList.add(line);e.setInResult(true);}};LineBuilder.prototype.labelIsolatedLines=function(edgesList){for(var it=edgesList.iterator();it.hasNext();){var e=it.next();var label=e.getLabel();if(e.isIsolated()){if(label.isNull(0))
this.labelIsolatedLine(e,0);else
this.labelIsolatedLine(e,1);}}};LineBuilder.prototype.labelIsolatedLine=function(e,targetIndex){var loc=ptLocator.locate(e.getCoordinate(),op.getArgGeometry(targetIndex));e.getLabel().setLocation(targetIndex,loc);};jsts.operation.overlay.LineBuilder=LineBuilder;})();(function(){var ArrayList=javascript.util.ArrayList;var PointBuilder=function(op,geometryFactory,ptLocator){this.resultPointList=new ArrayList();this.op=op;this.geometryFactory=geometryFactory;};PointBuilder.prototype.op=null;PointBuilder.prototype.geometryFactory=null;PointBuilder.prototype.resultPointList=null;PointBuilder.prototype.build=function(opCode){this.extractNonCoveredResultNodes(opCode);return this.resultPointList;};PointBuilder.prototype.extractNonCoveredResultNodes=function(opCode){for(var nodeit=this.op.getGraph().getNodes().iterator();nodeit.hasNext();){var n=nodeit.next();if(n.isInResult())
continue;if(n.isIncidentEdgeInResult())
continue;if(n.getEdges().getDegree()===0||opCode===jsts.operation.overlay.OverlayOp.INTERSECTION){var label=n.getLabel();if(jsts.operation.overlay.OverlayOp.isResultOfOp(label,opCode)){this.filterCoveredNodeToPoint(n);}}}};PointBuilder.prototype.filterCoveredNodeToPoint=function(n){var coord=n.getCoordinate();if(!this.op.isCoveredByLA(coord)){var pt=this.geometryFactory.createPoint(coord);this.resultPointList.add(pt);}};jsts.operation.overlay.PointBuilder=PointBuilder;})();(function(){var PointLocator=jsts.algorithm.PointLocator;var Location=jsts.geom.Location;var EdgeList=jsts.geomgraph.EdgeList;var Label=jsts.geomgraph.Label;var PlanarGraph=jsts.geomgraph.PlanarGraph;var Position=jsts.geomgraph.Position;var EdgeNodingValidator=jsts.geomgraph.EdgeNodingValidator;var GeometryGraphOperation=jsts.operation.GeometryGraphOperation;var OverlayNodeFactory=jsts.operation.overlay.OverlayNodeFactory;var PolygonBuilder=jsts.operation.overlay.PolygonBuilder;var LineBuilder=jsts.operation.overlay.LineBuilder;var PointBuilder=jsts.operation.overlay.PointBuilder;var Assert=jsts.util.Assert;var ArrayList=javascript.util.ArrayList;jsts.operation.overlay.OverlayOp=function(g0,g1){this.ptLocator=new PointLocator();this.edgeList=new EdgeList();this.resultPolyList=new ArrayList();this.resultLineList=new ArrayList();this.resultPointList=new ArrayList();GeometryGraphOperation.call(this,g0,g1);this.graph=new PlanarGraph(new OverlayNodeFactory());this.geomFact=g0.getFactory();};jsts.operation.overlay.OverlayOp.prototype=new GeometryGraphOperation();jsts.operation.overlay.OverlayOp.constructor=jsts.operation.overlay.OverlayOp;jsts.operation.overlay.OverlayOp.INTERSECTION=1;jsts.operation.overlay.OverlayOp.UNION=2;jsts.operation.overlay.OverlayOp.DIFFERENCE=3;jsts.operation.overlay.OverlayOp.SYMDIFFERENCE=4;jsts.operation.overlay.OverlayOp.overlayOp=function(geom0,geom1,opCode){var gov=new jsts.operation.overlay.OverlayOp(geom0,geom1);var geomOv=gov.getResultGeometry(opCode);return geomOv;}
jsts.operation.overlay.OverlayOp.isResultOfOp=function(label,opCode){if(arguments.length===3){return jsts.operation.overlay.OverlayOp.isResultOfOp2.apply(this,arguments);}
var loc0=label.getLocation(0);var loc1=label.getLocation(1);return jsts.operation.overlay.OverlayOp.isResultOfOp2(loc0,loc1,opCode);}
jsts.operation.overlay.OverlayOp.isResultOfOp2=function(loc0,loc1,opCode){if(loc0==Location.BOUNDARY)
loc0=Location.INTERIOR;if(loc1==Location.BOUNDARY)
loc1=Location.INTERIOR;switch(opCode){case jsts.operation.overlay.OverlayOp.INTERSECTION:return loc0==Location.INTERIOR&&loc1==Location.INTERIOR;case jsts.operation.overlay.OverlayOp.UNION:return loc0==Location.INTERIOR||loc1==Location.INTERIOR;case jsts.operation.overlay.OverlayOp.DIFFERENCE:return loc0==Location.INTERIOR&&loc1!=Location.INTERIOR;case jsts.operation.overlay.OverlayOp.SYMDIFFERENCE:return(loc0==Location.INTERIOR&&loc1!=Location.INTERIOR)||(loc0!=Location.INTERIOR&&loc1==Location.INTERIOR);}
return false;}
jsts.operation.overlay.OverlayOp.prototype.ptLocator=null;jsts.operation.overlay.OverlayOp.prototype.geomFact=null;jsts.operation.overlay.OverlayOp.prototype.resultGeom=null;jsts.operation.overlay.OverlayOp.prototype.graph=null;jsts.operation.overlay.OverlayOp.prototype.edgeList=null;jsts.operation.overlay.OverlayOp.prototype.resultPolyList=null;jsts.operation.overlay.OverlayOp.prototype.resultLineList=null;jsts.operation.overlay.OverlayOp.prototype.resultPointList=null;jsts.operation.overlay.OverlayOp.prototype.getResultGeometry=function(funcCode){this.computeOverlay(funcCode);return this.resultGeom;}
jsts.operation.overlay.OverlayOp.prototype.getGraph=function(){return this.graph;}
jsts.operation.overlay.OverlayOp.prototype.computeOverlay=function(opCode){this.copyPoints(0);this.copyPoints(1);this.arg[0].computeSelfNodes(this.li,false);this.arg[1].computeSelfNodes(this.li,false);this.arg[0].computeEdgeIntersections(this.arg[1],this.li,true);var baseSplitEdges=new ArrayList();this.arg[0].computeSplitEdges(baseSplitEdges);this.arg[1].computeSplitEdges(baseSplitEdges);var splitEdges=baseSplitEdges;this.insertUniqueEdges(baseSplitEdges);this.computeLabelsFromDepths();this.replaceCollapsedEdges();EdgeNodingValidator.checkValid(this.edgeList.getEdges());this.graph.addEdges(this.edgeList.getEdges());this.computeLabelling();this.labelIncompleteNodes();this.findResultAreaEdges(opCode);this.cancelDuplicateResultEdges();var polyBuilder=new PolygonBuilder(this.geomFact);polyBuilder.add(this.graph);this.resultPolyList=polyBuilder.getPolygons();var lineBuilder=new LineBuilder(this,this.geomFact,this.ptLocator);this.resultLineList=lineBuilder.build(opCode);var pointBuilder=new PointBuilder(this,this.geomFact,this.ptLocator);this.resultPointList=pointBuilder.build(opCode);this.resultGeom=this.computeGeometry(this.resultPointList,this.resultLineList,this.resultPolyList,opCode);}
jsts.operation.overlay.OverlayOp.prototype.insertUniqueEdges=function(edges){for(var i=edges.iterator();i.hasNext();){var e=i.next();this.insertUniqueEdge(e);}}
jsts.operation.overlay.OverlayOp.prototype.insertUniqueEdge=function(e){var existingEdge=this.edgeList.findEqualEdge(e);if(existingEdge!==null){var existingLabel=existingEdge.getLabel();var labelToMerge=e.getLabel();if(!existingEdge.isPointwiseEqual(e)){labelToMerge=new Label(e.getLabel());labelToMerge.flip();}
var depth=existingEdge.getDepth();if(depth.isNull()){depth.add(existingLabel);}
depth.add(labelToMerge);existingLabel.merge(labelToMerge);}else{this.edgeList.add(e);}};jsts.operation.overlay.OverlayOp.prototype.computeLabelsFromDepths=function(){for(var it=this.edgeList.iterator();it.hasNext();){var e=it.next();var lbl=e.getLabel();var depth=e.getDepth();if(!depth.isNull()){depth.normalize();for(var i=0;i<2;i++){if(!lbl.isNull(i)&&lbl.isArea()&&!depth.isNull(i)){if(depth.getDelta(i)==0){lbl.toLine(i);}else{Assert.isTrue(!depth.isNull(i,Position.LEFT),'depth of LEFT side has not been initialized');lbl.setLocation(i,Position.LEFT,depth.getLocation(i,Position.LEFT));Assert.isTrue(!depth.isNull(i,Position.RIGHT),'depth of RIGHT side has not been initialized');lbl.setLocation(i,Position.RIGHT,depth.getLocation(i,Position.RIGHT));}}}}}}
jsts.operation.overlay.OverlayOp.prototype.replaceCollapsedEdges=function(){var newEdges=new ArrayList();for(var it=this.edgeList.iterator();it.hasNext();){var e=it.next();if(e.isCollapsed()){it.remove();newEdges.add(e.getCollapsedEdge());}}
this.edgeList.addAll(newEdges);}
jsts.operation.overlay.OverlayOp.prototype.copyPoints=function(argIndex){for(var i=this.arg[argIndex].getNodeIterator();i.hasNext();){var graphNode=i.next();var newNode=this.graph.addNode(graphNode.getCoordinate());newNode.setLabel(argIndex,graphNode.getLabel().getLocation(argIndex));}}
jsts.operation.overlay.OverlayOp.prototype.computeLabelling=function(){for(var nodeit=this.graph.getNodes().iterator();nodeit.hasNext();){var node=nodeit.next();node.getEdges().computeLabelling(this.arg);}
this.mergeSymLabels();this.updateNodeLabelling();}
jsts.operation.overlay.OverlayOp.prototype.mergeSymLabels=function(){for(var nodeit=this.graph.getNodes().iterator();nodeit.hasNext();){var node=nodeit.next();node.getEdges().mergeSymLabels();}}
jsts.operation.overlay.OverlayOp.prototype.updateNodeLabelling=function(){for(var nodeit=this.graph.getNodes().iterator();nodeit.hasNext();){var node=nodeit.next();var lbl=node.getEdges().getLabel();node.getLabel().merge(lbl);}}
jsts.operation.overlay.OverlayOp.prototype.labelIncompleteNodes=function(){var nodeCount=0;for(var ni=this.graph.getNodes().iterator();ni.hasNext();){var n=ni.next();var label=n.getLabel();if(n.isIsolated()){nodeCount++;if(label.isNull(0))
this.labelIncompleteNode(n,0);else
this.labelIncompleteNode(n,1);}
n.getEdges().updateLabelling(label);}};jsts.operation.overlay.OverlayOp.prototype.labelIncompleteNode=function(n,targetIndex){var loc=this.ptLocator.locate(n.getCoordinate(),this.arg[targetIndex].getGeometry());n.getLabel().setLocation(targetIndex,loc);};jsts.operation.overlay.OverlayOp.prototype.findResultAreaEdges=function(opCode){for(var it=this.graph.getEdgeEnds().iterator();it.hasNext();){var de=it.next();var label=de.getLabel();if(label.isArea()&&!de.isInteriorAreaEdge()&&jsts.operation.overlay.OverlayOp.isResultOfOp(label.getLocation(0,Position.RIGHT),label.getLocation(1,Position.RIGHT),opCode)){de.setInResult(true);}}};jsts.operation.overlay.OverlayOp.prototype.cancelDuplicateResultEdges=function(){for(var it=this.graph.getEdgeEnds().iterator();it.hasNext();){var de=it.next();var sym=de.getSym();if(de.isInResult()&&sym.isInResult()){de.setInResult(false);sym.setInResult(false);}}};jsts.operation.overlay.OverlayOp.prototype.isCoveredByLA=function(coord){if(this.isCovered(coord,this.resultLineList))
return true;if(this.isCovered(coord,this.resultPolyList))
return true;return false;};jsts.operation.overlay.OverlayOp.prototype.isCoveredByA=function(coord){if(this.isCovered(coord,this.resultPolyList))
return true;return false;};jsts.operation.overlay.OverlayOp.prototype.isCovered=function(coord,geomList){for(var it=geomList.iterator();it.hasNext();){var geom=it.next();var loc=this.ptLocator.locate(coord,geom);if(loc!=Location.EXTERIOR)
return true;}
return false;};jsts.operation.overlay.OverlayOp.prototype.computeGeometry=function(resultPointList,resultLineList,resultPolyList,opcode){var geomList=new ArrayList();geomList.addAll(resultPointList);geomList.addAll(resultLineList);geomList.addAll(resultPolyList);return this.geomFact.buildGeometry(geomList);};jsts.operation.overlay.OverlayOp.prototype.createEmptyResult=function(opCode){var result=null;switch(resultDimension(opCode,this.arg[0].getGeometry(),this.arg[1].getGeometry())){case-1:result=geomFact.createGeometryCollection();break;case 0:result=geomFact.createPoint(null);break;case 1:result=geomFact.createLineString(null);break;case 2:result=geomFact.createPolygon(null,null);break;}
return result;};jsts.operation.overlay.OverlayOp.prototype.resultDimension=function(opCode,g0,g1){var dim0=g0.getDimension();var dim1=g1.getDimension();var resultDimension=-1;switch(opCode){case jsts.operation.overlay.OverlayOp.INTERSECTION:resultDimension=Math.min(dim0,dim1);break;case jsts.operation.overlay.OverlayOp.UNION:resultDimension=Math.max(dim0,dim1);break;case jsts.operation.overlay.OverlayOp.DIFFERENCE:resultDimension=dim0;break;case jsts.operation.overlay.OverlayOp.SYMDIFFERENCE:resultDimension=Math.max(dim0,dim1);break;}
return resultDimension;};})();(function(){var OverlayOp=jsts.operation.overlay.OverlayOp;var GeometrySnapper=jsts.operation.overlay.snap.GeometrySnapper;var SnapOverlayOp=function(g1,g2){this.geom=[];this.geom[0]=g1;this.geom[1]=g2;this.computeSnapTolerance();};SnapOverlayOp.overlayOp=function(g0,g1,opCode){var op=new SnapOverlayOp(g0,g1);return op.getResultGeometry(opCode);};SnapOverlayOp.intersection=function(g0,g1){return this.overlayOp(g0,g1,OverlayOp.INTERSECTION);};SnapOverlayOp.union=function(g0,g1){return this.overlayOp(g0,g1,OverlayOp.UNION);};SnapOverlayOp.difference=function(g0,g1){return overlayOp(g0,g1,OverlayOp.DIFFERENCE);};SnapOverlayOp.symDifference=function(g0,g1){return overlayOp(g0,g1,OverlayOp.SYMDIFFERENCE);};SnapOverlayOp.prototype.geom=null;SnapOverlayOp.prototype.snapTolerance=null;SnapOverlayOp.prototype.computeSnapTolerance=function(){this.snapTolerance=GeometrySnapper.computeOverlaySnapTolerance(this.geom[0],this.geom[1]);};SnapOverlayOp.prototype.getResultGeometry=function(opCode){var prepGeom=this.snap(this.geom);var result=OverlayOp.overlayOp(prepGeom[0],prepGeom[1],opCode);return this.prepareResult(result);};SnapOverlayOp.prototype.selfSnap=function(geom){var snapper0=new GeometrySnapper(geom);var snapGeom=snapper0.snapTo(geom,this.snapTolerance);return snapGeom;};SnapOverlayOp.prototype.snap=function(geom){var remGeom=geom;var snapGeom=GeometrySnapper.snap(remGeom[0],remGeom[1],this.snapTolerance);return snapGeom;};SnapOverlayOp.prototype.prepareResult=function(geom){return geom;};SnapOverlayOp.prototype.cbr=null;SnapOverlayOp.prototype.removeCommonBits=function(geom){this.cbr=new jsts.precision.CommonBitsRemover();this.cbr.add(this.geom[0]);this.cbr.add(this.geom[1]);var remGeom=[];remGeom[0]=cbr.removeCommonBits(this.geom[0].clone());remGeom[1]=cbr.removeCommonBits(this.geom[1].clone());return remGeom;};jsts.operation.overlay.snap.SnapOverlayOp=SnapOverlayOp;})();jsts.geomgraph.index.EdgeSetIntersector=function(){};jsts.geomgraph.index.EdgeSetIntersector.prototype.computeIntersections=function(edges,si,testAllSegments){throw new jsts.error.AbstractMethodInvocationError();};jsts.geomgraph.index.EdgeSetIntersector.prototype.computeIntersections2=function(edges0,edges1,si){throw new jsts.error.AbstractMethodInvocationError();};jsts.geomgraph.index.SimpleMCSweepLineIntersector=function(){this.events=[];};jsts.geomgraph.index.SimpleMCSweepLineIntersector.prototype=new jsts.geomgraph.index.EdgeSetIntersector();jsts.geomgraph.index.SimpleMCSweepLineIntersector.prototype.events=null;jsts.geomgraph.index.SimpleMCSweepLineIntersector.prototype.nOverlaps=0;jsts.geomgraph.index.SimpleMCSweepLineIntersector.prototype.computeIntersections=function(edges,si,testAllSegments){if(si instanceof javascript.util.List){this.computeIntersections2.apply(this,arguments);return;}
if(testAllSegments){this.addList2(edges,null);}else{this.addList(edges);}
this.computeIntersections3(si);};jsts.geomgraph.index.SimpleMCSweepLineIntersector.prototype.computeIntersections2=function(edges0,edges1,si){this.addList2(edges0,edges0);this.addList2(edges1,edges1);this.computeIntersections3(si);};jsts.geomgraph.index.SimpleMCSweepLineIntersector.prototype.add=function(edge,edgeSet){if(edge instanceof javascript.util.List){this.addList.apply(this,arguments);return;}
var mce=edge.getMonotoneChainEdge();var startIndex=mce.getStartIndexes();for(var i=0;i<startIndex.length-1;i++){var mc=new jsts.geomgraph.index.MonotoneChain(mce,i);var insertEvent=new jsts.geomgraph.index.SweepLineEvent(mce.getMinX(i),mc,edgeSet);this.events.push(insertEvent);this.events.push(new jsts.geomgraph.index.SweepLineEvent(mce.getMaxX(i),insertEvent));}};jsts.geomgraph.index.SimpleMCSweepLineIntersector.prototype.addList=function(edges){for(var i=edges.iterator();i.hasNext();){var edge=i.next();this.add(edge,edge);}};jsts.geomgraph.index.SimpleMCSweepLineIntersector.prototype.addList2=function(edges,edgeSet){for(var i=edges.iterator();i.hasNext();){var edge=i.next();this.add(edge,edgeSet);}};jsts.geomgraph.index.SimpleMCSweepLineIntersector.prototype.prepareEvents=function(){this.events.sort(function(a,b){return a.compareTo(b);});for(var i=0;i<this.events.length;i++){var ev=this.events[i];if(ev.isDelete()){ev.getInsertEvent().setDeleteEventIndex(i);}}};jsts.geomgraph.index.SimpleMCSweepLineIntersector.prototype.computeIntersections3=function(si){this.nOverlaps=0;this.prepareEvents();for(var i=0;i<this.events.length;i++){var ev=this.events[i];if(ev.isInsert()){this.processOverlaps(i,ev.getDeleteEventIndex(),ev,si);}}};jsts.geomgraph.index.SimpleMCSweepLineIntersector.prototype.processOverlaps=function(start,end,ev0,si){var mc0=ev0.getObject();for(var i=start;i<end;i++){var ev1=this.events[i];if(ev1.isInsert()){var mc1=ev1.getObject();if(!ev0.isSameLabel(ev1)){mc0.computeIntersections(mc1,si);this.nOverlaps++;}}}};jsts.algorithm.locate.SimplePointInAreaLocator=function(geom){this.geom=geom;};jsts.algorithm.locate.SimplePointInAreaLocator.locate=function(p,geom){if(geom.isEmpty())
return jsts.geom.Location.EXTERIOR;if(jsts.algorithm.locate.SimplePointInAreaLocator.containsPoint(p,geom))
return jsts.geom.Location.INTERIOR;return jsts.geom.Location.EXTERIOR;};jsts.algorithm.locate.SimplePointInAreaLocator.containsPoint=function(p,geom){if(geom instanceof jsts.geom.Polygon){return jsts.algorithm.locate.SimplePointInAreaLocator.containsPointInPolygon(p,geom);}else if(geom instanceof jsts.geom.GeometryCollection||geom instanceof jsts.geom.MultiPoint||geom instanceof jsts.geom.MultiLineString||geom instanceof jsts.geom.MultiPolygon){for(var i=0;i<geom.geometries.length;i++){var g2=geom.geometries[i];if(g2!==geom)
if(jsts.algorithm.locate.SimplePointInAreaLocator.containsPoint(p,g2))
return true;}}
return false;};jsts.algorithm.locate.SimplePointInAreaLocator.containsPointInPolygon=function(p,poly){if(poly.isEmpty())
return false;var shell=poly.getExteriorRing();if(!jsts.algorithm.locate.SimplePointInAreaLocator.isPointInRing(p,shell))
return false;for(var i=0;i<poly.getNumInteriorRing();i++){var hole=poly.getInteriorRingN(i);if(jsts.algorithm.locate.SimplePointInAreaLocator.isPointInRing(p,hole))
return false;}
return true;};jsts.algorithm.locate.SimplePointInAreaLocator.isPointInRing=function(p,ring){if(!ring.getEnvelopeInternal().intersects(p))
return false;return jsts.algorithm.CGAlgorithms.isPointInRing(p,ring.getCoordinates());};jsts.algorithm.locate.SimplePointInAreaLocator.prototype.geom=null;jsts.algorithm.locate.SimplePointInAreaLocator.prototype.locate=function(p){return jsts.algorithm.locate.SimplePointInAreaLocator.locate(p,geom);};(function(){var Location=jsts.geom.Location;var Position=jsts.geomgraph.Position;var EdgeEndStar=jsts.geomgraph.EdgeEndStar;var Assert=jsts.util.Assert;jsts.geomgraph.DirectedEdgeStar=function(){jsts.geomgraph.EdgeEndStar.call(this);};jsts.geomgraph.DirectedEdgeStar.prototype=new EdgeEndStar();jsts.geomgraph.DirectedEdgeStar.constructor=jsts.geomgraph.DirectedEdgeStar;jsts.geomgraph.DirectedEdgeStar.prototype.resultAreaEdgeList=null;jsts.geomgraph.DirectedEdgeStar.prototype.label=null;jsts.geomgraph.DirectedEdgeStar.prototype.insert=function(ee){var de=ee;this.insertEdgeEnd(de,de);};jsts.geomgraph.DirectedEdgeStar.prototype.getLabel=function(){return this.label;};jsts.geomgraph.DirectedEdgeStar.prototype.getOutgoingDegree=function(){var degree=0;for(var it=this.iterator();it.hasNext();){var de=it.next();if(de.isInResult())
degree++;}
return degree;};jsts.geomgraph.DirectedEdgeStar.prototype.getOutgoingDegree=function(er){var degree=0;for(var it=this.iterator();it.hasNext();){var de=it.next();if(de.getEdgeRing()===er)
degree++;}
return degree;};jsts.geomgraph.DirectedEdgeStar.prototype.getRightmostEdge=function(){var edges=this.getEdges();var size=edges.size();if(size<1)
return null;var de0=edges.get(0);if(size==1)
return de0;var deLast=edges.get(size-1);var quad0=de0.getQuadrant();var quad1=deLast.getQuadrant();if(jsts.geomgraph.Quadrant.isNorthern(quad0)&&jsts.geomgraph.Quadrant.isNorthern(quad1))
return de0;else if(!jsts.geomgraph.Quadrant.isNorthern(quad0)&&!jsts.geomgraph.Quadrant.isNorthern(quad1))
return deLast;else{var nonHorizontalEdge=null;if(de0.getDy()!=0)
return de0;else if(deLast.getDy()!=0)
return deLast;}
Assert.shouldNeverReachHere('found two horizontal edges incident on node');return null;};jsts.geomgraph.DirectedEdgeStar.prototype.computeLabelling=function(geom){EdgeEndStar.prototype.computeLabelling.call(this,geom);this.label=new jsts.geomgraph.Label(Location.NONE);for(var it=this.iterator();it.hasNext();){var ee=it.next();var e=ee.getEdge();var eLabel=e.getLabel();for(var i=0;i<2;i++){var eLoc=eLabel.getLocation(i);if(eLoc===Location.INTERIOR||eLoc===Location.BOUNDARY)
this.label.setLocation(i,Location.INTERIOR);}}};jsts.geomgraph.DirectedEdgeStar.prototype.mergeSymLabels=function(){for(var it=this.iterator();it.hasNext();){var de=it.next();var label=de.getLabel();label.merge(de.getSym().getLabel());}};jsts.geomgraph.DirectedEdgeStar.prototype.updateLabelling=function(nodeLabel){for(var it=this.iterator();it.hasNext();){var de=it.next();var label=de.getLabel();label.setAllLocationsIfNull(0,nodeLabel.getLocation(0));label.setAllLocationsIfNull(1,nodeLabel.getLocation(1));}};jsts.geomgraph.DirectedEdgeStar.prototype.getResultAreaEdges=function(){if(this.resultAreaEdgeList!==null)
return this.resultAreaEdgeList;this.resultAreaEdgeList=new javascript.util.ArrayList();for(var it=this.iterator();it.hasNext();){var de=it.next();if(de.isInResult()||de.getSym().isInResult())
this.resultAreaEdgeList.add(de);}
return this.resultAreaEdgeList;};jsts.geomgraph.DirectedEdgeStar.prototype.SCANNING_FOR_INCOMING=1;jsts.geomgraph.DirectedEdgeStar.prototype.LINKING_TO_OUTGOING=2;jsts.geomgraph.DirectedEdgeStar.prototype.linkResultDirectedEdges=function(){this.getResultAreaEdges();var firstOut=null;var incoming=null;var state=this.SCANNING_FOR_INCOMING;for(var i=0;i<this.resultAreaEdgeList.size();i++){var nextOut=this.resultAreaEdgeList.get(i);var nextIn=nextOut.getSym();if(!nextOut.getLabel().isArea())
continue;if(firstOut===null&&nextOut.isInResult())
firstOut=nextOut;switch(state){case this.SCANNING_FOR_INCOMING:if(!nextIn.isInResult())
continue;incoming=nextIn;state=this.LINKING_TO_OUTGOING;break;case this.LINKING_TO_OUTGOING:if(!nextOut.isInResult())
continue;incoming.setNext(nextOut);state=this.SCANNING_FOR_INCOMING;break;}}
if(state===this.LINKING_TO_OUTGOING){if(firstOut===null)
throw new jsts.error.TopologyError('no outgoing dirEdge found',this.getCoordinate());Assert.isTrue(firstOut.isInResult(),'unable to link last incoming dirEdge');incoming.setNext(firstOut);}};jsts.geomgraph.DirectedEdgeStar.prototype.linkMinimalDirectedEdges=function(er){var firstOut=null;var incoming=null;var state=this.SCANNING_FOR_INCOMING;for(var i=this.resultAreaEdgeList.size()-1;i>=0;i--){var nextOut=this.resultAreaEdgeList.get(i);var nextIn=nextOut.getSym();if(firstOut===null&&nextOut.getEdgeRing()===er)
firstOut=nextOut;switch(state){case this.SCANNING_FOR_INCOMING:if(nextIn.getEdgeRing()!=er)
continue;incoming=nextIn;state=this.LINKING_TO_OUTGOING;break;case this.LINKING_TO_OUTGOING:if(nextOut.getEdgeRing()!==er)
continue;incoming.setNextMin(nextOut);state=this.SCANNING_FOR_INCOMING;break;}}
if(state===this.LINKING_TO_OUTGOING){Assert.isTrue(firstOut!==null,'found null for first outgoing dirEdge');Assert.isTrue(firstOut.getEdgeRing()===er,'unable to link last incoming dirEdge');incoming.setNextMin(firstOut);}};jsts.geomgraph.DirectedEdgeStar.prototype.linkAllDirectedEdges=function(){this.getEdges();var prevOut=null;var firstIn=null;for(var i=this.edgeList.size()-1;i>=0;i--){var nextOut=this.edgeList.get(i);var nextIn=nextOut.getSym();if(firstIn===null)
firstIn=nextIn;if(prevOut!==null)
nextIn.setNext(prevOut);prevOut=nextOut;}
firstIn.setNext(prevOut);};jsts.geomgraph.DirectedEdgeStar.prototype.findCoveredLineEdges=function(){var startLoc=Location.NONE;for(var it=this.iterator();it.hasNext();){var nextOut=it.next();var nextIn=nextOut.getSym();if(!nextOut.isLineEdge()){if(nextOut.isInResult()){startLoc=Location.INTERIOR;break;}
if(nextIn.isInResult()){startLoc=Location.EXTERIOR;break;}}}
if(startLoc===Location.NONE)
return;var currLoc=startLoc;for(var it=this.iterator();it.hasNext();){var nextOut=it.next();var nextIn=nextOut.getSym();if(nextOut.isLineEdge()){nextOut.getEdge().setCovered(currLoc===Location.INTERIOR);}else{if(nextOut.isInResult())
currLoc=Location.EXTERIOR;if(nextIn.isInResult())
currLoc=Location.INTERIOR;}}};jsts.geomgraph.DirectedEdgeStar.prototype.computeDepths=function(de){if(arguments.length===2){this.computeDepths2.apply(this,arguments);return;}
var edgeIndex=this.findIndex(de);var label=de.getLabel();var startDepth=de.getDepth(Position.LEFT);var targetLastDepth=de.getDepth(Position.RIGHT);var nextDepth=this.computeDepths2(edgeIndex+1,this.edgeList.size(),startDepth);var lastDepth=this.computeDepths2(0,edgeIndex,nextDepth);if(lastDepth!=targetLastDepth)
throw new jsts.error.TopologyError('depth mismatch at '+
de.getCoordinate());};jsts.geomgraph.DirectedEdgeStar.prototype.computeDepths2=function(startIndex,endIndex,startDepth){var currDepth=startDepth;for(var i=startIndex;i<endIndex;i++){var nextDe=this.edgeList.get(i);var label=nextDe.getLabel();nextDe.setEdgeDepths(Position.RIGHT,currDepth);currDepth=nextDe.getDepth(Position.LEFT);}
return currDepth;};})();jsts.algorithm.CentroidLine=function(){this.centSum=new jsts.geom.Coordinate();};jsts.algorithm.CentroidLine.prototype.centSum=null;jsts.algorithm.CentroidLine.prototype.totalLength=0.0;jsts.algorithm.CentroidLine.prototype.add=function(geom){if(geom instanceof Array){this.add2.apply(this,arguments);return;}
if(geom instanceof jsts.geom.LineString){this.add(geom.getCoordinates());}else if(geom instanceof jsts.geom.Polygon){var poly=geom;this.add(poly.getExteriorRing().getCoordinates());for(var i=0;i<poly.getNumInteriorRing();i++){this.add(poly.getInteriorRingN(i).getCoordinates());}}else if(geom instanceof jsts.geom.GeometryCollection||geom instanceof jsts.geom.MultiPoint||geom instanceof jsts.geom.MultiLineString||geom instanceof jsts.geom.MultiPolygon){var gc=geom;for(var i=0;i<gc.getNumGeometries();i++){this.add(gc.getGeometryN(i));}}};jsts.algorithm.CentroidLine.prototype.getCentroid=function(){var cent=new jsts.geom.Coordinate();cent.x=this.centSum.x/this.totalLength;cent.y=this.centSum.y/this.totalLength;return cent;};jsts.algorithm.CentroidLine.prototype.add2=function(pts){for(var i=0;i<pts.length-1;i++){var segmentLen=pts[i].distance(pts[i+1]);this.totalLength+=segmentLen;var midx=(pts[i].x+pts[i+1].x)/2;this.centSum.x+=segmentLen*midx;var midy=(pts[i].y+pts[i+1].y)/2;this.centSum.y+=segmentLen*midy;}};jsts.index.IntervalSize=function(){};jsts.index.IntervalSize.MIN_BINARY_EXPONENT=-50;jsts.index.IntervalSize.isZeroWidth=function(min,max){var width=max-min;if(width===0.0){return true;}
var maxAbs,scaledInterval,level;maxAbs=Math.max(Math.abs(min),Math.abs(max));scaledInterval=width/maxAbs;level=jsts.index.DoubleBits.exponent(scaledInterval);return level<=jsts.index.IntervalSize.MIN_BINARY_EXPONENT;};jsts.geomgraph.index.SimpleEdgeSetIntersector=function(){};jsts.geomgraph.index.SimpleEdgeSetIntersector.prototype=new jsts.geomgraph.index.EdgeSetIntersector();jsts.geomgraph.index.SimpleEdgeSetIntersector.prototype.nOverlaps=0;jsts.geomgraph.index.SimpleEdgeSetIntersector.prototype.computeIntersections=function(edges,si,testAllSegments){if(si instanceof javascript.util.List){this.computeIntersections2.apply(this,arguments);return;}
this.nOverlaps=0;for(var i0=edges.iterator();i0.hasNext();){var edge0=i0.next();for(var i1=edges.iterator();i1.hasNext();){var edge1=i1.next();if(testAllSegments||edge0!=edge1)
this.computeIntersects(edge0,edge1,si);}}};jsts.geomgraph.index.SimpleEdgeSetIntersector.prototype.computeIntersections2=function(edges0,edges1,si){this.nOverlaps=0;for(var i0=edges0.iterator();i0.hasNext();){var edge0=i0.next();for(var i1=edges1.iterator();i1.hasNext();){var edge1=i1.next();this.computeIntersects(edge0,edge1,si);}}};jsts.geomgraph.index.SimpleEdgeSetIntersector.prototype.computeIntersects=function(e0,e1,si){var pts0=e0.getCoordinates();var pts1=e1.getCoordinates();var i0,i1;for(i0=0;i0<pts0.length-1;i0++){for(i1=0;i1<pts1.length-1;i1++){si.addIntersections(e0,i0,e1,i1);}}};jsts.geomgraph.Edge=function(pts,label){this.pts=pts;this.label=label;this.eiList=new jsts.geomgraph.EdgeIntersectionList(this);this.depth=new jsts.geomgraph.Depth();};jsts.geomgraph.Edge.prototype=new jsts.geomgraph.GraphComponent();jsts.geomgraph.Edge.constructor=jsts.geomgraph.Edge;jsts.geomgraph.Edge.updateIM=function(label,im){im.setAtLeastIfValid(label.getLocation(0,jsts.geomgraph.Position.ON),label.getLocation(1,jsts.geomgraph.Position.ON),1);if(label.isArea()){im.setAtLeastIfValid(label.getLocation(0,jsts.geomgraph.Position.LEFT),label.getLocation(1,jsts.geomgraph.Position.LEFT),2);im.setAtLeastIfValid(label.getLocation(0,jsts.geomgraph.Position.RIGHT),label.getLocation(1,jsts.geomgraph.Position.RIGHT),2);}};jsts.geomgraph.Edge.prototype.pts=null;jsts.geomgraph.Edge.prototype.env=null;jsts.geomgraph.Edge.prototype.name=null;jsts.geomgraph.Edge.prototype.mce=null;jsts.geomgraph.Edge.prototype._isIsolated=true;jsts.geomgraph.Edge.prototype.depth=null;jsts.geomgraph.Edge.prototype.depthDelta=0;jsts.geomgraph.Edge.prototype.eiList=null;jsts.geomgraph.Edge.prototype.getNumPoints=function(){return this.pts.length;};jsts.geomgraph.Edge.prototype.getEnvelope=function(){if(this.env===null){this.env=new jsts.geom.Envelope();for(var i=0;i<this.pts.length;i++){this.env.expandToInclude(pts[i]);}}
return env;};jsts.geomgraph.Edge.prototype.getDepth=function(){return this.depth;};jsts.geomgraph.Edge.prototype.getDepthDelta=function(){return this.depthDelta;};jsts.geomgraph.Edge.prototype.setDepthDelta=function(depthDelta){this.depthDelta=depthDelta;};jsts.geomgraph.Edge.prototype.getCoordinates=function(){return this.pts;};jsts.geomgraph.Edge.prototype.getCoordinate=function(i){if(i===undefined){if(this.pts.length>0){return this.pts[0];}else{return null;}}
return this.pts[i];};jsts.geomgraph.Edge.prototype.isClosed=function(){return this.pts[0].equals(this.pts[this.pts.length-1]);};jsts.geomgraph.Edge.prototype.setIsolated=function(isIsolated){this._isIsolated=isIsolated;};jsts.geomgraph.Edge.prototype.isIsolated=function(){return this._isIsolated;};jsts.geomgraph.Edge.prototype.addIntersections=function(li,segmentIndex,geomIndex){for(var i=0;i<li.getIntersectionNum();i++){this.addIntersection(li,segmentIndex,geomIndex,i);}};jsts.geomgraph.Edge.prototype.addIntersection=function(li,segmentIndex,geomIndex,intIndex){var intPt=new jsts.geom.Coordinate(li.getIntersection(intIndex));var normalizedSegmentIndex=segmentIndex;var dist=li.getEdgeDistance(geomIndex,intIndex);var nextSegIndex=normalizedSegmentIndex+1;if(nextSegIndex<this.pts.length){var nextPt=this.pts[nextSegIndex];if(intPt.equals2D(nextPt)){normalizedSegmentIndex=nextSegIndex;dist=0.0;}}
var ei=this.eiList.add(intPt,normalizedSegmentIndex,dist);};jsts.geomgraph.Edge.prototype.getMaximumSegmentIndex=function(){return this.pts.length-1;};jsts.geomgraph.Edge.prototype.getEdgeIntersectionList=function(){return this.eiList;};jsts.geomgraph.Edge.prototype.getMonotoneChainEdge=function(){if(this.mce==null){this.mce=new jsts.geomgraph.index.MonotoneChainEdge(this);}
return this.mce;};jsts.geomgraph.Edge.prototype.isClosed=function()
{return this.pts[0].equals(this.pts[this.pts.length-1]);};jsts.geomgraph.Edge.prototype.isCollapsed=function()
{if(!this.label.isArea())return false;if(this.pts.length!=3)return false;if(this.pts[0].equals(this.pts[2]))return true;return false;};jsts.geomgraph.Edge.prototype.getCollapsedEdge=function()
{var newPts=[];newPts[0]=this.pts[0];newPts[1]=this.pts[1];var newe=new jsts.geomgraph.Edge(newPts,jsts.geomgraph.Label.toLineLabel(this.label));return newe;};jsts.geomgraph.Edge.prototype.computeIM=function(im){jsts.geomgraph.Edge.updateIM(this.label,im);};jsts.geomgraph.Edge.prototype.isPointwiseEqual=function(e)
{if(this.pts.length!=e.pts.length)return false;for(var i=0;i<this.pts.length;i++){if(!this.pts[i].equals2D(e.pts[i])){return false;}}
return true;};jsts.noding.Octant=function(){throw jsts.error.AbstractMethodInvocationError();};jsts.noding.Octant.octant=function(dx,dy){if(dx instanceof jsts.geom.Coordinate){return jsts.noding.Octant.octant2.apply(this,arguments);}
if(dx===0.0&&dy===0.0)
throw new jsts.error.IllegalArgumentError('Cannot compute the octant for point ( '+dx+', '+dy+' )');var adx=Math.abs(dx);var ady=Math.abs(dy);if(dx>=0){if(dy>=0){if(adx>=ady)
return 0;else
return 1;}
else{if(adx>=ady)
return 7;else
return 6;}}
else{if(dy>=0){if(adx>=ady)
return 3;else
return 2;}
else{if(adx>=ady)
return 4;else
return 5;}}};jsts.noding.Octant.octant2=function(p0,p1){var dx=p1.x-p0.x;var dy=p1.y-p0.y;if(dx===0.0&&dy===0.0)
throw new jsts.error.IllegalArgumentError('Cannot compute the octant for two identical points '+p0);return jsts.noding.Octant.octant(dx,dy);};jsts.operation.union.UnionInteracting=function(g0,g1){this.g0=g0;this.g1=g1;this.geomFactory=g0.getFactory();this.interacts0=[];this.interacts1=[];};jsts.operation.union.UnionInteracting.union=function(g0,g1){var uue=new jsts.operation.union.UnionInteracting(g0,g1);return uue.union();};jsts.operation.union.UnionInteracting.prototype.geomFactory=null;jsts.operation.union.UnionInteracting.prototype.g0=null;jsts.operation.union.UnionInteracting.prototype.g1=null;jsts.operation.union.UnionInteracting.prototype.interacts0=null;jsts.operation.union.UnionInteracting.prototype.interacts1=null;jsts.operation.union.UnionInteracting.prototype.union=function(){this.computeInteracting();var int0=this.extractElements(this.g0,this.interacts0,true);var int1=this.extractElements(this.g1,this.interacts1,true);if(int0.isEmpty()||int1.isEmpty()){}
var union=in0.union(int1);var disjoint0=this.extractElements(this.g0,this.interacts0,false);var disjoint1=this.extractElements(this.g1,this.interacts1,false);var overallUnion=jsts.geom.util.GeometryCombiner.combine(union,disjoint0,disjoint1);return overallUnion;};jsts.operation.union.UnionInteracting.prototype.bufferUnion=function(g0,g1){var factory=g0.getFactory();var gColl=factory.createGeometryCollection([g0,g1]);var unionAll=gColl.buffer(0.0);return unionAll;};jsts.operation.union.UnionInteracting.prototype.computeInteracting=function(elem0){if(!elem0){for(var i=0,l=this.g0.getNumGeometries();i<l;i++){var elem=this.g0.getGeometryN(i);this.interacts0[i]=this.computeInteracting(elem);}}
else{var interactsWithAny=false;for(var i=0,l=g1.getNumGeometries();i<l;i++){var elem1=this.g1.getGeometryN(i);var interacts=elem1.getEnvelopeInternal().intersects(elem0.getEnvelopeInternal());if(interacts){this.interacts1[i]=true;interactsWithAny=true;}}
return interactsWithAny;}};jsts.operation.union.UnionInteracting.prototype.extractElements=function(geom,interacts,isInteracting){var extractedGeoms=[];for(var i=0,l=geom.getNumGeometries();i<l;i++){var elem=geom.getGeometryN(i);if(interacts[i]===isInteracting){extractedGeoms.push(elem);}}
return this.geomFactory.buildGeometry(extractedGeoms);};jsts.triangulate.quadedge.TrianglePredicate=function(){};jsts.triangulate.quadedge.TrianglePredicate.isInCircleNonRobust=function(a,b,c,p){var isInCircle=(a.x*a.x+a.y*a.y)*jsts.triangulate.quadedge.TrianglePredicate.triArea(b,c,p)-
(b.x*b.x+b.y*b.y)*jsts.triangulate.quadedge.TrianglePredicate.triArea(a,c,p)+
(c.x*c.x+c.y*c.y)*jsts.triangulate.quadedge.TrianglePredicate.triArea(a,b,p)-
(p.x*p.x+p.y*p.y)*jsts.triangulate.quadedge.TrianglePredicate.triArea(a,b,c)>0;return isInCircle;};jsts.triangulate.quadedge.TrianglePredicate.isInCircleNormalized=function(a,b,c,p){var adx,ady,bdx,bdy,cdx,cdy,abdet,bcdet,cadet,alift,blift,clift,disc;adx=a.x-p.x;ady=a.y-p.y;bdx=b.x-p.x;bdy=b.y-p.y;cdx=c.x-p.x;cdy=c.y-p.y;abdet=adx*bdy-bdx*ady;bcdet=bdx*cdy-cdx*bdy;cadet=cdx*ady-adx*cdy;alift=adx*adx+ady*ady;blift=bdx*bdx+bdy*bdy;clift=cdx*cdx+cdy*cdy;disc=alift*bcdet+blift*cadet+clift*abdet;return disc>0;};jsts.triangulate.quadedge.TrianglePredicate.triArea=function(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);};jsts.triangulate.quadedge.TrianglePredicate.isInCircleRobust=function(a,b,c,p){return jsts.triangulate.quadedge.TrianglePredicate.isInCircleNormalized(a,b,c,p);};jsts.triangulate.quadedge.TrianglePredicate.isInCircleDDSlow=function(a,b,c,p){var px,py,ax,ay,bx,by,cx,cy,aTerm,bTerm,cTerm,pTerm,sum,isInCircle;px=jsts.math.DD.valueOf(p.x);py=jsts.math.DD.valueOf(p.y);ax=jsts.math.DD.valueOf(a.x);ay=jsts.math.DD.valueOf(a.y);bx=jsts.math.DD.valueOf(b.x);by=jsts.math.DD.valueOf(b.y);cx=jsts.math.DD.valueOf(c.x);cy=jsts.math.DD.valueOf(c.y);aTerm=(ax.multiply(ax).add(ay.multiply(ay))).multiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDSlow(bx,by,cx,cy,px,py));bTerm=(bx.multiply(bx).add(by.multiply(by))).multiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDSlow(ax,ay,cx,cy,px,py));cTerm=(cx.multiply(cx).add(cy.multiply(cy))).multiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDSlow(ax,ay,bx,by,px,py));pTerm=(px.multiply(px).add(py.multiply(py))).multiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDSlow(ax,ay,bx,by,cx,cy));sum=aTerm.subtract(bTerm).add(cTerm).subtract(pTerm);isInCircle=sum.doubleValue()>0;return isInCircle;};jsts.triangulate.quadedge.TrianglePredicate.triAreaDDSlow=function(ax,ay,bx,by,cx,cy){return(bx.subtract(ax).multiply(cy.subtract(ay)).subtract(by.subtract(ay).multiply(cx.subtract(ax))));};jsts.triangulate.quadedge.TrianglePredicate.isInCircleDDFast=function(a,b,c,p){var aTerm,bTerm,cTerm,pTerm,sum,isInCircle;aTerm=(jsts.math.DD.sqr(a.x).selfAdd(jsts.math.DD.sqr(a.y))).selfMultiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDFast(b,c,p));bTerm=(jsts.math.DD.sqr(b.x).selfAdd(jsts.math.DD.sqr(b.y))).selfMultiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDFast(a,c,p));cTerm=(jsts.math.DD.sqr(c.x).selfAdd(jsts.math.DD.sqr(c.y))).selfMultiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDFast(a,b,p));pTerm=(jsts.math.DD.sqr(p.x).selfAdd(jsts.math.DD.sqr(p.y))).selfMultiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDFast(a,b,c));sum=aTerm.selfSubtract(bTerm).selfAdd(cTerm).selfSubtract(pTerm);isInCircle=sum.doubleValue()>0;return isInCircle;};jsts.triangulate.quadedge.TrianglePredicate.triAreaDDFast=function(a,b,c){var t1,t2;t1=jsts.math.DD.valueOf(b.x).selfSubtract(a.x).selfMultiply(jsts.math.DD.valueOf(c.y).selfSubtract(a.y));t2=jsts.math.DD.valueOf(b.y).selSubtract(a.y).selfMultiply(jsts.math.DD.valueOf(c.x).selfSubtract(a.x));return t1.selfSubtract(t2);};jsts.triangulate.quadedge.TrianglePredicate.isInCircleDDNormalized=function(a,b,c,p){var adx,ady,bdx,bdy,cdx,cdy,abdet,bcdet,cadet,alift,blift,clift,sum,isInCircle;adx=jsts.math.DD.valueOf(a.x).selfSubtract(p.x);ady=jsts.math.DD.valueOf(a.y).selfSubtract(p.y);bdx=jsts.math.DD.valueOf(b.x).selfSubtract(p.x);bdx=jsts.math.DD.valueOf(b.y).selfSubtract(p.y);cdx=jsts.math.DD.valueOf(c.x).selfSubtract(p.x);cdx=jsts.math.DD.valueOf(c.y).selfSubtract(p.y);abdet=adx.multiply(bdy).selfSubtract(bdx.multiply(ady));bcdet=bdx.multiply(cdy).selfSubtract(cdx.multiply(bdy));cadet=cdx.multiply(ady).selfSubtract(adx.multiply(cdy));alift=adx.multiply(adx).selfAdd(ady.multiply(ady));blift=bdx.multiply(bdx).selfAdd(bdy.multiply(bdy));clift=cdx.multiply(cdx).selfAdd(cdy.multiply(cdy));sum=alift.selfMultiply(bcdet).selfAdd(blift.selfMultiply(cadet)).selfAdd(clift.selfMultiply(abdet));isInCircle=sum.doubleValue()>0;return isInCircle;};jsts.triangulate.quadedge.TrianglePredicate.isInCircleCC=function(a,b,c,p){var cc,ccRadius,pRadiusDiff;cc=jsts.geom.Triangle.circumcentre(a,b,c);ccRadius=a.distance(cc);pRadiusDiff=p.distance(cc)-ccRadius;return pRadiusDiff<=0;};jsts.operation.union.PointGeometryUnion=function(pointGeom,otherGeom){this.pointGeom=pointGeom;this.otherGeom=otherGeom;this.geomFact=otherGeom.getFactory();};jsts.operation.union.PointGeometryUnion.union=function(pointGeom,otherGeom){var unioner=new jsts.operation.union.PointGeometryUnion(pointGeom,otherGeom);return unioner.union();};jsts.operation.union.PointGeometryUnion.prototype.pointGeom=null;jsts.operation.union.PointGeometryUnion.prototype.otherGeom=null;jsts.operation.union.PointGeometryUnion.prototype.geomFact=null;jsts.operation.union.PointGeometryUnion.prototype.union=function(){var locator=new jsts.algorithm.PointLocator();var exteriorCoords=[];for(var i=0,l=this.pointGeom.getNumGeometries();i<l;i++){var point=this.pointGeom.getGeometryN(i);var coord=point.getCoordinate();var loc=locator.locate(coord,this.otherGeom);if(loc===jsts.geom.Location.EXTERIOR){var include=true;for(var j=exteriorCoords.length;i--;){if(exteriorCoords[j].equals(coord)){include=false;break;}}
if(include){exteriorCoords.push(coord);}}}
exteriorCoords.sort(function(x,y){return x.compareTo(y);});if(exteriorCoords.length===0){return this.otherGeom;}
var ptComp=null;var coords=jsts.geom.CoordinateArrays.toCoordinateArray(exteriorCoords);if(coords.length===1){ptComp=this.geomFact.createPoint(coords[0]);}
else{ptComp=this.geomFact.createMultiPoint(coords);}
return jsts.geom.util.GeometryCombiner.combine(ptComp,this.otherGeom);};jsts.noding.IntersectionFinderAdder=function(li){this.li=li;this.interiorIntersections=new javascript.util.ArrayList();};jsts.noding.IntersectionFinderAdder.prototype=new jsts.noding.SegmentIntersector();jsts.noding.IntersectionFinderAdder.constructor=jsts.noding.IntersectionFinderAdder;jsts.noding.IntersectionFinderAdder.prototype.li=null;jsts.noding.IntersectionFinderAdder.prototype.interiorIntersections=null;jsts.noding.IntersectionFinderAdder.prototype.getInteriorIntersections=function(){return this.interiorIntersections;};jsts.noding.IntersectionFinderAdder.prototype.processIntersections=function(e0,segIndex0,e1,segIndex1){if(e0===e1&&segIndex0===segIndex1)
return;var p00=e0.getCoordinates()[segIndex0];var p01=e0.getCoordinates()[segIndex0+1];var p10=e1.getCoordinates()[segIndex1];var p11=e1.getCoordinates()[segIndex1+1];this.li.computeIntersection(p00,p01,p10,p11);if(this.li.hasIntersection()){if(this.li.isInteriorIntersection()){for(var intIndex=0;intIndex<this.li.getIntersectionNum();intIndex++){this.interiorIntersections.add(this.li.getIntersection(intIndex));}
e0.addIntersections(this.li,segIndex0,0);e1.addIntersections(this.li,segIndex1,1);}}};jsts.noding.IntersectionFinderAdder.prototype.isDone=function(){return false;};jsts.noding.snapround.MCIndexSnapRounder=function(pm){this.pm=pm;this.li=new jsts.algorithm.RobustLineIntersector();this.li.setPrecisionModel(pm);this.scaleFactor=pm.getScale();};jsts.noding.snapround.MCIndexSnapRounder.prototype=new jsts.noding.Noder();jsts.noding.snapround.MCIndexSnapRounder.constructor=jsts.noding.snapround.MCIndexSnapRounder;jsts.noding.snapround.MCIndexSnapRounder.prototype.pm=null;jsts.noding.snapround.MCIndexSnapRounder.prototype.li=null;jsts.noding.snapround.MCIndexSnapRounder.prototype.scaleFactor=null;jsts.noding.snapround.MCIndexSnapRounder.prototype.noder=null;jsts.noding.snapround.MCIndexSnapRounder.prototype.pointSnapper=null;jsts.noding.snapround.MCIndexSnapRounder.prototype.nodedSegStrings=null;jsts.noding.snapround.MCIndexSnapRounder.prototype.getNodedSubstrings=function(){return jsts.noding.NodedSegmentString.getNodedSubstrings(this.nodedSegStrings);};jsts.noding.snapround.MCIndexSnapRounder.prototype.computeNodes=function(inputSegmentStrings){this.nodedSegStrings=inputSegmentStrings;this.noder=new jsts.noding.MCIndexNoder();this.pointSnapper=new jsts.noding.snapround.MCIndexPointSnapper(this.noder.getIndex());this.snapRound(inputSegmentStrings,this.li);};jsts.noding.snapround.MCIndexSnapRounder.prototype.snapRound=function(segStrings,li){var intersections=this.findInteriorIntersections(segStrings,li);this.computeIntersectionSnaps(intersections);this.computeVertexSnaps(segStrings);};jsts.noding.snapround.MCIndexSnapRounder.prototype.findInteriorIntersections=function(segStrings,li){var intFinderAdder=new jsts.noding.IntersectionFinderAdder(li);this.noder.setSegmentIntersector(intFinderAdder);this.noder.computeNodes(segStrings);return intFinderAdder.getInteriorIntersections();};jsts.noding.snapround.MCIndexSnapRounder.prototype.computeIntersectionSnaps=function(snapPts){for(var it=snapPts.iterator();it.hasNext();){var snapPt=it.next();var hotPixel=new jsts.noding.snapround.HotPixel(snapPt,this.scaleFactor,this.li);this.pointSnapper.snap(hotPixel);}};jsts.noding.snapround.MCIndexSnapRounder.prototype.computeVertexSnaps=function(edges){if(edges instanceof jsts.noding.NodedSegmentString){this.computeVertexSnaps2.apply(this,arguments);return;}
for(var i0=edges.iterator();i0.hasNext();){var edge0=i0.next();this.computeVertexSnaps(edge0);}};jsts.noding.snapround.MCIndexSnapRounder.prototype.computeVertexSnaps2=function(e){var pts0=e.getCoordinates();for(var i=0;i<pts0.length-1;i++){var hotPixel=new jsts.noding.snapround.HotPixel(pts0[i],this.scaleFactor,this.li);var isNodeAdded=this.pointSnapper.snap(hotPixel,e,i);if(isNodeAdded){e.addIntersection(pts0[i],i);}}};jsts.operation.valid.ConnectedInteriorTester=function(geomGraph){this.geomGraph=geomGraph;this.geometryFactory=new jsts.geom.GeometryFactory();this.disconnectedRingcoord=null;};jsts.operation.valid.ConnectedInteriorTester.findDifferentPoint=function(coord,pt){var i=0,il=coord.length;for(i;i<il;i++){if(!coord[i].equals(pt))
return coord[i];}
return null;};jsts.operation.valid.ConnectedInteriorTester.prototype.getCoordinate=function(){return this.disconnectedRingcoord;};jsts.operation.valid.ConnectedInteriorTester.prototype.isInteriorsConnected=function(){var splitEdges=new javascript.util.ArrayList();this.geomGraph.computeSplitEdges(splitEdges);var graph=new jsts.geomgraph.PlanarGraph(new jsts.operation.overlay.OverlayNodeFactory());graph.addEdges(splitEdges);this.setInteriorEdgesInResult(graph);graph.linkResultDirectedEdges();var edgeRings=this.buildEdgeRings(graph.getEdgeEnds());this.visitShellInteriors(this.geomGraph.getGeometry(),graph);return!this.hasUnvisitedShellEdge(edgeRings);};jsts.operation.valid.ConnectedInteriorTester.prototype.setInteriorEdgesInResult=function(graph){var it=graph.getEdgeEnds().iterator(),de;while(it.hasNext()){de=it.next();if(de.getLabel().getLocation(0,jsts.geomgraph.Position.RIGHT)==jsts.geom.Location.INTERIOR){de.setInResult(true);}}};jsts.operation.valid.ConnectedInteriorTester.prototype.buildEdgeRings=function(dirEdges){var edgeRings=new javascript.util.ArrayList();for(var it=dirEdges.iterator();it.hasNext();){var de=it.next();if(de.isInResult()&&de.getEdgeRing()==null){var er=new jsts.operation.overlay.MaximalEdgeRing(de,this.geometryFactory);er.linkDirectedEdgesForMinimalEdgeRings();var minEdgeRings=er.buildMinimalRings();var i=0,il=minEdgeRings.length;for(i;i<il;i++){edgeRings.add(minEdgeRings[i]);}}}
return edgeRings;};jsts.operation.valid.ConnectedInteriorTester.prototype.visitShellInteriors=function(g,graph){if(g instanceof jsts.geom.Polygon){var p=g;this.visitInteriorRing(p.getExteriorRing(),graph);}
if(g instanceof jsts.geom.MultiPolygon){var mp=g;for(var i=0;i<mp.getNumGeometries();i++){var p=mp.getGeometryN(i);this.visitInteriorRing(p.getExteriorRing(),graph);}}};jsts.operation.valid.ConnectedInteriorTester.prototype.visitInteriorRing=function(ring,graph){var pts=ring.getCoordinates();var pt0=pts[0];var pt1=jsts.operation.valid.ConnectedInteriorTester.findDifferentPoint(pts,pt0);var e=graph.findEdgeInSameDirection(pt0,pt1);var de=graph.findEdgeEnd(e);var intDe=null;if(de.getLabel().getLocation(0,jsts.geomgraph.Position.RIGHT)==jsts.geom.Location.INTERIOR){intDe=de;}else if(de.getSym().getLabel().getLocation(0,jsts.geomgraph.Position.RIGHT)==jsts.geom.Location.INTERIOR){intDe=de.getSym();}
this.visitLinkedDirectedEdges(intDe);};jsts.operation.valid.ConnectedInteriorTester.prototype.visitLinkedDirectedEdges=function(start){var startDe=start;var de=start;do{de.setVisited(true);de=de.getNext();}while(de!=startDe);};jsts.operation.valid.ConnectedInteriorTester.prototype.hasUnvisitedShellEdge=function(edgeRings){for(var i=0;i<edgeRings.size();i++){var er=edgeRings.get(i);if(er.isHole()){continue;}
var edges=er.getEdges();var de=edges[0];if(de.getLabel().getLocation(0,jsts.geomgraph.Position.RIGHT)!=jsts.geom.Location.INTERIOR){continue;}
for(var j=0;j<edges.length;j++){de=edges[j];if(!de.isVisited()){disconnectedRingcoord=de.getCoordinate();return true;}}}
return false;};jsts.algorithm.InteriorPointLine=function(geometry){this.centroid;this.minDistance=Number.MAX_VALUE;this.interiorPoint=null;this.centroid=geometry.getCentroid().getCoordinate();this.addInterior(geometry);if(this.interiorPoint==null){this.addEndpoints(geometry);}};jsts.algorithm.InteriorPointLine.prototype.getInteriorPoint=function(){return this.interiorPoint;};jsts.algorithm.InteriorPointLine.prototype.addInterior=function(geometry){if(geometry instanceof jsts.geom.LineString){this.addInteriorCoord(geometry.getCoordinates());}else if(geometry instanceof jsts.geom.GeometryCollection){for(var i=0;i<geometry.getNumGeometries();i++){this.addInterior(geometry.getGeometryN(i));}}};jsts.algorithm.InteriorPointLine.prototype.addInteriorCoord=function(pts){for(var i=1;i<pts.length-1;i++){this.add(pts[i]);}};jsts.algorithm.InteriorPointLine.prototype.addEndpoints=function(geometry){if(geometry instanceof jsts.geom.LineString){this.addEndpointsCoord(geometry.getCoordinates());}else if(geometry instanceof jsts.geom.GeometryCollection){for(var i=0;i<geometry.getNumGeometries();i++){this.addEndpoints(geometry.getGeometryN(i));}}};jsts.algorithm.InteriorPointLine.prototype.addEndpointsCoord=function(pts){this.add(pts[0]);this.add(pts[pts.length-1]);};jsts.algorithm.InteriorPointLine.prototype.add=function(point){var dist=point.distance(this.centroid);if(dist<this.minDistance){this.interiorPoint=new jsts.geom.Coordinate(point);this.minDistance=dist;}};jsts.index.chain.MonotoneChainSelectAction=function(){this.tempEnv1=new jsts.geom.Envelope();this.selectedSegment=new jsts.geom.LineSegment();};jsts.index.chain.MonotoneChainSelectAction.prototype.tempEnv1=null;jsts.index.chain.MonotoneChainSelectAction.prototype.selectedSegment=null;jsts.index.chain.MonotoneChainSelectAction.prototype.select=function(mc,start){mc.getLineSegment(start,this.selectedSegment);this.select2(this.selectedSegment);};jsts.index.chain.MonotoneChainSelectAction.prototype.select2=function(seg){};jsts.algorithm.MCPointInRing=function(ring){this.ring=ring;this.tree=null;this.crossings=0;this.interval=new jsts.index.bintree.Interval();this.buildIndex();};jsts.algorithm.MCPointInRing.MCSelecter=function(p,parent){this.parent=parent;this.p=p;};jsts.algorithm.MCPointInRing.MCSelecter.prototype=new jsts.index.chain.MonotoneChainSelectAction;jsts.algorithm.MCPointInRing.MCSelecter.prototype.constructor=jsts.algorithm.MCPointInRing.MCSelecter;jsts.algorithm.MCPointInRing.MCSelecter.prototype.select2=function(ls){this.parent.testLineSegment.apply(this.parent,[this.p,ls]);};jsts.algorithm.MCPointInRing.prototype.buildIndex=function(){this.tree=new jsts.index.bintree.Bintree();var pts=jsts.geom.CoordinateArrays.removeRepeatedPoints(this.ring.getCoordinates());var mcList=jsts.index.chain.MonotoneChainBuilder.getChains(pts);for(var i=0;i<mcList.length;i++){var mc=mcList[i];var mcEnv=mc.getEnvelope();this.interval.min=mcEnv.getMinY();this.interval.max=mcEnv.getMaxY();this.tree.insert(this.interval,mc);}};jsts.algorithm.MCPointInRing.prototype.isInside=function(pt){this.crossings=0;var rayEnv=new jsts.geom.Envelope(-Number.MAX_VALUE,Number.MAX_VALUE,pt.y,pt.y);this.interval.min=pt.y;this.interval.max=pt.y;var segs=this.tree.query(this.interval);var mcSelecter=new jsts.algorithm.MCPointInRing.MCSelecter(pt,this);for(var i=segs.iterator();i.hasNext();){var mc=i.next();this.testMonotoneChain(rayEnv,mcSelecter,mc);}
if((this.crossings%2)==1){return true;}
return false;};jsts.algorithm.MCPointInRing.prototype.testMonotoneChain=function(rayEnv,mcSelecter,mc){mc.select(rayEnv,mcSelecter);};jsts.algorithm.MCPointInRing.prototype.testLineSegment=function(p,seg){var xInt,x1,y1,x2,y2,p1,p2;p1=seg.p0;p2=seg.p1;x1=p1.x-p.x;y1=p1.y-p.y;x2=p2.x-p.x;y2=p2.y-p.y;if(((y1>0)&&(y2<=0))||((y2>0)&&(y1<=0))){xInt=jsts.algorithm.RobustDeterminant.signOfDet2x2(x1,y1,x2,y2)/(y2-y1);if(0.0<xInt){this.crossings++;}}};jsts.operation.valid.TopologyValidationError=function(errorType,pt){this.errorType=errorType;this.pt=null;if(pt!=null){this.pt=pt.clone();}};jsts.operation.valid.TopologyValidationError.HOLE_OUTSIDE_SHELL=2;jsts.operation.valid.TopologyValidationError.NESTED_HOLES=3;jsts.operation.valid.TopologyValidationError.DISCONNECTED_INTERIOR=4;jsts.operation.valid.TopologyValidationError.SELF_INTERSECTION=5;jsts.operation.valid.TopologyValidationError.RING_SELF_INTERSECTION=6;jsts.operation.valid.TopologyValidationError.NESTED_SHELLS=7;jsts.operation.valid.TopologyValidationError.DUPLICATE_RINGS=8;jsts.operation.valid.TopologyValidationError.TOO_FEW_POINTS=9;jsts.operation.valid.TopologyValidationError.INVALID_COORDINATE=10;jsts.operation.valid.TopologyValidationError.RING_NOT_CLOSED=11;jsts.operation.valid.TopologyValidationError.prototype.errMsg=['Topology Validation Error','Repeated Point','Hole lies outside shell','Holes are nested','Interior is disconnected','Self-intersection','Ring Self-intersection','Nested shells','Duplicate Rings','Too few distinct points in geometry component','Invalid Coordinate','Ring is not closed'];jsts.operation.valid.TopologyValidationError.prototype.getCoordinate=function(){return this.pt;};jsts.operation.valid.TopologyValidationError.prototype.getErrorType=function(){return this.errorType;};jsts.operation.valid.TopologyValidationError.prototype.getMessage=function(){return this.errMsg[this.errorType];};jsts.operation.valid.TopologyValidationError.prototype.toString=function(){var locStr='';if(this.pt!=null){locStr=' at or near point '+this.pt;return this.getMessage()+locStr;}
return locStr;};(function(){jsts.geom.MultiPolygon=function(geometries,factory){this.geometries=geometries||[];this.factory=factory;};jsts.geom.MultiPolygon.prototype=new jsts.geom.GeometryCollection();jsts.geom.MultiPolygon.constructor=jsts.geom.MultiPolygon;jsts.geom.MultiPolygon.prototype.getBoundary=function(){if(this.isEmpty()){return this.getFactory().createMultiLineString(null);}
var allRings=[];for(var i=0;i<this.geometries.length;i++){var polygon=this.geometries[i];var rings=polygon.getBoundary();for(var j=0;j<rings.getNumGeometries();j++){allRings.push(rings.getGeometryN(j));}}
return this.getFactory().createMultiLineString(allRings);};jsts.geom.MultiPolygon.prototype.equalsExact=function(other,tolerance){if(!this.isEquivalentClass(other)){return false;}
return jsts.geom.GeometryCollection.prototype.equalsExact.call(this,other,tolerance);};jsts.geom.MultiPolygon.prototype.CLASS_NAME='jsts.geom.MultiPolygon';})();jsts.geom.CoordinateSequenceFilter=function(){};jsts.geom.CoordinateSequenceFilter.prototype.filter=jsts.abstractFunc;jsts.geom.CoordinateSequenceFilter.prototype.isDone=jsts.abstractFunc;jsts.geom.CoordinateSequenceFilter.prototype.isGeometryChanged=jsts.abstractFunc;(function(){var Interval=function(){this.min=0.0;this.max=0.0;if(arguments.length===1){var interval=arguments[0];this.init(interval.min,interval.max);}else if(arguments.length===2){this.init(arguments[0],arguments[1]);}};Interval.prototype.init=function(min,max){this.min=min;this.max=max;if(min>max){this.min=max;this.max=min;}};Interval.prototype.getMin=function(){return this.min;};Interval.prototype.getMax=function(){return this.max;};Interval.prototype.getWidth=function(){return(this.max-this.min);};Interval.prototype.expandToInclude=function(interval){if(interval.max>this.max){this.max=interval.max;}
if(interval.min<this.min){this.min=interval.min;}};Interval.prototype.overlaps=function(){if(arguments.length===1){return this.overlapsInterval.apply(this,arguments);}else{return this.overlapsMinMax.apply(this,arguments);}};Interval.prototype.overlapsInterval=function(interval){return this.overlaps(interval.min,interval.max);};Interval.prototype.overlapsMinMax=function(min,max){if(this.min>max||this.max<min){return false;}
return true;};Interval.prototype.contains=function(){var interval;if(arguments[0]instanceof jsts.index.bintree.Interval){interval=arguments[0];return this.containsMinMax(interval.min,interval.max);}else if(arguments.length===1){return this.containsPoint(arguments[0]);}else{return this.containsMinMax(arguments[0],arguments[1]);}};Interval.prototype.containsMinMax=function(min,max){return(min>=this.min&&max<=this.max);};Interval.prototype.containsPoint=function(p){return(p>=this.min&&p<=this.max);};jsts.index.bintree.Interval=Interval;})();jsts.index.DoubleBits=function(){};jsts.index.DoubleBits.powerOf2=function(exp){return Math.pow(2,exp);};jsts.index.DoubleBits.exponent=function(d){return jsts.index.DoubleBits.CVTFWD(64,d)-1023;};jsts.index.DoubleBits.CVTFWD=function(NumW,Qty){var Sign,Expo,Mant,Bin,nb01='';var Inf={32:{d:0x7F,c:0x80,b:0,a:0},64:{d:0x7FF0,c:0,b:0,a:0}};var ExW={32:8,64:11}[NumW],MtW=NumW-ExW-1;if(!Bin){Sign=Qty<0||1/Qty<0;if(!isFinite(Qty)){Bin=Inf[NumW];if(Sign){Bin.d+=1<<(NumW/4-1);}
Expo=Math.pow(2,ExW)-1;Mant=0;}}
if(!Bin){Expo={32:127,64:1023}[NumW];Mant=Math.abs(Qty);while(Mant>=2){Expo++;Mant/=2;}
while(Mant<1&&Expo>0){Expo--;Mant*=2;}
if(Expo<=0){Mant/=2;nb01='Zero or Denormal';}
if(NumW===32&&Expo>254){nb01='Too big for Single';Bin={d:Sign?0xFF:0x7F,c:0x80,b:0,a:0};Expo=Math.pow(2,ExW)-1;Mant=0;}}
return Expo;};(function(){var DoubleBits=jsts.index.DoubleBits;var Interval=jsts.index.bintree.Interval;var Key=function(interval){this.pt=0.0;this.level=0;this.computeKey(interval);};Key.computeLevel=function(interval){var dx=interval.getWidth(),level;level=DoubleBits.exponent(dx)+1;return level;};Key.prototype.getPoint=function(){return this.pt;};Key.prototype.getLevel=function(){return this.level;};Key.prototype.getInterval=function(){return this.interval;};Key.prototype.computeKey=function(itemInterval){this.level=Key.computeLevel(itemInterval);this.interval=new Interval();this.computeInterval(this.level,itemInterval);while(!this.interval.contains(itemInterval)){this.level+=1;this.computeInterval(this.level,itemInterval);}};Key.prototype.computeInterval=function(level,itemInterval){var size=DoubleBits.powerOf2(level);this.pt=Math.floor(itemInterval.getMin()/size)*size;this.interval.init(this.pt,this.pt+size);};jsts.index.bintree.Key=Key;})();jsts.operation.buffer.SubgraphDepthLocater=function(subgraphs){this.subgraphs=[];this.seg=new jsts.geom.LineSegment();this.subgraphs=subgraphs;};jsts.operation.buffer.SubgraphDepthLocater.prototype.subgraphs=null;jsts.operation.buffer.SubgraphDepthLocater.prototype.seg=null;jsts.operation.buffer.SubgraphDepthLocater.prototype.getDepth=function(p){var stabbedSegments=this.findStabbedSegments(p);if(stabbedSegments.length===0)
return 0;stabbedSegments.sort();var ds=stabbedSegments[0];return ds.leftDepth;};jsts.operation.buffer.SubgraphDepthLocater.prototype.findStabbedSegments=function(stabbingRayLeftPt){if(arguments.length===3){this.findStabbedSegments2.apply(this,arguments);return;}
var stabbedSegments=[];for(var i=0;i<this.subgraphs.length;i++){var bsg=this.subgraphs[i];var env=bsg.getEnvelope();if(stabbingRayLeftPt.y<env.getMinY()||stabbingRayLeftPt.y>env.getMaxY())
continue;this.findStabbedSegments2(stabbingRayLeftPt,bsg.getDirectedEdges(),stabbedSegments);}
return stabbedSegments;};jsts.operation.buffer.SubgraphDepthLocater.prototype.findStabbedSegments2=function(stabbingRayLeftPt,dirEdges,stabbedSegments){if(arguments[1]instanceof jsts.geomgraph.DirectedEdge){this.findStabbedSegments3(stabbingRayLeftPt,dirEdges,stabbedSegments);return;}
for(var i=dirEdges.iterator();i.hasNext();){var de=i.next();if(!de.isForward())
continue;this.findStabbedSegments3(stabbingRayLeftPt,de,stabbedSegments);}};jsts.operation.buffer.SubgraphDepthLocater.prototype.findStabbedSegments3=function(stabbingRayLeftPt,dirEdge,stabbedSegments){var pts=dirEdge.getEdge().getCoordinates();for(var i=0;i<pts.length-1;i++){this.seg.p0=pts[i];this.seg.p1=pts[i+1];if(this.seg.p0.y>this.seg.p1.y)
this.seg.reverse();var maxx=Math.max(this.seg.p0.x,this.seg.p1.x);if(maxx<stabbingRayLeftPt.x)
continue;if(this.seg.isHorizontal())
continue;if(stabbingRayLeftPt.y<this.seg.p0.y||stabbingRayLeftPt.y>this.seg.p1.y)
continue;if(jsts.algorithm.CGAlgorithms.computeOrientation(this.seg.p0,this.seg.p1,stabbingRayLeftPt)===jsts.algorithm.CGAlgorithms.RIGHT)
continue;var depth=dirEdge.getDepth(jsts.geomgraph.Position.LEFT);if(!this.seg.p0.equals(pts[i]))
depth=dirEdge.getDepth(jsts.geomgraph.Position.RIGHT);var ds=new jsts.operation.buffer.SubgraphDepthLocater.DepthSegment(this.seg,depth);stabbedSegments.push(ds);}};jsts.operation.buffer.SubgraphDepthLocater.DepthSegment=function(seg,depth){this.upwardSeg=new jsts.geom.LineSegment(seg);this.leftDepth=depth;};jsts.operation.buffer.SubgraphDepthLocater.DepthSegment.prototype.upwardSeg=null;jsts.operation.buffer.SubgraphDepthLocater.DepthSegment.prototype.leftDepth=null;jsts.operation.buffer.SubgraphDepthLocater.DepthSegment.prototype.compareTo=function(obj){var other=obj;var orientIndex=this.upwardSeg.orientationIndex(other.upwardSeg);if(orientIndex===0)
orientIndex=-1*other.upwardSeg.orientationIndex(upwardSeg);if(orientIndex!==0)
return orientIndex;return this.compareX(this.upwardSeg,other.upwardSeg);};jsts.operation.buffer.SubgraphDepthLocater.DepthSegment.prototype.compareX=function(seg0,seg1){var compare0=seg0.p0.compareTo(seg1.p0);if(compare0!==0)
return compare0;return seg0.p1.compareTo(seg1.p1);};jsts.noding.snapround.HotPixel=function(pt,scaleFactor,li){this.corner=[];this.originalPt=pt;this.pt=pt;this.scaleFactor=scaleFactor;this.li=li;if(this.scaleFactor!==1.0){this.pt=new jsts.geom.Coordinate(this.scale(pt.x),this.scale(pt.y));this.p0Scaled=new jsts.geom.Coordinate();this.p1Scaled=new jsts.geom.Coordinate();}
this.initCorners(this.pt);};jsts.noding.snapround.HotPixel.prototype.li=null;jsts.noding.snapround.HotPixel.prototype.pt=null;jsts.noding.snapround.HotPixel.prototype.originalPt=null;jsts.noding.snapround.HotPixel.prototype.ptScaled=null;jsts.noding.snapround.HotPixel.prototype.p0Scaled=null;jsts.noding.snapround.HotPixel.prototype.p1Scaled=null;jsts.noding.snapround.HotPixel.prototype.scaleFactor=undefined;jsts.noding.snapround.HotPixel.prototype.minx=undefined;jsts.noding.snapround.HotPixel.prototype.maxx=undefined;jsts.noding.snapround.HotPixel.prototype.miny=undefined;jsts.noding.snapround.HotPixel.prototype.maxy=undefined;jsts.noding.snapround.HotPixel.prototype.corner=null;jsts.noding.snapround.HotPixel.prototype.safeEnv=null;jsts.noding.snapround.HotPixel.prototype.getCoordinate=function(){return this.originalPt;};jsts.noding.snapround.HotPixel.SAFE_ENV_EXPANSION_FACTOR=0.75;jsts.noding.snapround.HotPixel.prototype.getSafeEnvelope=function(){if(this.safeEnv===null){var safeTolerance=jsts.noding.snapround.HotPixel.SAFE_ENV_EXPANSION_FACTOR/this.scaleFactor;this.safeEnv=new jsts.geom.Envelope(this.originalPt.x-safeTolerance,this.originalPt.x+safeTolerance,this.originalPt.y-safeTolerance,this.originalPt.y+safeTolerance);}
return this.safeEnv;};jsts.noding.snapround.HotPixel.prototype.initCorners=function(pt){var tolerance=0.5;this.minx=pt.x-tolerance;this.maxx=pt.x+tolerance;this.miny=pt.y-tolerance;this.maxy=pt.y+tolerance;this.corner[0]=new jsts.geom.Coordinate(this.maxx,this.maxy);this.corner[1]=new jsts.geom.Coordinate(this.minx,this.maxy);this.corner[2]=new jsts.geom.Coordinate(this.minx,this.miny);this.corner[3]=new jsts.geom.Coordinate(this.maxx,this.miny);};jsts.noding.snapround.HotPixel.prototype.scale=function(val){return Math.round(val*this.scaleFactor);};jsts.noding.snapround.HotPixel.prototype.intersects=function(p0,p1){if(this.scaleFactor===1.0)
return this.intersectsScaled(p0,p1);this.copyScaled(p0,this.p0Scaled);this.copyScaled(p1,this.p1Scaled);return this.intersectsScaled(this.p0Scaled,this.p1Scaled);};jsts.noding.snapround.HotPixel.prototype.copyScaled=function(p,pScaled){pScaled.x=this.scale(p.x);pScaled.y=this.scale(p.y);};jsts.noding.snapround.HotPixel.prototype.intersectsScaled=function(p0,p1){var segMinx=Math.min(p0.x,p1.x);var segMaxx=Math.max(p0.x,p1.x);var segMiny=Math.min(p0.y,p1.y);var segMaxy=Math.max(p0.y,p1.y);var isOutsidePixelEnv=this.maxx<segMinx||this.minx>segMaxx||this.maxy<segMiny||this.miny>segMaxy;if(isOutsidePixelEnv)
return false;var intersects=this.intersectsToleranceSquare(p0,p1);jsts.util.Assert.isTrue(!(isOutsidePixelEnv&&intersects),'Found bad envelope test');return intersects;};jsts.noding.snapround.HotPixel.prototype.intersectsToleranceSquare=function(p0,p1){var intersectsLeft=false;var intersectsBottom=false;this.li.computeIntersection(p0,p1,this.corner[0],this.corner[1]);if(this.li.isProper())
return true;this.li.computeIntersection(p0,p1,this.corner[1],this.corner[2]);if(this.li.isProper())
return true;if(this.li.hasIntersection())
intersectsLeft=true;this.li.computeIntersection(p0,p1,this.corner[2],this.corner[3]);if(this.li.isProper())
return true;if(this.li.hasIntersection())
intersectsBottom=true;this.li.computeIntersection(p0,p1,this.corner[3],this.corner[0]);if(this.li.isProper())
return true;if(intersectsLeft&&intersectsBottom)
return true;if(p0.equals(this.pt))
return true;if(p1.equals(this.pt))
return true;return false;};jsts.noding.snapround.HotPixel.prototype.intersectsPixelClosure=function(p0,p1){this.li.computeIntersection(p0,p1,this.corner[0],this.corner[1]);if(this.li.hasIntersection())
return true;this.li.computeIntersection(p0,p1,this.corner[1],this.corner[2]);if(this.li.hasIntersection())
return true;this.li.computeIntersection(p0,p1,this.corner[2],this.corner[3]);if(this.li.hasIntersection())
return true;this.li.computeIntersection(p0,p1,this.corner[3],this.corner[0]);if(this.li.hasIntersection())
return true;return false;};jsts.noding.snapround.HotPixel.prototype.addSnappedNode=function(segStr,segIndex){var p0=segStr.getCoordinate(segIndex);var p1=segStr.getCoordinate(segIndex+1);if(this.intersects(p0,p1)){segStr.addIntersection(this.getCoordinate(),segIndex);return true;}
return false;};jsts.operation.buffer.BufferInputLineSimplifier=function(inputLine){this.inputLine=inputLine;};jsts.operation.buffer.BufferInputLineSimplifier.simplify=function(inputLine,distanceTol){var simp=new jsts.operation.buffer.BufferInputLineSimplifier(inputLine);return simp.simplify(distanceTol);};jsts.operation.buffer.BufferInputLineSimplifier.INIT=0;jsts.operation.buffer.BufferInputLineSimplifier.DELETE=1;jsts.operation.buffer.BufferInputLineSimplifier.KEEP=1;jsts.operation.buffer.BufferInputLineSimplifier.prototype.inputLine=null;jsts.operation.buffer.BufferInputLineSimplifier.prototype.distanceTol=null;jsts.operation.buffer.BufferInputLineSimplifier.prototype.isDeleted=null;jsts.operation.buffer.BufferInputLineSimplifier.prototype.angleOrientation=jsts.algorithm.CGAlgorithms.COUNTERCLOCKWISE;jsts.operation.buffer.BufferInputLineSimplifier.prototype.simplify=function(distanceTol){this.distanceTol=Math.abs(distanceTol);if(distanceTol<0)
this.angleOrientation=jsts.algorithm.CGAlgorithms.CLOCKWISE;this.isDeleted=[];this.isDeleted.length=this.inputLine.length;var isChanged=false;do{isChanged=this.deleteShallowConcavities();}while(isChanged);return this.collapseLine();};jsts.operation.buffer.BufferInputLineSimplifier.prototype.deleteShallowConcavities=function(){var index=1;var maxIndex=this.inputLine.length-1;var midIndex=this.findNextNonDeletedIndex(index);var lastIndex=this.findNextNonDeletedIndex(midIndex);var isChanged=false;while(lastIndex<this.inputLine.length){var isMiddleVertexDeleted=false;if(this.isDeletable(index,midIndex,lastIndex,this.distanceTol)){this.isDeleted[midIndex]=jsts.operation.buffer.BufferInputLineSimplifier.DELETE;isMiddleVertexDeleted=true;isChanged=true;}
if(isMiddleVertexDeleted)
index=lastIndex;else
index=midIndex;midIndex=this.findNextNonDeletedIndex(index);lastIndex=this.findNextNonDeletedIndex(midIndex);}
return isChanged;};jsts.operation.buffer.BufferInputLineSimplifier.prototype.findNextNonDeletedIndex=function(index){var next=index+1;while(next<this.inputLine.length&&this.isDeleted[next]===jsts.operation.buffer.BufferInputLineSimplifier.DELETE)
next++;return next;};jsts.operation.buffer.BufferInputLineSimplifier.prototype.collapseLine=function(){var coordList=[];for(var i=0;i<this.inputLine.length;i++){if(this.isDeleted[i]!==jsts.operation.buffer.BufferInputLineSimplifier.DELETE)
coordList.push(this.inputLine[i]);}
return coordList;};jsts.operation.buffer.BufferInputLineSimplifier.prototype.isDeletable=function(i0,i1,i2,distanceTol){var p0=this.inputLine[i0];var p1=this.inputLine[i1];var p2=this.inputLine[i2];if(!this.isConcave(p0,p1,p2))
return false;if(!this.isShallow(p0,p1,p2,distanceTol))
return false;return this.isShallowSampled(p0,p1,i0,i2,distanceTol);};jsts.operation.buffer.BufferInputLineSimplifier.prototype.isShallowConcavity=function(p0,p1,p2,distanceTol){var orientation=jsts.algorithm.CGAlgorithms.computeOrientation(p0,p1,p2);var isAngleToSimplify=(orientation===this.angleOrientation);if(!isAngleToSimplify)
return false;var dist=jsts.algorithm.CGAlgorithms.distancePointLine(p1,p0,p2);return dist<distanceTol;};jsts.operation.buffer.BufferInputLineSimplifier.NUM_PTS_TO_CHECK=10;jsts.operation.buffer.BufferInputLineSimplifier.prototype.isShallowSampled=function(p0,p2,i0,i2,distanceTol){var inc=parseInt((i2-i0)/jsts.operation.buffer.BufferInputLineSimplifier.NUM_PTS_TO_CHECK);if(inc<=0)
inc=1;for(var i=i0;i<i2;i+=inc){if(!this.isShallow(p0,p2,this.inputLine[i],distanceTol))
return false;}
return true;};jsts.operation.buffer.BufferInputLineSimplifier.prototype.isShallow=function(p0,p1,p2,distanceTol){var dist=jsts.algorithm.CGAlgorithms.distancePointLine(p1,p0,p2);return dist<distanceTol;};jsts.operation.buffer.BufferInputLineSimplifier.prototype.isConcave=function(p0,p1,p2){var orientation=jsts.algorithm.CGAlgorithms.computeOrientation(p0,p1,p2);var isConcave=(orientation===this.angleOrientation);return isConcave;};jsts.geomgraph.index.SweepLineEvent=function(x,obj,label){if(!(obj instanceof jsts.geomgraph.index.SweepLineEvent)){this.eventType=jsts.geomgraph.index.SweepLineEvent.INSERT;this.label=label;this.xValue=x;this.obj=obj;return;}
this.eventType=jsts.geomgraph.index.SweepLineEvent.DELETE;this.xValue=x;this.insertEvent=obj;};jsts.geomgraph.index.SweepLineEvent.INSERT=1;jsts.geomgraph.index.SweepLineEvent.DELETE=2;jsts.geomgraph.index.SweepLineEvent.prototype.label=null;jsts.geomgraph.index.SweepLineEvent.prototype.xValue=null;jsts.geomgraph.index.SweepLineEvent.prototype.eventType=null;jsts.geomgraph.index.SweepLineEvent.prototype.insertEvent=null;jsts.geomgraph.index.SweepLineEvent.prototype.deleteEventIndex=null;jsts.geomgraph.index.SweepLineEvent.prototype.obj=null;jsts.geomgraph.index.SweepLineEvent.prototype.isInsert=function(){return this.eventType==jsts.geomgraph.index.SweepLineEvent.INSERT;};jsts.geomgraph.index.SweepLineEvent.prototype.isDelete=function(){return this.eventType==jsts.geomgraph.index.SweepLineEvent.DELETE;};jsts.geomgraph.index.SweepLineEvent.prototype.getInsertEvent=function(){return this.insertEvent;};jsts.geomgraph.index.SweepLineEvent.prototype.getDeleteEventIndex=function(){return this.deleteEventIndex;};jsts.geomgraph.index.SweepLineEvent.prototype.setDeleteEventIndex=function(deleteEventIndex){this.deleteEventIndex=deleteEventIndex;};jsts.geomgraph.index.SweepLineEvent.prototype.getObject=function(){return this.obj;};jsts.geomgraph.index.SweepLineEvent.prototype.isSameLabel=function(ev){if(this.label==null){return false;}
return this.label==ev.label;};jsts.geomgraph.index.SweepLineEvent.prototype.compareTo=function(pe){if(this.xValue<pe.xValue){return-1;}
if(this.xValue>pe.xValue){return 1;}
if(this.eventType<pe.eventType){return-1;}
if(this.eventType>pe.eventType){return 1;}
return 0;};jsts.geom.CoordinateList=function(coord,allowRepeated){javascript.util.ArrayList.apply(this,arguments);allowRepeated=(allowRepeated===undefined)?true:allowRepeated;if(coord!==undefined){this.add(coord,allowRepeated);}};jsts.geom.CoordinateList.prototype=new javascript.util.ArrayList();jsts.geom.CoordinateList.prototype.add=function(){if(arguments.length>1){return this.addCoordinates.apply(this,arguments);}else{return javascript.util.ArrayList.prototype.add.apply(this,arguments);}};jsts.geom.CoordinateList.prototype.addCoordinates=function(coord,allowRepeated,direction){if(coord instanceof jsts.geom.Coordinate){return this.addCoordinate.apply(this,arguments);}else if(typeof coord==='number'){return this.insertCoordinate.apply(this,arguments);}
direction=direction||true;if(direction){for(var i=0;i<coord.length;i++){this.addCoordinate(coord[i],allowRepeated);}}else{for(var i=coord.length-1;i>=0;i--){this.addCoordinate(coord[i],allowRepeated);}}
return true;};jsts.geom.CoordinateList.prototype.addCoordinate=function(coord,allowRepeated){if(!allowRepeated){if(this.size()>=1){var last=this.get(this.size()-1);if(last.equals2D(coord))return;}}
this.add(coord);};jsts.geom.CoordinateList.prototype.insertCoordinate=function(index,coord,allowRepeated){if(!allowRepeated){var before=index>0?index-1:-1;if(before!==-1&&this.get(before).equals2D(coord)){return;}
var after=index<this.size()-1?index+1:-1;if(after!==-1&&this.get(after).equals2D(coord)){return;}}
this.array.splice(index,0,coord);};jsts.geom.CoordinateList.prototype.closeRing=function(){if(this.size()>0){this.addCoordinate(new jsts.geom.Coordinate(this.get(0)),false);}};jsts.geom.CoordinateList.prototype.toArray=function(){var i,il,arr;i=0,il=this.size(),arr=[];for(i;i<il;i++){arr[i]=this.get(i);}
return arr;};jsts.geom.CoordinateList.prototype.toCoordinateArray=function(){return this.toArray();};jsts.operation.buffer.OffsetSegmentGenerator=function(precisionModel,bufParams,distance){this.seg0=new jsts.geom.LineSegment();this.seg1=new jsts.geom.LineSegment();this.offset0=new jsts.geom.LineSegment();this.offset1=new jsts.geom.LineSegment();this.precisionModel=precisionModel;this.bufParams=bufParams;this.li=new jsts.algorithm.RobustLineIntersector();this.filletAngleQuantum=Math.PI/2.0/bufParams.getQuadrantSegments();if(this.bufParams.getQuadrantSegments()>=8&&this.bufParams.getJoinStyle()===jsts.operation.buffer.BufferParameters.JOIN_ROUND){this.closingSegLengthFactor=jsts.operation.buffer.OffsetSegmentGenerator.MAX_CLOSING_SEG_LEN_FACTOR;}
this.init(distance);};jsts.operation.buffer.OffsetSegmentGenerator.OFFSET_SEGMENT_SEPARATION_FACTOR=1.0E-3;jsts.operation.buffer.OffsetSegmentGenerator.INSIDE_TURN_VERTEX_SNAP_DISTANCE_FACTOR=1.0E-3;jsts.operation.buffer.OffsetSegmentGenerator.CURVE_VERTEX_SNAP_DISTANCE_FACTOR=1.0E-6;jsts.operation.buffer.OffsetSegmentGenerator.MAX_CLOSING_SEG_LEN_FACTOR=80;jsts.operation.buffer.OffsetSegmentGenerator.prototype.maxCurveSegmentError=0.0;jsts.operation.buffer.OffsetSegmentGenerator.prototype.filletAngleQuantum=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.closingSegLengthFactor=1;jsts.operation.buffer.OffsetSegmentGenerator.prototype.segList=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.distance=0.0;jsts.operation.buffer.OffsetSegmentGenerator.prototype.precisionModel=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.bufParams=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.li=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.s0=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.s1=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.s2=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.seg0=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.seg1=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.offset0=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.offset1=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.side=0;jsts.operation.buffer.OffsetSegmentGenerator.prototype.hasNarrowConcaveAngle=false;jsts.operation.buffer.OffsetSegmentGenerator.prototype.hasNarrowConcaveAngle=function(){return this.hasNarrowConcaveAngle;};jsts.operation.buffer.OffsetSegmentGenerator.prototype.init=function(distance){this.distance=distance;this.maxCurveSegmentError=this.distance*(1-Math.cos(this.filletAngleQuantum/2.0));this.segList=new jsts.operation.buffer.OffsetSegmentString();this.segList.setPrecisionModel(this.precisionModel);this.segList.setMinimumVertexDistance(this.distance*jsts.operation.buffer.OffsetSegmentGenerator.CURVE_VERTEX_SNAP_DISTANCE_FACTOR);};jsts.operation.buffer.OffsetSegmentGenerator.prototype.initSideSegments=function(s1,s2,side){this.s1=s1;this.s2=s2;this.side=side;this.seg1.setCoordinates(this.s1,this.s2);this.computeOffsetSegment(this.seg1,this.side,this.distance,this.offset1);};jsts.operation.buffer.OffsetSegmentGenerator.prototype.getCoordinates=function(){return this.segList.getCoordinates();};jsts.operation.buffer.OffsetSegmentGenerator.prototype.closeRing=function(){this.segList.closeRing();};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addSegments=function(pt,isForward){this.segList.addPts(pt,isForward);};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addFirstSegment=function(){this.segList.addPt(this.offset1.p0);};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addLastSegment=function(){this.segList.addPt(this.offset1.p1);};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addNextSegment=function(p,addStartPoint){this.s0=this.s1;this.s1=this.s2;this.s2=p;this.seg0.setCoordinates(this.s0,this.s1);this.computeOffsetSegment(this.seg0,this.side,this.distance,this.offset0);this.seg1.setCoordinates(this.s1,this.s2);this.computeOffsetSegment(this.seg1,this.side,this.distance,this.offset1);if(this.s1.equals(this.s2))
return;var orientation=jsts.algorithm.CGAlgorithms.computeOrientation(this.s0,this.s1,this.s2);var outsideTurn=(orientation===jsts.algorithm.CGAlgorithms.CLOCKWISE&&this.side===jsts.geomgraph.Position.LEFT)||(orientation===jsts.algorithm.CGAlgorithms.COUNTERCLOCKWISE&&this.side===jsts.geomgraph.Position.RIGHT);if(orientation==0){this.addCollinear(addStartPoint);}else if(outsideTurn){this.addOutsideTurn(orientation,addStartPoint);}else{this.addInsideTurn(orientation,addStartPoint);}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addCollinear=function(addStartPoint){this.li.computeIntersection(this.s0,this.s1,this.s1,this.s2);var numInt=this.li.getIntersectionNum();if(numInt>=2){if(this.bufParams.getJoinStyle()===jsts.operation.buffer.BufferParameters.JOIN_BEVEL||this.bufParams.getJoinStyle()===jsts.operation.buffer.BufferParameters.JOIN_MITRE){if(addStartPoint)
this.segList.addPt(this.offset0.p1);this.segList.addPt(this.offset1.p0);}else{this.addFillet(this.s1,this.offset0.p1,this.offset1.p0,jsts.algorithm.CGAlgorithms.CLOCKWISE,this.distance);}}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addOutsideTurn=function(orientation,addStartPoint){if(this.offset0.p1.distance(this.offset1.p0)<this.distance*jsts.operation.buffer.OffsetSegmentGenerator.OFFSET_SEGMENT_SEPARATION_FACTOR){this.segList.addPt(this.offset0.p1);return;}
if(this.bufParams.getJoinStyle()===jsts.operation.buffer.BufferParameters.JOIN_MITRE){this.addMitreJoin(this.s1,this.offset0,this.offset1,this.distance);}else if(this.bufParams.getJoinStyle()===jsts.operation.buffer.BufferParameters.JOIN_BEVEL){this.addBevelJoin(this.offset0,this.offset1);}else{if(addStartPoint)
this.segList.addPt(this.offset0.p1);this.addFillet(this.s1,this.offset0.p1,this.offset1.p0,orientation,this.distance);this.segList.addPt(this.offset1.p0);}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addInsideTurn=function(orientation,addStartPoint){this.li.computeIntersection(this.offset0.p0,this.offset0.p1,this.offset1.p0,this.offset1.p1);if(this.li.hasIntersection()){this.segList.addPt(this.li.getIntersection(0));}else{this.hasNarrowConcaveAngle=true;if(this.offset0.p1.distance(this.offset1.p0)<this.distance*jsts.operation.buffer.OffsetSegmentGenerator.INSIDE_TURN_VERTEX_SNAP_DISTANCE_FACTOR){this.segList.addPt(this.offset0.p1);}else{this.segList.addPt(this.offset0.p1);if(this.closingSegLengthFactor>0){var mid0=new jsts.geom.Coordinate((this.closingSegLengthFactor*this.offset0.p1.x+this.s1.x)/(this.closingSegLengthFactor+1),(this.closingSegLengthFactor*this.offset0.p1.y+this.s1.y)/(this.closingSegLengthFactor+1));this.segList.addPt(mid0);var mid1=new jsts.geom.Coordinate((this.closingSegLengthFactor*this.offset1.p0.x+this.s1.x)/(this.closingSegLengthFactor+1),(this.closingSegLengthFactor*this.offset1.p0.y+this.s1.y)/(this.closingSegLengthFactor+1));this.segList.addPt(mid1);}else{this.segList.addPt(this.s1);}
this.segList.addPt(this.offset1.p0);}}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.computeOffsetSegment=function(seg,side,distance,offset){var sideSign=side===jsts.geomgraph.Position.LEFT?1:-1;var dx=seg.p1.x-seg.p0.x;var dy=seg.p1.y-seg.p0.y;var len=Math.sqrt(dx*dx+dy*dy);var ux=sideSign*distance*dx/len;var uy=sideSign*distance*dy/len;offset.p0.x=seg.p0.x-uy;offset.p0.y=seg.p0.y+ux;offset.p1.x=seg.p1.x-uy;offset.p1.y=seg.p1.y+ux;};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addLineEndCap=function(p0,p1){var seg=new jsts.geom.LineSegment(p0,p1);var offsetL=new jsts.geom.LineSegment();this.computeOffsetSegment(seg,jsts.geomgraph.Position.LEFT,this.distance,offsetL);var offsetR=new jsts.geom.LineSegment();this.computeOffsetSegment(seg,jsts.geomgraph.Position.RIGHT,this.distance,offsetR);var dx=p1.x-p0.x;var dy=p1.y-p0.y;var angle=Math.atan2(dy,dx);switch(this.bufParams.getEndCapStyle()){case jsts.operation.buffer.BufferParameters.CAP_ROUND:this.segList.addPt(offsetL.p1);this.addFillet(p1,angle+Math.PI/2,angle-Math.PI/2,jsts.algorithm.CGAlgorithms.CLOCKWISE,this.distance);this.segList.addPt(offsetR.p1);break;case jsts.operation.buffer.BufferParameters.CAP_FLAT:this.segList.addPt(offsetL.p1);this.segList.addPt(offsetR.p1);break;case jsts.operation.buffer.BufferParameters.CAP_SQUARE:var squareCapSideOffset=new jsts.geom.Coordinate();squareCapSideOffset.x=Math.abs(this.distance)*Math.cos(angle);squareCapSideOffset.y=Math.abs(this.distance)*Math.sin(angle);var squareCapLOffset=new jsts.geom.Coordinate(offsetL.p1.x+
squareCapSideOffset.x,offsetL.p1.y+squareCapSideOffset.y);var squareCapROffset=new jsts.geom.Coordinate(offsetR.p1.x+
squareCapSideOffset.x,offsetR.p1.y+squareCapSideOffset.y);this.segList.addPt(squareCapLOffset);this.segList.addPt(squareCapROffset);break;}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addMitreJoin=function(p,offset0,offset1,distance){var isMitreWithinLimit=true;var intPt=null;try{intPt=jsts.algorithm.HCoordinate.intersection(offset0.p0,offset0.p1,offset1.p0,offset1.p1);var mitreRatio=distance<=0.0?1.0:intPt.distance(p)/Math.abs(distance);if(mitreRatio>this.bufParams.getMitreLimit())
this.isMitreWithinLimit=false;}catch(e){if(e instanceof jsts.error.NotRepresentableError){intPt=new jsts.geom.Coordinate(0,0);this.isMitreWithinLimit=false;}}
if(isMitreWithinLimit){this.segList.addPt(intPt);}else{this.addLimitedMitreJoin(offset0,offset1,distance,bufParams.getMitreLimit());}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addLimitedMitreJoin=function(offset0,offset1,distance,mitreLimit){var basePt=this.seg0.p1;var ang0=jsts.algorithm.Angle.angle(basePt,this.seg0.p0);var ang1=jsts.algorithm.Angle.angle(basePt,this.seg1.p1);var angDiff=jsts.algorithm.Angle.angleBetweenOriented(this.seg0.p0,basePt,this.seg1.p1);var angDiffHalf=angDiff/2;var midAng=jsts.algorithm.Angle.normalize(ang0+angDiffHalf);var mitreMidAng=jsts.algorithm.Angle.normalize(midAng+Math.PI);var mitreDist=mitreLimit*distance;var bevelDelta=mitreDist*Math.abs(Math.sin(angDiffHalf));var bevelHalfLen=distance-bevelDelta;var bevelMidX=basePt.x+mitreDist*Math.cos(mitreMidAng);var bevelMidY=basePt.y+mitreDist*Math.sin(mitreMidAng);var bevelMidPt=new jsts.geom.Coordinate(bevelMidX,bevelMidY);var mitreMidLine=new jsts.geom.LineSegment(basePt,bevelMidPt);var bevelEndLeft=mitreMidLine.pointAlongOffset(1.0,bevelHalfLen);var bevelEndRight=mitreMidLine.pointAlongOffset(1.0,-bevelHalfLen);if(this.side==jsts.geomgraph.Position.LEFT){this.segList.addPt(bevelEndLeft);this.segList.addPt(bevelEndRight);}else{this.segList.addPt(bevelEndRight);this.segList.addPt(bevelEndLeft);}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addBevelJoin=function(offset0,offset1){this.segList.addPt(offset0.p1);this.segList.addPt(offset1.p0);};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addFillet=function(p,p0,p1,direction,radius){if(!(p1 instanceof jsts.geom.Coordinate)){this.addFillet2.apply(this,arguments);return;}
var dx0=p0.x-p.x;var dy0=p0.y-p.y;var startAngle=Math.atan2(dy0,dx0);var dx1=p1.x-p.x;var dy1=p1.y-p.y;var endAngle=Math.atan2(dy1,dx1);if(direction===jsts.algorithm.CGAlgorithms.CLOCKWISE){if(startAngle<=endAngle)
startAngle+=2.0*Math.PI;}else{if(startAngle>=endAngle)
startAngle-=2.0*Math.PI;}
this.segList.addPt(p0);this.addFillet(p,startAngle,endAngle,direction,radius);this.segList.addPt(p1);};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addFillet2=function(p,startAngle,endAngle,direction,radius){var directionFactor=direction===jsts.algorithm.CGAlgorithms.CLOCKWISE?-1:1;var totalAngle=Math.abs(startAngle-endAngle);var nSegs=parseInt((totalAngle/this.filletAngleQuantum+0.5));if(nSegs<1)
return;var initAngle,currAngleInc;initAngle=0.0;currAngleInc=totalAngle/nSegs;var currAngle=initAngle;var pt=new jsts.geom.Coordinate();while(currAngle<totalAngle){var angle=startAngle+directionFactor*currAngle;pt.x=p.x+radius*Math.cos(angle);pt.y=p.y+radius*Math.sin(angle);this.segList.addPt(pt);currAngle+=currAngleInc;}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.createCircle=function(p){var pt=new jsts.geom.Coordinate(p.x+this.distance,p.y);this.segList.addPt(pt);this.addFillet(p,0.0,2.0*Math.PI,-1,this.distance);this.segList.closeRing();};jsts.operation.buffer.OffsetSegmentGenerator.prototype.createSquare=function(p){this.segList.addPt(new jsts.geom.Coordinate(p.x+distance,p.y+distance));this.segList.addPt(new jsts.geom.Coordinate(p.x+distance,p.y-distance));this.segList.addPt(new jsts.geom.Coordinate(p.x-distance,p.y-distance));this.segList.addPt(new jsts.geom.Coordinate(p.x-distance,p.y+distance));this.segList.closeRing();};jsts.operation.overlay.MaximalEdgeRing=function(start,geometryFactory){jsts.geomgraph.EdgeRing.call(this,start,geometryFactory);};jsts.operation.overlay.MaximalEdgeRing.prototype=new jsts.geomgraph.EdgeRing();jsts.operation.overlay.MaximalEdgeRing.constructor=jsts.operation.overlay.MaximalEdgeRing;jsts.operation.overlay.MaximalEdgeRing.prototype.getNext=function(de)
{return de.getNext();};jsts.operation.overlay.MaximalEdgeRing.prototype.setEdgeRing=function(de,er)
{de.setEdgeRing(er);};jsts.operation.overlay.MaximalEdgeRing.prototype.linkDirectedEdgesForMinimalEdgeRings=function()
{var de=this.startDe;do{var node=de.getNode();node.getEdges().linkMinimalDirectedEdges(this);de=de.getNext();}while(de!=this.startDe);};jsts.operation.overlay.MaximalEdgeRing.prototype.buildMinimalRings=function()
{var minEdgeRings=[];var de=this.startDe;do{if(de.getMinEdgeRing()===null){var minEr=new jsts.operation.overlay.MinimalEdgeRing(de,this.geometryFactory);minEdgeRings.push(minEr);}
de=de.getNext();}while(de!=this.startDe);return minEdgeRings;};jsts.algorithm.CentroidPoint=function(){this.centSum=new jsts.geom.Coordinate();};jsts.algorithm.CentroidPoint.prototype.ptCount=0;jsts.algorithm.CentroidPoint.prototype.centSum=null;jsts.algorithm.CentroidPoint.prototype.add=function(geom){if(geom instanceof jsts.geom.Point){this.add2(geom.getCoordinate());}else if(geom instanceof jsts.geom.GeometryCollection||geom instanceof jsts.geom.MultiPoint||geom instanceof jsts.geom.MultiLineString||geom instanceof jsts.geom.MultiPolygon){var gc=geom;for(var i=0;i<gc.getNumGeometries();i++){this.add(gc.getGeometryN(i));}}};jsts.algorithm.CentroidPoint.prototype.add2=function(pt){this.ptCount+=1;this.centSum.x+=pt.x;this.centSum.y+=pt.y;};jsts.algorithm.CentroidPoint.prototype.getCentroid=function(){var cent=new jsts.geom.Coordinate();cent.x=this.centSum.x/this.ptCount;cent.y=this.centSum.y/this.ptCount;return cent;};jsts.operation.distance.ConnectedElementLocationFilter=function(locations){this.locations=locations;};jsts.operation.distance.ConnectedElementLocationFilter.prototype=new jsts.geom.GeometryFilter();jsts.operation.distance.ConnectedElementLocationFilter.prototype.locations=null;jsts.operation.distance.ConnectedElementLocationFilter.getLocations=function(geom){var locations=[];geom.apply(new jsts.operation.distance.ConnectedElementLocationFilter(locations));return locations;};jsts.operation.distance.ConnectedElementLocationFilter.prototype.filter=function(geom){if(geom instanceof jsts.geom.Point||geom instanceof jsts.geom.LineString||geom instanceof jsts.geom.Polygon)
this.locations.push(new jsts.operation.distance.GeometryLocation(geom,0,geom.getCoordinate()));};jsts.geomgraph.index.MonotoneChainEdge=function(e){this.e=e;this.pts=e.getCoordinates();var mcb=new jsts.geomgraph.index.MonotoneChainIndexer();this.startIndex=mcb.getChainStartIndices(this.pts);};jsts.geomgraph.index.MonotoneChainEdge.prototype.e=null;jsts.geomgraph.index.MonotoneChainEdge.prototype.pts=null;jsts.geomgraph.index.MonotoneChainEdge.prototype.startIndex=null;jsts.geomgraph.index.MonotoneChainEdge.prototype.env1=new jsts.geom.Envelope();jsts.geomgraph.index.MonotoneChainEdge.prototype.env2=new jsts.geom.Envelope();jsts.geomgraph.index.MonotoneChainEdge.prototype.getCoordinates=function(){return this.pts;};jsts.geomgraph.index.MonotoneChainEdge.prototype.getStartIndexes=function(){return this.startIndex;};jsts.geomgraph.index.MonotoneChainEdge.prototype.getMinX=function(chainIndex){var x1=this.pts[this.startIndex[chainIndex]].x;var x2=this.pts[this.startIndex[chainIndex+1]].x;if(x1<x2){return x1;}
return x2;};jsts.geomgraph.index.MonotoneChainEdge.prototype.getMaxX=function(chainIndex){var x1=this.pts[this.startIndex[chainIndex]].x;var x2=this.pts[this.startIndex[chainIndex+1]].x;if(x1>x2){return x1;}
return x2;};jsts.geomgraph.index.MonotoneChainEdge.prototype.computeIntersects=function(mce,si){for(var i=0;i<this.startIndex.length-1;i++){for(var j=0;j<mce.startIndex.length-1;j++){this.computeIntersectsForChain(i,mce,j,si);}}};jsts.geomgraph.index.MonotoneChainEdge.prototype.computeIntersectsForChain=function(chainIndex0,mce,chainIndex1,si){this.computeIntersectsForChain2(this.startIndex[chainIndex0],this.startIndex[chainIndex0+1],mce,mce.startIndex[chainIndex1],mce.startIndex[chainIndex1+1],si);};jsts.geomgraph.index.MonotoneChainEdge.prototype.computeIntersectsForChain2=function(start0,end0,mce,start1,end1,ei){var p00=this.pts[start0];var p01=this.pts[end0];var p10=mce.pts[start1];var p11=mce.pts[end1];if(end0-start0==1&&end1-start1==1){ei.addIntersections(this.e,start0,mce.e,start1);return;}
this.env1.init(p00,p01);this.env2.init(p10,p11);if(!this.env1.intersects(this.env2)){return;}
var mid0=Math.floor((start0+end0)/2);var mid1=Math.floor((start1+end1)/2);if(start0<mid0){if(start1<mid1){this.computeIntersectsForChain2(start0,mid0,mce,start1,mid1,ei);}
if(mid1<end1){this.computeIntersectsForChain2(start0,mid0,mce,mid1,end1,ei);}}
if(mid0<end0){if(start1<mid1){this.computeIntersectsForChain2(mid0,end0,mce,start1,mid1,ei);}
if(mid1<end1){this.computeIntersectsForChain2(mid0,end0,mce,mid1,end1,ei);}}};(function(){var ArrayList=javascript.util.ArrayList;jsts.operation.relate.EdgeEndBuilder=function(){};jsts.operation.relate.EdgeEndBuilder.prototype.computeEdgeEnds=function(edges){if(arguments.length==2){this.computeEdgeEnds2.apply(this,arguments);return;}
var l=new ArrayList();for(var i=edges;i.hasNext();){var e=i.next();this.computeEdgeEnds2(e,l);}
return l;};jsts.operation.relate.EdgeEndBuilder.prototype.computeEdgeEnds2=function(edge,l){var eiList=edge.getEdgeIntersectionList();eiList.addEndpoints();var it=eiList.iterator();var eiPrev=null;var eiCurr=null;if(!it.hasNext())
return;var eiNext=it.next();do{eiPrev=eiCurr;eiCurr=eiNext;eiNext=null;if(it.hasNext())
eiNext=it.next();if(eiCurr!==null){this.createEdgeEndForPrev(edge,l,eiCurr,eiPrev);this.createEdgeEndForNext(edge,l,eiCurr,eiNext);}}while(eiCurr!==null);};jsts.operation.relate.EdgeEndBuilder.prototype.createEdgeEndForPrev=function(edge,l,eiCurr,eiPrev){var iPrev=eiCurr.segmentIndex;if(eiCurr.dist===0.0){if(iPrev===0)
return;iPrev--;}
var pPrev=edge.getCoordinate(iPrev);if(eiPrev!==null&&eiPrev.segmentIndex>=iPrev)
pPrev=eiPrev.coord;var label=new jsts.geomgraph.Label(edge.getLabel());label.flip();var e=new jsts.geomgraph.EdgeEnd(edge,eiCurr.coord,pPrev,label);l.add(e);};jsts.operation.relate.EdgeEndBuilder.prototype.createEdgeEndForNext=function(edge,l,eiCurr,eiNext){var iNext=eiCurr.segmentIndex+1;if(iNext>=edge.getNumPoints()&&eiNext===null)
return;var pNext=edge.getCoordinate(iNext);if(eiNext!==null&&eiNext.segmentIndex===eiCurr.segmentIndex)
pNext=eiNext.coord;var e=new jsts.geomgraph.EdgeEnd(edge,eiCurr.coord,pNext,new jsts.geomgraph.Label(edge.getLabel()));l.add(e);};})();(function(){var ArrayList=javascript.util.ArrayList;var TreeSet=javascript.util.TreeSet;var CoordinateFilter=jsts.geom.CoordinateFilter;jsts.util.UniqueCoordinateArrayFilter=function(){this.treeSet=new TreeSet();this.list=new ArrayList();};jsts.util.UniqueCoordinateArrayFilter.prototype=new CoordinateFilter();jsts.util.UniqueCoordinateArrayFilter.prototype.treeSet=null;jsts.util.UniqueCoordinateArrayFilter.prototype.list=null;jsts.util.UniqueCoordinateArrayFilter.prototype.getCoordinates=function(){return this.list.toArray();};jsts.util.UniqueCoordinateArrayFilter.prototype.filter=function(coord){if(!this.treeSet.contains(coord)){this.list.add(coord);this.treeSet.add(coord);}};})();(function(){var CGAlgorithms=jsts.algorithm.CGAlgorithms;var UniqueCoordinateArrayFilter=jsts.util.UniqueCoordinateArrayFilter;var Assert=jsts.util.Assert;var Stack=javascript.util.Stack;var ArrayList=javascript.util.ArrayList;var Arrays=javascript.util.Arrays;var RadialComparator=function(origin){this.origin=origin;};RadialComparator.prototype.origin=null;RadialComparator.prototype.compare=function(o1,o2){var p1=o1;var p2=o2;return RadialComparator.polarCompare(this.origin,p1,p2);};RadialComparator.polarCompare=function(o,p,q){var dxp=p.x-o.x;var dyp=p.y-o.y;var dxq=q.x-o.x;var dyq=q.y-o.y;var orient=CGAlgorithms.computeOrientation(o,p,q);if(orient==CGAlgorithms.COUNTERCLOCKWISE)
return 1;if(orient==CGAlgorithms.CLOCKWISE)
return-1;var op=dxp*dxp+dyp*dyp;var oq=dxq*dxq+dyq*dyq;if(op<oq){return-1;}
if(op>oq){return 1;}
return 0;};jsts.algorithm.ConvexHull=function(){if(arguments.length===1){var geometry=arguments[0];this.inputPts=jsts.algorithm.ConvexHull.extractCoordinates(geometry);this.geomFactory=geometry.getFactory();}else{this.pts=arguments[0];this.geomFactory=arguments[1];}};jsts.algorithm.ConvexHull.prototype.geomFactory=null;jsts.algorithm.ConvexHull.prototype.inputPts=null;jsts.algorithm.ConvexHull.extractCoordinates=function(geom){var filter=new UniqueCoordinateArrayFilter();geom.apply(filter);return filter.getCoordinates();};jsts.algorithm.ConvexHull.prototype.getConvexHull=function(){if(this.inputPts.length==0){return this.geomFactory.createGeometryCollection(null);}
if(this.inputPts.length==1){return this.geomFactory.createPoint(this.inputPts[0]);}
if(this.inputPts.length==2){return this.geomFactory.createLineString(this.inputPts);}
var reducedPts=this.inputPts;if(this.inputPts.length>50){reducedPts=this.reduce(this.inputPts);}
var sortedPts=this.preSort(reducedPts);var cHS=this.grahamScan(sortedPts);var cH=cHS.toArray();return this.lineOrPolygon(cH);};jsts.algorithm.ConvexHull.prototype.reduce=function(inputPts){var polyPts=this.computeOctRing(inputPts);if(polyPts==null)
return this.inputPts;var reducedSet=new javascript.util.TreeSet();for(var i=0;i<polyPts.length;i++){reducedSet.add(polyPts[i]);}
for(var i=0;i<inputPts.length;i++){if(!CGAlgorithms.isPointInRing(inputPts[i],polyPts)){reducedSet.add(inputPts[i]);}}
var reducedPts=reducedSet.toArray();if(reducedPts.length<3)
return this.padArray3(reducedPts);return reducedPts;};jsts.algorithm.ConvexHull.prototype.padArray3=function(pts){var pad=[];for(var i=0;i<pad.length;i++){if(i<pts.length){pad[i]=pts[i];}else
pad[i]=pts[0];}
return pad;};jsts.algorithm.ConvexHull.prototype.preSort=function(pts){var t;for(var i=1;i<pts.length;i++){if((pts[i].y<pts[0].y)||((pts[i].y==pts[0].y)&&(pts[i].x<pts[0].x))){t=pts[0];pts[0]=pts[i];pts[i]=t;}}
Arrays.sort(pts,1,pts.length,new RadialComparator(pts[0]));return pts;};jsts.algorithm.ConvexHull.prototype.grahamScan=function(c){var p;var ps=new Stack();p=ps.push(c[0]);p=ps.push(c[1]);p=ps.push(c[2]);for(var i=3;i<c.length;i++){p=ps.pop();while(!ps.empty()&&CGAlgorithms.computeOrientation(ps.peek(),p,c[i])>0){p=ps.pop();}
p=ps.push(p);p=ps.push(c[i]);}
p=ps.push(c[0]);return ps;};jsts.algorithm.ConvexHull.prototype.isBetween=function(c1,c2,c3){if(CGAlgorithms.computeOrientation(c1,c2,c3)!==0){return false;}
if(c1.x!=c3.x){if(c1.x<=c2.x&&c2.x<=c3.x){return true;}
if(c3.x<=c2.x&&c2.x<=c1.x){return true;}}
if(c1.y!=c3.y){if(c1.y<=c2.y&&c2.y<=c3.y){return true;}
if(c3.y<=c2.y&&c2.y<=c1.y){return true;}}
return false;};jsts.algorithm.ConvexHull.prototype.computeOctRing=function(inputPts){var octPts=this.computeOctPts(inputPts);var coordList=new jsts.geom.CoordinateList();coordList.add(octPts,false);if(coordList.size()<3){return null;}
coordList.closeRing();return coordList.toCoordinateArray();};jsts.algorithm.ConvexHull.prototype.computeOctPts=function(inputPts){var pts=[];for(var j=0;j<8;j++){pts[j]=inputPts[0];}
for(var i=1;i<inputPts.length;i++){if(inputPts[i].x<pts[0].x){pts[0]=inputPts[i];}
if(inputPts[i].x-inputPts[i].y<pts[1].x-pts[1].y){pts[1]=inputPts[i];}
if(inputPts[i].y>pts[2].y){pts[2]=inputPts[i];}
if(inputPts[i].x+inputPts[i].y>pts[3].x+pts[3].y){pts[3]=inputPts[i];}
if(inputPts[i].x>pts[4].x){pts[4]=inputPts[i];}
if(inputPts[i].x-inputPts[i].y>pts[5].x-pts[5].y){pts[5]=inputPts[i];}
if(inputPts[i].y<pts[6].y){pts[6]=inputPts[i];}
if(inputPts[i].x+inputPts[i].y<pts[7].x+pts[7].y){pts[7]=inputPts[i];}}
return pts;};jsts.algorithm.ConvexHull.prototype.lineOrPolygon=function(coordinates){coordinates=this.cleanRing(coordinates);if(coordinates.length==3){return this.geomFactory.createLineString([coordinates[0],coordinates[1]]);}
var linearRing=this.geomFactory.createLinearRing(coordinates);return this.geomFactory.createPolygon(linearRing,null);};jsts.algorithm.ConvexHull.prototype.cleanRing=function(original){Assert.equals(original[0],original[original.length-1]);var cleanedRing=new ArrayList();var previousDistinctCoordinate=null;for(var i=0;i<=original.length-2;i++){var currentCoordinate=original[i];var nextCoordinate=original[i+1];if(currentCoordinate.equals(nextCoordinate)){continue;}
if(previousDistinctCoordinate!=null&&this.isBetween(previousDistinctCoordinate,currentCoordinate,nextCoordinate)){continue;}
cleanedRing.add(currentCoordinate);previousDistinctCoordinate=currentCoordinate;}
cleanedRing.add(original[original.length-1]);var cleanedRingCoordinates=[];return cleanedRing.toArray(cleanedRingCoordinates);};})();jsts.algorithm.MinimumDiameter=function(inputGeom,isConvex){this.convexHullPts=null;this.minBaseSeg=new jsts.geom.LineSegment();this.minWidthPt=null;this.minPtIndex=0;this.minWidth=0;jsts.algorithm.MinimumDiameter.inputGeom=inputGeom;jsts.algorithm.MinimumDiameter.isConvex=isConvex||false;};jsts.algorithm.MinimumDiameter.inputGeom=null;jsts.algorithm.MinimumDiameter.isConvex=false;jsts.algorithm.MinimumDiameter.nextIndex=function(pts,index){index++;if(index>=pts.length){index=0;}
return index;};jsts.algorithm.MinimumDiameter.computeC=function(a,b,p){return a*p.y-b*p.x;};jsts.algorithm.MinimumDiameter.computeSegmentForLine=function(a,b,c){var p0;var p1;if(Math.abs(b)>Math.abs(a)){p0=new jsts.geom.Coordinate(0,c/b);p1=new jsts.geom.Coordinate(1,c/b-a/b);}
else{p0=new jsts.geom.Coordinate(c/a,0);p1=new jsts.geom.Coordinate(c/a-b/a,1);}
return new jsts.geom.LineSegment(p0,p1);};jsts.algorithm.MinimumDiameter.prototype.getLength=function(){this.computeMinimumDiameter();return this.minWidth;};jsts.algorithm.MinimumDiameter.prototype.getWidthCoordinate=function(){this.computeMinimumDiameter();return this.minWidthPt;};jsts.algorithm.MinimumDiameter.prototype.getSupportingSegment=function(){this.computeMinimumDiameter();var coord=[this.minBaseSeg.p0,this.minBaseSeg.p1];return jsts.algorithm.MinimumDiameter.inputGeom.getFactory().createLineString(coord);};jsts.algorithm.MinimumDiameter.prototype.getDiameter=function(){this.computeMinimumDiameter();if(this.minWidthPt===null){return jsts.algorithm.MinimumDiameter.inputGeom.getFactory().createLineString(null);}
var basePt=this.minBaseSeg.project(this.minWidthPt);return jsts.algorithm.MinimumDiameter.inputGeom.getFactory().createLineString([basePt,this.minWidthPt]);};jsts.algorithm.MinimumDiameter.prototype.computeMinimumDiameter=function(){if(this.minWidthPt!==null){return;}
if(jsts.algorithm.MinimumDiameter.isConvex)
this.computeWidthConvex(jsts.algorithm.MinimumDiameter.inputGeom);else{var convexGeom=new jsts.algorithm.ConvexHull(jsts.algorithm.MinimumDiameter.inputGeom).getConvexHull();this.computeWidthConvex(convexGeom);}};jsts.algorithm.MinimumDiameter.prototype.computeWidthConvex=function(convexGeom){if(convexGeom instanceof jsts.geom.Polygon){this.convexHullPts=convexGeom.getExteriorRing().getCoordinates();}else{this.convexHullPts=convexGeom.getCoordinates();}
if(this.convexHullPts.length===0){this.minWidth=0;this.minWidthPt=null;this.minBaseSeg=null;}else if(this.convexHullPts.length===1){this.minWidth=0;this.minWidthPt=this.convexHullPts[0];this.minBaseSeg.p0=this.convexHullPts[0];this.minBaseSeg.p1=this.convexHullPts[0];}else if(this.convexHullPts.length===2||this.convexHullPts.length===3){this.minWidth=0;this.minWidthPt=this.convexHullPts[0];this.minBaseSeg.p0=this.convexHullPts[0];this.minBaseSeg.p1=this.convexHullPts[1];}else{this.computeConvexRingMinDiameter(this.convexHullPts);}};jsts.algorithm.MinimumDiameter.prototype.computeConvexRingMinDiameter=function(pts){this.minWidth=Number.MAX_VALUE;var currMaxIndex=1;var seg=new jsts.geom.LineSegment();for(var i=0;i<pts.length-1;i++){seg.p0=pts[i];seg.p1=pts[i+1];currMaxIndex=this.findMaxPerpDistance(pts,seg,currMaxIndex);}};jsts.algorithm.MinimumDiameter.prototype.findMaxPerpDistance=function(pts,seg,startIndex){var maxPerpDistance=seg.distancePerpendicular(pts[startIndex]);var nextPerpDistance=maxPerpDistance;var maxIndex=startIndex;var nextIndex=maxIndex;while(nextPerpDistance>=maxPerpDistance){maxPerpDistance=nextPerpDistance;maxIndex=nextIndex;nextIndex=jsts.algorithm.MinimumDiameter.nextIndex(pts,maxIndex);nextPerpDistance=seg.distancePerpendicular(pts[nextIndex]);}
if(maxPerpDistance<this.minWidth){this.minPtIndex=maxIndex;this.minWidth=maxPerpDistance;this.minWidthPt=pts[this.minPtIndex];this.minBaseSeg=new jsts.geom.LineSegment(seg);}
return maxIndex;};jsts.algorithm.MinimumDiameter.prototype.getMinimumRectangle=function(){this.computeMinimumDiameter();if(this.minWidth===0){if(this.minBaseSeg.p0.equals2D(this.minBaseSeg.p1)){return jsts.algorithm.MinimumDiameter.inputGeom.getFactory().createPoint(this.minBaseSeg.p0);}
return this.minBaseSeg.toGeometry(jsts.algorithm.MinimumDiameter.inputGeom.getFactory());}
var dx=this.minBaseSeg.p1.x-this.minBaseSeg.p0.x;var dy=this.minBaseSeg.p1.y-this.minBaseSeg.p0.y;var minPara=Number.MAX_VALUE;var maxPara=-Number.MAX_VALUE;var minPerp=Number.MAX_VALUE;var maxPerp=-Number.MAX_VALUE;for(var i=0;i<this.convexHullPts.length;i++){var paraC=jsts.algorithm.MinimumDiameter.computeC(dx,dy,this.convexHullPts[i]);if(paraC>maxPara)maxPara=paraC;if(paraC<minPara)minPara=paraC;var perpC=jsts.algorithm.MinimumDiameter.computeC(-dy,dx,this.convexHullPts[i]);if(perpC>maxPerp)maxPerp=perpC;if(perpC<minPerp)minPerp=perpC;}
var maxPerpLine=jsts.algorithm.MinimumDiameter.computeSegmentForLine(-dx,-dy,maxPerp);var minPerpLine=jsts.algorithm.MinimumDiameter.computeSegmentForLine(-dx,-dy,minPerp);var maxParaLine=jsts.algorithm.MinimumDiameter.computeSegmentForLine(-dy,dx,maxPara);var minParaLine=jsts.algorithm.MinimumDiameter.computeSegmentForLine(-dy,dx,minPara);var p0=maxParaLine.lineIntersection(maxPerpLine);var p1=minParaLine.lineIntersection(maxPerpLine);var p2=minParaLine.lineIntersection(minPerpLine);var p3=maxParaLine.lineIntersection(minPerpLine);var shell=jsts.algorithm.MinimumDiameter.inputGeom.getFactory().createLinearRing([p0,p1,p2,p3,p0]);return jsts.algorithm.MinimumDiameter.inputGeom.getFactory().createPolygon(shell,null);};(function(){jsts.io.GeoJSONParser=function(geometryFactory){this.geometryFactory=geometryFactory||new jsts.geom.GeometryFactory();this.geometryTypes=['Point','MultiPoint','LineString','MultiLineString','Polygon','MultiPolygon'];};jsts.io.GeoJSONParser.prototype.read=function(json){var obj;if(typeof json==='string'){obj=JSON.parse(json);}else{obj=json;}
var type=obj.type;if(!this.parse[type]){throw new Error('Unknown GeoJSON type: '+obj.type);}
if(this.geometryTypes.indexOf(type)!=-1){return this.parse[type].apply(this,[obj.coordinates]);}else if(type==='GeometryCollection'){return this.parse[type].apply(this,[obj.geometries]);}
return this.parse[type].apply(this,[obj]);};jsts.io.GeoJSONParser.prototype.parse={'Feature':function(obj){var feature={};for(var key in obj){feature[key]=obj[key];}
if(obj.geometry){var type=obj.geometry.type;if(!this.parse[type]){throw new Error('Unknown GeoJSON type: '+obj.type);}
feature.geometry=this.read(obj.geometry);}
if(obj.bbox){feature.bbox=this.parse.bbox.apply(this,[obj.bbox]);}
return feature;},'FeatureCollection':function(obj){var featureCollection={};if(obj.features){featureCollection.features=[];for(var i=0;i<obj.features.length;++i){featureCollection.features.push(this.read(obj.features[i]));}}
if(obj.bbox){featureCollection.bbox=this.parse.bbox.apply(this,[obj.bbox]);}
return featureCollection;},'coordinates':function(array){var coordinates=[];for(var i=0;i<array.length;++i){var sub=array[i];coordinates.push(new jsts.geom.Coordinate(sub[0],sub[1]));}
return coordinates;},'bbox':function(array){return this.geometryFactory.createLinearRing([new jsts.geom.Coordinate(array[0],array[1]),new jsts.geom.Coordinate(array[2],array[1]),new jsts.geom.Coordinate(array[2],array[3]),new jsts.geom.Coordinate(array[0],array[3]),new jsts.geom.Coordinate(array[0],array[1])]);},'Point':function(array){var coordinate=new jsts.geom.Coordinate(array[0],array[1]);return this.geometryFactory.createPoint(coordinate);},'MultiPoint':function(array){var points=[];for(var i=0;i<array.length;++i){points.push(this.parse.Point.apply(this,[array[i]]));}
return this.geometryFactory.createMultiPoint(points);},'LineString':function(array){var coordinates=this.parse.coordinates.apply(this,[array]);return this.geometryFactory.createLineString(coordinates);},'MultiLineString':function(array){var lineStrings=[];for(var i=0;i<array.length;++i){lineStrings.push(this.parse.LineString.apply(this,[array[i]]));}
return this.geometryFactory.createMultiLineString(lineStrings);},'Polygon':function(array){var shellCoordinates=this.parse.coordinates.apply(this,[array[0]]);var shell=this.geometryFactory.createLinearRing(shellCoordinates);var holes=[];for(var i=1;i<array.length;++i){var hole=array[i];var coordinates=this.parse.coordinates.apply(this,[hole]);var linearRing=this.geometryFactory.createLinearRing(coordinates);holes.push(linearRing);}
return this.geometryFactory.createPolygon(shell,holes);},'MultiPolygon':function(array){var polygons=[];for(var i=0;i<array.length;++i){var polygon=array[i];polygons.push(this.parse.Polygon.apply(this,[polygon]));}
return this.geometryFactory.createMultiPolygon(polygons);},'GeometryCollection':function(array){var geometries=[];for(var i=0;i<array.length;++i){var geometry=array[i];geometries.push(this.read(geometry));}
return this.geometryFactory.createGeometryCollection(geometries);}};jsts.io.GeoJSONParser.prototype.write=function(geometry){var type=geometry.CLASS_NAME.slice(10);if(!this.extract[type]){throw new Error('Geometry is not supported');}
return this.extract[type].apply(this,[geometry]);};jsts.io.GeoJSONParser.prototype.extract={'coordinate':function(coordinate){return[coordinate.x,coordinate.y];},'Point':function(point){var array=this.extract.coordinate.apply(this,[point.coordinate]);return{type:'Point',coordinates:array};},'MultiPoint':function(multipoint){var array=[];for(var i=0;i<multipoint.geometries.length;++i){var point=multipoint.geometries[i];var geoJson=this.extract.Point.apply(this,[point]);array.push(geoJson.coordinates);}
return{type:'MultiPoint',coordinates:array};},'LineString':function(linestring){var array=[];for(var i=0;i<linestring.points.length;++i){var coordinate=linestring.points[i];array.push(this.extract.coordinate.apply(this,[coordinate]));}
return{type:'LineString',coordinates:array};},'MultiLineString':function(multilinestring){var array=[];for(var i=0;i<multilinestring.geometries.length;++i){var linestring=multilinestring.geometries[i];var geoJson=this.extract.LineString.apply(this,[linestring]);array.push(geoJson.coordinates);}
return{type:'MultiLineString',coordinates:array};},'Polygon':function(polygon){var array=[];var shellGeoJson=this.extract.LineString.apply(this,[polygon.shell]);array.push(shellGeoJson.coordinates);for(var i=0;i<polygon.holes.length;++i){var hole=polygon.holes[i];var holeGeoJson=this.extract.LineString.apply(this,[hole]);array.push(holeGeoJson.coordinates);}
return{type:'Polygon',coordinates:array};},'MultiPolygon':function(multipolygon){var array=[];for(var i=0;i<multipolygon.geometries.length;++i){var polygon=multipolygon.geometries[i];var geoJson=this.extract.Polygon.apply(this,[polygon]);array.push(geoJson.coordinates);}
return{type:'MultiPolygon',coordinates:array};},'GeometryCollection':function(collection){var array=[];for(var i=0;i<collection.geometries.length;++i){var geometry=collection.geometries[i];var type=geometry.CLASS_NAME.slice(10);array.push(this.extract[type].apply(this,[geometry]));}
return{type:'GeometryCollection',geometries:array};}};})();jsts.triangulate.quadedge.Vertex=function(){if(arguments.length===1){this.initFromCoordinate(arguments[0]);}else{this.initFromXY(arguments[0],arguments[1]);}};jsts.triangulate.quadedge.Vertex.LEFT=0;jsts.triangulate.quadedge.Vertex.RIGHT=1;jsts.triangulate.quadedge.Vertex.BEYOND=2;jsts.triangulate.quadedge.Vertex.BEHIND=3;jsts.triangulate.quadedge.Vertex.BETWEEN=4;jsts.triangulate.quadedge.Vertex.ORIGIN=5;jsts.triangulate.quadedge.Vertex.DESTINATION=6;jsts.triangulate.quadedge.Vertex.prototype.initFromXY=function(x,y){this.p=new jsts.geom.Coordinate(x,y);};jsts.triangulate.quadedge.Vertex.prototype.initFromCoordinate=function(_p){this.p=new jsts.geom.Coordinate(_p);};jsts.triangulate.quadedge.Vertex.prototype.getX=function(){return this.p.x;};jsts.triangulate.quadedge.Vertex.prototype.getY=function(){return this.p.y;};jsts.triangulate.quadedge.Vertex.prototype.getZ=function(){return this.p.z;};jsts.triangulate.quadedge.Vertex.prototype.setZ=function(z){this.p.z=z;};jsts.triangulate.quadedge.Vertex.prototype.getCoordinate=function(){return this.p;};jsts.triangulate.quadedge.Vertex.prototype.toString=function(){return'POINT ('+this.p.x+' '+this.p.y+')';};jsts.triangulate.quadedge.Vertex.prototype.equals=function(){if(arguments.length===1){return this.equalsExact(arguments[0]);}else{return this.equalsWithTolerance(arguments[0],arguments[1]);}};jsts.triangulate.quadedge.Vertex.prototype.equalsExact=function(other){return(this.p.x===other.getX()&&this.p.y===other.getY());};jsts.triangulate.quadedge.Vertex.prototype.equalsWithTolerance=function(other,tolerance){return(this.p.distance(other.getCoordinate())<tolerance);};jsts.triangulate.quadedge.Vertex.prototype.classify=function(p0,p1){var p2,a,b,sa;p2=this;a=p1.sub(p0);b=p2.sub(p0);sa=a.crossProduct(b);if(sa>0.0){return jsts.triangulate.quadedge.Vertex.LEFT;}
if(sa<0.0){return jsts.triangulate.quadedge.Vertex.RIGHT;}
if((a.getX()*b.getX()<0.0)||(a.getY()*b.getY()<0.0)){return jsts.triangulate.quadedge.Vertex.BEHIND;}
if(a.magn()<b.magn()){return jsts.triangulate.quadedge.Vertex.BEYOND;}
if(p0.equals(p2)){return jsts.triangulate.quadedge.Vertex.ORIGIN;}
if(p1.equals(p2)){return jsts.triangulate.quadedge.Vertex.DESTINATION;}
return jsts.triangulate.quadedge.Vertex.BETWEEN;};jsts.triangulate.quadedge.Vertex.prototype.crossProduct=function(v){return((this.p.x*v.getY())-(this.p.y*v.getX()));};jsts.triangulate.quadedge.Vertex.prototype.dot=function(v){return((this.p.x*v.getX())+(this.p.y*v.getY()));};jsts.triangulate.quadedge.Vertex.prototype.times=function(c){return new jsts.triangulate.quadedge.Vertex(c*this.p.x,c*this.p.y);};jsts.triangulate.quadedge.Vertex.prototype.sum=function(v){return new jsts.triangulate.quadedge.Vertex(this.p.x+v.getX(),this.p.y+
v.getY());};jsts.triangulate.quadedge.Vertex.prototype.sub=function(v){return new jsts.triangulate.quadedge.Vertex(this.p.x-v.getX(),this.p.y-
v.getY());};jsts.triangulate.quadedge.Vertex.prototype.magn=function(){return(Math.sqrt((this.p.x*this.p.x)+(this.p.y*this.p.y)));};jsts.triangulate.quadedge.Vertex.prototype.cross=function(){return new Vertex(this.p.y,-this.p.x);};jsts.triangulate.quadedge.Vertex.prototype.isInCircle=function(a,b,c){return jsts.triangulate.quadedge.TrianglePredicate.isInCircleRobust(a.p,b.p,c.p,this.p);};jsts.triangulate.quadedge.Vertex.prototype.isCCW=function(b,c){return((b.p.x-this.p.x)*(c.p.y-this.p.y)-(b.p.y-this.p.y)*(c.p.x-this.p.x)>0);};jsts.triangulate.quadedge.Vertex.prototype.rightOf=function(e){return this.isCCW(e.dest(),e.orig());};jsts.triangulate.quadedge.Vertex.prototype.leftOf=function(e){return this.isCCW(e.orig(),e.dest());};jsts.triangulate.quadedge.Vertex.prototype.bisector=function(a,b){var dx,dy,l1,l2;dx=b.getX()-a.getX();dy=b.getY()-a.getY();l1=new jsts.algorithm.HCoordinate(a.getX()+(dx/2.0),a.getY()+
(dy/2.0),1.0);l2=new jsts.algorithm.HCoordinate(a.getX()-dy+(dx/2.0),a.getY()+
dx+(dy/2.0),1.0);return new jsts.algorithm.HCoordinate(l1,l2);};jsts.triangulate.quadedge.Vertex.prototype.distance=function(v1,v2){return v1.p.distance(v2.p);};jsts.triangulate.quadedge.Vertex.prototype.circumRadiusRatio=function(b,c){var x,radius,edgeLength,el;x=this.circleCenter(b,c);radius=this.distance(x,b);edgeLength=this.distance(this,b);el=this.distance(b,c);if(el<edgeLength){edgeLength=el;}
el=this.distance(c,this);if(el<edgeLength){edgeLength=el;}
return radius/edgeLength;};jsts.triangulate.quadedge.Vertex.prototype.midPoint=function(a){var xm,ym;xm=(this.p.x+a.getX())/2.0;ym=(this.p.y+a.getY())/2.0;return new jsts.triangulate.quadedge.Vertex(xm,ym);};jsts.triangulate.quadedge.Vertex.prototype.circleCenter=function(b,c){var a,cab,cbc,hcc,cc;a=new jsts.triangulate.quadedge.Vertex(this.getX(),this.getY());cab=this.bisector(a,b);cbc=this.bisector(b,c);hcc=new jsts.algorithm.HCoordinate(cab,cbc);cc=null;try{cc=new jsts.triangulate.quadedge.Vertex(hcc.getX(),hcc.getY());}catch(err){}
return cc;};jsts.operation.valid.IsValidOp=function(parentGeometry){this.parentGeometry=parentGeometry;this.isSelfTouchingRingFormingHoleValid=false;this.validErr=null;};jsts.operation.valid.IsValidOp.isValid=function(arg){if(arguments[0]instanceof jsts.geom.Coordinate){if(isNaN(arg.x)){return false;}
if(!isFinite(arg.x)&&!isNaN(arg.x)){return false;}
if(isNaN(arg.y)){return false;}
if(!isFinite(arg.y)&&!isNaN(arg.y)){return false;}
return true;}else{var isValidOp=new jsts.operation.valid.IsValidOp(arg);return isValidOp.isValid();}};jsts.operation.valid.IsValidOp.findPtNotNode=function(testCoords,searchRing,graph){var searchEdge=graph.findEdge(searchRing);var eiList=searchEdge.getEdgeIntersectionList();for(var i=0;i<testCoords.length;i++){var pt=testCoords[i];if(!eiList.isIntersection(pt)){return pt;}}
return null;};jsts.operation.valid.IsValidOp.prototype.setSelfTouchingRingFormingHoleValid=function(isValid){this.isSelfTouchingRingFormingHoleValid=isValid;};jsts.operation.valid.IsValidOp.prototype.isValid=function(){this.checkValid(this.parentGeometry);return this.validErr==null;};jsts.operation.valid.IsValidOp.prototype.getValidationError=function(){this.checkValid(this.parentGeometry);return this.validErr;};jsts.operation.valid.IsValidOp.prototype.checkValid=function(g){this.validErr=null;if(g.isEmpty()){return;}
if(g instanceof jsts.geom.Point){this.checkValidPoint(g);}else if(g instanceof jsts.geom.MultiPoint){this.checkValidMultiPoint(g);}else if(g instanceof jsts.geom.LinearRing){this.checkValidLinearRing(g);}else if(g instanceof jsts.geom.LineString){this.checkValidLineString(g);}else if(g instanceof jsts.geom.Polygon){this.checkValidPolygon(g);}else if(g instanceof jsts.geom.MultiPolygon){this.checkValidMultiPolygon(g);}else if(g instanceof jsts.geom.GeometryCollection){this.checkValidGeometryCollection(g);}else{throw g.constructor;}};jsts.operation.valid.IsValidOp.prototype.checkValidPoint=function(g){this.checkInvalidCoordinates(g.getCoordinates());};jsts.operation.valid.IsValidOp.prototype.checkValidMultiPoint=function(g){this.checkInvalidCoordinates(g.getCoordinates());};jsts.operation.valid.IsValidOp.prototype.checkValidLineString=function(g){this.checkInvalidCoordinates(g.getCoordinates());if(this.validErr!=null){return;}
var graph=new jsts.geomgraph.GeometryGraph(0,g);this.checkTooFewPoints(graph);};jsts.operation.valid.IsValidOp.prototype.checkValidLinearRing=function(g){this.checkInvalidCoordinates(g.getCoordinates());if(this.validErr!=null){return;}
this.checkClosedRing(g);if(this.validErr!=null){return;}
var graph=new jsts.geomgraph.GeometryGraph(0,g);this.checkTooFewPoints(graph);if(this.validErr!=null){return;}
var li=new jsts.algorithm.RobustLineIntersector();graph.computeSelfNodes(li,true);this.checkNoSelfIntersectingRings(graph);};jsts.operation.valid.IsValidOp.prototype.checkValidPolygon=function(g){this.checkInvalidCoordinates(g);if(this.validErr!=null){return;}
this.checkClosedRings(g);if(this.validErr!=null){return;}
var graph=new jsts.geomgraph.GeometryGraph(0,g);this.checkTooFewPoints(graph);if(this.validErr!=null){return;}
this.checkConsistentArea(graph);if(this.validErr!=null){return;}
if(!this.isSelfTouchingRingFormingHoleValid){this.checkNoSelfIntersectingRings(graph);if(this.validErr!=null){return;}}
this.checkHolesInShell(g,graph);if(this.validErr!=null){return;}
this.checkHolesNotNested(g,graph);if(this.validErr!=null){return;}
this.checkConnectedInteriors(graph);};jsts.operation.valid.IsValidOp.prototype.checkValidMultiPolygon=function(g){var il=g.getNumGeometries();for(var i=0;i<il;i++){var p=g.getGeometryN(i);this.checkInvalidCoordinates(p);if(this.validErr!=null){return;}
this.checkClosedRings(p);if(this.validErr!=null){return;}}
var graph=new jsts.geomgraph.GeometryGraph(0,g);this.checkTooFewPoints(graph);if(this.validErr!=null){return;}
this.checkConsistentArea(graph);if(this.validErr!=null){return;}
if(!this.isSelfTouchingRingFormingHoleValid){this.checkNoSelfIntersectingRings(graph);if(this.validErr!=null){return;}}
for(var i=0;i<g.getNumGeometries();i++){var p=g.getGeometryN(i);this.checkHolesInShell(p,graph);if(this.validErr!=null){return;}}
for(var i=0;i<g.getNumGeometries();i++){var p=g.getGeometryN(i);this.checkHolesNotNested(p,graph);if(this.validErr!=null){return;}}
this.checkShellsNotNested(g,graph);if(this.validErr!=null){return;}
this.checkConnectedInteriors(graph);};jsts.operation.valid.IsValidOp.prototype.checkValidGeometryCollection=function(gc){for(var i=0;i<gc.getNumGeometries();i++){var g=gc.getGeometryN(i);this.checkValid(g);if(this.validErr!=null){return;}}};jsts.operation.valid.IsValidOp.prototype.checkInvalidCoordinates=function(arg){if(arg instanceof jsts.geom.Polygon){var poly=arg;this.checkInvalidCoordinates(poly.getExteriorRing().getCoordinates());if(this.validErr!=null){return;}
for(var i=0;i<poly.getNumInteriorRing();i++){this.checkInvalidCoordinates(poly.getInteriorRingN(i).getCoordinates());if(this.validErr!=null){return;}}}else{var coords=arg;for(var i=0;i<coords.length;i++){if(!jsts.operation.valid.IsValidOp.isValid(coords[i])){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.INVALID_COORDINATE,coords[i]);return;}}}};jsts.operation.valid.IsValidOp.prototype.checkClosedRings=function(poly){this.checkClosedRing(poly.getExteriorRing());if(this.validErr!=null){return;}
for(var i=0;i<poly.getNumInteriorRing();i++){this.checkClosedRing(poly.getInteriorRingN(i));if(this.validErr!=null){return;}}};jsts.operation.valid.IsValidOp.prototype.checkClosedRing=function(ring){if(!ring.isClosed()){var pt=null;if(ring.getNumPoints()>=1){pt=ring.getCoordinateN(0);}
this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.RING_NOT_CLOSED,pt);}};jsts.operation.valid.IsValidOp.prototype.checkTooFewPoints=function(graph){if(graph.hasTooFewPoints){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.TOO_FEW_POINTS,graph.getInvalidPoint());return;}};jsts.operation.valid.IsValidOp.prototype.checkConsistentArea=function(graph){var cat=new jsts.operation.valid.ConsistentAreaTester(graph);var isValidArea=cat.isNodeConsistentArea();if(!isValidArea){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.SELF_INTERSECTION,cat.getInvalidPoint());return;}
if(cat.hasDuplicateRings()){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.DUPLICATE_RINGS,cat.getInvalidPoint());}};jsts.operation.valid.IsValidOp.prototype.checkNoSelfIntersectingRings=function(graph){for(var i=graph.getEdgeIterator();i.hasNext();){var e=i.next();this.checkNoSelfIntersectingRing(e.getEdgeIntersectionList());if(this.validErr!=null){return;}}};jsts.operation.valid.IsValidOp.prototype.checkNoSelfIntersectingRing=function(eiList){var nodeSet=[];var isFirst=true;for(var i=eiList.iterator();i.hasNext();){var ei=i.next();if(isFirst){isFirst=false;continue;}
if(nodeSet.indexOf(ei.coord)>=0){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.RING_SELF_INTERSECTION,ei.coord);return;}else{nodeSet.push(ei.coord);}}};jsts.operation.valid.IsValidOp.prototype.checkHolesInShell=function(p,graph){var shell=p.getExteriorRing();var pir=new jsts.algorithm.MCPointInRing(shell);for(var i=0;i<p.getNumInteriorRing();i++){var hole=p.getInteriorRingN(i);var holePt=jsts.operation.valid.IsValidOp.findPtNotNode(hole.getCoordinates(),shell,graph);if(holePt==null){return;}
var outside=!pir.isInside(holePt);if(outside){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.HOLE_OUTSIDE_SHELL,holePt);return;}}};jsts.operation.valid.IsValidOp.prototype.checkHolesNotNested=function(p,graph){var nestedTester=new jsts.operation.valid.IndexedNestedRingTester(graph);for(var i=0;i<p.getNumInteriorRing();i++){var innerHole=p.getInteriorRingN(i);nestedTester.add(innerHole);}
var isNonNested=nestedTester.isNonNested();if(!isNonNested){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.NESTED_HOLES,nestedTester.getNestedPoint());}};jsts.operation.valid.IsValidOp.prototype.checkShellsNotNested=function(mp,graph){for(var i=0;i<mp.getNumGeometries();i++){var p=mp.getGeometryN(i);var shell=p.getExteriorRing();for(var j=0;j<mp.getNumGeometries();j++){if(i==j){continue;}
var p2=mp.getGeometryN(j);this.checkShellNotNested(shell,p2,graph);if(this.validErr!=null){return;}}}};jsts.operation.valid.IsValidOp.prototype.checkShellNotNested=function(shell,p,graph){var shellPts=shell.getCoordinates();var polyShell=p.getExteriorRing();var polyPts=polyShell.getCoordinates();var shellPt=jsts.operation.valid.IsValidOp.findPtNotNode(shellPts,polyShell,graph);if(shellPt==null){return;}
var insidePolyShell=jsts.algorithm.CGAlgorithms.isPointInRing(shellPt,polyPts);if(!insidePolyShell){return;}
if(p.getNumInteriorRing()<=0){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.NESTED_SHELLS,shellPt);return;}
var badNestedPt=null;for(var i=0;i<p.getNumInteriorRing();i++){var hole=p.getInteriorRingN(i);badNestedPt=this.checkShellInsideHole(shell,hole,graph);if(badNestedPt==null){return;}}
this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.NESTED_SHELLS,badNestedPt);};jsts.operation.valid.IsValidOp.prototype.checkShellInsideHole=function(shell,hole,graph){var shellPts=shell.getCoordinates();var holePts=hole.getCoordinates();var shellPt=jsts.operation.valid.IsValidOp.findPtNotNode(shellPts,hole,graph);if(shellPt!=null){var insideHole=jsts.algorithm.CGAlgorithms.isPointInRing(shellPt,holePts);if(!insideHole){return shellPt;}}
var holePt=jsts.operation.valid.IsValidOp.findPtNotNode(holePts,shell,graph);if(holePt!=null){var insideShell=jsts.algorithm.CGAlgorithms.isPointInRing(holePt,shellPts);if(insideShell){return holePt;}
return null;}
jsts.util.Assert.shouldNeverReachHere('points in shell and hole appear to be equal');return null;};jsts.operation.valid.IsValidOp.prototype.checkConnectedInteriors=function(graph){var cit=new jsts.operation.valid.ConnectedInteriorTester(graph);if(!cit.isInteriorsConnected()){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.DISCONNECTED_INTERIOR,cit.getCoordinate());}};jsts.algorithm.RobustDeterminant=function(){};jsts.algorithm.RobustDeterminant.signOfDet2x2=function(x1,y1,x2,y2){var sign,swap,k,count;count=0;sign=1;if((x1===0.0)||(y2===0.0)){if((y1===0.0)||(x2===0.0)){return 0;}
else if(y1>0){if(x2>0){return-sign;}
else{return sign;}}
else{if(x2>0){return sign;}
else{return-sign;}}}
if((y1===0.0)||(x2===0.0)){if(y2>0){if(x1>0){return sign;}
else{return-sign;}}
else{if(x1>0){return-sign;}
else{return sign;}}}
if(0.0<y1){if(0.0<y2){if(y1>y2){sign=-sign;swap=x1;x1=x2;x2=swap;swap=y1;y1=y2;y2=swap;}}
else{if(y1<=-y2){sign=-sign;x2=-x2;y2=-y2;}
else{swap=x1;x1=-x2;x2=swap;swap=y1;y1=-y2;y2=swap;}}}
else{if(0.0<y2){if(-y1<=y2){sign=-sign;x1=-x1;y1=-y1;}
else{swap=-x1;x1=x2;x2=swap;swap=-y1;y1=y2;y2=swap;}}
else{if(y1>=y2){x1=-x1;y1=-y1;x2=-x2;y2=-y2;}
else{sign=-sign;swap=-x1;x1=-x2;x2=swap;swap=-y1;y1=-y2;y2=swap;}}}
if(0.0<x1){if(0.0<x2){if(x1>x2){return sign;}}
else{return sign;}}
else{if(0.0<x2){return-sign;}
else{if(x1>=x2){sign=-sign;x1=-x1;x2=-x2;}
else{return-sign;}}}
while(true){count=count+1;k=Math.floor(x2/x1);x2=x2-k*x1;y2=y2-k*y1;if(y2<0.0){return-sign;}
if(y2>y1){return sign;}
if(x1>x2+x2){if(y1<y2+y2){return sign;}}
else{if(y1>y2+y2){return-sign;}
else{x2=x1-x2;y2=y1-y2;sign=-sign;}}
if(y2===0.0){if(x2===0.0){return 0;}
else{return-sign;}}
if(x2===0.0){return sign;}
k=Math.floor(x1/x2);x1=x1-k*x2;y1=y1-k*y2;if(y1<0.0){return sign;}
if(y1>y2){return-sign;}
if(x2>x1+x1){if(y2<y1+y1){return-sign;}}
else{if(y2>y1+y1){return sign;}
else{x1=x2-x1;y1=y2-y1;sign=-sign;}}
if(y1===0.0){if(x1===0.0){return 0;}
else{return sign;}}
if(x1===0.0){return-sign;}}};jsts.algorithm.RobustDeterminant.orientationIndex=function(p1,p2,q){var dx1=p2.x-p1.x;var dy1=p2.y-p1.y;var dx2=q.x-p2.x;var dy2=q.y-p2.y;return jsts.algorithm.RobustDeterminant.signOfDet2x2(dx1,dy1,dx2,dy2);};jsts.index.quadtree.NodeBase=function(){this.subnode=new Array(4);this.subnode[0]=null;this.subnode[1]=null;this.subnode[2]=null;this.subnode[3]=null;this.items=[];};jsts.index.quadtree.NodeBase.prototype.getSubnodeIndex=function(env,centre){var subnodeIndex=-1;if(env.getMinX()>=centre.x){if(env.getMinY()>=centre.y){subnodeIndex=3;}
if(env.getMaxY()<=centre.y){subnodeIndex=1;}}
if(env.getMaxX()<=centre.x){if(env.getMinY()>=centre.y){subnodeIndex=2;}
if(env.getMaxY()<=centre.y){subnodeIndex=0;}}
return subnodeIndex;};jsts.index.quadtree.NodeBase.prototype.getItems=function(){return this.items;};jsts.index.quadtree.NodeBase.prototype.hasItems=function(){return(this.items.length>0);};jsts.index.quadtree.NodeBase.prototype.add=function(item){this.items.push(item);};jsts.index.quadtree.NodeBase.prototype.remove=function(itemEnv,item){if(!this.isSearchMatch(itemEnv)){return false;}
var found=false,i=0;for(i;i<4;i++){if(this.subnode[i]!==null){found=this.subnode[i].remove(itemEnv,item);if(found){if(this.subnode[i].isPrunable()){this.subnode[i]=null;}
break;}}}
if(found){return found;}
if(this.items.indexOf(item)!==-1){for(var i=this.items.length-1;i>=0;i--){if(this.items[i]===item){this.items.splice(i,1);}}
found=true;}
return found;};jsts.index.quadtree.NodeBase.prototype.isPrunable=function(){return!(this.hasChildren()||this.hasItems());};jsts.index.quadtree.NodeBase.prototype.hasChildren=function(){var i=0;for(i;i<4;i++){if(this.subnode[i]!==null){return true;}}
return false;};jsts.index.quadtree.NodeBase.prototype.isEmpty=function(){var isEmpty=true;if(this.items.length>0){isEmpty=false;}
var i=0;for(i;i<4;i++){if(this.subnode[i]!==null){if(!this.subnode[i].isEmpty()){isEmpty=false;}}}
return isEmpty;};jsts.index.quadtree.NodeBase.prototype.addAllItems=function(resultItems){resultItems=resultItems.concat(this.items);var i=0;for(i;i<4;i++){if(this.subnode[i]!==null){resultItems=this.subnode[i].addAllItems(resultItems);}}
return resultItems;};jsts.index.quadtree.NodeBase.prototype.addAllItemsFromOverlapping=function(searchEnv,resultItems){if(!this.isSearchMatch(searchEnv)){return;}
resultItems=resultItems.concat(this.items);var i=0;for(i;i<4;i++){if(this.subnode[i]!==null){resultItems=this.subnode[i].addAllItemsFromOverlapping(searchEnv,resultItems);}}};jsts.index.quadtree.NodeBase.prototype.visit=function(searchEnv,visitor){if(!this.isSearchMatch(searchEnv)){return;}
this.visitItems(searchEnv,visitor);var i=0;for(i;i<4;i++){if(this.subnode[i]!==null){this.subnode[i].visit(searchEnv,visitor);}}};jsts.index.quadtree.NodeBase.prototype.visitItems=function(env,visitor){var i=0,il=this.items.length;for(i;i<il;i++){visitor.visitItem(this.items[i]);}};jsts.index.quadtree.NodeBase.prototype.depth=function(){var maxSubDepth=0,i=0,sqd;for(i;i<4;i++){if(this.subnode[i]!==null){sqd=this.subnode[i].depth();if(sqd>maxSubDepth){maxSubDepth=sqd;}}}
return maxSubDepth+1;};jsts.index.quadtree.NodeBase.prototype.size=function(){var subSize=0,i=0;for(i;i<4;i++){if(this.subnode[i]!==null){subSize+=this.subnode[i].size();}}
return subSize+this.items.length;};jsts.index.quadtree.NodeBase.prototype.getNodeCount=function(){var subSize=0,i=0;for(i;i<4;i++){if(this.subnode[i]!==null){subSize+=this.subnode[i].size();}}
return subSize+1;};jsts.index.quadtree.Node=function(env,level){jsts.index.quadtree.NodeBase.prototype.constructor.apply(this,arguments);this.env=env;this.level=level;this.centre=new jsts.geom.Coordinate();this.centre.x=(env.getMinX()+env.getMaxX())/2;this.centre.y=(env.getMinY()+env.getMaxY())/2;};jsts.index.quadtree.Node.prototype=new jsts.index.quadtree.NodeBase();jsts.index.quadtree.Node.createNode=function(env){var key,node;key=new jsts.index.quadtree.Key(env);node=new jsts.index.quadtree.Node(key.getEnvelope(),key.getLevel());return node;};jsts.index.quadtree.Node.createExpanded=function(node,addEnv){var expandEnv=new jsts.geom.Envelope(addEnv),largerNode;if(node!==null){expandEnv.expandToInclude(node.env);}
largerNode=jsts.index.quadtree.Node.createNode(expandEnv);if(node!==null){largerNode.insertNode(node);}
return largerNode;};jsts.index.quadtree.Node.prototype.getEnvelope=function(){return this.env;};jsts.index.quadtree.Node.prototype.isSearchMatch=function(searchEnv){return this.env.intersects(searchEnv);};jsts.index.quadtree.Node.prototype.getNode=function(searchEnv){var subnodeIndex=this.getSubnodeIndex(searchEnv,this.centre),node;if(subnodeIndex!==-1){node=this.getSubnode(subnodeIndex);return node.getNode(searchEnv);}else{return this;}};jsts.index.quadtree.Node.prototype.find=function(searchEnv){var subnodeIndex=this.getSubnodeIndex(searchEnv,this.centre),node;if(subnodeIndex===-1){return this;}
if(this.subnode[subnodeIndex]!==null){node=this.subnode[subnodeIndex];return node.find(searchEnv);}
return this;};jsts.index.quadtree.Node.prototype.insertNode=function(node){var index=this.getSubnodeIndex(node.env,this.centre),childNode;if(node.level===this.level-1){this.subnode[index]=node;}else{childNode=this.createSubnode(index);childNode.insertNode(node);this.subnode[index]=childNode;}};jsts.index.quadtree.Node.prototype.getSubnode=function(index){if(this.subnode[index]===null){this.subnode[index]=this.createSubnode(index);}
return this.subnode[index];};jsts.index.quadtree.Node.prototype.createSubnode=function(index){var minx=0.0,maxx=0.0,miny=0.0,maxy=0.0,sqEnv,node;switch(index){case 0:minx=this.env.getMinX();maxx=this.centre.x;miny=this.env.getMinY();maxy=this.centre.y;break;case 1:minx=this.centre.x;maxx=this.env.getMaxX();miny=this.env.getMinY();maxy=this.centre.y;break;case 2:minx=this.env.getMinX();maxx=this.centre.x;miny=this.centre.y;maxy=this.env.getMaxY();break;case 3:minx=this.centre.x;maxx=this.env.getMaxX();miny=this.centre.y;maxy=this.env.getMaxY();break;}
sqEnv=new jsts.geom.Envelope(minx,maxx,miny,maxy);node=new jsts.index.quadtree.Node(sqEnv,this.level-1);return node;};(function(){jsts.triangulate.quadedge.QuadEdge=function(){this.rot=null;this.vertex=null;this.next=null;this.data=null;};var QuadEdge=jsts.triangulate.quadedge.QuadEdge;jsts.triangulate.quadedge.QuadEdge.makeEdge=function(o,d){var q0,q1,q2,q3,base;q0=new QuadEdge();q1=new QuadEdge();q2=new QuadEdge();q3=new QuadEdge();q0.rot=q1;q1.rot=q2;q2.rot=q3;q3.rot=q0;q0.setNext(q0);q1.setNext(q3);q2.setNext(q2);q3.setNext(q1);base=q0;base.setOrig(o);base.setDest(d);return base;};jsts.triangulate.quadedge.QuadEdge.connect=function(a,b){var e=QuadEdge.makeEdge(a.dest(),b.orig());QuadEdge.splice(e,a.lNext());QuadEdge.splice(e.sym(),b);return e;};jsts.triangulate.quadedge.QuadEdge.splice=function(a,b){var alpha,beta,t1,t2,t3,t4;alpha=a.oNext().rot;beta=b.oNext().rot;t1=b.oNext();t2=a.oNext();t3=beta.oNext();t4=alpha.oNext();a.setNext(t1);b.setNext(t2);alpha.setNext(t3);beta.setNext(t4);};jsts.triangulate.quadedge.QuadEdge.swap=function(e){var a,b;a=e.oPrev();b=e.sym().oPrev();QuadEdge.splice(e,a);QuadEdge.splice(e.sym(),b);QuadEdge.splice(e,a.lNext());QuadEdge.splice(e.sym(),b.lNext());e.setOrig(a.dest());e.setDest(b.dest());};jsts.triangulate.quadedge.QuadEdge.prototype.getPrimary=function(){if(this.orig().getCoordinate().compareTo(this.dest().getCoordinate())<=0){return this;}
else{return this.sym();}};jsts.triangulate.quadedge.QuadEdge.prototype.setData=function(data){this.data=data;};jsts.triangulate.quadedge.QuadEdge.prototype.getData=function(){return this.data;};jsts.triangulate.quadedge.QuadEdge.prototype.delete_jsts=function(){this.rot=null;};jsts.triangulate.quadedge.QuadEdge.prototype.isLive=function(){return this.rot!==null;};jsts.triangulate.quadedge.QuadEdge.prototype.setNext=function(next){this.next=next;};jsts.triangulate.quadedge.QuadEdge.prototype.invRot=function(){return this.rot.sym();};jsts.triangulate.quadedge.QuadEdge.prototype.sym=function(){return this.rot.rot;};jsts.triangulate.quadedge.QuadEdge.prototype.oNext=function(){return this.next;};jsts.triangulate.quadedge.QuadEdge.prototype.oPrev=function(){return this.rot.next.rot;};jsts.triangulate.quadedge.QuadEdge.prototype.dNext=function(){return this.sym().oNext().sym();};jsts.triangulate.quadedge.QuadEdge.prototype.dPrev=function(){return this.invRot().oNext().invRot();};jsts.triangulate.quadedge.QuadEdge.prototype.lNext=function(){return this.invRot().oNext().rot;};jsts.triangulate.quadedge.QuadEdge.prototype.lPrev=function(){return this.next.sym();};jsts.triangulate.quadedge.QuadEdge.prototype.rNext=function(){return this.rot.next.invRot();};jsts.triangulate.quadedge.QuadEdge.prototype.rPrev=function(){return this.sym().oNext();};jsts.triangulate.quadedge.QuadEdge.prototype.setOrig=function(o){this.vertex=o;};jsts.triangulate.quadedge.QuadEdge.prototype.setDest=function(d){this.sym().setOrig(d);};jsts.triangulate.quadedge.QuadEdge.prototype.orig=function(){return this.vertex;};jsts.triangulate.quadedge.QuadEdge.prototype.dest=function(){return this.sym().orig();};jsts.triangulate.quadedge.QuadEdge.prototype.getLength=function(){return this.orig().getCoordinate().distance(dest().getCoordinate());};jsts.triangulate.quadedge.QuadEdge.prototype.equalsNonOriented=function(qe){if(this.equalsOriented(qe)){return true;}
if(this.equalsOriented(qe.sym())){return true;}
return false;};jsts.triangulate.quadedge.QuadEdge.prototype.equalsOriented=function(qe){if(this.orig().getCoordinate().equals2D(qe.orig().getCoordinate())&&this.dest().getCoordinate().equals2D(qe.dest().getCoordinate())){return true;}
return false;};jsts.triangulate.quadedge.QuadEdge.prototype.toLineSegment=function()
{return new jsts.geom.LineSegment(this.vertex.getCoordinate(),this.dest().getCoordinate());};jsts.triangulate.quadedge.QuadEdge.prototype.toString=function(){var p0,p1;p0=this.vertex.getCoordinate();p1=this.dest().getCoordinate();return jsts.io.WKTWriter.toLineString(p0,p1);};})();(function(){var Assert=jsts.util.Assert;jsts.geomgraph.EdgeEnd=function(edge,p0,p1,label){this.edge=edge;if(p0&&p1){this.init(p0,p1);}
if(label){this.label=label||null;}};jsts.geomgraph.EdgeEnd.prototype.edge=null;jsts.geomgraph.EdgeEnd.prototype.label=null;jsts.geomgraph.EdgeEnd.prototype.node=null;jsts.geomgraph.EdgeEnd.prototype.p0=null;jsts.geomgraph.EdgeEnd.prototype.p1=null;jsts.geomgraph.EdgeEnd.prototype.dx=null;jsts.geomgraph.EdgeEnd.prototype.dy=null;jsts.geomgraph.EdgeEnd.prototype.quadrant=null;jsts.geomgraph.EdgeEnd.prototype.init=function(p0,p1){this.p0=p0;this.p1=p1;this.dx=p1.x-p0.x;this.dy=p1.y-p0.y;this.quadrant=jsts.geomgraph.Quadrant.quadrant(this.dx,this.dy);Assert.isTrue(!(this.dx===0&&this.dy===0),'EdgeEnd with identical endpoints found');};jsts.geomgraph.EdgeEnd.prototype.getEdge=function(){return this.edge;};jsts.geomgraph.EdgeEnd.prototype.getLabel=function(){return this.label;};jsts.geomgraph.EdgeEnd.prototype.getCoordinate=function(){return this.p0;};jsts.geomgraph.EdgeEnd.prototype.getDirectedCoordinate=function(){return this.p1;};jsts.geomgraph.EdgeEnd.prototype.getQuadrant=function(){return this.quadrant;};jsts.geomgraph.EdgeEnd.prototype.getDx=function(){return this.dx;};jsts.geomgraph.EdgeEnd.prototype.getDy=function(){return this.dy;};jsts.geomgraph.EdgeEnd.prototype.setNode=function(node){this.node=node;};jsts.geomgraph.EdgeEnd.prototype.getNode=function(){return this.node;};jsts.geomgraph.EdgeEnd.prototype.compareTo=function(e){return this.compareDirection(e);};jsts.geomgraph.EdgeEnd.prototype.compareDirection=function(e){if(this.dx===e.dx&&this.dy===e.dy)
return 0;if(this.quadrant>e.quadrant)
return 1;if(this.quadrant<e.quadrant)
return-1;return jsts.algorithm.CGAlgorithms.computeOrientation(e.p0,e.p1,this.p1);};jsts.geomgraph.EdgeEnd.prototype.computeLabel=function(boundaryNodeRule){};})();jsts.operation.buffer.RightmostEdgeFinder=function(){};jsts.operation.buffer.RightmostEdgeFinder.prototype.minIndex=-1;jsts.operation.buffer.RightmostEdgeFinder.prototype.minCoord=null;jsts.operation.buffer.RightmostEdgeFinder.prototype.minDe=null;jsts.operation.buffer.RightmostEdgeFinder.prototype.orientedDe=null;jsts.operation.buffer.RightmostEdgeFinder.prototype.getEdge=function(){return this.orientedDe;};jsts.operation.buffer.RightmostEdgeFinder.prototype.getCoordinate=function(){return this.minCoord;};jsts.operation.buffer.RightmostEdgeFinder.prototype.findEdge=function(dirEdgeList){for(var i=dirEdgeList.iterator();i.hasNext();){var de=i.next();if(!de.isForward())
continue;this.checkForRightmostCoordinate(de);}
jsts.util.Assert.isTrue(this.minIndex!==0||this.minCoord.equals(this.minDe.getCoordinate()),'inconsistency in rightmost processing');if(this.minIndex===0){this.findRightmostEdgeAtNode();}else{this.findRightmostEdgeAtVertex();}
this.orientedDe=this.minDe;var rightmostSide=this.getRightmostSide(this.minDe,this.minIndex);if(rightmostSide==jsts.geomgraph.Position.LEFT){this.orientedDe=this.minDe.getSym();}};jsts.operation.buffer.RightmostEdgeFinder.prototype.findRightmostEdgeAtNode=function(){var node=this.minDe.getNode();var star=node.getEdges();this.minDe=star.getRightmostEdge();if(!this.minDe.isForward()){this.minDe=this.minDe.getSym();this.minIndex=this.minDe.getEdge().getCoordinates().length-1;}};jsts.operation.buffer.RightmostEdgeFinder.prototype.findRightmostEdgeAtVertex=function(){var pts=this.minDe.getEdge().getCoordinates();jsts.util.Assert.isTrue(this.minIndex>0&&this.minIndex<pts.length,'rightmost point expected to be interior vertex of edge');var pPrev=pts[this.minIndex-1];var pNext=pts[this.minIndex+1];var orientation=jsts.algorithm.CGAlgorithms.computeOrientation(this.minCoord,pNext,pPrev);var usePrev=false;if(pPrev.y<this.minCoord.y&&pNext.y<this.minCoord.y&&orientation===jsts.algorithm.CGAlgorithms.COUNTERCLOCKWISE){usePrev=true;}else if(pPrev.y>this.minCoord.y&&pNext.y>this.minCoord.y&&orientation===jsts.algorithm.CGAlgorithms.CLOCKWISE){usePrev=true;}
if(usePrev){this.minIndex=this.minIndex-1;}};jsts.operation.buffer.RightmostEdgeFinder.prototype.checkForRightmostCoordinate=function(de){var coord=de.getEdge().getCoordinates();for(var i=0;i<coord.length-1;i++){if(this.minCoord===null||coord[i].x>this.minCoord.x){this.minDe=de;this.minIndex=i;this.minCoord=coord[i];}}};jsts.operation.buffer.RightmostEdgeFinder.prototype.getRightmostSide=function(de,index){var side=this.getRightmostSideOfSegment(de,index);if(side<0)
side=this.getRightmostSideOfSegment(de,index-1);if(side<0){this.minCoord=null;this.checkForRightmostCoordinate(de);}
return side;};jsts.operation.buffer.RightmostEdgeFinder.prototype.getRightmostSideOfSegment=function(de,i){var e=de.getEdge();var coord=e.getCoordinates();if(i<0||i+1>=coord.length)
return-1;if(coord[i].y==coord[i+1].y)
return-1;var pos=jsts.geomgraph.Position.LEFT;if(coord[i].y<coord[i+1].y)
pos=jsts.geomgraph.Position.RIGHT;return pos;};(function(){jsts.triangulate.IncrementalDelaunayTriangulator=function(subdiv){this.subdiv=subdiv;this.isUsingTolerance=subdiv.getTolerance()>0.0;};jsts.triangulate.IncrementalDelaunayTriangulator.prototype.insertSites=function(vertices){var i=0,il=vertices.length,v;for(i;i<il;i++){v=vertices[i];this.insertSite(v);}};jsts.triangulate.IncrementalDelaunayTriangulator.prototype.insertSite=function(v){var e,base,startEdge,t;e=this.subdiv.locate(v);if(this.subdiv.isVertexOfEdge(e,v)){return e;}
else if(this.subdiv.isOnEdge(e,v.getCoordinate())){e=e.oPrev();this.subdiv.delete_jsts(e.oNext());}
base=this.subdiv.makeEdge(e.orig(),v);jsts.triangulate.quadedge.QuadEdge.splice(base,e);startEdge=base;do{base=this.subdiv.connect(e,base.sym());e=base.oPrev();}while(e.lNext()!=startEdge);do{t=e.oPrev();if(t.dest().rightOf(e)&&v.isInCircle(e.orig(),t.dest(),e.dest())){jsts.triangulate.quadedge.QuadEdge.swap(e);e=e.oPrev();}else if(e.oNext()==startEdge){return base;}else{e=e.oNext().lPrev();}}while(true);};}());jsts.algorithm.CentroidArea=function(){this.basePt=null;this.triangleCent3=new jsts.geom.Coordinate();this.centSum=new jsts.geom.Coordinate();this.cg3=new jsts.geom.Coordinate();};jsts.algorithm.CentroidArea.prototype.basePt=null;jsts.algorithm.CentroidArea.prototype.triangleCent3=null;jsts.algorithm.CentroidArea.prototype.areasum2=0;jsts.algorithm.CentroidArea.prototype.cg3=null;jsts.algorithm.CentroidArea.prototype.centSum=null;jsts.algorithm.CentroidArea.prototype.totalLength=0.0;jsts.algorithm.CentroidArea.prototype.add=function(geom){if(geom instanceof jsts.geom.Polygon){var poly=geom;this.setBasePoint(poly.getExteriorRing().getCoordinateN(0));this.add3(poly);}else if(geom instanceof jsts.geom.GeometryCollection||geom instanceof jsts.geom.MultiPolygon){var gc=geom;for(var i=0;i<gc.getNumGeometries();i++){this.add(gc.getGeometryN(i));}}else if(geom instanceof Array){this.add2(geom);}};jsts.algorithm.CentroidArea.prototype.add2=function(ring){this.setBasePoint(ring[0]);this.addShell(ring);};jsts.algorithm.CentroidArea.prototype.getCentroid=function(){var cent=new jsts.geom.Coordinate();if(Math.abs(this.areasum2)>0.0){cent.x=this.cg3.x/3/this.areasum2;cent.y=this.cg3.y/3/this.areasum2;}else{cent.x=this.centSum.x/this.totalLength;cent.y=this.centSum.y/this.totalLength;}
return cent;};jsts.algorithm.CentroidArea.prototype.setBasePoint=function(basePt){if(this.basePt==null)
this.basePt=basePt;};jsts.algorithm.CentroidArea.prototype.add3=function(poly){this.addShell(poly.getExteriorRing().getCoordinates());for(var i=0;i<poly.getNumInteriorRing();i++){this.addHole(poly.getInteriorRingN(i).getCoordinates());}};jsts.algorithm.CentroidArea.prototype.addShell=function(pts){var isPositiveArea=!jsts.algorithm.CGAlgorithms.isCCW(pts);for(var i=0;i<pts.length-1;i++){this.addTriangle(this.basePt,pts[i],pts[i+1],isPositiveArea);}
this.addLinearSegments(pts);};jsts.algorithm.CentroidArea.prototype.addHole=function(pts){var isPositiveArea=jsts.algorithm.CGAlgorithms.isCCW(pts);for(var i=0;i<pts.length-1;i++){this.addTriangle(this.basePt,pts[i],pts[i+1],isPositiveArea);}
this.addLinearSegments(pts);};jsts.algorithm.CentroidArea.prototype.addTriangle=function(p0,p1,p2,isPositiveArea){var sign=(isPositiveArea)?1.0:-1.0;jsts.algorithm.CentroidArea.centroid3(p0,p1,p2,this.triangleCent3);var area2=jsts.algorithm.CentroidArea.area2(p0,p1,p2);this.cg3.x+=sign*area2*this.triangleCent3.x;this.cg3.y+=sign*area2*this.triangleCent3.y;this.areasum2+=sign*area2;};jsts.algorithm.CentroidArea.centroid3=function(p1,p2,p3,c){c.x=p1.x+p2.x+p3.x;c.y=p1.y+p2.y+p3.y;return;};jsts.algorithm.CentroidArea.area2=function(p1,p2,p3){return(p2.x-p1.x)*(p3.y-p1.y)-(p3.x-p1.x)*(p2.y-p1.y);};jsts.algorithm.CentroidArea.prototype.addLinearSegments=function(pts){for(var i=0;i<pts.length-1;i++){var segmentLen=pts[i].distance(pts[i+1]);this.totalLength+=segmentLen;var midx=(pts[i].x+pts[i+1].x)/2;this.centSum.x+=segmentLen*midx;var midy=(pts[i].y+pts[i+1].y)/2;this.centSum.y+=segmentLen*midy;}};jsts.geomgraph.index.SweepLineSegment=function(edge,ptIndex){this.edge=edge;this.ptIndex=ptIndex;this.pts=edge.getCoordinates();};jsts.geomgraph.index.SweepLineSegment.prototype.edge=null;jsts.geomgraph.index.SweepLineSegment.prototype.pts=null;jsts.geomgraph.index.SweepLineSegment.prototype.ptIndex=null;jsts.geomgraph.index.SweepLineSegment.prototype.getMinX=function(){var x1=this.pts[this.ptIndex].x;var x2=this.pts[this.ptIndex+1].x;if(x1<x2){return x1;}
return x2;};jsts.geomgraph.index.SweepLineSegment.prototype.getMaxX=function(){var x1=this.pts[this.ptIndex].x;var x2=this.pts[this.ptIndex+1].x;if(x1>x2){return x1;}
return x2;};jsts.geomgraph.index.SweepLineSegment.prototype.computeIntersections=function(ss,si){si.addIntersections(this.edge,this.ptIndex,ss.edge,ss.ptIndex);};jsts.index.quadtree.Root=function(){jsts.index.quadtree.NodeBase.prototype.constructor.apply(this,arguments);this.origin=new jsts.geom.Coordinate(0.0,0.0);};jsts.index.quadtree.Root.prototype=new jsts.index.quadtree.NodeBase();jsts.index.quadtree.Root.prototype.insert=function(itemEnv,item){var index=this.getSubnodeIndex(itemEnv,this.origin);if(index===-1){this.add(item);return;}
var node=this.subnode[index];if(node===null||!node.getEnvelope().contains(itemEnv)){var largerNode=jsts.index.quadtree.Node.createExpanded(node,itemEnv);this.subnode[index]=largerNode;}
this.insertContained(this.subnode[index],itemEnv,item);};jsts.index.quadtree.Root.prototype.insertContained=function(tree,itemEnv,item){var isZeroX,isZeroY,node;isZeroX=jsts.index.IntervalSize.isZeroWidth(itemEnv.getMinX(),itemEnv.getMaxX());isZeroY=jsts.index.IntervalSize.isZeroWidth(itemEnv.getMinY(),itemEnv.getMaxY());if(isZeroX||isZeroY){node=tree.find(itemEnv);}else{node=tree.getNode(itemEnv);}
node.add(item);};jsts.index.quadtree.Root.prototype.isSearchMatch=function(searchEnv){return true;};jsts.geomgraph.index.MonotoneChainIndexer=function(){};jsts.geomgraph.index.MonotoneChainIndexer.toIntArray=function(list){var array=[];for(var i=list.iterator();i.hasNext();){var element=i.next();array.push(element);}
return array;};jsts.geomgraph.index.MonotoneChainIndexer.prototype.getChainStartIndices=function(pts){var start=0;var startIndexList=new javascript.util.ArrayList();startIndexList.add(start);do{var last=this.findChainEnd(pts,start);startIndexList.add(last);start=last;}while(start<pts.length-1);var startIndex=jsts.geomgraph.index.MonotoneChainIndexer.toIntArray(startIndexList);return startIndex;};jsts.geomgraph.index.MonotoneChainIndexer.prototype.findChainEnd=function(pts,start){var chainQuad=jsts.geomgraph.Quadrant.quadrant(pts[start],pts[start+1]);var last=start+1;while(last<pts.length){var quad=jsts.geomgraph.Quadrant.quadrant(pts[last-1],pts[last]);if(quad!=chainQuad){break;}
last++;}
return last-1;};jsts.noding.IntersectionAdder=function(li){this.li=li;};jsts.noding.IntersectionAdder.prototype=new jsts.noding.SegmentIntersector();jsts.noding.IntersectionAdder.constructor=jsts.noding.IntersectionAdder;jsts.noding.IntersectionAdder.isAdjacentSegments=function(i1,i2){return Math.abs(i1-i2)===1;};jsts.noding.IntersectionAdder.prototype._hasIntersection=false;jsts.noding.IntersectionAdder.prototype.hasProper=false;jsts.noding.IntersectionAdder.prototype.hasProperInterior=false;jsts.noding.IntersectionAdder.prototype.hasInterior=false;jsts.noding.IntersectionAdder.prototype.properIntersectionPoint=null;jsts.noding.IntersectionAdder.prototype.li=null;jsts.noding.IntersectionAdder.prototype.isSelfIntersection=null;jsts.noding.IntersectionAdder.prototype.numIntersections=0;jsts.noding.IntersectionAdder.prototype.numInteriorIntersections=0;jsts.noding.IntersectionAdder.prototype.numProperIntersections=0;jsts.noding.IntersectionAdder.prototype.numTests=0;jsts.noding.IntersectionAdder.prototype.getLineIntersector=function(){return this.li;};jsts.noding.IntersectionAdder.prototype.getProperIntersectionPoint=function(){return this.properIntersectionPoint;};jsts.noding.IntersectionAdder.prototype.hasIntersection=function(){return this._hasIntersection;};jsts.noding.IntersectionAdder.prototype.hasProperIntersection=function(){return this.hasProper;};jsts.noding.IntersectionAdder.prototype.hasProperInteriorIntersection=function(){return this.hasProperInterior;};jsts.noding.IntersectionAdder.prototype.hasInteriorIntersection=function(){return this.hasInterior;};jsts.noding.IntersectionAdder.prototype.isTrivialIntersection=function(e0,segIndex0,e1,segIndex1){if(e0==e1){if(this.li.getIntersectionNum()==1){if(jsts.noding.IntersectionAdder.isAdjacentSegments(segIndex0,segIndex1))
return true;if(e0.isClosed()){var maxSegIndex=e0.size()-1;if((segIndex0===0&&segIndex1===maxSegIndex)||(segIndex1===0&&segIndex0===maxSegIndex)){return true;}}}}
return false;};jsts.noding.IntersectionAdder.prototype.processIntersections=function(e0,segIndex0,e1,segIndex1){if(e0===e1&&segIndex0===segIndex1)
return;this.numTests++;var p00=e0.getCoordinates()[segIndex0];var p01=e0.getCoordinates()[segIndex0+1];var p10=e1.getCoordinates()[segIndex1];var p11=e1.getCoordinates()[segIndex1+1];this.li.computeIntersection(p00,p01,p10,p11);if(this.li.hasIntersection()){this.numIntersections++;if(this.li.isInteriorIntersection()){this.numInteriorIntersections++;this.hasInterior=true;}
if(!this.isTrivialIntersection(e0,segIndex0,e1,segIndex1)){this._hasIntersection=true;e0.addIntersections(this.li,segIndex0,0);e1.addIntersections(this.li,segIndex1,1);if(this.li.isProper()){this.numProperIntersections++;this.hasProper=true;this.hasProperInterior=true;}}}};jsts.noding.IntersectionAdder.prototype.isDone=function(){return false;};jsts.operation.union.CascadedPolygonUnion=function(polys){this.inputPolys=polys;};jsts.operation.union.CascadedPolygonUnion.union=function(polys){var op=new jsts.operation.union.CascadedPolygonUnion(polys);return op.union();};jsts.operation.union.CascadedPolygonUnion.prototype.inputPolys;jsts.operation.union.CascadedPolygonUnion.prototype.geomFactory=null;jsts.operation.union.CascadedPolygonUnion.prototype.STRTREE_NODE_CAPACITY=4;jsts.operation.union.CascadedPolygonUnion.prototype.union=function(){if(this.inputPolys.length===0){return null;}
this.geomFactory=this.inputPolys[0].getFactory();var index=new jsts.index.strtree.STRtree(this.STRTREE_NODE_CAPACITY);for(var i=0,l=this.inputPolys.length;i<l;i++){var item=this.inputPolys[i];index.insert(item.getEnvelopeInternal(),item);}
var itemTree=index.itemsTree();var unionAll=this.unionTree(itemTree);return unionAll;};jsts.operation.union.CascadedPolygonUnion.prototype.unionTree=function(geomTree){var geoms=this.reduceToGeometries(geomTree);var union=this.binaryUnion(geoms);return union;};jsts.operation.union.CascadedPolygonUnion.prototype.binaryUnion=function(geoms,start,end){start=start||0;end=end||geoms.length;if(end-start<=1){var g0=this.getGeometry(geoms,start);return this.unionSafe(g0,null);}
else if(end-start===2){return this.unionSafe(this.getGeometry(geoms,start),this.getGeometry(geoms,start+1));}
else{var mid=parseInt((end+start)/2);var g0=this.binaryUnion(geoms,start,mid);var g1=this.binaryUnion(geoms,mid,end);return this.unionSafe(g0,g1);}};jsts.operation.union.CascadedPolygonUnion.prototype.getGeometry=function(list,index){if(index>=list.length){return null;}
return list[index];};jsts.operation.union.CascadedPolygonUnion.prototype.reduceToGeometries=function(geomTree){var geoms=[];for(var i=0,l=geomTree.length;i<l;i++){var o=geomTree[i],geom=null;if(o instanceof Array){geom=this.unionTree(o);}
else if(o instanceof jsts.geom.Geometry){geom=o;}
geoms.push(geom);}
return geoms;};jsts.operation.union.CascadedPolygonUnion.prototype.unionSafe=function(g0,g1){if(g0===null&&g1===null){return null;}
if(g0===null){return g1.clone();}
if(g1===null){return g0.clone();}
return this.unionOptimized(g0,g1);};jsts.operation.union.CascadedPolygonUnion.prototype.unionOptimized=function(g0,g1){var g0Env=g0.getEnvelopeInternal(),g1Env=g1.getEnvelopeInternal();if(!g0Env.intersects(g1Env)){var combo=jsts.geom.util.GeometryCombiner.combine(g0,g1);return combo;}
if(g0.getNumGeometries<=1&&g1.getNumGeometries<=1){return this.unionActual(g0,g1);}
var commonEnv=g0Env.intersection(g1Env);return this.unionUsingEnvelopeIntersection(g0,g1,commonEnv);};jsts.operation.union.CascadedPolygonUnion.prototype.unionUsingEnvelopeIntersection=function(g0,g1,common){var disjointPolys=new javascript.util.ArrayList();var g0Int=this.extractByEnvelope(common,g0,disjointPolys);var g1Int=this.extractByEnvelope(common,g1,disjointPolys);var union=this.unionActual(g0Int,g1Int);disjointPolys.add(union);var overallUnion=jsts.geom.util.GeometryCombiner.combine(disjointPolys);return overallUnion;};jsts.operation.union.CascadedPolygonUnion.prototype.extractByEnvelope=function(env,geom,disjointGeoms){var intersectingGeoms=new javascript.util.ArrayList();for(var i=0;i<geom.getNumGeometries();i++){var elem=geom.getGeometryN(i);if(elem.getEnvelopeInternal().intersects(env)){intersectingGeoms.add(elem);}
else{disjointGeoms.add(elem);}}
return this.geomFactory.buildGeometry(intersectingGeoms);};jsts.operation.union.CascadedPolygonUnion.prototype.unionActual=function(g0,g1){return g0.union(g1);};(function(){jsts.geom.MultiPoint=function(points,factory){this.geometries=points||[];this.factory=factory;};jsts.geom.MultiPoint.prototype=new jsts.geom.GeometryCollection();jsts.geom.MultiPoint.constructor=jsts.geom.MultiPoint;jsts.geom.MultiPoint.prototype.getBoundary=function(){return this.getFactory().createGeometryCollection(null);};jsts.geom.MultiPoint.prototype.getGeometryN=function(n){return this.geometries[n];};jsts.geom.MultiPoint.prototype.equalsExact=function(other,tolerance){if(!this.isEquivalentClass(other)){return false;}
return jsts.geom.GeometryCollection.prototype.equalsExact.call(this,other,tolerance);};jsts.geom.MultiPoint.prototype.CLASS_NAME='jsts.geom.MultiPoint';})();jsts.operation.buffer.OffsetCurveBuilder=function(precisionModel,bufParams){this.precisionModel=precisionModel;this.bufParams=bufParams;};jsts.operation.buffer.OffsetCurveBuilder.prototype.distance=0.0;jsts.operation.buffer.OffsetCurveBuilder.prototype.precisionModel=null;jsts.operation.buffer.OffsetCurveBuilder.prototype.bufParams=null;jsts.operation.buffer.OffsetCurveBuilder.prototype.getBufferParameters=function(){return this.bufParams;};jsts.operation.buffer.OffsetCurveBuilder.prototype.getLineCurve=function(inputPts,distance){this.distance=distance;if(this.distance<0.0&&!this.bufParams.isSingleSided())
return null;if(this.distance==0.0)
return null;var posDistance=Math.abs(this.distance);var segGen=this.getSegGen(posDistance);if(inputPts.length<=1){this.computePointCurve(inputPts[0],segGen);}else{if(this.bufParams.isSingleSided()){var isRightSide=distance<0.0;this.computeSingleSidedBufferCurve(inputPts,isRightSide,segGen);}else
this.computeLineBufferCurve(inputPts,segGen);}
var lineCoord=segGen.getCoordinates();return lineCoord;};jsts.operation.buffer.OffsetCurveBuilder.prototype.getRingCurve=function(inputPts,side,distance){this.distance=distance;if(inputPts.length<=2)
return this.getLineCurve(inputPts,distance);if(this.distance==0.0){return jsts.operation.buffer.OffsetCurveBuilder.copyCoordinates(inputPts);}
var segGen=this.getSegGen(this.distance);this.computeRingBufferCurve(inputPts,side,segGen);return segGen.getCoordinates();};jsts.operation.buffer.OffsetCurveBuilder.prototype.getOffsetCurve=function(inputPts,distance){this.distance=distance;if(this.distance===0.0)
return null;var isRightSide=this.distance<0.0;var posDistance=Math.abs(this.distance);var segGen=this.getSegGen(posDistance);if(inputPts.length<=1){this.computePointCurve(inputPts[0],segGen);}else{this.computeOffsetCurve(inputPts,isRightSide,segGen);}
var curvePts=segGen.getCoordinates();if(isRightSide)
curvePts.reverse();return curvePts;};jsts.operation.buffer.OffsetCurveBuilder.copyCoordinates=function(pts){var copy=[];for(var i=0;i<pts.length;i++){copy.push(pts[i].clone());}
return copy;};jsts.operation.buffer.OffsetCurveBuilder.prototype.getSegGen=function(distance){return new jsts.operation.buffer.OffsetSegmentGenerator(this.precisionModel,this.bufParams,distance);};jsts.operation.buffer.OffsetCurveBuilder.SIMPLIFY_FACTOR=100.0;jsts.operation.buffer.OffsetCurveBuilder.simplifyTolerance=function(bufDistance){return bufDistance/jsts.operation.buffer.OffsetCurveBuilder.SIMPLIFY_FACTOR;};jsts.operation.buffer.OffsetCurveBuilder.prototype.computePointCurve=function(pt,segGen){switch(this.bufParams.getEndCapStyle()){case jsts.operation.buffer.BufferParameters.CAP_ROUND:segGen.createCircle(pt);break;case jsts.operation.buffer.BufferParameters.CAP_SQUARE:segGen.createSquare(pt);break;}};jsts.operation.buffer.OffsetCurveBuilder.prototype.computeLineBufferCurve=function(inputPts,segGen){var distTol=jsts.operation.buffer.OffsetCurveBuilder.simplifyTolerance(this.distance);var simp1=jsts.operation.buffer.BufferInputLineSimplifier.simplify(inputPts,distTol);var n1=simp1.length-1;segGen.initSideSegments(simp1[0],simp1[1],jsts.geomgraph.Position.LEFT);for(var i=2;i<=n1;i++){segGen.addNextSegment(simp1[i],true);}
segGen.addLastSegment();segGen.addLineEndCap(simp1[n1-1],simp1[n1]);var simp2=jsts.operation.buffer.BufferInputLineSimplifier.simplify(inputPts,-distTol);var n2=simp2.length-1;segGen.initSideSegments(simp2[n2],simp2[n2-1],jsts.geomgraph.Position.LEFT);for(var i=n2-2;i>=0;i--){segGen.addNextSegment(simp2[i],true);}
segGen.addLastSegment();segGen.addLineEndCap(simp2[1],simp2[0]);segGen.closeRing();};jsts.operation.buffer.OffsetCurveBuilder.prototype.computeSingleSidedBufferCurve=function(inputPts,isRightSide,segGen){var distTol=jsts.operation.buffer.OffsetCurveBuilder.simplifyTolerance(this.distance);if(isRightSide){segGen.addSegments(inputPts,true);var simp2=jsts.operation.buffer.BufferInputLineSimplifier.simplify(inputPts,-distTol);var n2=simp2.length-1;segGen.initSideSegments(simp2[n2],simp2[n2-1],jsts.geomgraph.Position.LEFT);segGen.addFirstSegment();for(var i=n2-2;i>=0;i--){segGen.addNextSegment(simp2[i],true);}}else{segGen.addSegments(inputPts,false);var simp1=jsts.operation.buffer.BufferInputLineSimplifier.simplify(inputPts,distTol);var n1=simp1.length-1;segGen.initSideSegments(simp1[0],simp1[1],jsts.geomgraph.Position.LEFT);segGen.addFirstSegment();for(var i=2;i<=n1;i++){segGen.addNextSegment(simp1[i],true);}}
segGen.addLastSegment();segGen.closeRing();};jsts.operation.buffer.OffsetCurveBuilder.prototype.computeOffsetCurve=function(inputPts,isRightSide,segGen){var distTol=jsts.operation.buffer.OffsetCurveBuilder.simplifyTolerance(this.distance);if(isRightSide){var simp2=jsts.operation.buffer.BufferInputLineSimplifier.simplify(inputPts,-distTol);var n2=simp2.length-1;segGen.initSideSegments(simp2[n2],simp2[n2-1],jsts.geomgraph.Position.LEFT);segGen.addFirstSegment();for(var i=n2-2;i>=0;i--){segGen.addNextSegment(simp2[i],true);}}else{var simp1=jsts.operation.buffer.BufferInputLineSimplifier.simplify(inputPts,distTol);var n1=simp1.length-1;segGen.initSideSegments(simp1[0],simp1[1],jsts.geomgraph.Position.LEFT);segGen.addFirstSegment();for(var i=2;i<=n1;i++){segGen.addNextSegment(simp1[i],true);}}
segGen.addLastSegment();};jsts.operation.buffer.OffsetCurveBuilder.prototype.computeRingBufferCurve=function(inputPts,side,segGen){var distTol=jsts.operation.buffer.OffsetCurveBuilder.simplifyTolerance(this.distance);if(side===jsts.geomgraph.Position.RIGHT)
distTol=-distTol;var simp=jsts.operation.buffer.BufferInputLineSimplifier.simplify(inputPts,distTol);var n=simp.length-1;segGen.initSideSegments(simp[n-1],simp[0],side);for(var i=1;i<=n;i++){var addStartPoint=i!==1;segGen.addNextSegment(simp[i],addStartPoint);}
segGen.closeRing();};(function(){var HotPixelSnapAction=function(hotPixel,parentEdge,vertexIndex){this.hotPixel=hotPixel;this.parentEdge=parentEdge;this.vertexIndex=vertexIndex;};HotPixelSnapAction.prototype=new jsts.index.chain.MonotoneChainSelectAction();HotPixelSnapAction.constructor=HotPixelSnapAction;HotPixelSnapAction.prototype.hotPixel=null;HotPixelSnapAction.prototype.parentEdge=null;HotPixelSnapAction.prototype.vertexIndex=null;HotPixelSnapAction.prototype._isNodeAdded=false;HotPixelSnapAction.prototype.isNodeAdded=function(){return this._isNodeAdded;};HotPixelSnapAction.prototype.select=function(mc,startIndex){var ss=mc.getContext();if(this.parentEdge!==null){if(ss===this.parentEdge&&startIndex===this.vertexIndex)
return;}
this._isNodeAdded=this.hotPixel.addSnappedNode(ss,startIndex);};jsts.noding.snapround.MCIndexPointSnapper=function(index){this.index=index;};jsts.noding.snapround.MCIndexPointSnapper.prototype.index=null;jsts.noding.snapround.MCIndexPointSnapper.prototype.snap=function(hotPixel,parentEdge,vertexIndex){if(arguments.length===1){this.snap2.apply(this,arguments);return;}
var pixelEnv=hotPixel.getSafeEnvelope();var hotPixelSnapAction=new HotPixelSnapAction(hotPixel,parentEdge,vertexIndex);this.index.query(pixelEnv,{visitItem:function(testChain){testChain.select(pixelEnv,hotPixelSnapAction);}});return hotPixelSnapAction.isNodeAdded();};jsts.noding.snapround.MCIndexPointSnapper.prototype.snap2=function(hotPixel){return this.snap(hotPixel,null,-1);};})();(function(){var NodeBase=function(){this.items=new javascript.util.ArrayList();this.subnode=[null,null];};NodeBase.getSubnodeIndex=function(interval,centre){var subnodeIndex=-1;if(interval.min>=centre){subnodeIndex=1;}
if(interval.max<=centre){subnodeIndex=0;}
return subnodeIndex;};NodeBase.prototype.getItems=function(){return this.items;};NodeBase.prototype.add=function(item){this.items.add(item);};NodeBase.prototype.addAllItems=function(items){items.addAll(this.items);var i=0,il=2;for(i;i<il;i++){if(this.subnode[i]!==null){this.subnode[i].addAllItems(items);}}
return items;};NodeBase.prototype.addAllItemsFromOverlapping=function(interval,resultItems){if(interval!==null&&!this.isSearchMatch(interval)){return;}
resultItems.addAll(this.items);if(this.subnode[0]!==null){this.subnode[0].addAllItemsFromOverlapping(interval,resultItems);}
if(this.subnode[1]!==null){this.subnode[1].addAllItemsFromOverlapping(interval,resultItems);}};NodeBase.prototype.remove=function(itemInterval,item){if(!this.isSearchMatch(itemInterval)){return false;}
var found=false,i=0,il=2;for(i;i<il;i++){if(this.subnode[i]!==null){found=this.subnode[i].remove(itemInterval,item);if(found){if(this.subnode[i].isPrunable()){this.subnode[i]=null;}
break;}}}
if(found){return found;}
found=this.items.remove(item);return found;};NodeBase.prototype.isPrunable=function(){return!(this.hasChildren()||this.hasItems());};NodeBase.prototype.hasChildren=function(){var i=0,il=2;for(i;i<il;i++){if(this.subnode[i]!==null){return true;}}
return false;};NodeBase.prototype.hasItems=function(){return!this.items.isEmpty();};NodeBase.prototype.depth=function(){var maxSubDepth=0,i=0,il=2,sqd;for(i;i<il;i++){if(this.subnode[i]!==null){sqd=this.subnode[i].depth();if(sqd>maxSubDepth){maxSubDepth=sqd;}}}
return maxSubDepth+1;};NodeBase.prototype.size=function(){var subSize=0,i=0,il=2;for(i;i<il;i++){if(this.subnode[i]!==null){subSize+=this.subnode[i].size();}}
return subSize+this.items.size();};NodeBase.prototype.nodeSize=function(){var subSize=0,i=0,il=2;for(i;i<il;i++){if(this.subnode[i]!==null){subSize+=this.subnode[i].nodeSize();}}
return subSize+1;};jsts.index.bintree.NodeBase=NodeBase;})();(function(){var NodeBase=jsts.index.bintree.NodeBase;var Key=jsts.index.bintree.Key;var Interval=jsts.index.bintree.Interval;var Node=function(interval,level){this.items=new javascript.util.ArrayList();this.subnode=[null,null];this.interval=interval;this.level=level;this.centre=(interval.getMin()+interval.getMax())/2;};Node.prototype=new NodeBase();Node.constructor=Node;Node.createNode=function(itemInterval){var key,node;key=new Key(itemInterval);node=new Node(key.getInterval(),key.getLevel());return node;};Node.createExpanded=function(node,addInterval){var expandInt,largerNode;expandInt=new Interval(addInterval);if(node!==null){expandInt.expandToInclude(node.interval);}
largerNode=Node.createNode(expandInt);if(node!==null){largerNode.insert(node);}
return largerNode;};Node.prototype.getInterval=function(){return this.interval;};Node.prototype.isSearchMatch=function(itemInterval){return itemInterval.overlaps(this.interval);};Node.prototype.getNode=function(searchInterval){var subnodeIndex=NodeBase.getSubnodeIndex(searchInterval,this.centre),node;if(subnodeIndex!=-1){node=this.getSubnode(subnodeIndex);return node.getNode(searchInterval);}else{return this;}};Node.prototype.find=function(searchInterval){var subnodeIndex=NodeBase.getSubnodeIndex(searchInterval,this.centre),node;if(subnodeIndex===-1){return this;}
if(this.subnode[subnodeIndex]!==null){node=this.subnode[subnodeIndex];return node.find(searchInterval);}
return this;};Node.prototype.insert=function(node){var index=NodeBase.getSubnodeIndex(node.interval,this.centre),childNode;if(node.level===this.level-1){this.subnode[index]=node;}else{childNode=this.createSubnode(index);childNode.insert(node);this.subnode[index]=childNode;}};Node.prototype.getSubnode=function(index){if(this.subnode[index]===null){this.subnode[index]=this.createSubnode(index);}
return this.subnode[index];};Node.prototype.createSubnode=function(index){var min,max,subInt,node;min=0.0;max=0.0;switch(index){case 0:min=this.interval.getMin();max=this.centre;break;case 1:min=this.centre;max=this.interval.getMax();break;}
subInt=new Interval(min,max);node=new Node(subInt,this.level-1);return node;};jsts.index.bintree.Node=Node;})();(function(){var Node=jsts.index.bintree.Node;var NodeBase=jsts.index.bintree.NodeBase;var Root=function(){this.subnode=[null,null];this.items=new javascript.util.ArrayList();};Root.prototype=new jsts.index.bintree.NodeBase();Root.constructor=Root;Root.origin=0.0;Root.prototype.insert=function(itemInterval,item){var index=NodeBase.getSubnodeIndex(itemInterval,Root.origin),node,largerNode;if(index===-1){this.add(item);return;}
node=this.subnode[index];if(node===null||!node.getInterval().contains(itemInterval)){largerNode=Node.createExpanded(node,itemInterval);this.subnode[index]=largerNode;}
this.insertContained(this.subnode[index],itemInterval,item);};Root.prototype.insertContained=function(tree,itemInterval,item){var isZeroArea,node;isZeroArea=jsts.index.IntervalSize.isZeroWidth(itemInterval.getMin(),itemInterval.getMax());node=isZeroArea?tree.find(itemInterval):tree.getNode(itemInterval);node.add(item);};Root.prototype.isSearchMatch=function(interval){return true;};jsts.index.bintree.Root=Root;})();jsts.geomgraph.Quadrant=function(){};jsts.geomgraph.Quadrant.NE=0;jsts.geomgraph.Quadrant.NW=1;jsts.geomgraph.Quadrant.SW=2;jsts.geomgraph.Quadrant.SE=3;jsts.geomgraph.Quadrant.quadrant=function(dx,dy){if(dx instanceof jsts.geom.Coordinate){return jsts.geomgraph.Quadrant.quadrant2.apply(this,arguments);}
if(dx===0.0&&dy===0.0)
throw new jsts.error.IllegalArgumentError('Cannot compute the quadrant for point ( '+dx+', '+dy+' )');if(dx>=0.0){if(dy>=0.0)
return jsts.geomgraph.Quadrant.NE;else
return jsts.geomgraph.Quadrant.SE;}else{if(dy>=0.0)
return jsts.geomgraph.Quadrant.NW;else
return jsts.geomgraph.Quadrant.SW;}};jsts.geomgraph.Quadrant.quadrant2=function(p0,p1){if(p1.x===p0.x&&p1.y===p0.y)
throw new jsts.error.IllegalArgumentError('Cannot compute the quadrant for two identical points '+p0);if(p1.x>=p0.x){if(p1.y>=p0.y)
return jsts.geomgraph.Quadrant.NE;else
return jsts.geomgraph.Quadrant.SE;}else{if(p1.y>=p0.y)
return jsts.geomgraph.Quadrant.NW;else
return jsts.geomgraph.Quadrant.SW;}};jsts.geomgraph.Quadrant.isOpposite=function(quad1,quad2){if(quad1===quad2)
return false;var diff=(quad1-quad2+4)%4;if(diff===2)
return true;return false;};jsts.geomgraph.Quadrant.commonHalfPlane=function(quad1,quad2){if(quad1===quad2)
return quad1;var diff=(quad1-quad2+4)%4;if(diff===2)
return-1;var min=(quad1<quad2)?quad1:quad2;var max=(quad1>quad2)?quad1:quad2;if(min===0&&max===3)
return 3;return min;};jsts.geomgraph.Quadrant.isInHalfPlane=function(quad,halfPlane){if(halfPlane===jsts.geomgraph.Quadrant.SE){return quad===jsts.geomgraph.Quadrant.SE||quad===jsts.geomgraph.Quadrant.SW;}
return quad===halfPlane||quad===halfPlane+1;};jsts.geomgraph.Quadrant.isNorthern=function(quad){return quad===jsts.geomgraph.Quadrant.NE||quad===jsts.geomgraph.Quadrant.NW;};jsts.operation.valid.ConsistentAreaTester=function(geomGraph){this.geomGraph=geomGraph;this.li=new jsts.algorithm.RobustLineIntersector();this.nodeGraph=new jsts.operation.relate.RelateNodeGraph();this.invalidPoint=null;};jsts.operation.valid.ConsistentAreaTester.prototype.getInvalidPoint=function(){return this.invalidPoint;};jsts.operation.valid.ConsistentAreaTester.prototype.isNodeConsistentArea=function(){var intersector=this.geomGraph.computeSelfNodes(this.li,true);if(intersector.hasProperIntersection()){this.invalidPoint=intersector.getProperIntersectionPoint();return false;}
this.nodeGraph.build(this.geomGraph);return this.isNodeEdgeAreaLabelsConsistent();};jsts.operation.valid.ConsistentAreaTester.prototype.isNodeEdgeAreaLabelsConsistent=function(){for(var nodeIt=this.nodeGraph.getNodeIterator();nodeIt.hasNext();){var node=nodeIt.next();if(!node.getEdges().isAreaLabelsConsistent(this.geomGraph)){this.invalidPoint=node.getCoordinate().clone();return false;}}
return true;};jsts.operation.valid.ConsistentAreaTester.prototype.hasDuplicateRings=function(){for(var nodeIt=this.nodeGraph.getNodeIterator();nodeIt.hasNext();){var node=nodeIt.next();for(var i=node.getEdges().iterator();i.hasNext();){var eeb=i.next();if(eeb.getEdgeEnds().length>1){invalidPoint=eeb.getEdge().getCoordinate(0);return true;}}}
return false;};jsts.operation.relate.RelateNode=function(coord,edges){jsts.geomgraph.Node.apply(this,arguments);};jsts.operation.relate.RelateNode.prototype=new jsts.geomgraph.Node();jsts.operation.relate.RelateNode.prototype.computeIM=function(im){im.setAtLeastIfValid(this.label.getLocation(0),this.label.getLocation(1),0);};jsts.operation.relate.RelateNode.prototype.updateIMFromEdges=function(im){this.edges.updateIM(im);};(function(){var Location=jsts.geom.Location;var Position=jsts.geomgraph.Position;var EdgeEnd=jsts.geomgraph.EdgeEnd;jsts.geomgraph.DirectedEdge=function(edge,isForward){EdgeEnd.call(this,edge);this.depth=[0,-999,-999];this._isForward=isForward;if(isForward){this.init(edge.getCoordinate(0),edge.getCoordinate(1));}else{var n=edge.getNumPoints()-1;this.init(edge.getCoordinate(n),edge.getCoordinate(n-1));}
this.computeDirectedLabel();};jsts.geomgraph.DirectedEdge.prototype=new EdgeEnd();jsts.geomgraph.DirectedEdge.constructor=jsts.geomgraph.DirectedEdge;jsts.geomgraph.DirectedEdge.depthFactor=function(currLocation,nextLocation){if(currLocation===Location.EXTERIOR&&nextLocation===Location.INTERIOR)
return 1;else if(currLocation===Location.INTERIOR&&nextLocation===Location.EXTERIOR)
return-1;return 0;};jsts.geomgraph.DirectedEdge.prototype._isForward=null;jsts.geomgraph.DirectedEdge.prototype._isInResult=false;jsts.geomgraph.DirectedEdge.prototype._isVisited=false;jsts.geomgraph.DirectedEdge.prototype.sym=null;jsts.geomgraph.DirectedEdge.prototype.next=null;jsts.geomgraph.DirectedEdge.prototype.nextMin=null;jsts.geomgraph.DirectedEdge.prototype.edgeRing=null;jsts.geomgraph.DirectedEdge.prototype.minEdgeRing=null;jsts.geomgraph.DirectedEdge.prototype.depth=null;jsts.geomgraph.DirectedEdge.prototype.getEdge=function(){return this.edge;};jsts.geomgraph.DirectedEdge.prototype.setInResult=function(isInResult){this._isInResult=isInResult;};jsts.geomgraph.DirectedEdge.prototype.isInResult=function(){return this._isInResult;};jsts.geomgraph.DirectedEdge.prototype.isVisited=function(){return this._isVisited;};jsts.geomgraph.DirectedEdge.prototype.setVisited=function(isVisited){this._isVisited=isVisited;};jsts.geomgraph.DirectedEdge.prototype.setEdgeRing=function(edgeRing){this.edgeRing=edgeRing;};jsts.geomgraph.DirectedEdge.prototype.getEdgeRing=function(){return this.edgeRing;};jsts.geomgraph.DirectedEdge.prototype.setMinEdgeRing=function(minEdgeRing){this.minEdgeRing=minEdgeRing;};jsts.geomgraph.DirectedEdge.prototype.getMinEdgeRing=function(){return this.minEdgeRing;};jsts.geomgraph.DirectedEdge.prototype.getDepth=function(position){return this.depth[position];};jsts.geomgraph.DirectedEdge.prototype.setDepth=function(position,depthVal){if(this.depth[position]!==-999){if(this.depth[position]!==depthVal)
throw new jsts.error.TopologyError('assigned depths do not match',this.getCoordinate());}
this.depth[position]=depthVal;};jsts.geomgraph.DirectedEdge.prototype.getDepthDelta=function(){var depthDelta=this.edge.getDepthDelta();if(!this._isForward)
depthDelta=-depthDelta;return depthDelta;};jsts.geomgraph.DirectedEdge.prototype.setVisitedEdge=function(isVisited){this.setVisited(isVisited);this.sym.setVisited(isVisited);};jsts.geomgraph.DirectedEdge.prototype.getSym=function(){return this.sym;};jsts.geomgraph.DirectedEdge.prototype.isForward=function(){return this._isForward;};jsts.geomgraph.DirectedEdge.prototype.setSym=function(de){this.sym=de;};jsts.geomgraph.DirectedEdge.prototype.getNext=function(){return this.next;};jsts.geomgraph.DirectedEdge.prototype.setNext=function(next){this.next=next;};jsts.geomgraph.DirectedEdge.prototype.getNextMin=function(){return this.nextMin;};jsts.geomgraph.DirectedEdge.prototype.setNextMin=function(nextMin){this.nextMin=nextMin;};jsts.geomgraph.DirectedEdge.prototype.isLineEdge=function(){var isLine=this.label.isLine(0)||this.label.isLine(1);var isExteriorIfArea0=!this.label.isArea(0)||this.label.allPositionsEqual(0,Location.EXTERIOR);var isExteriorIfArea1=!this.label.isArea(1)||this.label.allPositionsEqual(1,Location.EXTERIOR);return isLine&&isExteriorIfArea0&&isExteriorIfArea1;};jsts.geomgraph.DirectedEdge.prototype.isInteriorAreaEdge=function(){var isInteriorAreaEdge=true;for(var i=0;i<2;i++){if(!(this.label.isArea(i)&&this.label.getLocation(i,Position.LEFT)===Location.INTERIOR&&this.label.getLocation(i,Position.RIGHT)===Location.INTERIOR)){isInteriorAreaEdge=false;}}
return isInteriorAreaEdge;};jsts.geomgraph.DirectedEdge.prototype.computeDirectedLabel=function(){this.label=new jsts.geomgraph.Label(this.edge.getLabel());if(!this._isForward)
this.label.flip();};jsts.geomgraph.DirectedEdge.prototype.setEdgeDepths=function(position,depth){var depthDelta=this.getEdge().getDepthDelta();if(!this._isForward)
depthDelta=-depthDelta;var directionFactor=1;if(position===Position.LEFT)
directionFactor=-1;var oppositePos=Position.opposite(position);var delta=depthDelta*directionFactor;var oppositeDepth=depth+delta;this.setDepth(position,depth);this.setDepth(oppositePos,oppositeDepth);};})();jsts.operation.distance.DistanceOp=function(g0,g1,terminateDistance){this.ptLocator=new jsts.algorithm.PointLocator();this.geom=[];this.geom[0]=g0;this.geom[1]=g1;this.terminateDistance=terminateDistance;};jsts.operation.distance.DistanceOp.prototype.geom=null;jsts.operation.distance.DistanceOp.prototype.terminateDistance=0.0;jsts.operation.distance.DistanceOp.prototype.ptLocator=null;jsts.operation.distance.DistanceOp.prototype.minDistanceLocation=null;jsts.operation.distance.DistanceOp.prototype.minDistance=Number.MAX_VALUE;jsts.operation.distance.DistanceOp.distance=function(g0,g1){var distOp=new jsts.operation.distance.DistanceOp(g0,g1,0.0);return distOp.distance();};jsts.operation.distance.DistanceOp.isWithinDistance=function(g0,g1,distance){var distOp=new jsts.operation.distance.DistanceOp(g0,g1,distance);return distOp.distance()<=distance;};jsts.operation.distance.DistanceOp.nearestPoints=function(g0,g1){var distOp=new jsts.operation.distance.DistanceOp(g0,g1,0.0);return distOp.nearestPoints();};jsts.operation.distance.DistanceOp.prototype.distance=function(){if(this.geom[0]===null||this.geom[1]===null)
throw new jsts.error.IllegalArgumentError('null geometries are not supported');if(this.geom[0].isEmpty()||this.geom[1].isEmpty())
return 0.0;this.computeMinDistance();return this.minDistance;};jsts.operation.distance.DistanceOp.prototype.nearestPoints=function(){this.computeMinDistance();var nearestPts=[this.minDistanceLocation[0].getCoordinate(),this.minDistanceLocation[1].getCoordinate()];return nearestPts;};jsts.operation.distance.DistanceOp.prototype.nearestLocations=function(){this.computeMinDistance();return this.minDistanceLocation;};jsts.operation.distance.DistanceOp.prototype.updateMinDistance=function(locGeom,flip){if(locGeom[0]===null)
return;if(flip){this.minDistanceLocation[0]=locGeom[1];this.minDistanceLocation[1]=locGeom[0];}else{this.minDistanceLocation[0]=locGeom[0];this.minDistanceLocation[1]=locGeom[1];}};jsts.operation.distance.DistanceOp.prototype.computeMinDistance=function(){if(arguments.length>0){this.computeMinDistance2.apply(this,arguments);return;}
if(this.minDistanceLocation!==null)
return;this.minDistanceLocation=[];this.computeContainmentDistance();if(this.minDistance<=this.terminateDistance)
return;this.computeFacetDistance();};jsts.operation.distance.DistanceOp.prototype.computeContainmentDistance=function(){if(arguments.length===2){this.computeContainmentDistance2.apply(this,arguments);return;}else if(arguments.length===3&&(!arguments[0]instanceof jsts.operation.distance.GeometryLocation)){this.computeContainmentDistance3.apply(this,arguments);return;}else if(arguments.length===3){this.computeContainmentDistance4.apply(this,arguments);return;}
var locPtPoly=[];this.computeContainmentDistance2(0,locPtPoly);if(this.minDistance<=this.terminateDistance)
return;this.computeContainmentDistance2(1,locPtPoly);};jsts.operation.distance.DistanceOp.prototype.computeContainmentDistance2=function(polyGeomIndex,locPtPoly){var locationsIndex=1-polyGeomIndex;var polys=jsts.geom.util.PolygonExtracter.getPolygons(this.geom[polyGeomIndex]);if(polys.length>0){var insideLocs=jsts.operation.distance.ConnectedElementLocationFilter.getLocations(this.geom[locationsIndex]);this.computeContainmentDistance3(insideLocs,polys,locPtPoly);if(this.minDistance<=this.terminateDistance){this.minDistanceLocation[locationsIndex]=locPtPoly[0];this.minDistanceLocation[polyGeomIndex]=locPtPoly[1];return;}}};jsts.operation.distance.DistanceOp.prototype.computeContainmentDistance3=function(locs,polys,locPtPoly){for(var i=0;i<locs.length;i++){var loc=locs[i];for(var j=0;j<polys.length;j++){this.computeContainmentDistance4(loc,polys[j],locPtPoly);if(this.minDistance<=this.terminateDistance)
return;}}};jsts.operation.distance.DistanceOp.prototype.computeContainmentDistance4=function(ptLoc,poly,locPtPoly){var pt=ptLoc.getCoordinate();if(jsts.geom.Location.EXTERIOR!==this.ptLocator.locate(pt,poly)){this.minDistance=0.0;locPtPoly[0]=ptLoc;locPtPoly[1]=new jsts.operation.distance.GeometryLocation(poly,pt);return;}};jsts.operation.distance.DistanceOp.prototype.computeFacetDistance=function(){var locGeom=[];var lines0=jsts.geom.util.LinearComponentExtracter.getLines(this.geom[0]);var lines1=jsts.geom.util.LinearComponentExtracter.getLines(this.geom[1]);var pts0=jsts.geom.util.PointExtracter.getPoints(this.geom[0]);var pts1=jsts.geom.util.PointExtracter.getPoints(this.geom[1]);this.computeMinDistanceLines(lines0,lines1,locGeom);this.updateMinDistance(locGeom,false);if(this.minDistance<=this.terminateDistance)
return;locGeom[0]=null;locGeom[1]=null;this.computeMinDistanceLinesPoints(lines0,pts1,locGeom);this.updateMinDistance(locGeom,false);if(this.minDistance<=this.terminateDistance)
return;locGeom[0]=null;locGeom[1]=null;this.computeMinDistanceLinesPoints(lines1,pts0,locGeom);this.updateMinDistance(locGeom,true);if(this.minDistance<=this.terminateDistance)
return;locGeom[0]=null;locGeom[1]=null;this.computeMinDistancePoints(pts0,pts1,locGeom);this.updateMinDistance(locGeom,false);};jsts.operation.distance.DistanceOp.prototype.computeMinDistanceLines=function(lines0,lines1,locGeom){for(var i=0;i<lines0.length;i++){var line0=lines0[i];for(var j=0;j<lines1.length;j++){var line1=lines1[j];this.computeMinDistance(line0,line1,locGeom);if(this.minDistance<=this.terminateDistance)
return;}}};jsts.operation.distance.DistanceOp.prototype.computeMinDistancePoints=function(points0,points1,locGeom){for(var i=0;i<points0.length;i++){var pt0=points0[i];for(var j=0;j<points1.length;j++){var pt1=points1[j];var dist=pt0.getCoordinate().distance(pt1.getCoordinate());if(dist<this.minDistance){this.minDistance=dist;locGeom[0]=new jsts.operation.distance.GeometryLocation(pt0,0,pt0.getCoordinate());locGeom[1]=new jsts.operation.distance.GeometryLocation(pt1,0,pt1.getCoordinate());}
if(this.minDistance<=this.terminateDistance)
return;}}};jsts.operation.distance.DistanceOp.prototype.computeMinDistanceLinesPoints=function(lines,points,locGeom){for(var i=0;i<lines.length;i++){var line=lines[i];for(var j=0;j<points.length;j++){var pt=points[j];this.computeMinDistance(line,pt,locGeom);if(this.minDistance<=this.terminateDistance)
return;}}};jsts.operation.distance.DistanceOp.prototype.computeMinDistance2=function(line0,line1,locGeom){if(line1 instanceof jsts.geom.Point){this.computeMinDistance3(line0,line1,locGeom);return;}
if(line0.getEnvelopeInternal().distance(line1.getEnvelopeInternal())>this.minDistance){return;}
var coord0=line0.getCoordinates();var coord1=line1.getCoordinates();for(var i=0;i<coord0.length-1;i++){for(var j=0;j<coord1.length-1;j++){var dist=jsts.algorithm.CGAlgorithms.distanceLineLine(coord0[i],coord0[i+1],coord1[j],coord1[j+1]);if(dist<this.minDistance){this.minDistance=dist;var seg0=new jsts.geom.LineSegment(coord0[i],coord0[i+1]);var seg1=new jsts.geom.LineSegment(coord1[j],coord1[j+1]);var closestPt=seg0.closestPoints(seg1);locGeom[0]=new jsts.operation.distance.GeometryLocation(line0,i,closestPt[0]);locGeom[1]=new jsts.operation.distance.GeometryLocation(line1,j,closestPt[1]);}
if(this.minDistance<=this.terminateDistance){return;}}}};jsts.operation.distance.DistanceOp.prototype.computeMinDistance3=function(line,pt,locGeom){if(line.getEnvelopeInternal().distance(pt.getEnvelopeInternal())>this.minDistance){return;}
var coord0=line.getCoordinates();var coord=pt.getCoordinate();for(var i=0;i<coord0.length-1;i++){var dist=jsts.algorithm.CGAlgorithms.distancePointLine(coord,coord0[i],coord0[i+1]);if(dist<this.minDistance){this.minDistance=dist;var seg=new jsts.geom.LineSegment(coord0[i],coord0[i+1]);var segClosestPoint=seg.closestPoint(coord);locGeom[0]=new jsts.operation.distance.GeometryLocation(line,i,segClosestPoint);locGeom[1]=new jsts.operation.distance.GeometryLocation(pt,0,coord);}
if(this.minDistance<=this.terminateDistance){return;}}};jsts.index.strtree.SIRtree=function(nodeCapacity){nodeCapacity=nodeCapacity||10;jsts.index.strtree.AbstractSTRtree.call(this,nodeCapacity);};jsts.index.strtree.SIRtree.prototype=new jsts.index.strtree.AbstractSTRtree();jsts.index.strtree.SIRtree.constructor=jsts.index.strtree.SIRtree;jsts.index.strtree.SIRtree.prototype.comperator={compare:function(o1,o2){return o1.getBounds().getCentre()-o2.getBounds().getCentre();}};jsts.index.strtree.SIRtree.prototype.intersectionOp={intersects:function(aBounds,bBounds){return aBounds.intersects(bBounds);}};jsts.index.strtree.SIRtree.prototype.createNode=function(level){var AbstractNode=function(level){jsts.index.strtree.AbstractNode.apply(this,arguments);};AbstractNode.prototype=new jsts.index.strtree.AbstractNode();AbstractNode.constructor=AbstractNode;AbstractNode.prototype.computeBounds=function(){var bounds=null,childBoundables=this.getChildBoundables(),childBoundable;for(var i=0,l=childBoundables.length;i<l;i++){childBoundable=childBoundables[i];if(bounds===null){bounds=new jsts.index.strtree.Interval(childBoundable.getBounds());}
else{bounds.expandToInclude(childBoundable.getBounds());}}
return bounds;};return AbstractNode;};jsts.index.strtree.SIRtree.prototype.insert=function(x1,x2,item){jsts.index.strtree.AbstractSTRtree.prototype.insert(new jsts.index.strtree.Interval(Math.min(x1,x2),Math.max(x1,x2)),item);};jsts.index.strtree.SIRtree.prototype.query=function(x1,x2){x2=x2||x1;jsts.index.strtree.AbstractSTRtree.prototype.query(new jsts.index.strtree.Interval(Math.min(x1,x2),Math.max(x1,x2)));};jsts.index.strtree.SIRtree.prototype.getIntersectsOp=function(){return this.intersectionOp;};jsts.index.strtree.SIRtree.prototype.getComparator=function(){return this.comperator;};jsts.simplify.DouglasPeuckerSimplifier=function(inputGeom){this.inputGeom=inputGeom;this.isEnsureValidTopology=true;};jsts.simplify.DouglasPeuckerSimplifier.prototype.inputGeom=null;jsts.simplify.DouglasPeuckerSimplifier.prototype.distanceTolerance=null;jsts.simplify.DouglasPeuckerSimplifier.prototype.isEnsureValidTopology=null;jsts.simplify.DouglasPeuckerSimplifier.simplify=function(geom,distanceTolerance){var tss=new jsts.simplify.DouglasPeuckerSimplifier(geom);tss.setDistanceTolerance(distanceTolerance);return tss.getResultGeometry();};jsts.simplify.DouglasPeuckerSimplifier.prototype.setDistanceTolerance=function(distanceTolerance){if(distanceTolerance<0.0){throw"Tolerance must be non-negative";}
this.distanceTolerance=distanceTolerance;};jsts.simplify.DouglasPeuckerSimplifier.prototype.setEnsureValid=function(isEnsureValidTopology){this.isEnsureValidTopology=isEnsureValidTopology;};jsts.simplify.DouglasPeuckerSimplifier.prototype.getResultGeometry=function(){if(this.inputGeom.isEmpty()){return this.inputGeom.clone();}
return(new jsts.simplify.DPTransformer(this.distanceTolerance,this.isEnsureValidTopology)).transform(this.inputGeom);};(function(){jsts.operation.predicate.RectangleContains=function(rectangle){this.rectEnv=rectangle.getEnvelopeInternal();}
jsts.operation.predicate.RectangleContains.contains=function(rectangle,b){var rc=new jsts.operation.predicate.RectangleContains(rectangle);return rc.contains(b);}
jsts.operation.predicate.RectangleContains.prototype.rectEnv=null;jsts.operation.predicate.RectangleContains.prototype.contains=function(geom){if(!this.rectEnv.contains(geom.getEnvelopeInternal()))
return false;if(this.isContainedInBoundary(geom))
return false;return true;}
jsts.operation.predicate.RectangleContains.prototype.isContainedInBoundary=function(geom){if(geom instanceof jsts.geom.Polygon)return false;if(geom instanceof jsts.geom.Point)return this.isPointContainedInBoundary(geom.getCoordinate());if(geom instanceof jsts.geom.LineString)return this.isLineStringContainedInBoundary(geom);for(var i=0;i<geom.getNumGeometries();i++){var comp=geom.getGeometryN(i);if(!this.isContainedInBoundary(comp))
return false;}
return true;}
jsts.operation.predicate.RectangleContains.prototype.isPointContainedInBoundary=function(pt){return pt.x==this.rectEnv.getMinX()||pt.x==this.rectEnv.getMaxX()||pt.y==this.rectEnv.getMinY()||pt.y==this.rectEnv.getMaxY();}
jsts.operation.predicate.RectangleContains.prototype.isLineStringContainedInBoundary=function(line){var seq=line.getCoordinateSequence();for(var i=0;i<seq.length-1;i++){var p0=seq[i];var p1=seq[i+1];if(!this.isLineSegmentContainedInBoundary(p0,p1))
return false;}
return true;}
jsts.operation.predicate.RectangleContains.prototype.isLineSegmentContainedInBoundary=function(p0,p1){if(p0.equals(p1))
return this.isPointContainedInBoundary(p0);if(p0.x==p1.x){if(p0.x==this.rectEnv.getMinX()||p0.x==this.rectEnv.getMaxX())
return true;}
else if(p0.y==p1.y){if(p0.y==this.rectEnv.getMinY()||p0.y==this.rectEnv.getMaxY())
return true;}
return false;}})();(function(){var Location=jsts.geom.Location;var Position=jsts.geomgraph.Position;jsts.geomgraph.Depth=function(){this.depth=[[],[]];for(var i=0;i<2;i++){for(var j=0;j<3;j++){this.depth[i][j]=jsts.geomgraph.Depth.NULL_VALUE;}}};jsts.geomgraph.Depth.NULL_VALUE=-1;jsts.geomgraph.Depth.depthAtLocation=function(location){if(location===Location.EXTERIOR)
return 0;if(location===Location.INTERIOR)
return 1;return jsts.geomgraph.Depth.NULL_VALUE;};jsts.geomgraph.Depth.prototype.depth=null;jsts.geomgraph.Depth.prototype.getDepth=function(geomIndex,posIndex){return this.depth[geomIndex][posIndex];};jsts.geomgraph.Depth.prototype.setDepth=function(geomIndex,posIndex,depthValue){this.depth[geomIndex][posIndex]=depthValue;};jsts.geomgraph.Depth.prototype.getLocation=function(geomIndex,posIndex){if(this.depth[geomIndex][posIndex]<=0)
return Location.EXTERIOR;return Location.INTERIOR;};jsts.geomgraph.Depth.prototype.add=function(geomIndex,posIndex,location){if(location===Location.INTERIOR)
this.depth[geomIndex][posIndex]++;};jsts.geomgraph.Depth.prototype.isNull=function(){if(arguments.length>0){return this.isNull2.apply(this,arguments);}
for(var i=0;i<2;i++){for(var j=0;j<3;j++){if(this.depth[i][j]!==jsts.geomgraph.Depth.NULL_VALUE)
return false;}}
return true;};jsts.geomgraph.Depth.prototype.isNull2=function(geomIndex){if(arguments.length>1){return this.isNull3.apply(this,arguments);}
return this.depth[geomIndex][1]==jsts.geomgraph.Depth.NULL_VALUE;};jsts.geomgraph.Depth.prototype.isNull3=function(geomIndex,posIndex){return this.depth[geomIndex][posIndex]==jsts.geomgraph.Depth.NULL_VALUE;};jsts.geomgraph.Depth.prototype.add=function(lbl){for(var i=0;i<2;i++){for(var j=1;j<3;j++){var loc=lbl.getLocation(i,j);if(loc===Location.EXTERIOR||loc===Location.INTERIOR){if(this.isNull(i,j)){this.depth[i][j]=jsts.geomgraph.Depth.depthAtLocation(loc);}else
this.depth[i][j]+=jsts.geomgraph.Depth.depthAtLocation(loc);}}}};jsts.geomgraph.Depth.prototype.getDelta=function(geomIndex){return this.depth[geomIndex][Position.RIGHT]-
this.depth[geomIndex][Position.LEFT];};jsts.geomgraph.Depth.prototype.normalize=function(){for(var i=0;i<2;i++){if(!this.isNull(i)){var minDepth=this.depth[i][1];if(this.depth[i][2]<minDepth)
minDepth=this.depth[i][2];if(minDepth<0)
minDepth=0;for(var j=1;j<3;j++){var newValue=0;if(this.depth[i][j]>minDepth)
newValue=1;this.depth[i][j]=newValue;}}}};jsts.geomgraph.Depth.prototype.toString=function(){return'A: '+this.depth[0][1]+','+this.depth[0][2]+' B: '+
this.depth[1][1]+','+this.depth[1][2];};})();jsts.algorithm.BoundaryNodeRule=function(){};jsts.algorithm.BoundaryNodeRule.prototype.isInBoundary=function(boundaryCount){throw new jsts.error.AbstractMethodInvocationError();};jsts.algorithm.Mod2BoundaryNodeRule=function(){};jsts.algorithm.Mod2BoundaryNodeRule.prototype=new jsts.algorithm.BoundaryNodeRule();jsts.algorithm.Mod2BoundaryNodeRule.prototype.isInBoundary=function(boundaryCount){return boundaryCount%2===1;};jsts.algorithm.BoundaryNodeRule.MOD2_BOUNDARY_RULE=new jsts.algorithm.Mod2BoundaryNodeRule();jsts.algorithm.BoundaryNodeRule.OGC_SFS_BOUNDARY_RULE=jsts.algorithm.BoundaryNodeRule.MOD2_BOUNDARY_RULE;jsts.operation.distance.GeometryLocation=function(component,segIndex,pt){this.component=component;this.segIndex=segIndex;this.pt=pt;};jsts.operation.distance.GeometryLocation.INSIDE_AREA=-1;jsts.operation.distance.GeometryLocation.prototype.component=null;jsts.operation.distance.GeometryLocation.prototype.segIndex=null;jsts.operation.distance.GeometryLocation.prototype.pt=null;jsts.operation.distance.GeometryLocation.prototype.getGeometryComponent=function(){return this.component;};jsts.operation.distance.GeometryLocation.prototype.getSegmentIndex=function(){return this.segIndex;};jsts.operation.distance.GeometryLocation.prototype.getCoordinate=function(){return this.pt;};jsts.operation.distance.GeometryLocation.prototype.isInsideArea=function(){return this.segIndex===jsts.operation.distance.GeometryLocation.INSIDE_AREA;};jsts.geom.util.PointExtracter=function(pts){this.pts=pts;};jsts.geom.util.PointExtracter.prototype=new jsts.geom.GeometryFilter();jsts.geom.util.PointExtracter.prototype.pts=null;jsts.geom.util.PointExtracter.getPoints=function(geom,list){if(list===undefined){list=[];}
if(geom instanceof jsts.geom.Point){list.push(geom);}else if(geom instanceof jsts.geom.GeometryCollection||geom instanceof jsts.geom.MultiPoint||geom instanceof jsts.geom.MultiLineString||geom instanceof jsts.geom.MultiPolygon){geom.apply(new jsts.geom.util.PointExtracter(list));}
return list;};jsts.geom.util.PointExtracter.prototype.filter=function(geom){if(geom instanceof jsts.geom.Point)
this.pts.push(geom);};(function(){var Location=jsts.geom.Location;jsts.operation.relate.RelateNodeGraph=function(){this.nodes=new jsts.geomgraph.NodeMap(new jsts.operation.relate.RelateNodeFactory());};jsts.operation.relate.RelateNodeGraph.prototype.nodes=null;jsts.operation.relate.RelateNodeGraph.prototype.build=function(geomGraph){this.computeIntersectionNodes(geomGraph,0);this.copyNodesAndLabels(geomGraph,0);var eeBuilder=new jsts.operation.relate.EdgeEndBuilder();var eeList=eeBuilder.computeEdgeEnds(geomGraph.getEdgeIterator());this.insertEdgeEnds(eeList);};jsts.operation.relate.RelateNodeGraph.prototype.computeIntersectionNodes=function(geomGraph,argIndex){for(var edgeIt=geomGraph.getEdgeIterator();edgeIt.hasNext();){var e=edgeIt.next();var eLoc=e.getLabel().getLocation(argIndex);for(var eiIt=e.getEdgeIntersectionList().iterator();eiIt.hasNext();){var ei=eiIt.next();var n=this.nodes.addNode(ei.coord);if(eLoc===Location.BOUNDARY)
n.setLabelBoundary(argIndex);else{if(n.getLabel().isNull(argIndex))
n.setLabel(argIndex,Location.INTERIOR);}}}};jsts.operation.relate.RelateNodeGraph.prototype.copyNodesAndLabels=function(geomGraph,argIndex){for(var nodeIt=geomGraph.getNodeIterator();nodeIt.hasNext();){var graphNode=nodeIt.next();var newNode=this.nodes.addNode(graphNode.getCoordinate());newNode.setLabel(argIndex,graphNode.getLabel().getLocation(argIndex));}};jsts.operation.relate.RelateNodeGraph.prototype.insertEdgeEnds=function(ee){for(var i=ee.iterator();i.hasNext();){var e=i.next();this.nodes.add(e);}};jsts.operation.relate.RelateNodeGraph.prototype.getNodeIterator=function(){return this.nodes.iterator();};})();jsts.geomgraph.index.SimpleSweepLineIntersector=function(){};jsts.geomgraph.index.SimpleSweepLineIntersector.prototype=new jsts.geomgraph.index.EdgeSetIntersector();jsts.geomgraph.index.SimpleSweepLineIntersector.prototype.events=[];jsts.geomgraph.index.SimpleSweepLineIntersector.prototype.nOverlaps=null;jsts.geomgraph.index.SimpleSweepLineIntersector.prototype.computeIntersections=function(edges,si,testAllSegments){if(si instanceof javascript.util.List){this.computeIntersections2.apply(this,arguments);return;}
if(testAllSegments){this.add(edges,null);}else{this.add(edges);}
this.computeIntersections3(si);};jsts.geomgraph.index.SimpleSweepLineIntersector.prototype.computeIntersections2=function(edges0,edges1,si){this.add(edges0,edges0);this.add(edges1,edges1);this.computeIntersections3(si);};jsts.geomgraph.index.SimpleSweepLineIntersector.prototype.add=function(edge,edgeSet){if(edge instanceof javascript.util.List){this.add2.apply(this,arguments);return;}
var pts=edge.getCoordinates();for(var i=0;i<pts.length-1;i++){var ss=new jsts.geomgraph.index.SweepLineSegment(edge,i);var insertEvent=new jsts.geomgraph.index.SweepLineEvent(ss.getMinX(),ss,edgeSet);this.events.push(insertEvent);this.events.push(new jsts.geomgraph.index.SweepLineEvent(ss.getMaxX(),insertEvent));}};jsts.geomgraph.index.SimpleSweepLineIntersector.prototype.add2=function(edges,edgeSet){for(var i=edges.iterator();i.hasNext();){var edge=i.next();if(edgeSet){this.add(edge,edgeSet);}else{this.add(edge,edge);}}};jsts.geomgraph.index.SimpleSweepLineIntersector.prototype.prepareEvents=function(){this.events.sort(function(a,b){return a.compareTo(b);});for(var i=0;i<this.events.length;i++){var ev=this.events[i];if(ev.isDelete()){ev.getInsertEvent().setDeleteEventIndex(i);}}};jsts.geomgraph.index.SimpleSweepLineIntersector.prototype.computeIntersections3=function(si){this.nOverlaps=0;this.prepareEvents();for(var i=0;i<this.events.length;i++){var ev=this.events[i];if(ev.isInsert()){this.processOverlaps(i,ev.getDeleteEventIndex(),ev,si);}}};jsts.geomgraph.index.SimpleSweepLineIntersector.prototype.processOverlaps=function(start,end,ev0,si){var ss0=ev0.getObject();for(var i=start;i<end;i++){var ev1=this.events[i];if(ev1.isInsert()){var ss1=ev1.getObject();if(!ev0.isSameLabel(ev1)){ss0.computeIntersections(ss1,si);this.nOverlaps++;}}}}
jsts.triangulate.VoronoiDiagramBuilder=function(){this.siteCoords=null;this.tolerance=0.0;this.subdiv=null;this.clipEnv=null;this.diagramEnv=null;};jsts.triangulate.VoronoiDiagramBuilder.prototype.setSites=function(){var arg=arguments[0];if(arg instanceof jsts.geom.Geometry||arg instanceof jsts.geom.Coordinate||arg instanceof jsts.geom.Point||arg instanceof jsts.geom.MultiPoint||arg instanceof jsts.geom.LineString||arg instanceof jsts.geom.MultiLineString||arg instanceof jsts.geom.LinearRing||arg instanceof jsts.geom.Polygon||arg instanceof jsts.geom.MultiPolygon){this.setSitesByGeometry(arg);}else{this.setSitesByArray(arg);}};jsts.triangulate.VoronoiDiagramBuilder.prototype.setSitesByGeometry=function(geom){this.siteCoords=jsts.triangulate.DelaunayTriangulationBuilder.extractUniqueCoordinates(geom);};jsts.triangulate.VoronoiDiagramBuilder.prototype.setSitesByArray=function(coords){this.siteCoords=jsts.triangulate.DelaunayTriangulationBuilder.unique(coords);};jsts.triangulate.VoronoiDiagramBuilder.prototype.setClipEnvelope=function(clipEnv){this.clipEnv=clipEnv;};jsts.triangulate.VoronoiDiagramBuilder.prototype.setTolerance=function(tolerance)
{this.tolerance=tolerance;};jsts.triangulate.VoronoiDiagramBuilder.prototype.create=function(){if(this.subdiv!==null){return;}
var siteEnv,expandBy,vertices,triangulator;siteEnv=jsts.triangulate.DelaunayTriangulationBuilder.envelope(this.siteCoords);this.diagramEnv=siteEnv;expandBy=Math.max(this.diagramEnv.getWidth(),this.diagramEnv.getHeight());this.diagramEnv.expandBy(expandBy);if(this.clipEnv!==null){this.diagramEnv.expandToInclude(this.clipEnv);}
vertices=jsts.triangulate.DelaunayTriangulationBuilder.toVertices(this.siteCoords);this.subdiv=new jsts.triangulate.quadedge.QuadEdgeSubdivision(siteEnv,this.tolerance);triangulator=new jsts.triangulate.IncrementalDelaunayTriangulator(this.subdiv);triangulator.insertSites(vertices);};jsts.triangulate.VoronoiDiagramBuilder.prototype.getSubdivision=function(){this.create();return this.subdiv;};jsts.triangulate.VoronoiDiagramBuilder.prototype.getDiagram=function(geomFact){this.create();var polys=this.subdiv.getVoronoiDiagram(geomFact);return this.clipGeometryCollection(polys,this.diagramEnv);};jsts.triangulate.VoronoiDiagramBuilder.prototype.clipGeometryCollection=function(geom,clipEnv){var clipPoly,clipped,i,il,g,result;clipPoly=geom.getFactory().toGeometry(clipEnv);clipped=[];i=0,il=geom.getNumGeometries();for(i;i<il;i++){g=geom.getGeometryN(i);result=null;if(clipEnv.contains(g.getEnvelopeInternal())){result=g;}
else if(clipEnv.intersects(g.getEnvelopeInternal())){result=clipPoly.intersection(g);}
if(result!==null&&!result.isEmpty()){clipped.push(result);}}
return geom.getFactory().createGeometryCollection(clipped);};jsts.operation.valid.IndexedNestedRingTester=function(graph){this.graph=graph;this.rings=new javascript.util.ArrayList();this.totalEnv=new jsts.geom.Envelope();this.index=null;this.nestedPt=null;};jsts.operation.valid.IndexedNestedRingTester.prototype.getNestedPoint=function(){return this.nestedPt;};jsts.operation.valid.IndexedNestedRingTester.prototype.add=function(ring){this.rings.add(ring);this.totalEnv.expandToInclude(ring.getEnvelopeInternal());};jsts.operation.valid.IndexedNestedRingTester.prototype.isNonNested=function(){this.buildIndex();for(var i=0;i<this.rings.size();i++){var innerRing=this.rings.get(i);var innerRingPts=innerRing.getCoordinates();var results=this.index.query(innerRing.getEnvelopeInternal());for(var j=0;j<results.length;j++){var searchRing=results[j];var searchRingPts=searchRing.getCoordinates();if(innerRing==searchRing){continue;}
if(!innerRing.getEnvelopeInternal().intersects(searchRing.getEnvelopeInternal())){continue;}
var innerRingPt=jsts.operation.valid.IsValidOp.findPtNotNode(innerRingPts,searchRing,this.graph);if(innerRingPt==null){continue;}
var isInside=jsts.algorithm.CGAlgorithms.isPointInRing(innerRingPt,searchRingPts);if(isInside){this.nestedPt=innerRingPt;return false;}}}
return true;};jsts.operation.valid.IndexedNestedRingTester.prototype.buildIndex=function(){this.index=new jsts.index.strtree.STRtree();for(var i=0;i<this.rings.size();i++){var ring=this.rings.get(i);var env=ring.getEnvelopeInternal();this.index.insert(env,ring);}};jsts.geomgraph.index.MonotoneChain=function(mce,chainIndex){this.mce=mce;this.chainIndex=chainIndex;};jsts.geomgraph.index.MonotoneChain.prototype.mce=null;jsts.geomgraph.index.MonotoneChain.prototype.chainIndex=null;jsts.geomgraph.index.MonotoneChain.prototype.computeIntersections=function(mc,si){this.mce.computeIntersectsForChain(this.chainIndex,mc.mce,mc.chainIndex,si);};jsts.noding.SegmentNode=function(segString,coord,segmentIndex,segmentOctant){this.segString=segString;this.coord=new jsts.geom.Coordinate(coord);this.segmentIndex=segmentIndex;this.segmentOctant=segmentOctant;this._isInterior=!coord.equals2D(segString.getCoordinate(segmentIndex));};jsts.noding.SegmentNode.prototype.segString=null;jsts.noding.SegmentNode.prototype.coord=null;jsts.noding.SegmentNode.prototype.segmentIndex=null;jsts.noding.SegmentNode.prototype.segmentOctant=null;jsts.noding.SegmentNode.prototype._isInterior=null;jsts.noding.SegmentNode.prototype.getCoordinate=function(){return this.coord;};jsts.noding.SegmentNode.prototype.isInterior=function(){return this._isInterior;};jsts.noding.SegmentNode.prototype.isEndPoint=function(maxSegmentIndex){if(this.segmentIndex===0&&!this._isInterior)return true;if(this.segmentIndex===this.maxSegmentIndex)return true;return false;};jsts.noding.SegmentNode.prototype.compareTo=function(obj){var other=obj;if(this.segmentIndex<other.segmentIndex)return-1;if(this.segmentIndex>other.segmentIndex)return 1;if(this.coord.equals2D(other.coord))return 0;return jsts.noding.SegmentPointComparator.compare(this.segmentOctant,this.coord,other.coord);};(function(){jsts.io.GeoJSONWriter=function(){this.parser=new jsts.io.GeoJSONParser(this.geometryFactory);};jsts.io.GeoJSONWriter.prototype.write=function(geometry){var geoJson=this.parser.write(geometry);return geoJson;};})();jsts.io.OpenLayersParser=function(geometryFactory){this.geometryFactory=geometryFactory||new jsts.geom.GeometryFactory();};jsts.io.OpenLayersParser.prototype.read=function(geometry){if(geometry.CLASS_NAME==='OpenLayers.Geometry.Point'){return this.convertFromPoint(geometry);}else if(geometry.CLASS_NAME==='OpenLayers.Geometry.LineString'){return this.convertFromLineString(geometry);}else if(geometry.CLASS_NAME==='OpenLayers.Geometry.LinearRing'){return this.convertFromLinearRing(geometry);}else if(geometry.CLASS_NAME==='OpenLayers.Geometry.Polygon'){return this.convertFromPolygon(geometry);}else if(geometry.CLASS_NAME==='OpenLayers.Geometry.MultiPoint'){return this.convertFromMultiPoint(geometry);}else if(geometry.CLASS_NAME==='OpenLayers.Geometry.MultiLineString'){return this.convertFromMultiLineString(geometry);}else if(geometry.CLASS_NAME==='OpenLayers.Geometry.MultiPolygon'){return this.convertFromMultiPolygon(geometry);}else if(geometry.CLASS_NAME==='OpenLayers.Geometry.Collection'){return this.convertFromCollection(geometry);}};jsts.io.OpenLayersParser.prototype.convertFromPoint=function(point){return this.geometryFactory.createPoint(new jsts.geom.Coordinate(point.x,point.y));};jsts.io.OpenLayersParser.prototype.convertFromLineString=function(lineString){var i;var coordinates=[];for(i=0;i<lineString.components.length;i++){coordinates.push(new jsts.geom.Coordinate(lineString.components[i].x,lineString.components[i].y));}
return this.geometryFactory.createLineString(coordinates);};jsts.io.OpenLayersParser.prototype.convertFromLinearRing=function(linearRing){var i;var coordinates=[];for(i=0;i<linearRing.components.length;i++){coordinates.push(new jsts.geom.Coordinate(linearRing.components[i].x,linearRing.components[i].y));}
return this.geometryFactory.createLinearRing(coordinates);};jsts.io.OpenLayersParser.prototype.convertFromPolygon=function(polygon){var i;var shell=null;var holes=[];for(i=0;i<polygon.components.length;i++){var linearRing=this.convertFromLinearRing(polygon.components[i]);if(i===0){shell=linearRing;}else{holes.push(linearRing);}}
return this.geometryFactory.createPolygon(shell,holes);};jsts.io.OpenLayersParser.prototype.convertFromMultiPoint=function(multiPoint){var i;var points=[];for(i=0;i<multiPoint.components.length;i++){points.push(this.convertFromPoint(multiPoint.components[i]));}
return this.geometryFactory.createMultiPoint(points);};jsts.io.OpenLayersParser.prototype.convertFromMultiLineString=function(multiLineString){var i;var lineStrings=[];for(i=0;i<multiLineString.components.length;i++){lineStrings.push(this.convertFromLineString(multiLineString.components[i]));}
return this.geometryFactory.createMultiLineString(lineStrings);};jsts.io.OpenLayersParser.prototype.convertFromMultiPolygon=function(multiPolygon){var i;var polygons=[];for(i=0;i<multiPolygon.components.length;i++){polygons.push(this.convertFromPolygon(multiPolygon.components[i]));}
return this.geometryFactory.createMultiPolygon(polygons);};jsts.io.OpenLayersParser.prototype.convertFromCollection=function(collection){var i;var geometries=[];for(i=0;i<collection.components.length;i++){geometries.push(this.read(collection.components[i]));}
return this.geometryFactory.createGeometryCollection(geometries);};jsts.io.OpenLayersParser.prototype.write=function(geometry){if(geometry.CLASS_NAME==='jsts.geom.Point'){return this.convertToPoint(geometry.coordinate);}else if(geometry.CLASS_NAME==='jsts.geom.LineString'){return this.convertToLineString(geometry);}else if(geometry.CLASS_NAME==='jsts.geom.LinearRing'){return this.convertToLinearRing(geometry);}else if(geometry.CLASS_NAME==='jsts.geom.Polygon'){return this.convertToPolygon(geometry);}else if(geometry.CLASS_NAME==='jsts.geom.MultiPoint'){return this.convertToMultiPoint(geometry);}else if(geometry.CLASS_NAME==='jsts.geom.MultiLineString'){return this.convertToMultiLineString(geometry);}else if(geometry.CLASS_NAME==='jsts.geom.MultiPolygon'){return this.convertToMultiPolygon(geometry);}else if(geometry.CLASS_NAME==='jsts.geom.GeometryCollection'){return this.convertToCollection(geometry);}};jsts.io.OpenLayersParser.prototype.convertToPoint=function(coordinate){return new OpenLayers.Geometry.Point(coordinate.x,coordinate.y);};jsts.io.OpenLayersParser.prototype.convertToLineString=function(lineString){var i;var points=[];for(i=0;i<lineString.points.length;i++){var coordinate=lineString.points[i];points.push(this.convertToPoint(coordinate));}
return new OpenLayers.Geometry.LineString(points);};jsts.io.OpenLayersParser.prototype.convertToLinearRing=function(linearRing){var i;var points=[];for(i=0;i<linearRing.points.length;i++){var coordinate=linearRing.points[i];points.push(this.convertToPoint(coordinate));}
return new OpenLayers.Geometry.LinearRing(points);};jsts.io.OpenLayersParser.prototype.convertToPolygon=function(polygon){var i;var rings=[];rings.push(this.convertToLinearRing(polygon.shell));for(i=0;i<polygon.holes.length;i++){var ring=polygon.holes[i];rings.push(this.convertToLinearRing(ring));}
return new OpenLayers.Geometry.Polygon(rings);};jsts.io.OpenLayersParser.prototype.convertToMultiPoint=function(multiPoint){var i;var points=[];for(i=0;i<multiPoint.geometries.length;i++){var coordinate=multiPoint.geometries[i].coordinate;points.push(new OpenLayers.Geometry.Point(coordinate.x,coordinate.y));}
return new OpenLayers.Geometry.MultiPoint(points);};jsts.io.OpenLayersParser.prototype.convertToMultiLineString=function(multiLineString){var i;var lineStrings=[];for(i=0;i<multiLineString.geometries.length;i++){lineStrings.push(this.convertToLineString(multiLineString.geometries[i]));}
return new OpenLayers.Geometry.MultiLineString(lineStrings);};jsts.io.OpenLayersParser.prototype.convertToMultiPolygon=function(multiPolygon){var i;var polygons=[];for(i=0;i<multiPolygon.geometries.length;i++){polygons.push(this.convertToPolygon(multiPolygon.geometries[i]));}
return new OpenLayers.Geometry.MultiPolygon(polygons);};jsts.io.OpenLayersParser.prototype.convertToCollection=function(geometryCollection){var i;var geometries=[];for(i=0;i<geometryCollection.geometries.length;i++){var geometry=geometryCollection.geometries[i];var geometryOpenLayers=this.write(geometry);geometries.push(geometryOpenLayers);}
return new OpenLayers.Geometry.Collection(geometries);};jsts.index.quadtree.Quadtree=function(){this.root=new jsts.index.quadtree.Root();this.minExtent=1.0;};jsts.index.quadtree.Quadtree.ensureExtent=function(itemEnv,minExtent){var minx,maxx,miny,maxy;minx=itemEnv.getMinX();maxx=itemEnv.getMaxX();miny=itemEnv.getMinY();maxy=itemEnv.getMaxY();if(minx!==maxx&&miny!==maxy){return itemEnv;}
if(minx===maxx){minx=minx-(minExtent/2.0);maxx=minx+(minExtent/2.0);}
if(miny===maxy){miny=miny-(minExtent/2.0);maxy=miny+(minExtent/2.0);}
return new jsts.geom.Envelope(minx,maxx,miny,maxy);};jsts.index.quadtree.Quadtree.prototype.depth=function(){return this.root.depth();};jsts.index.quadtree.Quadtree.prototype.size=function(){return this.root.size();};jsts.index.quadtree.Quadtree.prototype.insert=function(itemEnv,item){this.collectStats(itemEnv);var insertEnv=jsts.index.quadtree.Quadtree.ensureExtent(itemEnv,this.minExtent);this.root.insert(insertEnv,item);};jsts.index.quadtree.Quadtree.prototype.remove=function(itemEnv,item){var posEnv=jsts.index.quadtree.Quadtree.ensureExtent(itemEnv,this.minExtent);return this.root.remove(posEnv,item);};jsts.index.quadtree.Quadtree.prototype.query=function(){if(arguments.length===1){return jsts.index.quadtree.Quadtree.prototype.queryByEnvelope.apply(this,arguments);}else{jsts.index.quadtree.Quadtree.prototype.queryWithVisitor.apply(this,arguments);}};jsts.index.quadtree.Quadtree.prototype.queryByEnvelope=function(searchEnv){var visitor=new jsts.index.ArrayListVisitor();this.query(searchEnv,visitor);return visitor.getItems();};jsts.index.quadtree.Quadtree.prototype.queryWithVisitor=function(searchEnv,visitor){this.root.visit(searchEnv,visitor);};jsts.index.quadtree.Quadtree.prototype.queryAll=function(){var foundItems=[];foundItems=this.root.addAllItems(foundItems);return foundItems;};jsts.index.quadtree.Quadtree.prototype.collectStats=function(itemEnv){var delX=itemEnv.getWidth();if(delX<this.minExtent&&delX>0.0){this.minExtent=delX;}
var delY=itemEnv.getHeight();if(delY<this.minExtent&&delY>0.0){this.minExtent=delY;}};jsts.operation.relate.RelateNodeFactory=function(){};jsts.operation.relate.RelateNodeFactory.prototype=new jsts.geomgraph.NodeFactory();jsts.operation.relate.RelateNodeFactory.prototype.createNode=function(coord){return new jsts.operation.relate.RelateNode(coord,new jsts.operation.relate.EdgeEndBundleStar());};jsts.index.quadtree.Key=function(itemEnv){this.pt=new jsts.geom.Coordinate();this.level=0;this.env=null;this.computeKey(itemEnv);};jsts.index.quadtree.Key.computeQuadLevel=function(env){var dx,dy,dMax,level;dx=env.getWidth();dy=env.getHeight();dMax=dx>dy?dx:dy;level=jsts.index.DoubleBits.exponent(dMax)+1;return level;};jsts.index.quadtree.Key.prototype.getPoint=function(){return this.pt;};jsts.index.quadtree.Key.prototype.getLevel=function(){return this.level;};jsts.index.quadtree.Key.prototype.getEnvelope=function(){return this.env;};jsts.index.quadtree.Key.prototype.getCentre=function(){var x,y;x=(this.env.getMinX()+this.env.getMaxX())/2;y=(this.env.getMinY()+this.env.getMaxY())/2;return new jsts.geom.Coordinate(x,y);};jsts.index.quadtree.Key.prototype.computeKey=function(){if(arguments[0]instanceof jsts.geom.Envelope){this.computeKeyFromEnvelope(arguments[0]);}else{this.computeKeyFromLevel(arguments[0],arguments[1]);}};jsts.index.quadtree.Key.prototype.computeKeyFromEnvelope=function(env){this.level=jsts.index.quadtree.Key.computeQuadLevel(env);this.env=new jsts.geom.Envelope();this.computeKey(this.level,env);while(!this.env.contains(env)){this.level+=1;this.computeKey(this.level,env);}};jsts.index.quadtree.Key.prototype.computeKeyFromLevel=function(level,env){var quadSize=jsts.index.DoubleBits.powerOf2(level);this.pt.x=Math.floor(env.getMinX()/quadSize)*quadSize;this.pt.y=Math.floor(env.getMinY()/quadSize)*quadSize;this.env.init(this.pt.x,this.pt.x+quadSize,this.pt.y,this.pt.y+
quadSize);};jsts.geom.CoordinateArrays=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.CoordinateArrays.copyDeep=function(){if(arguments.length===1){return jsts.geom.CoordinateArrays.copyDeep1(arguments[0]);}else if(arguments.length===5){jsts.geom.CoordinateArrays.copyDeep2(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4]);}};jsts.geom.CoordinateArrays.copyDeep1=function(coordinates){var copy=[];for(var i=0;i<coordinates.length;i++){copy[i]=new jsts.geom.Coordinate(coordinates[i]);}
return copy;};jsts.geom.CoordinateArrays.copyDeep2=function(src,srcStart,dest,destStart,length){for(var i=0;i<length;i++){dest[destStart+i]=new jsts.geom.Coordinate(src[srcStart+i]);}};jsts.geom.CoordinateArrays.removeRepeatedPoints=function(coord){var coordList;if(!this.hasRepeatedPoints(coord)){return coord;}
coordList=new jsts.geom.CoordinateList(coord,false);return coordList.toCoordinateArray();};jsts.geom.CoordinateArrays.hasRepeatedPoints=function(coord){var i;for(i=1;i<coord.length;i++){if(coord[i-1].equals(coord[i])){return true;}}
return false;};jsts.geom.CoordinateArrays.ptNotInList=function(testPts,pts){for(var i=0;i<testPts.length;i++){var testPt=testPts[i];if(jsts.geom.CoordinateArrays.indexOf(testPt,pts)<0)
return testPt;}
return null;};jsts.geom.CoordinateArrays.increasingDirection=function(pts){for(var i=0;i<parseInt(pts.length/2);i++){var j=pts.length-1-i;var comp=pts[i].compareTo(pts[j]);if(comp!=0)
return comp;}
return 1;};jsts.geom.CoordinateArrays.minCoordinate=function(coordinates){var minCoord=null;for(var i=0;i<coordinates.length;i++){if(minCoord===null||minCoord.compareTo(coordinates[i])>0){minCoord=coordinates[i];}}
return minCoord;};jsts.geom.CoordinateArrays.scroll=function(coordinates,firstCoordinate){var i=jsts.geom.CoordinateArrays.indexOf(firstCoordinate,coordinates);if(i<0)
return;var newCoordinates=coordinates.slice(i).concat(coordinates.slice(0,i));for(i=0;i<newCoordinates.length;i++){coordinates[i]=newCoordinates[i];}};jsts.geom.CoordinateArrays.indexOf=function(coordinate,coordinates){for(var i=0;i<coordinates.length;i++){if(coordinate.equals(coordinates[i])){return i;}}
return-1;};jsts.operation.overlay.MinimalEdgeRing=function(start,geometryFactory){jsts.geomgraph.EdgeRing.call(this,start,geometryFactory);};jsts.operation.overlay.MinimalEdgeRing.prototype=new jsts.geomgraph.EdgeRing();jsts.operation.overlay.MinimalEdgeRing.constructor=jsts.operation.overlay.MinimalEdgeRing;jsts.operation.overlay.MinimalEdgeRing.prototype.getNext=function(de){return de.getNextMin();};jsts.operation.overlay.MinimalEdgeRing.prototype.setEdgeRing=function(de,er){de.setMinEdgeRing(er);};jsts.triangulate.DelaunayTriangulationBuilder=function(){this.siteCoords=null;this.tolerance=0.0;this.subdiv=null;};jsts.triangulate.DelaunayTriangulationBuilder.extractUniqueCoordinates=function(geom){if(geom===undefined||geom===null){return new jsts.geom.CoordinateList([],false).toArray();}
var coords=geom.getCoordinates();return jsts.triangulate.DelaunayTriangulationBuilder.unique(coords);};jsts.triangulate.DelaunayTriangulationBuilder.unique=function(coords){coords.sort(function(a,b){return a.compareTo(b);});var coordList=new jsts.geom.CoordinateList(coords,false);return coordList.toArray();};jsts.triangulate.DelaunayTriangulationBuilder.toVertices=function(coords){var verts=new Array(coords.length),i=0,il=coords.length,coord;for(i;i<il;i++){coord=coords[i];verts[i]=new jsts.triangulate.quadedge.Vertex(coord);}
return verts;};jsts.triangulate.DelaunayTriangulationBuilder.envelope=function(coords){var env=new jsts.geom.Envelope(),i=0,il=coords.length;for(i;i<il;i++){env.expandToInclude(coords[i]);}
return env;};jsts.triangulate.DelaunayTriangulationBuilder.prototype.setSites=function(){var arg=arguments[0];if(arg instanceof jsts.geom.Geometry||arg instanceof jsts.geom.Coordinate||arg instanceof jsts.geom.Point||arg instanceof jsts.geom.MultiPoint||arg instanceof jsts.geom.LineString||arg instanceof jsts.geom.MultiLineString||arg instanceof jsts.geom.LinearRing||arg instanceof jsts.geom.Polygon||arg instanceof jsts.geom.MultiPolygon){this.setSitesFromGeometry(arg);}else{this.setSitesFromCollection(arg);}};jsts.triangulate.DelaunayTriangulationBuilder.prototype.setSitesFromGeometry=function(geom){this.siteCoords=jsts.triangulate.DelaunayTriangulationBuilder.extractUniqueCoordinates(geom);};jsts.triangulate.DelaunayTriangulationBuilder.prototype.setSitesFromCollection=function(coords){this.siteCoords=jsts.triangulate.DelaunayTriangulationBuilder.unique(coords);};jsts.triangulate.DelaunayTriangulationBuilder.prototype.setTolerance=function(tolerance){this.tolerance=tolerance;};jsts.triangulate.DelaunayTriangulationBuilder.prototype.create=function(){if(this.subdiv===null){var siteEnv,vertices,triangulator;siteEnv=jsts.triangulate.DelaunayTriangulationBuilder.envelope(this.siteCoords);vertices=jsts.triangulate.DelaunayTriangulationBuilder.toVertices(this.siteCoords);this.subdiv=new jsts.triangulate.quadedge.QuadEdgeSubdivision(siteEnv,this.tolerance);triangulator=new jsts.triangulate.IncrementalDelaunayTriangulator(this.subdiv);triangulator.insertSites(vertices);}};jsts.triangulate.DelaunayTriangulationBuilder.prototype.getSubdivision=function(){this.create();return this.subdiv;};jsts.triangulate.DelaunayTriangulationBuilder.prototype.getEdges=function(geomFact){this.create();return this.subdiv.getEdges(geomFact);};jsts.triangulate.DelaunayTriangulationBuilder.prototype.getTriangles=function(geomFact){this.create();return this.subdiv.getTriangles(geomFact);};jsts.algorithm.RayCrossingCounter=function(p){this.p=p;};jsts.algorithm.RayCrossingCounter.locatePointInRing=function(p,ring){var counter=new jsts.algorithm.RayCrossingCounter(p);for(var i=1;i<ring.length;i++){var p1=ring[i];var p2=ring[i-1];counter.countSegment(p1,p2);if(counter.isOnSegment())
return counter.getLocation();}
return counter.getLocation();};jsts.algorithm.RayCrossingCounter.prototype.p=null;jsts.algorithm.RayCrossingCounter.prototype.crossingCount=0;jsts.algorithm.RayCrossingCounter.prototype.isPointOnSegment=false;jsts.algorithm.RayCrossingCounter.prototype.countSegment=function(p1,p2){if(p1.x<this.p.x&&p2.x<this.p.x)
return;if(this.p.x==p2.x&&this.p.y===p2.y){this.isPointOnSegment=true;return;}
if(p1.y===this.p.y&&p2.y===this.p.y){var minx=p1.x;var maxx=p2.x;if(minx>maxx){minx=p2.x;maxx=p1.x;}
if(this.p.x>=minx&&this.p.x<=maxx){this.isPointOnSegment=true;}
return;}
if(((p1.y>this.p.y)&&(p2.y<=this.p.y))||((p2.y>this.p.y)&&(p1.y<=this.p.y))){var x1=p1.x-this.p.x;var y1=p1.y-this.p.y;var x2=p2.x-this.p.x;var y2=p2.y-this.p.y;var xIntSign=jsts.algorithm.RobustDeterminant.signOfDet2x2(x1,y1,x2,y2);if(xIntSign===0.0){this.isPointOnSegment=true;return;}
if(y2<y1)
xIntSign=-xIntSign;if(xIntSign>0.0){this.crossingCount++;}}};jsts.algorithm.RayCrossingCounter.prototype.isOnSegment=function(){return jsts.geom.isPointOnSegment;};jsts.algorithm.RayCrossingCounter.prototype.getLocation=function(){if(this.isPointOnSegment)
return jsts.geom.Location.BOUNDARY;if((this.crossingCount%2)===1){return jsts.geom.Location.INTERIOR;}
return jsts.geom.Location.EXTERIOR;};jsts.algorithm.RayCrossingCounter.prototype.isPointInPolygon=function(){return this.getLocation()!==jsts.geom.Location.EXTERIOR;};jsts.operation.BoundaryOp=function(geom,bnRule){this.geom=geom;this.geomFact=geom.getFactory();this.bnRule=bnRule||jsts.algorithm.BoundaryNodeRule.MOD2_BOUNDARY_RULE;};jsts.operation.BoundaryOp.prototype.geom=null;jsts.operation.BoundaryOp.prototype.geomFact=null;jsts.operation.BoundaryOp.prototype.bnRule=null;jsts.operation.BoundaryOp.prototype.getBoundary=function(){if(this.geom instanceof jsts.geom.LineString)return this.boundaryLineString(this.geom);if(this.geom instanceof jsts.geom.MultiLineString)return this.boundaryMultiLineString(this.geom);return this.geom.getBoundary();};jsts.operation.BoundaryOp.prototype.getEmptyMultiPoint=function(){return this.geomFact.createMultiPoint(null);};jsts.operation.BoundaryOp.prototype.boundaryMultiLineString=function(mLine){if(this.geom.isEmpty()){return this.getEmptyMultiPoint();}
var bdyPts=this.computeBoundaryCoordinates(mLine);if(bdyPts.length==1){return this.geomFact.createPoint(bdyPts[0]);}
return this.geomFact.createMultiPoint(bdyPts);};jsts.operation.BoundaryOp.prototype.endpoints=null;jsts.operation.BoundaryOp.prototype.computeBoundaryCoordinates=function(mLine){var i,line,endpoint,bdyPts=[];this.endpoints=[];for(i=0;i<mLine.getNumGeometries();i++){line=mLine.getGeometryN(i);if(line.getNumPoints()==0)
continue;this.addEndpoint(line.getCoordinateN(0));this.addEndpoint(line.getCoordinateN(line.getNumPoints()-1));}
for(i=0;i<this.endpoints.length;i++){endpoint=this.endpoints[i];if(this.bnRule.isInBoundary(endpoint.count)){bdyPts.push(endpoint.coordinate);}}
return bdyPts;};jsts.operation.BoundaryOp.prototype.addEndpoint=function(pt){var i,endpoint,found=false;for(i=0;i<this.endpoints.length;i++){endpoint=this.endpoints[i];if(endpoint.coordinate.equals(pt)){found=true;break;}}
if(!found){endpoint={};endpoint.coordinate=pt;endpoint.count=0;this.endpoints.push(endpoint);}
endpoint.count++;};jsts.operation.BoundaryOp.prototype.boundaryLineString=function(line){if(this.geom.isEmpty()){return this.getEmptyMultiPoint();}
if(line.isClosed()){var closedEndpointOnBoundary=this.bnRule.isInBoundary(2);if(closedEndpointOnBoundary){return line.getStartPoint();}
else{return this.geomFact.createMultiPoint(null);}}
return this.geomFact.createMultiPoint([line.getStartPoint(),line.getEndPoint()]);};jsts.operation.buffer.OffsetCurveSetBuilder=function(inputGeom,distance,curveBuilder){this.inputGeom=inputGeom;this.distance=distance;this.curveBuilder=curveBuilder;this.curveList=new javascript.util.ArrayList();};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.inputGeom=null;jsts.operation.buffer.OffsetCurveSetBuilder.prototype.distance=null;jsts.operation.buffer.OffsetCurveSetBuilder.prototype.curveBuilder=null;jsts.operation.buffer.OffsetCurveSetBuilder.prototype.curveList=null;jsts.operation.buffer.OffsetCurveSetBuilder.prototype.getCurves=function(){this.add(this.inputGeom);return this.curveList;};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.addCurve=function(coord,leftLoc,rightLoc){if(coord==null||coord.length<2)
return;var e=new jsts.noding.NodedSegmentString(coord,new jsts.geomgraph.Label(0,jsts.geom.Location.BOUNDARY,leftLoc,rightLoc));this.curveList.add(e);};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.add=function(g){if(g.isEmpty())
return;if(g instanceof jsts.geom.Polygon)
this.addPolygon(g);else if(g instanceof jsts.geom.LineString)
this.addLineString(g);else if(g instanceof jsts.geom.Point)
this.addPoint(g);else if(g instanceof jsts.geom.MultiPoint)
this.addCollection(g);else if(g instanceof jsts.geom.MultiLineString)
this.addCollection(g);else if(g instanceof jsts.geom.MultiPolygon)
this.addCollection(g);else if(g instanceof jsts.geom.GeometryCollection)
this.addCollection(g);else
throw new jsts.error.IllegalArgumentError();};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.addCollection=function(gc){for(var i=0;i<gc.getNumGeometries();i++){var g=gc.getGeometryN(i);this.add(g);}};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.addPoint=function(p){if(this.distance<=0.0)
return;var coord=p.getCoordinates();var curve=this.curveBuilder.getLineCurve(coord,this.distance);this.addCurve(curve,jsts.geom.Location.EXTERIOR,jsts.geom.Location.INTERIOR);};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.addLineString=function(line){if(this.distance<=0.0&&!this.curveBuilder.getBufferParameters().isSingleSided())
return;var coord=jsts.geom.CoordinateArrays.removeRepeatedPoints(line.getCoordinates());var curve=this.curveBuilder.getLineCurve(coord,this.distance);this.addCurve(curve,jsts.geom.Location.EXTERIOR,jsts.geom.Location.INTERIOR);};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.addPolygon=function(p){var offsetDistance=this.distance;var offsetSide=jsts.geomgraph.Position.LEFT;if(this.distance<0.0){offsetDistance=-this.distance;offsetSide=jsts.geomgraph.Position.RIGHT;}
var shell=p.getExteriorRing();var shellCoord=jsts.geom.CoordinateArrays.removeRepeatedPoints(shell.getCoordinates());if(this.distance<0.0&&this.isErodedCompletely(shell,this.distance))
return;if(this.distance<=0.0&&shellCoord.length<3)
return;this.addPolygonRing(shellCoord,offsetDistance,offsetSide,jsts.geom.Location.EXTERIOR,jsts.geom.Location.INTERIOR);for(var i=0;i<p.getNumInteriorRing();i++){var hole=p.getInteriorRingN(i);var holeCoord=jsts.geom.CoordinateArrays.removeRepeatedPoints(hole.getCoordinates());if(this.distance>0.0&&this.isErodedCompletely(hole,-this.distance))
continue;this.addPolygonRing(holeCoord,offsetDistance,jsts.geomgraph.Position.opposite(offsetSide),jsts.geom.Location.INTERIOR,jsts.geom.Location.EXTERIOR);}};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.addPolygonRing=function(coord,offsetDistance,side,cwLeftLoc,cwRightLoc){if(offsetDistance==0.0&&coord.length<jsts.geom.LinearRing.MINIMUM_VALID_SIZE)
return;var leftLoc=cwLeftLoc;var rightLoc=cwRightLoc;if(coord.length>=jsts.geom.LinearRing.MINIMUM_VALID_SIZE&&jsts.algorithm.CGAlgorithms.isCCW(coord)){leftLoc=cwRightLoc;rightLoc=cwLeftLoc;side=jsts.geomgraph.Position.opposite(side);}
var curve=this.curveBuilder.getRingCurve(coord,side,offsetDistance);this.addCurve(curve,leftLoc,rightLoc);};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.isErodedCompletely=function(ring,bufferDistance){var ringCoord=ring.getCoordinates();var minDiam=0.0;if(ringCoord.length<4)
return bufferDistance<0;if(ringCoord.length==4)
return this.isTriangleErodedCompletely(ringCoord,bufferDistance);var env=ring.getEnvelopeInternal();var envMinDimension=Math.min(env.getHeight(),env.getWidth());if(bufferDistance<0.0&&2*Math.abs(bufferDistance)>envMinDimension)
return true;return false;};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.isTriangleErodedCompletely=function(triangleCoord,bufferDistance){var tri=new jsts.geom.Triangle(triangleCoord[0],triangleCoord[1],triangleCoord[2]);var inCentre=tri.inCentre();var distToCentre=jsts.algorithm.CGAlgorithms.distancePointLine(inCentre,tri.p0,tri.p1);return distToCentre<Math.abs(bufferDistance);};jsts.operation.buffer.BufferSubgraph=function(){this.dirEdgeList=new javascript.util.ArrayList();this.nodes=new javascript.util.ArrayList();this.finder=new jsts.operation.buffer.RightmostEdgeFinder();};jsts.operation.buffer.BufferSubgraph.prototype.finder=null;jsts.operation.buffer.BufferSubgraph.prototype.dirEdgeList=null;jsts.operation.buffer.BufferSubgraph.prototype.nodes=null;jsts.operation.buffer.BufferSubgraph.prototype.rightMostCoord=null;jsts.operation.buffer.BufferSubgraph.prototype.env=null;jsts.operation.buffer.BufferSubgraph.prototype.getDirectedEdges=function(){return this.dirEdgeList;};jsts.operation.buffer.BufferSubgraph.prototype.getNodes=function(){return this.nodes;};jsts.operation.buffer.BufferSubgraph.prototype.getEnvelope=function(){if(this.env===null){var edgeEnv=new jsts.geom.Envelope();for(var it=this.dirEdgeList.iterator();it.hasNext();){var dirEdge=it.next();var pts=dirEdge.getEdge().getCoordinates();for(var j=0;j<pts.length-1;j++){edgeEnv.expandToInclude(pts[j]);}}
this.env=edgeEnv;}
return this.env;};jsts.operation.buffer.BufferSubgraph.prototype.getRightmostCoordinate=function(){return this.rightMostCoord;};jsts.operation.buffer.BufferSubgraph.prototype.create=function(node){this.addReachable(node);this.finder.findEdge(this.dirEdgeList);this.rightMostCoord=this.finder.getCoordinate();};jsts.operation.buffer.BufferSubgraph.prototype.addReachable=function(startNode){var nodeStack=[];nodeStack.push(startNode);while(nodeStack.length!==0){var node=nodeStack.pop();this.add(node,nodeStack);}};jsts.operation.buffer.BufferSubgraph.prototype.add=function(node,nodeStack){node.setVisited(true);this.nodes.add(node);for(var i=node.getEdges().iterator();i.hasNext();){var de=i.next();this.dirEdgeList.add(de);var sym=de.getSym();var symNode=sym.getNode();if(!symNode.isVisited())
nodeStack.push(symNode);}};jsts.operation.buffer.BufferSubgraph.prototype.clearVisitedEdges=function(){for(var it=this.dirEdgeList.iterator();it.hasNext();){var de=it.next();de.setVisited(false);}};jsts.operation.buffer.BufferSubgraph.prototype.computeDepth=function(outsideDepth){this.clearVisitedEdges();var de=this.finder.getEdge();var n=de.getNode();var label=de.getLabel();de.setEdgeDepths(jsts.geomgraph.Position.RIGHT,outsideDepth);this.copySymDepths(de);this.computeDepths(de);};jsts.operation.buffer.BufferSubgraph.prototype.computeDepths=function(startEdge){var nodesVisited=[];var nodeQueue=[];var startNode=startEdge.getNode();nodeQueue.push(startNode);nodesVisited.push(startNode);startEdge.setVisited(true);while(nodeQueue.length!==0){var n=nodeQueue.shift();nodesVisited.push(n);this.computeNodeDepth(n);for(var i=n.getEdges().iterator();i.hasNext();){var de=i.next();var sym=de.getSym();if(sym.isVisited())
continue;var adjNode=sym.getNode();if(nodesVisited.indexOf(adjNode)===-1){nodeQueue.push(adjNode);nodesVisited.push(adjNode);}}}};jsts.operation.buffer.BufferSubgraph.prototype.computeNodeDepth=function(n){var startEdge=null;for(var i=n.getEdges().iterator();i.hasNext();){var de=i.next();if(de.isVisited()||de.getSym().isVisited()){startEdge=de;break;}}
if(startEdge==null)
throw new jsts.error.TopologyError('unable to find edge to compute depths at '+n.getCoordinate());n.getEdges().computeDepths(startEdge);for(var i=n.getEdges().iterator();i.hasNext();){var de=i.next();de.setVisited(true);this.copySymDepths(de);}};jsts.operation.buffer.BufferSubgraph.prototype.copySymDepths=function(de){var sym=de.getSym();sym.setDepth(jsts.geomgraph.Position.LEFT,de.getDepth(jsts.geomgraph.Position.RIGHT));sym.setDepth(jsts.geomgraph.Position.RIGHT,de.getDepth(jsts.geomgraph.Position.LEFT));};jsts.operation.buffer.BufferSubgraph.prototype.findResultEdges=function(){for(var it=this.dirEdgeList.iterator();it.hasNext();){var de=it.next();if(de.getDepth(jsts.geomgraph.Position.RIGHT)>=1&&de.getDepth(jsts.geomgraph.Position.LEFT)<=0&&!de.isInteriorAreaEdge()){de.setInResult(true);}}};jsts.operation.buffer.BufferSubgraph.prototype.compareTo=function(o){var graph=o;if(this.rightMostCoord.x<graph.rightMostCoord.x){return-1;}
if(this.rightMostCoord.x>graph.rightMostCoord.x){return 1;}
return 0;};jsts.simplify.DPTransformer=function(distanceTolerance,isEnsureValidTopology){this.distanceTolerance=distanceTolerance;this.isEnsureValidTopology=isEnsureValidTopology;};jsts.simplify.DPTransformer.prototype=new jsts.geom.util.GeometryTransformer();jsts.simplify.DPTransformer.prototype.distanceTolerance=null;jsts.simplify.DPTransformer.prototype.isEnsureValidTopology=null;jsts.simplify.DPTransformer.prototype.transformCoordinates=function(coords,parent){var inputPts=coords;var newPts=null;if(inputPts.length==0){newPts=[];}else{newPts=jsts.simplify.DouglasPeuckerLineSimplifier.simplify(inputPts,this.distanceTolerance);}
return newPts;};jsts.simplify.DPTransformer.prototype.transformPolygon=function(geom,parent){if(geom.isEmpty()){return null;}
var rawGeom=jsts.geom.util.GeometryTransformer.prototype.transformPolygon.apply(this,arguments);if(parent instanceof jsts.geom.MultiPolygon){return rawGeom;}
return this.createValidArea(rawGeom);};jsts.simplify.DPTransformer.prototype.transformLinearRing=function(geom,parent){var removeDegenerateRings=parent instanceof jsts.geom.Polygon;var simpResult=jsts.geom.util.GeometryTransformer.prototype.transformLinearRing.apply(this,arguments);if(removeDegenerateRings&&!(simpResult instanceof jsts.geom.LinearRing)){return null;}
return simpResult;};jsts.simplify.DPTransformer.prototype.transformMultiPolygon=function(geom,parent){var rawGeom=jsts.geom.util.GeometryTransformer.prototype.transformMultiPolygon.apply(this,arguments);return this.createValidArea(rawGeom);};jsts.simplify.DPTransformer.prototype.createValidArea=function(rawAreaGeom){if(this.isEnsureValidTopology){return rawAreaGeom.buffer(0.0);}
return rawAreaGeom;};jsts.geom.util.GeometryExtracter=function(clz,comps){this.clz=clz;this.comps=comps;};jsts.geom.util.GeometryExtracter.prototype=new jsts.geom.GeometryFilter();jsts.geom.util.GeometryExtracter.prototype.clz=null;jsts.geom.util.GeometryExtracter.prototype.comps=null;jsts.geom.util.GeometryExtracter.extract=function(geom,clz,list){list=list||new javascript.util.ArrayList();if(geom instanceof clz){list.add(geom);}
else if(geom instanceof jsts.geom.GeometryCollection||geom instanceof jsts.geom.MultiPoint||geom instanceof jsts.geom.MultiLineString||geom instanceof jsts.geom.MultiPolygon){geom.apply(new jsts.geom.util.GeometryExtracter(clz,list));}
return list;};jsts.geom.util.GeometryExtracter.prototype.filter=function(geom){if(this.clz===null||geom instanceof this.clz){this.comps.add(geom);}};(function(){var OverlayOp=jsts.operation.overlay.OverlayOp;var SnapOverlayOp=jsts.operation.overlay.snap.SnapOverlayOp;var SnapIfNeededOverlayOp=function(g1,g2){this.geom=[];this.geom[0]=g1;this.geom[1]=g2;};SnapIfNeededOverlayOp.overlayOp=function(g0,g1,opCode){var op=new SnapIfNeededOverlayOp(g0,g1);return op.getResultGeometry(opCode);};SnapIfNeededOverlayOp.intersection=function(g0,g1){return overlayOp(g0,g1,OverlayOp.INTERSECTION);};SnapIfNeededOverlayOp.union=function(g0,g1){return overlayOp(g0,g1,OverlayOp.UNION);};SnapIfNeededOverlayOp.difference=function(g0,g1){return overlayOp(g0,g1,OverlayOp.DIFFERENCE);};SnapIfNeededOverlayOp.symDifference=function(g0,g1){return overlayOp(g0,g1,OverlayOp.SYMDIFFERENCE);};SnapIfNeededOverlayOp.prototype.geom=null;SnapIfNeededOverlayOp.prototype.getResultGeometry=function(opCode){var result=null;var isSuccess=false;var savedException=null;try{result=OverlayOp.overlayOp(this.geom[0],this.geom[1],opCode);var isValid=true;if(isValid)
isSuccess=true;}catch(ex){savedException=ex;}
if(!isSuccess){try{result=SnapOverlayOp.overlayOp(this.geom[0],this.geom[1],opCode);}catch(ex){throw savedException;}}
return result;};jsts.operation.overlay.snap.SnapIfNeededOverlayOp=SnapIfNeededOverlayOp;})();(function(){var GeometryExtracter=jsts.geom.util.GeometryExtracter;var CascadedPolygonUnion=jsts.operation.union.CascadedPolygonUnion;var PointGeometryUnion=jsts.operation.union.PointGeometryUnion;var OverlayOp=jsts.operation.overlay.OverlayOp;var SnapIfNeededOverlayOp=jsts.operation.overlay.snap.SnapIfNeededOverlayOp;var ArrayList=javascript.util.ArrayList;jsts.operation.union.UnaryUnionOp=function(geoms,geomFact){this.polygons=new ArrayList();this.lines=new ArrayList();this.points=new ArrayList();if(geomFact){this.geomFact=geomFact;}
this.extract(geoms);};jsts.operation.union.UnaryUnionOp.union=function(geoms,geomFact){var op=new jsts.operation.union.UnaryUnionOp(geoms,geomFact);return op.union();};jsts.operation.union.UnaryUnionOp.prototype.polygons=null;jsts.operation.union.UnaryUnionOp.prototype.lines=null;jsts.operation.union.UnaryUnionOp.prototype.points=null;jsts.operation.union.UnaryUnionOp.prototype.geomFact=null;jsts.operation.union.UnaryUnionOp.prototype.extract=function(geoms){if(geoms instanceof ArrayList){for(var i=geoms.iterator();i.hasNext();){var geom=i.next();this.extract(geom);}}else{if(this.geomFact===null){this.geomFact=geoms.getFactory();}
GeometryExtracter.extract(geoms,jsts.geom.Polygon,this.polygons);GeometryExtracter.extract(geoms,jsts.geom.LineString,this.lines);GeometryExtracter.extract(geoms,jsts.geom.Point,this.points);}};jsts.operation.union.UnaryUnionOp.prototype.union=function(){if(this.geomFact===null){return null;}
var unionPoints=null;if(this.points.size()>0){var ptGeom=this.geomFact.buildGeometry(this.points);unionPoints=this.unionNoOpt(ptGeom);}
var unionLines=null;if(this.lines.size()>0){var lineGeom=this.geomFact.buildGeometry(this.lines);unionLines=this.unionNoOpt(lineGeom);}
var unionPolygons=null;if(this.polygons.size()>0){unionPolygons=CascadedPolygonUnion.union(this.polygons);}
var unionLA=this.unionWithNull(unionLines,unionPolygons);var union=null;if(unionPoints===null){union=unionLA;}else if(unionLA===null){union=unionPoints;}else{union=PointGeometryUnion(unionPoints,unionLA);}
if(union===null){return this.geomFact.createGeometryCollection(null);}
return union;};jsts.operation.union.UnaryUnionOp.prototype.unionWithNull=function(g0,g1){if(g0===null&&g1===null){return null;}
if(g1===null){return g0;}
if(g0===null){return g1;}
return g0.union(g1);};jsts.operation.union.UnaryUnionOp.prototype.unionNoOpt=function(g0){var empty=this.geomFact.createPoint(null);return SnapIfNeededOverlayOp.overlayOp(g0,empty,OverlayOp.UNION);};}());jsts.index.kdtree.KdNode=function(){this.left=null;this.right=null;this.count=1;if(arguments.length===2){this.initializeFromCoordinate.apply(this,arguments[0],arguments[1]);}else if(arguments.length===3){this.initializeFromXY.apply(this,arguments[0],arguments[1],arguments[2]);}};jsts.index.kdtree.KdNode.prototype.initializeFromXY=function(x,y,data){this.p=new jsts.geom.Coordinate(x,y);this.data=data;};jsts.index.kdtree.KdNode.prototype.initializeFromCoordinate=function(p,data){this.p=p;this.data=data;};jsts.index.kdtree.KdNode.prototype.getX=function(){return this.p.x;};jsts.index.kdtree.KdNode.prototype.getY=function(){return this.p.y;};jsts.index.kdtree.KdNode.prototype.getCoordinate=function(){return this.p;};jsts.index.kdtree.KdNode.prototype.getData=function(){return this.data;};jsts.index.kdtree.KdNode.prototype.getLeft=function(){return this.left;};jsts.index.kdtree.KdNode.prototype.getRight=function(){return this.right;};jsts.index.kdtree.KdNode.prototype.increment=function(){this.count+=1;};jsts.index.kdtree.KdNode.prototype.getCount=function(){return this.count;};jsts.index.kdtree.KdNode.prototype.isRepeated=function(){return count>1;};jsts.index.kdtree.KdNode.prototype.setLeft=function(left){this.left=left;};jsts.index.kdtree.KdNode.prototype.setRight=function(right){this.right=right;};jsts.algorithm.InteriorPointPoint=function(geometry){this.minDistance=Number.MAX_VALUE;this.interiorPoint=null;this.centroid=geometry.getCentroid().getCoordinate();this.add(geometry);};jsts.algorithm.InteriorPointPoint.prototype.add=function(geometry){if(geometry instanceof jsts.geom.Point){this.addPoint(geometry.getCoordinate());}else if(geometry instanceof jsts.geom.GeometryCollection){for(var i=0;i<geometry.getNumGeometries();i++){this.add(geometry.getGeometryN(i));}}};jsts.algorithm.InteriorPointPoint.prototype.addPoint=function(point){var dist=point.distance(this.centroid);if(dist<this.minDistance){this.interiorPoint=new jsts.geom.Coordinate(point);this.minDistance=dist;}};jsts.algorithm.InteriorPointPoint.prototype.getInteriorPoint=function(){return this.interiorPoint;};(function(){jsts.geom.MultiLineString=function(geometries,factory){this.geometries=geometries||[];this.factory=factory;};jsts.geom.MultiLineString.prototype=new jsts.geom.GeometryCollection();jsts.geom.MultiLineString.constructor=jsts.geom.MultiLineString;jsts.geom.MultiLineString.prototype.getBoundary=function(){return(new jsts.operation.BoundaryOp(this)).getBoundary();};jsts.geom.MultiLineString.prototype.equalsExact=function(other,tolerance){if(!this.isEquivalentClass(other)){return false;}
return jsts.geom.GeometryCollection.prototype.equalsExact.call(this,other,tolerance);};jsts.geom.MultiLineString.prototype.CLASS_NAME='jsts.geom.MultiLineString';})();(function(){var Interval=jsts.index.bintree.Interval;var Root=jsts.index.bintree.Root;var Bintree=function(){this.root=new Root();this.minExtent=1.0;};Bintree.ensureExtent=function(itemInterval,minExtent){var min,max;min=itemInterval.getMin();max=itemInterval.getMax();if(min!==max){return itemInterval;}
if(min===max){min=min-(minExtent/2.0);max=min+(minExtent/2.0);}
return new Interval(min,max);};Bintree.prototype.depth=function(){if(this.root!==null){return this.root.depth();}
return 0;};Bintree.prototype.size=function(){if(this.root!==null){return this.root.size();}
return 0;};Bintree.prototype.nodeSize=function(){if(this.root!==null){return this.root.nodeSize();}
return 0;};Bintree.prototype.insert=function(itemInterval,item){this.collectStats(itemInterval);var insertInterval=Bintree.ensureExtent(itemInterval,this.minExtent);this.root.insert(insertInterval,item);};Bintree.prototype.remove=function(itemInterval,item){var insertInterval=Bintree.ensureExtent(itemInterval,this.minExtent);return this.root.remove(insertInterval,item);};Bintree.prototype.iterator=function(){var foundItems=new javascript.util.ArrayList();this.root.addAllItems(foundItems);return foundItems.iterator();};Bintree.prototype.query=function(){if(arguments.length===2){this.queryAndAdd(arguments[0],arguments[1]);}else{var x=arguments[0];if(!x instanceof Interval){x=new Interval(x,x);}
return this.queryInterval(x);}};Bintree.prototype.queryInterval=function(interval){var foundItems=new javascript.util.ArrayList();this.query(interval,foundItems);return foundItems;};Bintree.prototype.queryAndAdd=function(interval,foundItems){this.root.addAllItemsFromOverlapping(interval,foundItems);};Bintree.prototype.collectStats=function(interval){var del=interval.getWidth();if(del<this.minExtent&&del>0.0){this.minExtent=del;}};jsts.index.bintree.Bintree=Bintree;})();jsts.algorithm.InteriorPointArea=function(geometry){this.factory;this.interiorPoint=null;this.maxWidth=0;this.factory=geometry.getFactory();this.add(geometry);};jsts.algorithm.InteriorPointArea.avg=function(a,b){return(a+b)/2;};jsts.algorithm.InteriorPointArea.prototype.getInteriorPoint=function(){return this.interiorPoint;};jsts.algorithm.InteriorPointArea.prototype.add=function(geometry){if(geometry instanceof jsts.geom.Polygon){this.addPolygon(geometry);}else if(geometry instanceof jsts.geom.GeometryCollection){for(var i=0;i<geometry.getNumGeometries();i++){this.add(geometry.getGeometryN(i));}}};jsts.algorithm.InteriorPointArea.prototype.addPolygon=function(geometry){if(geometry.isEmpty()){return;}
var intPt;var width=0;var bisector=this.horizontalBisector(geometry);if(bisector.getLength()==0.0){width=0;intPt=bisector.getCoordinate();}else{var intersections=bisector.intersection(geometry);var widestIntersection=this.widestGeometry(intersections);width=widestIntersection.getEnvelopeInternal().getWidth();intPt=this.centre(widestIntersection.getEnvelopeInternal());}
if(this.interiorPoint==null||width>this.maxWidth){this.interiorPoint=intPt;this.maxWidth=width;}};jsts.algorithm.InteriorPointArea.prototype.widestGeometry=function(obj){if(obj instanceof jsts.geom.GeometryCollection){var gc=obj;if(gc.isEmpty()){return gc;}
var widestGeometry=gc.getGeometryN(0);for(var i=1;i<gc.getNumGeometries();i++){if(gc.getGeometryN(i).getEnvelopeInternal().getWidth()>widestGeometry.getEnvelopeInternal().getWidth()){widestGeometry=gc.getGeometryN(i);}}
return widestGeometry;}else if(obj instanceof jsts.geom.Geometry){return obj;}};jsts.algorithm.InteriorPointArea.prototype.horizontalBisector=function(geometry){var envelope=geometry.getEnvelopeInternal();var bisectY=jsts.algorithm.SafeBisectorFinder.getBisectorY(geometry);return this.factory.createLineString([new jsts.geom.Coordinate(envelope.getMinX(),bisectY),new jsts.geom.Coordinate(envelope.getMaxX(),bisectY)]);};jsts.algorithm.InteriorPointArea.prototype.centre=function(envelope){return new jsts.geom.Coordinate(jsts.algorithm.InteriorPointArea.avg(envelope.getMinX(),envelope.getMaxX()),jsts.algorithm.InteriorPointArea.avg(envelope.getMinY(),envelope.getMaxY()));};jsts.algorithm.SafeBisectorFinder=function(poly){this.poly;this.centreY;this.hiY=Number.MAX_VALUE;this.loY=-Number.MAX_VALUE;this.poly=poly;this.hiY=poly.getEnvelopeInternal().getMaxY();this.loY=poly.getEnvelopeInternal().getMinY();this.centreY=jsts.algorithm.InteriorPointArea.avg(this.loY,this.hiY);};jsts.algorithm.SafeBisectorFinder.getBisectorY=function(poly){var finder=new jsts.algorithm.SafeBisectorFinder(poly);return finder.getBisectorY();};jsts.algorithm.SafeBisectorFinder.prototype.getBisectorY=function(){this.process(this.poly.getExteriorRing());for(var i=0;i<this.poly.getNumInteriorRing();i++){this.process(this.poly.getInteriorRingN(i));}
var bisectY=jsts.algorithm.InteriorPointArea.avg(this.hiY,this.loY);return bisectY;};jsts.algorithm.SafeBisectorFinder.prototype.process=function(line){var seq=line.getCoordinateSequence();for(var i=0;i<seq.length;i++){var y=seq[i].y;this.updateInterval(y);}};jsts.algorithm.SafeBisectorFinder.prototype.updateInterval=function(y){if(y<=this.centreY){if(y>this.loY){this.loY=y;}}else if(y>this.centreY){if(y<this.hiY){this.hiY=y;}}};jsts.operation.buffer.BufferParameters=function(quadrantSegments,endCapStyle,joinStyle,mitreLimit){if(quadrantSegments)
this.setQuadrantSegments(quadrantSegments);if(endCapStyle)
this.setEndCapStyle(endCapStyle);if(joinStyle)
this.setJoinStyle(joinStyle);if(mitreLimit)
this.setMitreLimit(mitreLimit);};jsts.operation.buffer.BufferParameters.CAP_ROUND=1;jsts.operation.buffer.BufferParameters.CAP_FLAT=2;jsts.operation.buffer.BufferParameters.CAP_SQUARE=3;jsts.operation.buffer.BufferParameters.JOIN_ROUND=1;jsts.operation.buffer.BufferParameters.JOIN_MITRE=2;jsts.operation.buffer.BufferParameters.JOIN_BEVEL=3;jsts.operation.buffer.BufferParameters.DEFAULT_QUADRANT_SEGMENTS=8;jsts.operation.buffer.BufferParameters.DEFAULT_MITRE_LIMIT=5.0;jsts.operation.buffer.BufferParameters.prototype.quadrantSegments=jsts.operation.buffer.BufferParameters.DEFAULT_QUADRANT_SEGMENTS;jsts.operation.buffer.BufferParameters.prototype.endCapStyle=jsts.operation.buffer.BufferParameters.CAP_ROUND;jsts.operation.buffer.BufferParameters.prototype.joinStyle=jsts.operation.buffer.BufferParameters.JOIN_ROUND;jsts.operation.buffer.BufferParameters.prototype.mitreLimit=jsts.operation.buffer.BufferParameters.DEFAULT_MITRE_LIMIT;jsts.operation.buffer.BufferParameters.prototype._isSingleSided=false;jsts.operation.buffer.BufferParameters.prototype.getQuadrantSegments=function(){return this.quadrantSegments;};jsts.operation.buffer.BufferParameters.prototype.setQuadrantSegments=function(quadrantSegments){this.quadrantSegments=quadrantSegments;};jsts.operation.buffer.BufferParameters.prototype.setQuadrantSegments=function(quadSegs){this.quadrantSegments=quadSegs;if(this.quadrantSegments===0)
this.joinStyle=jsts.operation.buffer.BufferParameters.JOIN_BEVEL;if(this.quadrantSegments<0){this.joinStyle=jsts.operation.buffer.BufferParameters.JOIN_MITRE;this.mitreLimit=Math.abs(this.quadrantSegments);}
if(quadSegs<=0){this.quadrantSegments=1;}
if(this.joinStyle!==jsts.operation.buffer.BufferParameters.JOIN_ROUND){this.quadrantSegments=jsts.operation.buffer.BufferParameters.DEFAULT_QUADRANT_SEGMENTS;}};jsts.operation.buffer.BufferParameters.bufferDistanceError=function(quadSegs){var alpha=Math.PI/2.0/quadSegs;return 1-Math.cos(alpha/2.0);};jsts.operation.buffer.BufferParameters.prototype.getEndCapStyle=function(){return this.endCapStyle;};jsts.operation.buffer.BufferParameters.prototype.setEndCapStyle=function(endCapStyle){this.endCapStyle=endCapStyle;};jsts.operation.buffer.BufferParameters.prototype.getJoinStyle=function(){return this.joinStyle;};jsts.operation.buffer.BufferParameters.prototype.setJoinStyle=function(joinStyle){this.joinStyle=joinStyle;};jsts.operation.buffer.BufferParameters.prototype.getMitreLimit=function(){return this.mitreLimit;};jsts.operation.buffer.BufferParameters.prototype.setMitreLimit=function(mitreLimit){this.mitreLimit=mitreLimit;};jsts.operation.buffer.BufferParameters.prototype.setSingleSided=function(isSingleSided){this._isSingleSided=isSingleSided;};jsts.operation.buffer.BufferParameters.prototype.isSingleSided=function(){return this._isSingleSided;};(function(){jsts.geom.util.ShortCircuitedGeometryVisitor=function(){};jsts.geom.util.ShortCircuitedGeometryVisitor.prototype.isDone=false;jsts.geom.util.ShortCircuitedGeometryVisitor.prototype.applyTo=function(geom){for(var i=0;i<geom.getNumGeometries()&&!this.isDone;i++){var element=geom.getGeometryN(i);if(!(element instanceof jsts.geom.GeometryCollection)){this.visit(element);if(this.isDone()){this.isDone=true;return;}}
else
this.applyTo(element);}}
jsts.geom.util.ShortCircuitedGeometryVisitor.prototype.visit=function(element){};jsts.geom.util.ShortCircuitedGeometryVisitor.prototype.isDone=function(){};})();(function(){var EnvelopeIntersectsVisitor=function(rectEnv){this.rectEnv=rectEnv;};EnvelopeIntersectsVisitor.prototype=new jsts.geom.util.ShortCircuitedGeometryVisitor();EnvelopeIntersectsVisitor.constructor=EnvelopeIntersectsVisitor;EnvelopeIntersectsVisitor.prototype.rectEnv=null;EnvelopeIntersectsVisitor.prototype.intersects=false;EnvelopeIntersectsVisitor.prototype.intersects=function(){return this.intersects;}
EnvelopeIntersectsVisitor.prototype.visit=function(element){var elementEnv=element.getEnvelopeInternal();if(!this.rectEnv.intersects(elementEnv)){return;}
if(this.rectEnv.contains(elementEnv)){this.intersects=true;return;}
if(elementEnv.getMinX()>=rectEnv.getMinX()&&elementEnv.getMaxX()<=rectEnv.getMaxX()){this.intersects=true;return;}
if(elementEnv.getMinY()>=rectEnv.getMinY()&&elementEnv.getMaxY()<=rectEnv.getMaxY()){this.intersects=true;return;}}
EnvelopeIntersectsVisitor.prototype.isDone=function(){return this.intersects==true;}
var GeometryContainsPointVisitor=function(rectangle){this.rectSeq=rectangle.getExteriorRing().getCoordinateSequence();this.rectEnv=rectangle.getEnvelopeInternal();};GeometryContainsPointVisitor.prototype=new jsts.geom.util.ShortCircuitedGeometryVisitor();GeometryContainsPointVisitor.constructor=GeometryContainsPointVisitor;GeometryContainsPointVisitor.prototype.rectSeq=null;GeometryContainsPointVisitor.prototype.rectEnv=null;GeometryContainsPointVisitor.prototype.containsPoint=false;GeometryContainsPointVisitor.prototype.containsPoint=function(){return this.containsPoint;}
GeometryContainsPointVisitor.prototype.visit=function(geom){if(!(geom instanceof jsts.geom.Polygon))
return;var elementEnv=geom.getEnvelopeInternal();if(!this.rectEnv.intersects(elementEnv))
return;var rectPt=new jsts.geom.Coordinate();for(var i=0;i<4;i++){this.rectSeq.getCoordinate(i,rectPt);if(!elementEnv.contains(rectPt))
continue;if(SimplePointInAreaLocator.containsPointInPolygon(rectPt,geom)){this.containsPoint=true;return;}}}
GeometryContainsPointVisitor.prototype.isDone=function(){return this.containsPoint==true;}
var RectangleIntersectsSegmentVisitor=function(rectangle){this.rectEnv=rectangle.getEnvelopeInternal();this.rectIntersector=new RectangleLineIntersector(rectEnv);};RectangleIntersectsSegmentVisitor.prototype=new jsts.geom.util.ShortCircuitedGeometryVisitor();RectangleIntersectsSegmentVisitor.constructor=RectangleIntersectsSegmentVisitor;RectangleIntersectsSegmentVisitor.prototype.rectEnv=null;RectangleIntersectsSegmentVisitor.prototype.rectIntersector=null;RectangleIntersectsSegmentVisitor.prototype.hasIntersection=false;RectangleIntersectsSegmentVisitor.prototype.p0=null;RectangleIntersectsSegmentVisitor.prototype.p1=null;RectangleIntersectsSegmentVisitor.prototype.intersects=function(){return this.hasIntersection;}
RectangleIntersectsSegmentVisitor.prototype.visit=function(geom){var elementEnv=geom.getEnvelopeInternal();if(!this.rectEnv.intersects(elementEnv))
return;var lines=LinearComponentExtracter.getLines(geom);this.checkIntersectionWithLineStrings(lines);}
RectangleIntersectsSegmentVisitor.prototype.checkIntersectionWithLineStrings=function(lines){for(var i=lines.iterator();i.hasNext();){var testLine=i.next();this.checkIntersectionWithSegments(testLine);if(this.hasIntersection)
return;}}
RectangleIntersectsSegmentVisitor.prototype.checkIntersectionWithSegments=function(testLine){var seq1=testLine.getCoordinateSequence();for(var j=1;j<seq1.length;j++){this.p0=seq1[j-1];this.p1=seq1[j];if(rectIntersector.intersects(p0,p1)){this.hasIntersection=true;return;}}}
RectangleIntersectsSegmentVisitor.prototype.isDone=function(){return this.hasIntersection==true;}
jsts.operation.predicate.RectangleIntersects=function(rectangle){this.rectangle=rectangle;this.rectEnv=rectangle.getEnvelopeInternal();}
jsts.operation.predicate.RectangleIntersects.intersects=function(rectangle,b){var rp=new jsts.operation.predicate.RectangleIntersects(rectangle);return rp.intersects(b);}
jsts.operation.predicate.RectangleIntersects.prototype.rectangle=null;jsts.operation.predicate.RectangleIntersects.prototype.rectEnv=null;jsts.operation.predicate.RectangleIntersects.prototype.intersects=function(geom){if(!this.rectEnv.intersects(geom.getEnvelopeInternal()))
return false;var visitor=new EnvelopeIntersectsVisitor(this.rectEnv);visitor.applyTo(geom);if(visitor.intersects())
return true;var ecpVisitor=new GeometryContainsPointVisitor(rectangle);ecpVisitor.applyTo(geom);if(ecpVisitor.containsPoint())
return true;var riVisitor=new RectangleIntersectsSegmentVisitor(rectangle);riVisitor.applyTo(geom);if(riVisitor.intersects())
return true;return false;}})();jsts.operation.buffer.BufferBuilder=function(bufParams){this.bufParams=bufParams;this.edgeList=new jsts.geomgraph.EdgeList();};jsts.operation.buffer.BufferBuilder.depthDelta=function(label){var lLoc=label.getLocation(0,jsts.geomgraph.Position.LEFT);var rLoc=label.getLocation(0,jsts.geomgraph.Position.RIGHT);if(lLoc===jsts.geom.Location.INTERIOR&&rLoc===jsts.geom.Location.EXTERIOR)
return 1;else if(lLoc===jsts.geom.Location.EXTERIOR&&rLoc===jsts.geom.Location.INTERIOR)
return-1;return 0;};jsts.operation.buffer.BufferBuilder.prototype.bufParams=null;jsts.operation.buffer.BufferBuilder.prototype.workingPrecisionModel=null;jsts.operation.buffer.BufferBuilder.prototype.workingNoder=null;jsts.operation.buffer.BufferBuilder.prototype.geomFact=null;jsts.operation.buffer.BufferBuilder.prototype.graph=null;jsts.operation.buffer.BufferBuilder.prototype.edgeList=null;jsts.operation.buffer.BufferBuilder.prototype.setWorkingPrecisionModel=function(pm){this.workingPrecisionModel=pm;};jsts.operation.buffer.BufferBuilder.prototype.setNoder=function(noder){this.workingNoder=noder;};jsts.operation.buffer.BufferBuilder.prototype.buffer=function(g,distance){var precisionModel=this.workingPrecisionModel;if(precisionModel===null)
precisionModel=g.getPrecisionModel();this.geomFact=g.getFactory();var curveBuilder=new jsts.operation.buffer.OffsetCurveBuilder(precisionModel,this.bufParams);var curveSetBuilder=new jsts.operation.buffer.OffsetCurveSetBuilder(g,distance,curveBuilder);var bufferSegStrList=curveSetBuilder.getCurves();if(bufferSegStrList.size()<=0){return this.createEmptyResultGeometry();}
this.computeNodedEdges(bufferSegStrList,precisionModel);this.graph=new jsts.geomgraph.PlanarGraph(new jsts.operation.overlay.OverlayNodeFactory());this.graph.addEdges(this.edgeList.getEdges());var subgraphList=this.createSubgraphs(this.graph);var polyBuilder=new jsts.operation.overlay.PolygonBuilder(this.geomFact);this.buildSubgraphs(subgraphList,polyBuilder);var resultPolyList=polyBuilder.getPolygons();if(resultPolyList.size()<=0){return this.createEmptyResultGeometry();}
var resultGeom=this.geomFact.buildGeometry(resultPolyList);return resultGeom;};jsts.operation.buffer.BufferBuilder.prototype.getNoder=function(precisionModel){if(this.workingNoder!==null)
return this.workingNoder;var noder=new jsts.noding.MCIndexNoder();var li=new jsts.algorithm.RobustLineIntersector();li.setPrecisionModel(precisionModel);noder.setSegmentIntersector(new jsts.noding.IntersectionAdder(li));return noder;};jsts.operation.buffer.BufferBuilder.prototype.computeNodedEdges=function(bufferSegStrList,precisionModel){var noder=this.getNoder(precisionModel);noder.computeNodes(bufferSegStrList);var nodedSegStrings=noder.getNodedSubstrings();for(var i=nodedSegStrings.iterator();i.hasNext();){var segStr=i.next();var oldLabel=segStr.getData();var edge=new jsts.geomgraph.Edge(segStr.getCoordinates(),new jsts.geomgraph.Label(oldLabel));this.insertUniqueEdge(edge);}};jsts.operation.buffer.BufferBuilder.prototype.insertUniqueEdge=function(e){var existingEdge=this.edgeList.findEqualEdge(e);if(existingEdge!=null){var existingLabel=existingEdge.getLabel();var labelToMerge=e.getLabel();if(!existingEdge.isPointwiseEqual(e)){labelToMerge=new jsts.geomgraph.Label(e.getLabel());labelToMerge.flip();}
existingLabel.merge(labelToMerge);var mergeDelta=jsts.operation.buffer.BufferBuilder.depthDelta(labelToMerge);var existingDelta=existingEdge.getDepthDelta();var newDelta=existingDelta+mergeDelta;existingEdge.setDepthDelta(newDelta);}else{this.edgeList.add(e);e.setDepthDelta(jsts.operation.buffer.BufferBuilder.depthDelta(e.getLabel()));}};jsts.operation.buffer.BufferBuilder.prototype.createSubgraphs=function(graph){var subgraphList=[];for(var i=graph.getNodes().iterator();i.hasNext();){var node=i.next();if(!node.isVisited()){var subgraph=new jsts.operation.buffer.BufferSubgraph();subgraph.create(node);subgraphList.push(subgraph);}}
var compare=function(a,b){return a.compareTo(b);};subgraphList.sort(compare);subgraphList.reverse();return subgraphList;};jsts.operation.buffer.BufferBuilder.prototype.buildSubgraphs=function(subgraphList,polyBuilder){var processedGraphs=[];for(var i=0;i<subgraphList.length;i++){var subgraph=subgraphList[i];var p=subgraph.getRightmostCoordinate();var locater=new jsts.operation.buffer.SubgraphDepthLocater(processedGraphs);var outsideDepth=locater.getDepth(p);subgraph.computeDepth(outsideDepth);subgraph.findResultEdges();processedGraphs.push(subgraph);polyBuilder.add(subgraph.getDirectedEdges(),subgraph.getNodes());}};jsts.operation.buffer.BufferBuilder.convertSegStrings=function(it){var fact=new jsts.geom.GeometryFactory();var lines=new javascript.util.ArrayList();while(it.hasNext()){var ss=it.next();var line=fact.createLineString(ss.getCoordinates());lines.add(line);}
return fact.buildGeometry(lines);};jsts.operation.buffer.BufferBuilder.prototype.createEmptyResultGeometry=function(){var emptyGeom=this.geomFact.createPolygon(null,null);return emptyGeom;};jsts.noding.SegmentPointComparator=function(){};jsts.noding.SegmentPointComparator.compare=function(octant,p0,p1){if(p0.equals2D(p1))
return 0;var xSign=jsts.noding.SegmentPointComparator.relativeSign(p0.x,p1.x);var ySign=jsts.noding.SegmentPointComparator.relativeSign(p0.y,p1.y);switch(octant){case 0:return jsts.noding.SegmentPointComparator.compareValue(xSign,ySign);case 1:return jsts.noding.SegmentPointComparator.compareValue(ySign,xSign);case 2:return jsts.noding.SegmentPointComparator.compareValue(ySign,-xSign);case 3:return jsts.noding.SegmentPointComparator.compareValue(-xSign,ySign);case 4:return jsts.noding.SegmentPointComparator.compareValue(-xSign,-ySign);case 5:return jsts.noding.SegmentPointComparator.compareValue(-ySign,-xSign);case 6:return jsts.noding.SegmentPointComparator.compareValue(-ySign,xSign);case 7:return jsts.noding.SegmentPointComparator.compareValue(xSign,-ySign);}
return 0;};jsts.noding.SegmentPointComparator.relativeSign=function(x0,x1){if(x0<x1)
return-1;if(x0>x1)
return 1;return 0;};jsts.noding.SegmentPointComparator.compareValue=function(compareSign0,compareSign1){if(compareSign0<0)
return-1;if(compareSign0>0)
return 1;if(compareSign1<0)
return-1;if(compareSign1>0)
return 1;return 0;};jsts.operation.relate.RelateOp=function(){jsts.operation.GeometryGraphOperation.apply(this,arguments);this._relate=new jsts.operation.relate.RelateComputer(this.arg);};jsts.operation.relate.RelateOp.prototype=new jsts.operation.GeometryGraphOperation();jsts.operation.relate.RelateOp.relate=function(a,b,boundaryNodeRule){var relOp=new jsts.operation.relate.RelateOp(a,b,boundaryNodeRule);var im=relOp.getIntersectionMatrix();return im;};jsts.operation.relate.RelateOp.prototype._relate=null;jsts.operation.relate.RelateOp.prototype.getIntersectionMatrix=function(){return this._relate.computeIM();};jsts.index.chain.MonotoneChain=function(pts,start,end,context){this.pts=pts;this.start=start;this.end=end;this.context=context;};jsts.index.chain.MonotoneChain.prototype.pts=null;jsts.index.chain.MonotoneChain.prototype.start=null;jsts.index.chain.MonotoneChain.prototype.end=null;jsts.index.chain.MonotoneChain.prototype.env=null;jsts.index.chain.MonotoneChain.prototype.context=null;jsts.index.chain.MonotoneChain.prototype.id=null;jsts.index.chain.MonotoneChain.prototype.setId=function(id){this.id=id;};jsts.index.chain.MonotoneChain.prototype.getId=function(){return this.id;};jsts.index.chain.MonotoneChain.prototype.getContext=function(){return this.context;};jsts.index.chain.MonotoneChain.prototype.getEnvelope=function(){if(this.env==null){var p0=this.pts[this.start];var p1=this.pts[this.end];this.env=new jsts.geom.Envelope(p0,p1);}
return this.env;};jsts.index.chain.MonotoneChain.prototype.getStartIndex=function(){return this.start;};jsts.index.chain.MonotoneChain.prototype.getEndIndex=function(){return this.end;};jsts.index.chain.MonotoneChain.prototype.getLineSegment=function(index,ls){ls.p0=this.pts[index];ls.p1=this.pts[index+1];};jsts.index.chain.MonotoneChain.prototype.getCoordinates=function(){var coord=[];var index=0;for(var i=this.start;i<=this.end;i++){coord[index++]=this.pts[i];}
return coord;};jsts.index.chain.MonotoneChain.prototype.select=function(searchEnv,mcs){this.computeSelect2(searchEnv,this.start,this.end,mcs);};jsts.index.chain.MonotoneChain.prototype.computeSelect2=function(searchEnv,start0,end0,mcs){var p0=this.pts[start0];var p1=this.pts[end0];mcs.tempEnv1.init(p0,p1);if(end0-start0===1){mcs.select(this,start0);return;}
if(!searchEnv.intersects(mcs.tempEnv1))
return;var mid=parseInt((start0+end0)/2);if(start0<mid){this.computeSelect2(searchEnv,start0,mid,mcs);}
if(mid<end0){this.computeSelect2(searchEnv,mid,end0,mcs);}};jsts.index.chain.MonotoneChain.prototype.computeOverlaps=function(mc,mco){if(arguments.length===6){return this.computeOverlaps2.apply(this,arguments);}
this.computeOverlaps2(this.start,this.end,mc,mc.start,mc.end,mco);};jsts.index.chain.MonotoneChain.prototype.computeOverlaps2=function(start0,end0,mc,start1,end1,mco){var p00=this.pts[start0];var p01=this.pts[end0];var p10=mc.pts[start1];var p11=mc.pts[end1];if(end0-start0===1&&end1-start1===1){mco.overlap(this,start0,mc,start1);return;}
mco.tempEnv1.init(p00,p01);mco.tempEnv2.init(p10,p11);if(!mco.tempEnv1.intersects(mco.tempEnv2))
return;var mid0=parseInt((start0+end0)/2);var mid1=parseInt((start1+end1)/2);if(start0<mid0){if(start1<mid1)
this.computeOverlaps2(start0,mid0,mc,start1,mid1,mco);if(mid1<end1)
this.computeOverlaps2(start0,mid0,mc,mid1,end1,mco);}
if(mid0<end0){if(start1<mid1)
this.computeOverlaps2(mid0,end0,mc,start1,mid1,mco);if(mid1<end1)
this.computeOverlaps2(mid0,end0,mc,mid1,end1,mco);}};(function(){var Location=jsts.geom.Location;var Dimension=jsts.geom.Dimension;jsts.geom.IntersectionMatrix=function(elements){var other=elements;if(elements===undefined||elements===null){this.matrix=[[],[],[]];this.setAll(Dimension.FALSE);}else if(typeof elements==='string'){this.set(elements);}else if(other instanceof jsts.geom.IntersectionMatrix){this.matrix[Location.INTERIOR][Location.INTERIOR]=other.matrix[Location.INTERIOR][Location.INTERIOR];this.matrix[Location.INTERIOR][Location.BOUNDARY]=other.matrix[Location.INTERIOR][Location.BOUNDARY];this.matrix[Location.INTERIOR][Location.EXTERIOR]=other.matrix[Location.INTERIOR][Location.EXTERIOR];this.matrix[Location.BOUNDARY][Location.INTERIOR]=other.matrix[Location.BOUNDARY][Location.INTERIOR];this.matrix[Location.BOUNDARY][Location.BOUNDARY]=other.matrix[Location.BOUNDARY][Location.BOUNDARY];this.matrix[Location.BOUNDARY][Location.EXTERIOR]=other.matrix[Location.BOUNDARY][Location.EXTERIOR];this.matrix[Location.EXTERIOR][Location.INTERIOR]=other.matrix[Location.EXTERIOR][Location.INTERIOR];this.matrix[Location.EXTERIOR][Location.BOUNDARY]=other.matrix[Location.EXTERIOR][Location.BOUNDARY];this.matrix[Location.EXTERIOR][Location.EXTERIOR]=other.matrix[Location.EXTERIOR][Location.EXTERIOR];}};jsts.geom.IntersectionMatrix.prototype.matrix=null;jsts.geom.IntersectionMatrix.prototype.add=function(im){var i,j;for(i=0;i<3;i++){for(j=0;j<3;j++){this.setAtLeast(i,j,im.get(i,j));}}};jsts.geom.IntersectionMatrix.matches=function(actualDimensionValue,requiredDimensionSymbol){if(typeof actualDimensionValue==='string'){return jsts.geom.IntersectionMatrix.matches2.call(this,arguments);}
if(requiredDimensionSymbol==='*'){return true;}
if(requiredDimensionSymbol==='T'&&(actualDimensionValue>=0||actualDimensionValue===Dimension.TRUE)){return true;}
if(requiredDimensionSymbol==='F'&&actualDimensionValue===Dimension.FALSE){return true;}
if(requiredDimensionSymbol==='0'&&actualDimensionValue===Dimension.P){return true;}
if(requiredDimensionSymbol==='1'&&actualDimensionValue===Dimension.L){return true;}
if(requiredDimensionSymbol==='2'&&actualDimensionValue===Dimension.A){return true;}
return false;};jsts.geom.IntersectionMatrix.matches2=function(actualDimensionSymbols,requiredDimensionSymbols){var m=new jsts.geom.IntersectionMatrix(actualDimensionSymbols);return m.matches(requiredDimensionSymbols);};jsts.geom.IntersectionMatrix.prototype.set=function(row,column,dimensionValue){if(typeof row==='string'){this.set2(row);return;}
this.matrix[row][column]=dimensionValue;};jsts.geom.IntersectionMatrix.prototype.set2=function(dimensionSymbols){for(var i=0;i<dimensionSymbols.length();i++){var row=i/3;var col=i%3;this.matrix[row][col]=Dimension.toDimensionValue(dimensionSymbols.charAt(i));}};jsts.geom.IntersectionMatrix.prototype.setAtLeast=function(row,column,minimumDimensionValue){if(arguments.length===1){this.setAtLeast2(arguments[0]);return;}
if(this.matrix[row][column]<minimumDimensionValue){this.matrix[row][column]=minimumDimensionValue;}};jsts.geom.IntersectionMatrix.prototype.setAtLeastIfValid=function(row,column,minimumDimensionValue){if(row>=0&&column>=0){this.setAtLeast(row,column,minimumDimensionValue);}};jsts.geom.IntersectionMatrix.prototype.setAtLeast2=function(minimumDimensionSymbols){var i;for(i=0;i<minimumDimensionSymbols.length;i++){var row=parseInt(i/3);var col=parseInt(i%3);this.setAtLeast(row,col,jsts.geom.Dimension.toDimensionValue(minimumDimensionSymbols.charAt(i)));}};jsts.geom.IntersectionMatrix.prototype.setAll=function(dimensionValue){var ai,bi;for(ai=0;ai<3;ai++){for(bi=0;bi<3;bi++){this.matrix[ai][bi]=dimensionValue;}}};jsts.geom.IntersectionMatrix.prototype.get=function(row,column){return this.matrix[row][column];};jsts.geom.IntersectionMatrix.prototype.isDisjoint=function(){return this.matrix[Location.INTERIOR][Location.INTERIOR]===Dimension.FALSE&&this.matrix[Location.INTERIOR][Location.BOUNDARY]===Dimension.FALSE&&this.matrix[Location.BOUNDARY][Location.INTERIOR]===Dimension.FALSE&&this.matrix[Location.BOUNDARY][Location.BOUNDARY]===Dimension.FALSE;};jsts.geom.IntersectionMatrix.prototype.isIntersects=function(){return!this.isDisjoint();};jsts.geom.IntersectionMatrix.prototype.isTouches=function(dimensionOfGeometryA,dimensionOfGeometryB){if(dimensionOfGeometryA>dimensionOfGeometryB){return this.isTouches(dimensionOfGeometryB,dimensionOfGeometryA);}
if((dimensionOfGeometryA==Dimension.A&&dimensionOfGeometryB==Dimension.A)||(dimensionOfGeometryA==Dimension.L&&dimensionOfGeometryB==Dimension.L)||(dimensionOfGeometryA==Dimension.L&&dimensionOfGeometryB==Dimension.A)||(dimensionOfGeometryA==Dimension.P&&dimensionOfGeometryB==Dimension.A)||(dimensionOfGeometryA==Dimension.P&&dimensionOfGeometryB==Dimension.L)){return this.matrix[Location.INTERIOR][Location.INTERIOR]===Dimension.FALSE&&(jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.BOUNDARY],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.BOUNDARY][Location.INTERIOR],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.BOUNDARY][Location.BOUNDARY],'T'));}
return false;};jsts.geom.IntersectionMatrix.prototype.isCrosses=function(dimensionOfGeometryA,dimensionOfGeometryB){if((dimensionOfGeometryA==Dimension.P&&dimensionOfGeometryB==Dimension.L)||(dimensionOfGeometryA==Dimension.P&&dimensionOfGeometryB==Dimension.A)||(dimensionOfGeometryA==Dimension.L&&dimensionOfGeometryB==Dimension.A)){return jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.INTERIOR],'T')&&jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.EXTERIOR],'T');}
if((dimensionOfGeometryA==Dimension.L&&dimensionOfGeometryB==Dimension.P)||(dimensionOfGeometryA==Dimension.A&&dimensionOfGeometryB==Dimension.P)||(dimensionOfGeometryA==Dimension.A&&dimensionOfGeometryB==Dimension.L)){return jsts.geom.IntersectionMatrix.matches(matrix[Location.INTERIOR][Location.INTERIOR],'T')&&jsts.geom.IntersectionMatrix.matches(this.matrix[Location.EXTERIOR][Location.INTERIOR],'T');}
if(dimensionOfGeometryA===Dimension.L&&dimensionOfGeometryB===Dimension.L){return this.matrix[Location.INTERIOR][Location.INTERIOR]===0;}
return false;};jsts.geom.IntersectionMatrix.prototype.isWithin=function(){return jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.INTERIOR],'T')&&this.matrix[Location.INTERIOR][Location.EXTERIOR]==Dimension.FALSE&&this.matrix[Location.BOUNDARY][Location.EXTERIOR]==Dimension.FALSE;};jsts.geom.IntersectionMatrix.prototype.isContains=function(){return jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.INTERIOR],'T')&&this.matrix[Location.EXTERIOR][Location.INTERIOR]==Dimension.FALSE&&this.matrix[Location.EXTERIOR][Location.BOUNDARY]==Dimension.FALSE;};jsts.geom.IntersectionMatrix.prototype.isCovers=function(){var hasPointInCommon=jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.INTERIOR],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.BOUNDARY],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.BOUNDARY][Location.INTERIOR],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.BOUNDARY][Location.BOUNDARY],'T');return hasPointInCommon&&this.matrix[Location.EXTERIOR][Location.INTERIOR]==Dimension.FALSE&&this.matrix[Location.EXTERIOR][Location.BOUNDARY]==Dimension.FALSE;};jsts.geom.IntersectionMatrix.prototype.isCoveredBy=function(){var hasPointInCommon=jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.INTERIOR],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.BOUNDARY],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.BOUNDARY][Location.INTERIOR],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.BOUNDARY][Location.BOUNDARY],'T');return hasPointInCommon&&this.matrix[Location.INTERIOR][Location.EXTERIOR]===Dimension.FALSE&&this.matrix[Location.BOUNDARY][Location.EXTERIOR]===Dimension.FALSE;};jsts.geom.IntersectionMatrix.prototype.isEquals=function(dimensionOfGeometryA,dimensionOfGeometryB){if(dimensionOfGeometryA!==dimensionOfGeometryB){return false;}
return jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.INTERIOR],'T')&&this.matrix[Location.EXTERIOR][Location.INTERIOR]===Dimension.FALSE&&this.matrix[Location.INTERIOR][Location.EXTERIOR]===Dimension.FALSE&&this.matrix[Location.EXTERIOR][Location.BOUNDARY]===Dimension.FALSE&&this.matrix[Location.BOUNDARY][Location.EXTERIOR]===Dimension.FALSE;};jsts.geom.IntersectionMatrix.prototype.isOverlaps=function(dimensionOfGeometryA,dimensionOfGeometryB){if((dimensionOfGeometryA==Dimension.P&&dimensionOfGeometryB===Dimension.P)||(dimensionOfGeometryA==Dimension.A&&dimensionOfGeometryB===Dimension.A)){return jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.INTERIOR],'T')&&jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.EXTERIOR],'T')&&jsts.geom.IntersectionMatrix.matches(this.matrix[Location.EXTERIOR][Location.INTERIOR],'T');}
if(dimensionOfGeometryA===Dimension.L&&dimensionOfGeometryB===Dimension.L){return this.matrix[Location.INTERIOR][Location.INTERIOR]==1&&jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.EXTERIOR],'T')&&jsts.geom.IntersectionMatrix.matches(this.matrix[Location.EXTERIOR][Location.INTERIOR],'T');}
return false;};jsts.geom.IntersectionMatrix.prototype.matches=function(requiredDimensionSymbols){if(requiredDimensionSymbols.length!=9){throw new jsts.error.IllegalArgumentException('Should be length 9: '+
requiredDimensionSymbols);}
for(var ai=0;ai<3;ai++){for(var bi=0;bi<3;bi++){if(!jsts.geom.IntersectionMatrix.matches(this.matrix[ai][bi],requiredDimensionSymbols.charAt(3*ai+bi))){return false;}}}
return true;};jsts.geom.IntersectionMatrix.prototype.transpose=function(){var temp=matrix[1][0];this.matrix[1][0]=this.matrix[0][1];this.matrix[0][1]=temp;temp=this.matrix[2][0];this.matrix[2][0]=this.matrix[0][2];this.matrix[0][2]=temp;temp=this.matrix[2][1];this.matrix[2][1]=this.matrix[1][2];this.matrix[1][2]=temp;return this;};jsts.geom.IntersectionMatrix.prototype.toString=function(){var ai,bi,buf='';for(ai=0;ai<3;ai++){for(bi=0;bi<3;bi++){buf+=Dimension.toDimensionSymbol(this.matrix[ai][bi]);}}
return buf;};})();jsts.triangulate.quadedge.LastFoundQuadEdgeLocator=function(subdiv){this.subdiv=subdiv;this.lastEdge=null;this.init();};jsts.triangulate.quadedge.LastFoundQuadEdgeLocator.prototype.init=function(){this.lastEdge=this.findEdge();};jsts.triangulate.quadedge.LastFoundQuadEdgeLocator.prototype.findEdge=function(){var edges=this.subdiv.getEdges();return edges[0];};jsts.triangulate.quadedge.LastFoundQuadEdgeLocator.prototype.locate=function(v){if(!this.lastEdge.isLive()){this.init();}
var e=this.subdiv.locateFromEdge(v,this.lastEdge);this.lastEdge=e;return e;};jsts.noding.SegmentNodeList=function(edge){this.nodeMap=new javascript.util.TreeMap();this.edge=edge;};jsts.noding.SegmentNodeList.prototype.nodeMap=null;jsts.noding.SegmentNodeList.prototype.iterator=function(){return this.nodeMap.values().iterator();};jsts.noding.SegmentNodeList.prototype.edge=null;jsts.noding.SegmentNodeList.prototype.getEdge=function(){return this.edge;};jsts.noding.SegmentNodeList.prototype.add=function(intPt,segmentIndex){var eiNew=new jsts.noding.SegmentNode(this.edge,intPt,segmentIndex,this.edge.getSegmentOctant(segmentIndex));var ei=this.nodeMap.get(eiNew);if(ei!==null){jsts.util.Assert.isTrue(ei.coord.equals2D(intPt),'Found equal nodes with different coordinates');return ei;}
this.nodeMap.put(eiNew,eiNew);return eiNew;};jsts.noding.SegmentNodeList.prototype.addEndpoints=function(){var maxSegIndex=this.edge.size()-1;this.add(this.edge.getCoordinate(0),0);this.add(this.edge.getCoordinate(maxSegIndex),maxSegIndex);};jsts.noding.SegmentNodeList.prototype.addCollapsedNodes=function(){var collapsedVertexIndexes=[];this.findCollapsesFromInsertedNodes(collapsedVertexIndexes);this.findCollapsesFromExistingVertices(collapsedVertexIndexes);for(var i=0;i<collapsedVertexIndexes.length;i++){var vertexIndex=collapsedVertexIndexes[i];this.add(this.edge.getCoordinate(vertexIndex),vertexIndex);}};jsts.noding.SegmentNodeList.prototype.findCollapsesFromExistingVertices=function(collapsedVertexIndexes){for(var i=0;i<this.edge.size()-2;i++){var p0=this.edge.getCoordinate(i);var p1=this.edge.getCoordinate(i+1);var p2=this.edge.getCoordinate(i+2);if(p0.equals2D(p2)){collapsedVertexIndexes.push(i+1);}}};jsts.noding.SegmentNodeList.prototype.findCollapsesFromInsertedNodes=function(collapsedVertexIndexes){var collapsedVertexIndex=[null];var it=this.iterator();var eiPrev=it.next();while(it.hasNext()){var ei=it.next();var isCollapsed=this.findCollapseIndex(eiPrev,ei,collapsedVertexIndex);if(isCollapsed)
collapsedVertexIndexes.push(collapsedVertexIndex[0]);eiPrev=ei;}};jsts.noding.SegmentNodeList.prototype.findCollapseIndex=function(ei0,ei1,collapsedVertexIndex){if(!ei0.coord.equals2D(ei1.coord))
return false;var numVerticesBetween=ei1.segmentIndex-ei0.segmentIndex;if(!ei1.isInterior()){numVerticesBetween--;}
if(numVerticesBetween===1){collapsedVertexIndex[0]=ei0.segmentIndex+1;return true;}
return false;};jsts.noding.SegmentNodeList.prototype.addSplitEdges=function(edgeList){this.addEndpoints();this.addCollapsedNodes();var it=this.iterator();var eiPrev=it.next();while(it.hasNext()){var ei=it.next();var newEdge=this.createSplitEdge(eiPrev,ei);edgeList.add(newEdge);eiPrev=ei;}};jsts.noding.SegmentNodeList.prototype.checkSplitEdgesCorrectness=function(splitEdges){var edgePts=edge.getCoordinates();var split0=splitEdges[0];var pt0=split0.getCoordinate(0);if(!pt0.equals2D(edgePts[0]))
throw new Error('bad split edge start point at '+pt0);var splitn=splitEdges[splitEdges.length-1];var splitnPts=splitn.getCoordinates();var ptn=splitnPts[splitnPts.length-1];if(!ptn.equals2D(edgePts[edgePts.length-1]))
throw new Error('bad split edge end point at '+ptn);};jsts.noding.SegmentNodeList.prototype.createSplitEdge=function(ei0,ei1){var npts=ei1.segmentIndex-ei0.segmentIndex+2;var lastSegStartPt=this.edge.getCoordinate(ei1.segmentIndex);var useIntPt1=ei1.isInterior()||!ei1.coord.equals2D(lastSegStartPt);if(!useIntPt1){npts--;}
var pts=[];var ipt=0;pts[ipt++]=new jsts.geom.Coordinate(ei0.coord);for(var i=ei0.segmentIndex+1;i<=ei1.segmentIndex;i++){pts[ipt++]=this.edge.getCoordinate(i);}
if(useIntPt1)
pts[ipt]=ei1.coord;return new jsts.noding.NodedSegmentString(pts,this.edge.getData());};jsts.io.WKTWriter=function(){this.parser=new jsts.io.WKTParser(this.geometryFactory);};jsts.io.WKTWriter.prototype.write=function(geometry){var wkt=this.parser.write(geometry);return wkt;};jsts.io.WKTWriter.toLineString=function(p0,p1){if(arguments.length!==2){throw new jsts.error.NotImplementedError();}
return'LINESTRING ( '+p0.x+' '+p0.y+', '+p1.x+' '+p1.y+' )';};jsts.io.WKTReader=function(geometryFactory){this.geometryFactory=geometryFactory||new jsts.geom.GeometryFactory();this.precisionModel=this.geometryFactory.getPrecisionModel();this.parser=new jsts.io.WKTParser(this.geometryFactory);};jsts.io.WKTReader.prototype.read=function(wkt){var geometry=this.parser.read(wkt);if(this.precisionModel.getType()===jsts.geom.PrecisionModel.FIXED){this.reducePrecision(geometry);}
return geometry;};jsts.io.WKTReader.prototype.reducePrecision=function(geometry){var i,len;if(geometry.coordinate){this.precisionModel.makePrecise(geometry.coordinate);}else if(geometry.points){for(i=0,len=geometry.points.length;i<len;i++){this.precisionModel.makePrecise(geometry.points[i]);}}else if(geometry.geometries){for(i=0,len=geometry.geometries.length;i<len;i++){this.reducePrecision(geometry.geometries[i]);}}};jsts.triangulate.quadedge.QuadEdgeSubdivision=function(env,tolerance){this.tolerance=tolerance;this.edgeCoincidenceTolerance=tolerance/jsts.triangulate.quadedge.QuadEdgeSubdivision.EDGE_COINCIDENCE_TOL_FACTOR;this.visitedKey=0;this.quadEdges=[];this.startingEdge;this.tolerance;this.edgeCoincidenceTolerance;this.frameEnv;this.locator=null;this.seg=new jsts.geom.LineSegment();this.triEdges=new Array(3);this.frameVertex=new Array(3);this.createFrame(env);this.startingEdge=this.initSubdiv();this.locator=new jsts.triangulate.quadedge.LastFoundQuadEdgeLocator(this);};jsts.triangulate.quadedge.QuadEdgeSubdivision.EDGE_COINCIDENCE_TOL_FACTOR=1000;jsts.triangulate.quadedge.QuadEdgeSubdivision.getTriangleEdges=function(startQE,triEdge){triEdge[0]=startQE;triEdge[1]=triEdge[0].lNext();triEdge[2]=triEdge[1].lNext();if(triEdge[2].lNext()!=triEdge[0]){throw new jsts.IllegalArgumentError('Edges do not form a triangle');}};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.createFrame=function(env){var deltaX,deltaY,offset;deltaX=env.getWidth();deltaY=env.getHeight();offset=0.0;if(deltaX>deltaY){offset=deltaX*10.0;}else{offset=deltaY*10.0;}
this.frameVertex[0]=new jsts.triangulate.quadedge.Vertex((env.getMaxX()+env.getMinX())/2.0,env.getMaxY()
+offset);this.frameVertex[1]=new jsts.triangulate.quadedge.Vertex(env.getMinX()-offset,env.getMinY()-offset);this.frameVertex[2]=new jsts.triangulate.quadedge.Vertex(env.getMaxX()+offset,env.getMinY()-offset);this.frameEnv=new jsts.geom.Envelope(this.frameVertex[0].getCoordinate(),this.frameVertex[1].getCoordinate());this.frameEnv.expandToInclude(this.frameVertex[2].getCoordinate());};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.initSubdiv=function(){var ea,eb,ec;ea=this.makeEdge(this.frameVertex[0],this.frameVertex[1]);eb=this.makeEdge(this.frameVertex[1],this.frameVertex[2]);jsts.triangulate.quadedge.QuadEdge.splice(ea.sym(),eb);ec=this.makeEdge(this.frameVertex[2],this.frameVertex[0]);jsts.triangulate.quadedge.QuadEdge.splice(eb.sym(),ec);jsts.triangulate.quadedge.QuadEdge.splice(ec.sym(),ea);return ea;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getTolerance=function(){return this.tolerance;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getEnvelope=function(){return new jsts.geom.Envelope(this.frameEnv);};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getEdges=function(){if(arguments.length>0){return this.getEdgesByFactory(arguments[0]);}else{return this.quadEdges;}};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.setLocator=function(locator){this.locator=locator;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.makeEdge=function(o,d){var q=jsts.triangulate.quadedge.QuadEdge.makeEdge(o,d);this.quadEdges.push(q);return q;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.connect=function(a,b){var q=jsts.triangulate.quadedge.QuadEdge.connect(a,b);this.quadEdges.push(q);return q;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.delete_jsts=function(e){jsts.triangulate.quadedge.QuadEdge.splice(e,e.oPrev());jsts.triangulate.quadedge.QuadEdge.splice(e.sym(),e.sym().oPrev());var eSym,eRot,eRotSym;e.eSym=e.sym();eRot=e.rot;eRotSym=e.rot.sym();var idx=this.quadEdges.indexOf(e);if(idx!==-1){this.quadEdges.splice(idx,1);}
idx=this.quadEdges.indexOf(eSym);if(idx!==-1){this.quadEdges.splice(idx,1);}
idx=this.quadEdges.indexOf(eRot);if(idx!==-1){this.quadEdges.splice(idx,1);}
idx=this.quadEdges.indexOf(eRotSym);if(idx!==-1){this.quadEdges.splice(idx,1);}
e.delete_jsts();eSym.delete_jsts();eRot.delete_jsts();eRotSym.delete_jsts();};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.locateFromEdge=function(v,startEdge){var iter=0,maxIter=this.quadEdges.length,e;e=startEdge;while(true){iter++;if(iter>maxIter){throw new jsts.error.LocateFailureError(e.toLineSegment());}
if((v.equals(e.orig()))||(v.equals(e.dest()))){break;}else if(v.rightOf(e)){e=e.sym();}else if(!v.rightOf(e.oNext())){e=e.oNext();}else if(!v.rightOf(e.dPrev())){e=e.dPrev();}else{break;}}
return e;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.locate=function(){if(arguments.length===1){if(arguments[0]instanceof jsts.triangulate.quadedge.Vertex){return this.locateByVertex(arguments[0]);}else{return this.locateByCoordinate(arguments[0]);}}else{return this.locateByCoordinates(arguments[0],arguments[1]);}};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.locateByVertex=function(v){return this.locator.locate(v);};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.locateByCoordinate=function(p){return this.locator.locate(new jsts.triangulate.quadedge.Vertex(p));};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.locateByCoordinates=function(p0,p1){var e,base,locEdge;var e=this.locator.locate(new jsts.triangulate.quadedge.Vertex(p0));if(e===null){return null;}
base=e;if(e.dest().getCoordinate().equals2D(p0)){base=e.sym();}
locEdge=base;do{if(locEdge.dest().getCoordinate().equals2D(p1)){return locEdge;}
locEdge=locEdge.oNext();}while(locEdge!=base);return null;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.insertSite=function(v){var e,base,startEdge;e=this.locate(v);if((v.equals(e.orig(),this.tolerance))||(v.equals(e.dest(),this.tolerance))){return e;}
base=this.makeEdge(e.orig(),v);jsts.triangulate.quadedge.QuadEdge.splice(base,e);startEdge=base;do{base=this.connect(e,base.sym());e=base.oPrev();}while(e.lNext()!=startEdge);return startEdge;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.isFrameEdge=function(e){if(this.isFrameVertex(e.orig())||this.isFrameVertex(e.dest())){return true;}
return false;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.isFrameBorderEdge=function(e){var leftTri,rightTri,vLeftTriOther,vRightTriOther;leftTri=new Array(3);this.getTriangleEdges(e,leftTri);rightTri=new Array(3);this.getTriangleEdges(e.sym(),rightTri);vLeftTriOther=e.lNext().dest();if(this.isFrameVertex(vLeftTriOther)){return true;}
vRightTriOther=e.sym().lNext().dest();if(this.isFrameVertex(vRightTriOther)){return true;}
return false;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.isFrameVertex=function(v){if(v.equals(this.frameVertex[0])){return true;}
if(v.equals(this.frameVertex[1])){return true;}
if(v.equals(this.frameVertex[2])){return true;}
return false;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.isOnEdge=function(e,p){this.seg.setCoordinates(e.orig().getCoordinate(),e.dest().getCoordinate());var dist=this.seg.distance(p);return dist<this.edgeCoincidenceTolerance;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.isVertexOfEdge=function(e,v){if((v.equals(e.orig(),this.tolerance))||(v.equals(e.dest(),this.tolerance))){return true;}
return false;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getVertices=function(includeFrame)
{var vertices=[],i,il,qe,v,vd;i=0,il=this.quadEdges.length;for(i;i<il;i++){qe=this.quadEdges[i];v=qe.orig();if(includeFrame||!this.isFrameVertex(v)){vertices.push(v);}
vd=qe.dest();if(includeFrame||!this.isFrameVertex(vd)){vertices.push(vd);}}
return vertices;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getVertexUniqueEdges=function(includeFrame)
{var edges,visitedVertices,i,il,qe,v,qd,vd;edges=[];visitedVertices=[];i=0,il=this.quadEdges.length;for(i;i<il;i++){qe=this.quadEdges[i];v=qe.orig();if(visitedVertices.indexOf(v)===-1){visitedVertices.push(v);if(includeFrame||!this.isFrameVertex(v)){edges.push(qe);}}
qd=qe.sym();vd=qd.orig();if(visitedVertices.indexOf(vd)===-1){visitedVertices.push(vd);if(includeFrame||!this.isFrameVertex(vd)){edges.push(qd);}}}
return edges;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getPrimaryEdges=function(includeFrame){this.visitedKey++;var edges,edgeStack,visitedEdges,edge,priQE;edges=[];edgeStack=[];edgeStack.push(this.startingEdge);visitedEdges=[];while(edgeStack.length>0){edge=edgeStack.pop();if(visitedEdges.indexOf(edge)===-1){priQE=edge.getPrimary();if(includeFrame||!this.isFrameEdge(priQE)){edges.push(priQE);}
edgeStack.push(edge.oNext());edgeStack.push(edge.sym().oNext());visitedEdges.push(edge);visitedEdges.push(edge.sym());}}
return edges;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.visitTriangles=function(triVisitor,includeFrame){this.visitedKey++;var edgeStack,visitedEdges,edge,triEdges;edgeStack=[];edgeStack.push(this.startingEdge);visitedEdges=[];while(edgeStack.length>0){edge=edgeStack.pop();if(visitedEdges.indexOf(edge)===-1){triEdges=this.fetchTriangleToVisit(edge,edgeStack,includeFrame,visitedEdges);if(triEdges!==null)
triVisitor.visit(triEdges);}}};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.fetchTriangleToVisit=function(edge,edgeStack,includeFrame,visitedEdges){var curr,edgeCount,isFrame,sym;curr=edge;edgeCount=0;isFrame=false;do{this.triEdges[edgeCount]=curr;if(this.isFrameEdge(curr)){isFrame=true;}
sym=curr.sym();if(visitedEdges.indexOf(sym)===-1){edgeStack.push(sym);}
visitedEdges.push(curr);edgeCount++;curr=curr.lNext();}while(curr!==edge);if(isFrame&&!includeFrame){return null;}
return this.triEdges;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getTriangleEdges=function(includeFrame){var visitor=new jsts.triangulate.quadedge.TriangleEdgesListVisitor();this.visitTriangles(visitor,includeFrame);return visitor.getTriangleEdges();};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getTriangleVertices=function(includeFrame){var visitor=new TriangleVertexListVisitor();this.visitTriangles(visitor,includeFrame);return visitor.getTriangleVertices();};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getTriangleCoordinates=function(includeFrame){var visitor=new jsts.triangulate.quadedge.TriangleCoordinatesVisitor();this.visitTriangles(visitor,includeFrame);return visitor.getTriangles();};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getEdgesByFactory=function(geomFact){var quadEdges,edges,i,il,qe,coords;quadEdges=this.getPrimaryEdges(false);edges=[];i=0;il=quadEdges.length;for(i;i<il;i++){qe=quadEdges[i];coords=[];coords[0]=(qe.orig().getCoordinate());coords[1]=(qe.dest().getCoordinate());edges[i]=geomFact.createLineString(coords);}
return geomFact.createMultiLineString(edges);};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getTriangles=function(geomFact){var triPtsList,tris,triPt,i,il;triPtsList=this.getTriangleCoordinates(false);tris=new Array(triPtsList.length);i=0,il=triPtsList.length;for(i;i<il;i++){triPt=triPtsList[i];tris[i]=geomFact.createPolygon(geomFact.createLinearRing(triPt,null));}
return geomFact.createGeometryCollection(tris);};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getVoronoiDiagram=function(geomFact)
{var vorCells=this.getVoronoiCellPolygons(geomFact);return geomFact.createGeometryCollection(vorCells);};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getVoronoiCellPolygons=function(geomFact)
{this.visitTriangles(new jsts.triangulate.quadedge.TriangleCircumcentreVisitor(),true);var cells,edges,i,il,qe;cells=[];edges=this.getVertexUniqueEdges(false);i=0,il=edges.length;for(i;i<il;i++){qe=edges[i];cells.push(this.getVoronoiCellPolygon(qe,geomFact));}
return cells;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getVoronoiCellPolygon=function(qe,geomFact)
{var cellPts,startQe,cc,coordList,cellPoly,v;cellPts=[];startQE=qe;do{cc=qe.rot.orig().getCoordinate();cellPts.push(cc);qe=qe.oPrev();}while(qe!==startQE);coordList=new jsts.geom.CoordinateList([],false);coordList.add(cellPts,false);coordList.closeRing();if(coordList.size()<4){coordList.add(coordList.get(coordList.size()-1),true);}
cellPoly=geomFact.createPolygon(geomFact.createLinearRing(coordList.toArray()),null);v=startQE.orig();return cellPoly;};jsts.triangulate.quadedge.TriangleCircumcentreVisitor=function(){};jsts.triangulate.quadedge.TriangleCircumcentreVisitor.prototype.visit=function(triEdges){var a,b,c,cc,ccVertex,i;a=triEdges[0].orig().getCoordinate();b=triEdges[1].orig().getCoordinate();c=triEdges[2].orig().getCoordinate();cc=jsts.geom.Triangle.circumcentre(a,b,c);ccVertex=new jsts.triangulate.quadedge.Vertex(cc);i=0;for(i;i<3;i++){triEdges[i].rot.setOrig(ccVertex);}};jsts.triangulate.quadedge.TriangleEdgesListVisitor=function(){this.triList=[];};jsts.triangulate.quadedge.TriangleEdgesListVisitor.prototype.visit=function(triEdges){var clone=triEdges.concat();this.triList.push(clone);};jsts.triangulate.quadedge.TriangleEdgesListVisitor.prototype.getTriangleEdges=function(){return this.triList;};jsts.triangulate.quadedge.TriangleVertexListVisitor=function(){this.triList=[];};jsts.triangulate.quadedge.TriangleVertexListVisitor.prototype.visit=function(triEdges){var vertices=[];vertices.push(trieEdges[0].orig());vertices.push(trieEdges[1].orig());vertices.push(trieEdges[2].orig());this.triList.push(vertices);};jsts.triangulate.quadedge.TriangleVertexListVisitor.prototype.getTriangleVertices=function(){return this.triList;};jsts.triangulate.quadedge.TriangleCoordinatesVisitor=function(){this.coordList=new jsts.geom.CoordinateList([],false);this.triCoords=[];};jsts.triangulate.quadedge.TriangleCoordinatesVisitor.prototype.visit=function(triEdges){this.coordList=new jsts.geom.CoordinateList([],false);var i=0,v,pts;for(i;i<3;i++){v=triEdges[i].orig();this.coordList.add(v.getCoordinate());}
if(this.coordList.size()>0){this.coordList.closeRing();pts=this.coordList.toArray();if(pts.length!==4){return;}
this.triCoords.push(pts);}};jsts.triangulate.quadedge.TriangleCoordinatesVisitor.prototype.getTriangles=function(){return this.triCoords;};jsts.operation.relate.EdgeEndBundle=function(){this.edgeEnds=[];var e=arguments[0]instanceof jsts.geomgraph.EdgeEnd?arguments[0]:arguments[1];var edge=e.getEdge();var coord=e.getCoordinate();var dirCoord=e.getDirectedCoordinate();var label=new jsts.geomgraph.Label(e.getLabel());jsts.geomgraph.EdgeEnd.call(this,edge,coord,dirCoord,label);this.insert(e);};jsts.operation.relate.EdgeEndBundle.prototype=new jsts.geomgraph.EdgeEnd();jsts.operation.relate.EdgeEndBundle.prototype.edgeEnds=null;jsts.operation.relate.EdgeEndBundle.prototype.getLabel=function(){return this.label;};jsts.operation.relate.EdgeEndBundle.prototype.getEdgeEnds=function(){return this.edgeEnds;};jsts.operation.relate.EdgeEndBundle.prototype.insert=function(e){this.edgeEnds.push(e);};jsts.operation.relate.EdgeEndBundle.prototype.computeLabel=function(boundaryNodeRule){var isArea=false;for(var i=0;i<this.edgeEnds.length;i++){var e=this.edgeEnds[i];if(e.getLabel().isArea())
isArea=true;}
if(isArea)
this.label=new jsts.geomgraph.Label(jsts.geom.Location.NONE,jsts.geom.Location.NONE,jsts.geom.Location.NONE);else
this.label=new jsts.geomgraph.Label(jsts.geom.Location.NONE);for(var i=0;i<2;i++){this.computeLabelOn(i,boundaryNodeRule);if(isArea)
this.computeLabelSides(i);}};jsts.operation.relate.EdgeEndBundle.prototype.computeLabelOn=function(geomIndex,boundaryNodeRule){var boundaryCount=0;var foundInterior=false;for(var i=0;i<this.edgeEnds.length;i++){var e=this.edgeEnds[i];var loc=e.getLabel().getLocation(geomIndex);if(loc==jsts.geom.Location.BOUNDARY)
boundaryCount++;if(loc==jsts.geom.Location.INTERIOR)
foundInterior=true;}
var loc=jsts.geom.Location.NONE;if(foundInterior)
loc=jsts.geom.Location.INTERIOR;if(boundaryCount>0){loc=jsts.geomgraph.GeometryGraph.determineBoundary(boundaryNodeRule,boundaryCount);}
this.label.setLocation(geomIndex,loc);};jsts.operation.relate.EdgeEndBundle.prototype.computeLabelSides=function(geomIndex){this.computeLabelSide(geomIndex,jsts.geomgraph.Position.LEFT);this.computeLabelSide(geomIndex,jsts.geomgraph.Position.RIGHT);};jsts.operation.relate.EdgeEndBundle.prototype.computeLabelSide=function(geomIndex,side){for(var i=0;i<this.edgeEnds.length;i++){var e=this.edgeEnds[i];if(e.getLabel().isArea()){var loc=e.getLabel().getLocation(geomIndex,side);if(loc===jsts.geom.Location.INTERIOR){this.label.setLocation(geomIndex,side,jsts.geom.Location.INTERIOR);return;}else if(loc===jsts.geom.Location.EXTERIOR)
this.label.setLocation(geomIndex,side,jsts.geom.Location.EXTERIOR);}}};jsts.operation.relate.EdgeEndBundle.prototype.updateIM=function(im){jsts.geomgraph.Edge.updateIM(this.label,im);};jsts.index.kdtree.KdTree=function(tolerance){var tol=0.0;if(tolerance!==undefined){tol=tolerance;}
this.root=null;this.last=null;this.numberOfNodes=0;this.tolerance=tol;};jsts.index.kdtree.KdTree.prototype.insert=function(){if(arguments.length===1){return this.insertCoordinate.apply(this,arguments[0]);}else{return this.insertWithData.apply(this,arguments[0],arguments[1]);}};jsts.index.kdtree.KdTree.prototype.insertCoordinate=function(p){return this.insertWithData(p,null);};jsts.index.kdtree.KdTree.prototype.insertWithData=function(p,data){if(this.root===null){this.root=new jsts.index.kdtree.KdNode(p,data);return this.root;}
var currentNode=this.root,leafNode=this.root,isOddLevel=true,isLessThan=true;while(currentNode!==last){if(isOddLevel){isLessThan=p.x<currentNode.getX();}else{isLessThan=p.y<currentNode.getY();}
leafNode=currentNode;if(isLessThan){currentNode=currentNode.getLeft();}else{currentNode=currentNode.getRight();}
if(currentNode!==null){var isInTolerance=p.distance(currentNode.getCoordinate())<=this.tolerance;if(isInTolerance){currentNode.increment();return currentNode;}}
isOddLevel=!isOddLevel;}
this.numberOfNodes=numberOfNodes+1;var node=new jsts.index.kdtree.KdNode(p,data);node.setLeft(this.last);node.setRight(this.last);if(isLessThan){leafNode.setLeft(node);}else{leafNode.setRight(node);}
return node;};jsts.index.kdtree.KdTree.prototype.queryNode=function(currentNode,bottomNode,queryEnv,odd,result){if(currentNode===bottomNode){return;}
var min,max,discriminant;if(odd){min=queryEnv.getMinX();max=queryEnv.getMaxX();discriminant=currentNode.getX();}else{min=queryEnv.getMinY();max=queryEnv.getMaxY();discriminant=currentNode.getY();}
var searchLeft=min<discriminant;var searchRight=discriminant<=max;if(searchLeft){this.queryNode(currentNode.getLeft(),bottomNode,queryEnv,!odd,result);}
if(queryEnv.contains(currentNode.getCoordinate())){result.add(currentNode);}
if(searchRight){this.queryNode(currentNode.getRight(),bottomNode,queryEnv,!odd,result);}};jsts.index.kdtree.KdTree.prototype.query=function(){if(arguments.length===1){return this.queryByEnvelope.apply(this,arguments[0]);}else{return this.queryWithArray.apply(this,arguments[0],arguments[1]);}};jsts.index.kdtree.KdTree.prototype.queryByEnvelope=function(queryEnv){var result=[];this.queryNode(this.root,this.last,queryEnv,true,result);return result;};jsts.index.kdtree.KdTree.prototype.queryWithArray=function(queryEnv,result){this.queryNode(this.root,this.last,queryEnv,true,result);};jsts.geom.Triangle=function(p0,p1,p2){this.p0=p0;this.p1=p1;this.p2=p2;};jsts.geom.Triangle.isAcute=function(a,b,c){if(!jsts.algorithm.Angle.isAcute(a,b,c)){return false;}
if(!jsts.algorithm.Angle.isAcute(b,c,a)){return false;}
if(!jsts.algorithm.Angle.isAcute(c,a,b)){return false;}
return true;};jsts.geom.Triangle.perpendicularBisector=function(a,b){var dx,dy,l1,l2;dx=b.x-a.x;dy=b.y-a.y;l1=new jsts.algorithm.HCoordinate(a.x+dx/2.0,a.y+dy/2.0,1.0);l2=new jsts.algorithm.HCoordinate(a.x-dy+dx/2.0,a.y+dx+dy/2.0,1.0);return new jsts.algorithm.HCoordinate(l1,l2);};jsts.geom.Triangle.circumcentre=function(a,b,c){var cx,cy,ax,ay,bx,by,denom,numx,numy,ccx,ccy;cx=c.x;cy=c.y;ax=a.x-cx;ay=a.y-cy;bx=b.x-cx;by=b.y-cy;denom=2*jsts.geom.Triangle.det(ax,ay,bx,by);numx=jsts.geom.Triangle.det(ay,ax*ax+ay*ay,by,bx*bx+by*by);numy=jsts.geom.Triangle.det(ax,ax*ax+ay*ay,bx,bx*bx+by*by);ccx=cx-numx/denom;ccy=cy+numy/denom;return new jsts.geom.Coordinate(ccx,ccy);};jsts.geom.Triangle.det=function(m00,m01,m10,m11){return m00*m11-m01*m10;};jsts.geom.Triangle.inCentre=function(a,b,c){var len0,len1,len2,circum,inCentreX,inCentreY;len0=b.distance(c);len1=a.distance(c);len2=a.distance(b);circum=len0+len1+len2;inCentreX=(len0*a.x+len1*b.x+len2*c.x)/circum;inCentreY=(len0*a.y+len1*b.y+len2*c.y)/circum;return new jsts.geom.Coordinate(inCentreX,inCentreY);};jsts.geom.Triangle.centroid=function(a,b,c){var x,y;x=(a.x+b.x+c.x)/3;y=(a.y+b.y+c.y)/3;return new jsts.geom.Coordinate(x,y);};jsts.geom.Triangle.longestSideLength=function(a,b,c){var lenAB,lenBC,lenCA,maxLen;lenAB=a.distance(b);lenBC=b.distance(c);lenCA=c.distance(a);maxLen=lenAB;if(lenBC>maxLen){maxLen=lenBC;}
if(lenCA>maxLen){maxLen=lenCA;}
return maxLen;};jsts.geom.Triangle.angleBisector=function(a,b,c){var len0,len2,frac,dx,dy,splitPt;len0=b.distance(a);len2=b.distance(c);frac=len0/(len0+len2);dx=c.x-a.x;dy=c.y-a.y;splitPt=new jsts.geom.Coordinate(a.x+frac*dx,a.y+frac*dy);return splitPt;};jsts.geom.Triangle.area=function(a,b,c){return Math.abs(((c.x-a.x)*(b.y-a.y)-(b.x-a.x)*(c.y-a.y))/2.0);};jsts.geom.Triangle.signedArea=function(a,b,c){return((c.x-a.x)*(b.y-a.y)-(b.x-a.x)*(c.y-a.y))/2.0;};jsts.geom.Triangle.prototype.inCentre=function(){return jsts.geom.Triangle.inCentre(this.p0,this.p1,this.p2);};jsts.noding.OrientedCoordinateArray=function(pts){this.pts=pts;this._orientation=jsts.noding.OrientedCoordinateArray.orientation(pts);};jsts.noding.OrientedCoordinateArray.prototype.pts=null;jsts.noding.OrientedCoordinateArray.prototype._orientation=undefined;jsts.noding.OrientedCoordinateArray.orientation=function(pts){return jsts.geom.CoordinateArrays.increasingDirection(pts)===1;};jsts.noding.OrientedCoordinateArray.prototype.compareTo=function(o1){var oca=o1;var comp=jsts.noding.OrientedCoordinateArray.compareOriented(this.pts,this._orientation,oca.pts,oca._orientation);return comp;};jsts.noding.OrientedCoordinateArray.compareOriented=function(pts1,orientation1,pts2,orientation2){var dir1=orientation1?1:-1;var dir2=orientation2?1:-1;var limit1=orientation1?pts1.length:-1;var limit2=orientation2?pts2.length:-1;var i1=orientation1?0:pts1.length-1;var i2=orientation2?0:pts2.length-1;var comp=0;while(true){var compPt=pts1[i1].compareTo(pts2[i2]);if(compPt!==0)
return compPt;i1+=dir1;i2+=dir2;var done1=i1===limit1;var done2=i2===limit2;if(done1&&!done2)
return-1;if(!done1&&done2)
return 1;if(done1&&done2)
return 0;}};jsts.algorithm.CentralEndpointIntersector=function(p00,p01,p10,p11){this.pts=[p00,p01,p10,p11];this.compute();};jsts.algorithm.CentralEndpointIntersector.getIntersection=function(p00,p01,p10,p11){var intor=new jsts.algorithm.CentralEndpointIntersector(p00,p01,p10,p11);return intor.getIntersection();};jsts.algorithm.CentralEndpointIntersector.prototype.pts=null;jsts.algorithm.CentralEndpointIntersector.prototype.intPt=null;jsts.algorithm.CentralEndpointIntersector.prototype.compute=function(){var centroid=jsts.algorithm.CentralEndpointIntersector.average(this.pts);this.intPt=this.findNearestPoint(centroid,this.pts);};jsts.algorithm.CentralEndpointIntersector.prototype.getIntersection=function(){return this.intPt;};jsts.algorithm.CentralEndpointIntersector.average=function(pts){var avg=new jsts.geom.Coordinate();var i,n=pts.length;for(i=0;i<n;i++){avg.x+=pts[i].x;avg.y+=pts[i].y;}
if(n>0){avg.x/=n;avg.y/=n;}
return avg;};jsts.algorithm.CentralEndpointIntersector.prototype.findNearestPoint=function(p,pts){var minDist=Number.MAX_VALUE;var i,result=null,dist;for(i=0;i<pts.length;i++){dist=p.distance(pts[i]);if(dist<minDist){minDist=dist;result=pts[i];}}
return result;};jsts.operation.buffer.BufferOp=function(g,bufParams){this.argGeom=g;this.bufParams=bufParams?bufParams:new jsts.operation.buffer.BufferParameters();};jsts.operation.buffer.BufferOp.MAX_PRECISION_DIGITS=12;jsts.operation.buffer.BufferOp.precisionScaleFactor=function(g,distance,maxPrecisionDigits){var env=g.getEnvelopeInternal();var envSize=Math.max(env.getHeight(),env.getWidth());var expandByDistance=distance>0.0?distance:0.0;var bufEnvSize=envSize+2*expandByDistance;var bufEnvLog10=(Math.log(bufEnvSize)/Math.log(10)+1.0);var minUnitLog10=bufEnvLog10-maxPrecisionDigits;var scaleFactor=Math.pow(10.0,-minUnitLog10);return scaleFactor;};jsts.operation.buffer.BufferOp.bufferOp=function(g,distance){if(arguments.length>2){return jsts.operation.buffer.BufferOp.bufferOp2.apply(this,arguments);}
var gBuf=new jsts.operation.buffer.BufferOp(g);var geomBuf=gBuf.getResultGeometry(distance);return geomBuf;};jsts.operation.buffer.BufferOp.bufferOp2=function(g,distance,params){if(arguments.length>3){return jsts.operation.buffer.BufferOp.bufferOp3.apply(this,arguments);}
var bufOp=new jsts.operation.buffer.BufferOp(g,params);var geomBuf=bufOp.getResultGeometry(distance);return geomBuf;};jsts.operation.buffer.BufferOp.bufferOp3=function(g,distance,quadrantSegments){if(arguments.length>4){return jsts.operation.buffer.BufferOp.bufferOp4.apply(this,arguments);}
var bufOp=new jsts.operation.buffer.BufferOp(g);bufOp.setQuadrantSegments(quadrantSegments);var geomBuf=bufOp.getResultGeometry(distance);return geomBuf;};jsts.operation.buffer.BufferOp.bufferOp4=function(g,distance,quadrantSegments,endCapStyle){var bufOp=new jsts.operation.buffer.BufferOp(g);bufOp.setQuadrantSegments(quadrantSegments);bufOp.setEndCapStyle(endCapStyle);var geomBuf=bufOp.getResultGeometry(distance);return geomBuf;};jsts.operation.buffer.BufferOp.prototype.argGeom=null;jsts.operation.buffer.BufferOp.prototype.distance=null;jsts.operation.buffer.BufferOp.prototype.bufParams=null;jsts.operation.buffer.BufferOp.prototype.resultGeometry=null;jsts.operation.buffer.BufferOp.prototype.setEndCapStyle=function(endCapStyle){this.bufParams.setEndCapStyle(endCapStyle);};jsts.operation.buffer.BufferOp.prototype.setQuadrantSegments=function(quadrantSegments){this.bufParams.setQuadrantSegments(quadrantSegments);};jsts.operation.buffer.BufferOp.prototype.getResultGeometry=function(dist){this.distance=dist;this.computeGeometry();return this.resultGeometry;};jsts.operation.buffer.BufferOp.prototype.computeGeometry=function(){this.bufferOriginalPrecision();if(this.resultGeometry!==null){return;}
var argPM=this.argGeom.getPrecisionModel();if(argPM.getType()===jsts.geom.PrecisionModel.FIXED){this.bufferFixedPrecision(argPM);}else{this.bufferReducedPrecision();}};jsts.operation.buffer.BufferOp.prototype.bufferReducedPrecision=function(){var precDigits;var saveException=null;for(precDigits=jsts.operation.buffer.BufferOp.MAX_PRECISION_DIGITS;precDigits>=0;precDigits--){try{this.bufferReducedPrecision2(precDigits);}catch(ex){saveException=ex;}
if(this.resultGeometry!==null){return;}}
throw saveException;};jsts.operation.buffer.BufferOp.prototype.bufferOriginalPrecision=function(){try{var bufBuilder=new jsts.operation.buffer.BufferBuilder(this.bufParams);this.resultGeometry=bufBuilder.buffer(this.argGeom,this.distance);}catch(e){}};jsts.operation.buffer.BufferOp.prototype.bufferReducedPrecision2=function(precisionDigits){var sizeBasedScaleFactor=jsts.operation.buffer.BufferOp.precisionScaleFactor(this.argGeom,this.distance,precisionDigits);var fixedPM=new jsts.geom.PrecisionModel(sizeBasedScaleFactor);this.bufferFixedPrecision(fixedPM);};jsts.operation.buffer.BufferOp.prototype.bufferFixedPrecision=function(fixedPM){var noder=new jsts.noding.ScaledNoder(new jsts.noding.snapround.MCIndexSnapRounder(new jsts.geom.PrecisionModel(1.0)),fixedPM.getScale());var bufBuilder=new jsts.operation.buffer.BufferBuilder(this.bufParams);bufBuilder.setWorkingPrecisionModel(fixedPM);bufBuilder.setNoder(noder);this.resultGeometry=bufBuilder.buffer(this.argGeom,this.distance);};(function(){var Location=jsts.geom.Location;var Position=jsts.geomgraph.Position;var Assert=jsts.util.Assert;jsts.geomgraph.GeometryGraph=function(argIndex,parentGeom,boundaryNodeRule){jsts.geomgraph.PlanarGraph.call(this);this.lineEdgeMap=new javascript.util.HashMap();this.ptLocator=new jsts.algorithm.PointLocator();this.argIndex=argIndex;this.parentGeom=parentGeom;this.boundaryNodeRule=boundaryNodeRule||jsts.algorithm.BoundaryNodeRule.OGC_SFS_BOUNDARY_RULE;if(parentGeom!==null){this.add(parentGeom);}};jsts.geomgraph.GeometryGraph.prototype=new jsts.geomgraph.PlanarGraph();jsts.geomgraph.GeometryGraph.constructor=jsts.geomgraph.GeometryGraph;jsts.geomgraph.GeometryGraph.prototype.createEdgeSetIntersector=function(){return new jsts.geomgraph.index.SimpleMCSweepLineIntersector();};jsts.geomgraph.GeometryGraph.determineBoundary=function(boundaryNodeRule,boundaryCount){return boundaryNodeRule.isInBoundary(boundaryCount)?Location.BOUNDARY:Location.INTERIOR;};jsts.geomgraph.GeometryGraph.prototype.parentGeom=null;jsts.geomgraph.GeometryGraph.prototype.lineEdgeMap=null;jsts.geomgraph.GeometryGraph.prototype.boundaryNodeRule=null;jsts.geomgraph.GeometryGraph.prototype.useBoundaryDeterminationRule=true;jsts.geomgraph.GeometryGraph.prototype.argIndex=null;jsts.geomgraph.GeometryGraph.prototype.boundaryNodes=null;jsts.geomgraph.GeometryGraph.prototype.hasTooFewPoints=false;jsts.geomgraph.GeometryGraph.prototype.invalidPoint=null;jsts.geomgraph.GeometryGraph.prototype.areaPtLocator=null;jsts.geomgraph.GeometryGraph.prototype.ptLocator=null;jsts.geomgraph.GeometryGraph.prototype.getGeometry=function(){return this.parentGeom;};jsts.geomgraph.GeometryGraph.prototype.getBoundaryNodes=function(){if(this.boundaryNodes===null)
this.boundaryNodes=this.nodes.getBoundaryNodes(this.argIndex);return this.boundaryNodes;};jsts.geomgraph.GeometryGraph.prototype.getBoundaryNodeRule=function(){return this.boundaryNodeRule;};jsts.geomgraph.GeometryGraph.prototype.findEdge=function(line){return this.lineEdgeMap.get(line);};jsts.geomgraph.GeometryGraph.prototype.computeSplitEdges=function(edgelist){for(var i=this.edges.iterator();i.hasNext();){var e=i.next();e.eiList.addSplitEdges(edgelist);}}
jsts.geomgraph.GeometryGraph.prototype.add=function(g){if(g.isEmpty()){return;}
if(g instanceof jsts.geom.MultiPolygon)
this.useBoundaryDeterminationRule=false;if(g instanceof jsts.geom.Polygon)
this.addPolygon(g);else if(g instanceof jsts.geom.LineString)
this.addLineString(g);else if(g instanceof jsts.geom.Point)
this.addPoint(g);else if(g instanceof jsts.geom.MultiPoint)
this.addCollection(g);else if(g instanceof jsts.geom.MultiLineString)
this.addCollection(g);else if(g instanceof jsts.geom.MultiPolygon)
this.addCollection(g);else if(g instanceof jsts.geom.GeometryCollection)
this.addCollection(g);else
throw new jsts.error.IllegalArgumentError('Geometry type not supported.');};jsts.geomgraph.GeometryGraph.prototype.addCollection=function(gc){for(var i=0;i<gc.getNumGeometries();i++){var g=gc.getGeometryN(i);this.add(g);}};jsts.geomgraph.GeometryGraph.prototype.addEdge=function(e){this.insertEdge(e);var coord=e.getCoordinates();this.insertPoint(this.argIndex,coord[0],Location.BOUNDARY);this.insertPoint(this.argIndex,coord[coord.length-1],Location.BOUNDARY);};jsts.geomgraph.GeometryGraph.prototype.addPoint=function(p){var coord=p.getCoordinate();this.insertPoint(this.argIndex,coord,Location.INTERIOR);};jsts.geomgraph.GeometryGraph.prototype.addLineString=function(line){var coord=jsts.geom.CoordinateArrays.removeRepeatedPoints(line.getCoordinates());if(coord.length<2){this.hasTooFewPoints=true;this.invalidPoint=coords[0];return;}
var e=new jsts.geomgraph.Edge(coord,new jsts.geomgraph.Label(this.argIndex,Location.INTERIOR));this.lineEdgeMap.put(line,e);this.insertEdge(e);Assert.isTrue(coord.length>=2,'found LineString with single point');this.insertBoundaryPoint(this.argIndex,coord[0]);this.insertBoundaryPoint(this.argIndex,coord[coord.length-1]);};jsts.geomgraph.GeometryGraph.prototype.addPolygonRing=function(lr,cwLeft,cwRight){if(lr.isEmpty())
return;var coord=jsts.geom.CoordinateArrays.removeRepeatedPoints(lr.getCoordinates());if(coord.length<4){this.hasTooFewPoints=true;this.invalidPoint=coord[0];return;}
var left=cwLeft;var right=cwRight;if(jsts.algorithm.CGAlgorithms.isCCW(coord)){left=cwRight;right=cwLeft;}
var e=new jsts.geomgraph.Edge(coord,new jsts.geomgraph.Label(this.argIndex,Location.BOUNDARY,left,right));this.lineEdgeMap.put(lr,e);this.insertEdge(e);this.insertPoint(this.argIndex,coord[0],Location.BOUNDARY);};jsts.geomgraph.GeometryGraph.prototype.addPolygon=function(p){this.addPolygonRing(p.getExteriorRing(),Location.EXTERIOR,Location.INTERIOR);for(var i=0;i<p.getNumInteriorRing();i++){var hole=p.getInteriorRingN(i);this.addPolygonRing(hole,Location.INTERIOR,Location.EXTERIOR);}};jsts.geomgraph.GeometryGraph.prototype.computeEdgeIntersections=function(g,li,includeProper){var si=new jsts.geomgraph.index.SegmentIntersector(li,includeProper,true);si.setBoundaryNodes(this.getBoundaryNodes(),g.getBoundaryNodes());var esi=this.createEdgeSetIntersector();esi.computeIntersections(this.edges,g.edges,si);return si;};jsts.geomgraph.GeometryGraph.prototype.computeSelfNodes=function(li,computeRingSelfNodes){var si=new jsts.geomgraph.index.SegmentIntersector(li,true,false);var esi=this.createEdgeSetIntersector();if(!computeRingSelfNodes&&(this.parentGeom instanceof jsts.geom.LinearRing||this.parentGeom instanceof jsts.geom.Polygon||this.parentGeom instanceof jsts.geom.MultiPolygon)){esi.computeIntersections(this.edges,si,false);}else{esi.computeIntersections(this.edges,si,true);}
this.addSelfIntersectionNodes(this.argIndex);return si;};jsts.geomgraph.GeometryGraph.prototype.insertPoint=function(argIndex,coord,onLocation){var n=this.nodes.addNode(coord);var lbl=n.getLabel();if(lbl==null){n.label=new jsts.geomgraph.Label(argIndex,onLocation);}else
lbl.setLocation(argIndex,onLocation);};jsts.geomgraph.GeometryGraph.prototype.insertBoundaryPoint=function(argIndex,coord){var n=this.nodes.addNode(coord);var lbl=n.getLabel();var boundaryCount=1;var loc=Location.NONE;if(lbl!==null)
loc=lbl.getLocation(argIndex,Position.ON);if(loc===Location.BOUNDARY)
boundaryCount++;var newLoc=jsts.geomgraph.GeometryGraph.determineBoundary(this.boundaryNodeRule,boundaryCount);lbl.setLocation(argIndex,newLoc);};jsts.geomgraph.GeometryGraph.prototype.addSelfIntersectionNodes=function(argIndex){for(var i=this.edges.iterator();i.hasNext();){var e=i.next();var eLoc=e.getLabel().getLocation(argIndex);for(var eiIt=e.eiList.iterator();eiIt.hasNext();){var ei=eiIt.next();this.addSelfIntersectionNode(argIndex,ei.coord,eLoc);}}};jsts.geomgraph.GeometryGraph.prototype.addSelfIntersectionNode=function(argIndex,coord,loc){if(this.isBoundaryNode(argIndex,coord))
return;if(loc===Location.BOUNDARY&&this.useBoundaryDeterminationRule)
this.insertBoundaryPoint(argIndex,coord);else
this.insertPoint(argIndex,coord,loc);};jsts.geomgraph.GeometryGraph.prototype.getInvalidPoint=function(){return this.invalidPoint;};})();jsts.operation.buffer.OffsetSegmentString=function(){this.ptList=[];};jsts.operation.buffer.OffsetSegmentString.prototype.ptList=null;jsts.operation.buffer.OffsetSegmentString.prototype.precisionModel=null;jsts.operation.buffer.OffsetSegmentString.prototype.minimimVertexDistance=0.0;jsts.operation.buffer.OffsetSegmentString.prototype.setPrecisionModel=function(precisionModel){this.precisionModel=precisionModel;};jsts.operation.buffer.OffsetSegmentString.prototype.setMinimumVertexDistance=function(minimimVertexDistance){this.minimimVertexDistance=minimimVertexDistance;};jsts.operation.buffer.OffsetSegmentString.prototype.addPt=function(pt){var bufPt=new jsts.geom.Coordinate(pt);this.precisionModel.makePrecise(bufPt);if(this.isRedundant(bufPt))
return;this.ptList.push(bufPt);};jsts.operation.buffer.OffsetSegmentString.prototype.addPts=function(pt,isForward){if(isForward){for(var i=0;i<pt.length;i++){this.addPt(pt[i]);}}else{for(var i=pt.length-1;i>=0;i--){this.addPt(pt[i]);}}};jsts.operation.buffer.OffsetSegmentString.prototype.isRedundant=function(pt){if(this.ptList.length<1)
return false;var lastPt=this.ptList[this.ptList.length-1];var ptDist=pt.distance(lastPt);if(ptDist<this.minimimVertexDistance)
return true;return false;};jsts.operation.buffer.OffsetSegmentString.prototype.closeRing=function(){if(this.ptList.length<1)
return;var startPt=new jsts.geom.Coordinate(this.ptList[0]);var lastPt=this.ptList[this.ptList.length-1];var last2Pt=null;if(this.ptList.length>=2)
last2Pt=this.ptList[this.ptList.length-2];if(startPt.equals(lastPt))
return;this.ptList.push(startPt);};jsts.operation.buffer.OffsetSegmentString.prototype.reverse=function(){};jsts.operation.buffer.OffsetSegmentString.prototype.getCoordinates=function(){return this.ptList;};jsts.algorithm.distance.PointPairDistance=function(){this.pt=[new jsts.geom.Coordinate(),new jsts.geom.Coordinate()];};jsts.algorithm.distance.PointPairDistance.prototype.pt=null;jsts.algorithm.distance.PointPairDistance.prototype.distance=NaN;jsts.algorithm.distance.PointPairDistance.prototype.isNull=true;jsts.algorithm.distance.PointPairDistance.prototype.initialize=function(p0,p1,distance){if(p0===undefined){this.isNull=true;return;}
this.pt[0].setCoordinate(p0);this.pt[1].setCoordinate(p1);this.distance=distance!==undefined?distance:p0.distance(p1);this.isNull=false;};jsts.algorithm.distance.PointPairDistance.prototype.getDistance=function(){return this.distance;};jsts.algorithm.distance.PointPairDistance.prototype.getCoordinates=function(){return this.pt;};jsts.algorithm.distance.PointPairDistance.prototype.getCoordinate=function(i){return this.pt[i];};jsts.algorithm.distance.PointPairDistance.prototype.setMaximum=function(ptDist){if(arguments.length===2){this.setMaximum2.apply(this,arguments);return;}
this.setMaximum(ptDist.pt[0],ptDist.pt[1]);};jsts.algorithm.distance.PointPairDistance.prototype.setMaximum2=function(p0,p1){if(this.isNull){this.initialize(p0,p1);return;}
var dist=p0.distance(p1);if(dist>this.distance)
this.initialize(p0,p1,dist);};jsts.algorithm.distance.PointPairDistance.prototype.setMinimum=function(ptDist){if(arguments.length===2){this.setMinimum2.apply(this,arguments);return;}
this.setMinimum(ptDist.pt[0],ptDist.pt[1]);};jsts.algorithm.distance.PointPairDistance.prototype.setMinimum2=function(p0,p1){if(this.isNull){this.initialize(p0,p1);return;}
var dist=p0.distance(p1);if(dist<this.distance)
this.initialize(p0,p1,dist);};(function(){var PointPairDistance=jsts.algorithm.distance.PointPairDistance;var DistanceToPoint=jsts.algorithm.distance.DistanceToPoint;var MaxPointDistanceFilter=function(geom){this.maxPtDist=new PointPairDistance();this.minPtDist=new PointPairDistance();this.euclideanDist=new DistanceToPoint();this.geom=geom;};MaxPointDistanceFilter.prototype=new jsts.geom.CoordinateFilter();MaxPointDistanceFilter.prototype.maxPtDist=new PointPairDistance();MaxPointDistanceFilter.prototype.minPtDist=new PointPairDistance();MaxPointDistanceFilter.prototype.euclideanDist=new DistanceToPoint();MaxPointDistanceFilter.prototype.geom;MaxPointDistanceFilter.prototype.filter=function(pt){this.minPtDist.initialize();DistanceToPoint.computeDistance(this.geom,pt,this.minPtDist);this.maxPtDist.setMaximum(this.minPtDist);};MaxPointDistanceFilter.prototype.getMaxPointDistance=function(){return this.maxPtDist;};var MaxDensifiedByFractionDistanceFilter=function(geom,fraction){this.maxPtDist=new PointPairDistance();this.minPtDist=new PointPairDistance();this.geom=geom;this.numSubSegs=Math.round(1.0/fraction);};MaxDensifiedByFractionDistanceFilter.prototype=new jsts.geom.CoordinateSequenceFilter();MaxDensifiedByFractionDistanceFilter.prototype.maxPtDist=new PointPairDistance();MaxDensifiedByFractionDistanceFilter.prototype.minPtDist=new PointPairDistance();MaxDensifiedByFractionDistanceFilter.prototype.geom;MaxDensifiedByFractionDistanceFilter.prototype.numSubSegs=0;MaxDensifiedByFractionDistanceFilter.prototype.filter=function(seq,index){if(index==0)
return;var p0=seq[index-1];var p1=seq[index];var delx=(p1.x-p0.x)/this.numSubSegs;var dely=(p1.y-p0.y)/this.numSubSegs;for(var i=0;i<this.numSubSegs;i++){var x=p0.x+i*delx;var y=p0.y+i*dely;var pt=new jsts.geom.Coordinate(x,y);this.minPtDist.initialize();DistanceToPoint.computeDistance(this.geom,pt,this.minPtDist);this.maxPtDist.setMaximum(this.minPtDist);}};MaxDensifiedByFractionDistanceFilter.prototype.isGeometryChanged=function(){return false;};MaxDensifiedByFractionDistanceFilter.prototype.isDone=function(){return false;};MaxDensifiedByFractionDistanceFilter.prototype.getMaxPointDistance=function(){return this.maxPtDist;};jsts.algorithm.distance.DiscreteHausdorffDistance=function(g0,g1){this.g0=g0;this.g1=g1;this.ptDist=new jsts.algorithm.distance.PointPairDistance();};jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.g0=null;jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.g1=null;jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.ptDist=null;jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.densifyFrac=0.0;jsts.algorithm.distance.DiscreteHausdorffDistance.distance=function(g0,g1,densifyFrac){var dist=new jsts.algorithm.distance.DiscreteHausdorffDistance(g0,g1);if(densifyFrac!==undefined)
dist.setDensifyFraction(densifyFrac);return dist.distance();};jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.setDensifyFraction=function(densifyFrac){if(densifyFrac>1.0||densifyFrac<=0.0)
throw new jsts.error.IllegalArgumentError('Fraction is not in range (0.0 - 1.0]');this.densifyFrac=densifyFrac;};jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.distance=function(){this.compute(this.g0,this.g1);return ptDist.getDistance();};jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.orientedDistance=function(){this.computeOrientedDistance(this.g0,this.g1,this.ptDist);return this.ptDist.getDistance();};jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.getCoordinates=function(){return ptDist.getCoordinates();};jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.compute=function(g0,g1){this.computeOrientedDistance(g0,g1,this.ptDist);this.computeOrientedDistance(g1,g0,this.ptDist);};jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.computeOrientedDistance=function(discreteGeom,geom,ptDist){var distFilter=new MaxPointDistanceFilter(geom);discreteGeom.apply(distFilter);ptDist.setMaximum(distFilter.getMaxPointDistance());if(this.densifyFrac>0){var fracFilter=new MaxDensifiedByFractionDistanceFilter(geom,this.densifyFrac);discreteGeom.apply(fracFilter);ptDist.setMaximum(fracFilter.getMaxPointDistance());}};})();jsts.algorithm.MinimumBoundingCircle=function(geom){this.input=null;this.extremalPts=null;this.centre=null;this.radius=0;this.input=geom;};jsts.algorithm.MinimumBoundingCircle.prototype.getCircle=function(){this.compute();if(this.centre===null){return this.input.getFactory().createPolygon(null,null);}
var centrePoint=this.input.getFactory().createPoint(this.centre);if(this.radius===0){return centrePoint;}
return centrePoint.buffer(this.radius);};jsts.algorithm.MinimumBoundingCircle.prototype.getExtremalPoints=function(){this.compute();return this.extremalPts;};jsts.algorithm.MinimumBoundingCircle.prototype.getCentre=function(){this.compute();return this.centre;};jsts.algorithm.MinimumBoundingCircle.prototype.getRadius=function(){this.compute();return this.radius;};jsts.algorithm.MinimumBoundingCircle.prototype.computeCentre=function(){switch(this.extremalPts.length){case 0:this.centre=null;break;case 1:this.centre=this.extremalPts[0];break;case 2:this.centre=new jsts.geom.Coordinate((this.extremalPts[0].x+this.extremalPts[1].x)/2,(this.extremalPts[0].y+this.extremalPts[1].y)/2);break;case 3:this.centre=jsts.geom.Triangle.circumcentre(this.extremalPts[0],this.extremalPts[1],this.extremalPts[2]);break;}};jsts.algorithm.MinimumBoundingCircle.prototype.compute=function(){if(this.extremalPts!==null){return;}
this.computeCirclePoints();this.computeCentre();if(this.centre!==null){this.radius=this.centre.distance(this.extremalPts[0]);}};jsts.algorithm.MinimumBoundingCircle.prototype.computeCirclePoints=function(){if(this.input.isEmpty()){this.extremalPts=[];return;}
var pts;if(this.input.getNumPoints()===1){pts=this.input.getCoordinates();this.extremalPts=[new jsts.geom.Coordinate(pts[0])];return;}
var convexHull=this.input.convexHull();var hullPts=convexHull.getCoordinates();pts=hullPts;if(hullPts[0].equals2D(hullPts[hullPts.length-1])){pts=[];jsts.geom.CoordinateArrays.copyDeep(hullPts,0,pts,0,hullPts.length-1);}
if(pts.length<=2){this.extremalPts=jsts.geom.CoordinateArrays.copyDeep(pts);return;}
var P=jsts.algorithm.MinimumBoundingCircle.lowestPoint(pts);var Q=jsts.algorithm.MinimumBoundingCircle.pointWitMinAngleWithX(pts,P);for(var i=0;i<pts.length;i++){var R=jsts.algorithm.MinimumBoundingCircle.pointWithMinAngleWithSegment(pts,P,Q);if(jsts.algorithm.Angle.isObtuse(P,R,Q)){this.extremalPts=[new jsts.geom.Coordinate(P),new jsts.geom.Coordinate(Q)];return;}
if(jsts.algorithm.Angle.isObtuse(R,P,Q)){P=R;continue;}
if(jsts.algorithm.Angle.isObtuse(R,Q,P)){Q=R;continue;}
this.extremalPts=[new jsts.geom.Coordinate(P),new jsts.geom.Coordinate(Q),new jsts.geom.Coordinate(R)];return;}
throw new Error("Logic failure in Minimum Bounding Circle algorithm!");};jsts.algorithm.MinimumBoundingCircle.lowestPoint=function(pts){var min=pts[0];for(var i=1;i<pts.length;i++){if(pts[i].y<min.y){min=pts[i];}}
return min;};jsts.algorithm.MinimumBoundingCircle.pointWitMinAngleWithX=function(pts,P){var minSin=Number.MAX_VALUE;var minAngPt=null;for(var i=0;i<pts.length;i++){var p=pts[i];if(p===P)continue;var dx=p.x-P.x;var dy=p.y-P.y;if(dy<0)dy=-dy;var len=Math.sqrt(dx*dx+dy*dy);var sin=dy/len;if(sin<minSin){minSin=sin;minAngPt=p;}}
return minAngPt;};jsts.algorithm.MinimumBoundingCircle.pointWithMinAngleWithSegment=function(pts,P,Q){var minAng=Number.MAX_VALUE;var minAngPt=null;for(var i=0;i<pts.length;i++){var p=pts[i];if(p===P)continue;if(p===Q)continue;var ang=jsts.algorithm.Angle.angleBetween(P,p,Q);if(ang<minAng){minAng=ang;minAngPt=p;}}
return minAngPt;};jsts.noding.ScaledNoder=function(noder,scaleFactor,offsetX,offsetY){this.offsetX=offsetX?offsetX:0;this.offsetY=offsetY?offsetY:0;this.noder=noder;this.scaleFactor=scaleFactor;this.isScaled=!this.isIntegerPrecision();};jsts.noding.ScaledNoder.prototype=new jsts.noding.Noder();jsts.noding.ScaledNoder.constructor=jsts.noding.ScaledNoder;jsts.noding.ScaledNoder.prototype.noder=null;jsts.noding.ScaledNoder.prototype.scaleFactor=undefined;jsts.noding.ScaledNoder.prototype.offsetX=undefined;jsts.noding.ScaledNoder.prototype.offsetY=undefined;jsts.noding.ScaledNoder.prototype.isScaled=false;jsts.noding.ScaledNoder.prototype.isIntegerPrecision=function(){return this.scaleFactor===1.0;};jsts.noding.ScaledNoder.prototype.getNodedSubstrings=function(){var splitSS=this.noder.getNodedSubstrings();if(this.isScaled)
this.rescale(splitSS);return splitSS;};jsts.noding.ScaledNoder.prototype.computeNodes=function(inputSegStrings){var intSegStrings=inputSegStrings;if(this.isScaled)
intSegStrings=this.scale(inputSegStrings);this.noder.computeNodes(intSegStrings);};jsts.noding.ScaledNoder.prototype.scale=function(segStrings){if(segStrings instanceof Array){return this.scale2(segStrings);}
var transformed=new javascript.util.ArrayList();for(var i=segStrings.iterator();i.hasNext();){var ss=i.next();transformed.add(new jsts.noding.NodedSegmentString(this.scale(ss.getCoordinates()),ss.getData()));}
return transformed;};jsts.noding.ScaledNoder.prototype.scale2=function(pts){var roundPts=[];for(var i=0;i<pts.length;i++){roundPts[i]=new jsts.geom.Coordinate(Math.round((pts[i].x-this.offsetX)*this.scaleFactor),Math.round((pts[i].y-this.offsetY)*this.scaleFactor));}
var roundPtsNoDup=jsts.geom.CoordinateArrays.removeRepeatedPoints(roundPts);return roundPtsNoDup;};jsts.noding.ScaledNoder.prototype.rescale=function(segStrings){if(segStrings instanceof Array){this.rescale2(segStrings);return;}
for(var i=segStrings.iterator();i.hasNext();){var ss=i.next();this.rescale(ss.getCoordinates());}};jsts.noding.ScaledNoder.prototype.rescale2=function(pts){for(var i=0;i<pts.length;i++){pts[i].x=pts[i].x/this.scaleFactor+this.offsetX;pts[i].y=pts[i].y/this.scaleFactor+this.offsetY;}};(function(){var ArrayList=javascript.util.ArrayList;jsts.geomgraph.index.SegmentIntersector=function(li,includeProper,recordIsolated){this.li=li;this.includeProper=includeProper;this.recordIsolated=recordIsolated;};jsts.geomgraph.index.SegmentIntersector.isAdjacentSegments=function(i1,i2){return Math.abs(i1-i2)===1;};jsts.geomgraph.index.SegmentIntersector.prototype._hasIntersection=false;jsts.geomgraph.index.SegmentIntersector.prototype.hasProper=false;jsts.geomgraph.index.SegmentIntersector.prototype.hasProperInterior=false;jsts.geomgraph.index.SegmentIntersector.prototype.properIntersectionPoint=null;jsts.geomgraph.index.SegmentIntersector.prototype.li=null;jsts.geomgraph.index.SegmentIntersector.prototype.includeProper=null;jsts.geomgraph.index.SegmentIntersector.prototype.recordIsolated=null;jsts.geomgraph.index.SegmentIntersector.prototype.isSelfIntersection=null;jsts.geomgraph.index.SegmentIntersector.prototype.numIntersections=0;jsts.geomgraph.index.SegmentIntersector.prototype.numTests=0;jsts.geomgraph.index.SegmentIntersector.prototype.bdyNodes=null;jsts.geomgraph.index.SegmentIntersector.prototype.setBoundaryNodes=function(bdyNodes0,bdyNodes1){this.bdyNodes=[];this.bdyNodes[0]=bdyNodes0;this.bdyNodes[1]=bdyNodes1;};jsts.geomgraph.index.SegmentIntersector.prototype.getProperIntersectionPoint=function(){return this.properIntersectionPoint;};jsts.geomgraph.index.SegmentIntersector.prototype.hasIntersection=function(){return this._hasIntersection;};jsts.geomgraph.index.SegmentIntersector.prototype.hasProperIntersection=function(){return this.hasProper;};jsts.geomgraph.index.SegmentIntersector.prototype.hasProperInteriorIntersection=function(){return this.hasProperInterior;};jsts.geomgraph.index.SegmentIntersector.prototype.isTrivialIntersection=function(e0,segIndex0,e1,segIndex1){if(e0===e1){if(this.li.getIntersectionNum()===1){if(jsts.geomgraph.index.SegmentIntersector.isAdjacentSegments(segIndex0,segIndex1))
return true;if(e0.isClosed()){var maxSegIndex=e0.getNumPoints()-1;if((segIndex0===0&&segIndex1===maxSegIndex)||(segIndex1===0&&segIndex0===maxSegIndex)){return true;}}}}
return false;};jsts.geomgraph.index.SegmentIntersector.prototype.addIntersections=function(e0,segIndex0,e1,segIndex1){if(e0===e1&&segIndex0===segIndex1)
return;this.numTests++;var p00=e0.getCoordinates()[segIndex0];var p01=e0.getCoordinates()[segIndex0+1];var p10=e1.getCoordinates()[segIndex1];var p11=e1.getCoordinates()[segIndex1+1];this.li.computeIntersection(p00,p01,p10,p11);if(this.li.hasIntersection()){if(this.recordIsolated){e0.setIsolated(false);e1.setIsolated(false);}
this.numIntersections++;if(!this.isTrivialIntersection(e0,segIndex0,e1,segIndex1)){this._hasIntersection=true;if(this.includeProper||!this.li.isProper()){e0.addIntersections(this.li,segIndex0,0);e1.addIntersections(this.li,segIndex1,1);}
if(this.li.isProper()){this.properIntersectionPoint=this.li.getIntersection(0).clone();this.hasProper=true;if(!this.isBoundaryPoint(this.li,this.bdyNodes))
this.hasProperInterior=true;}}}};jsts.geomgraph.index.SegmentIntersector.prototype.isBoundaryPoint=function(li,bdyNodes){if(bdyNodes===null)
return false;if(bdyNodes instanceof Array){if(this.isBoundaryPoint(li,bdyNodes[0]))
return true;if(this.isBoundaryPoint(li,bdyNodes[1]))
return true;return false;}else{for(var i=bdyNodes.iterator();i.hasNext();){var node=i.next();var pt=node.getCoordinate();if(li.isIntersection(pt))
return true;}
return false;}};})();
},{}],32:[function(require,module,exports){
/*
  javascript.util is a port of selected parts of java.util to JavaScript which
  main purpose is to ease porting Java code to JavaScript.
  
  The MIT License (MIT)

  Copyright (C) 2011,2012 by The Authors

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/

javascript={util:{}};if(typeof module!=='undefined'){module.exports=javascript;}
(function(){function EmptyStackException(message){this.message=message||'';};EmptyStackException.prototype=new Error();EmptyStackException.prototype.name='EmptyStackException';javascript.util.EmptyStackException=EmptyStackException;})();(function(){function IndexOutOfBoundsException(message){this.message=message||'';};IndexOutOfBoundsException.prototype=new Error();IndexOutOfBoundsException.prototype.name='IndexOutOfBoundsException';javascript.util.IndexOutOfBoundsException=IndexOutOfBoundsException;})();(function(){function NoSuchElementException(message){this.message=message||'';};NoSuchElementException.prototype=new Error();NoSuchElementException.prototype.name='NoSuchElementException';javascript.util.NoSuchElementException=NoSuchElementException;})();(function(){function OperationNotSupported(message){this.message=message||'';};OperationNotSupported.prototype=new Error();OperationNotSupported.prototype.name='OperationNotSupported';javascript.util.OperationNotSupported=OperationNotSupported;})();(function(){function Map(){};Map.prototype.get=function(key){};Map.prototype.put=function(key,value){};Map.prototype.size=function(){};Map.prototype.values=function(){};javascript.util.Map=Map;})();(function(){var Map=javascript.util.Map;function SortedMap(){};SortedMap.prototype=new Map;javascript.util.SortedMap=SortedMap;})();(function(){function Arrays(){};Arrays.sort=function(){var a=arguments[0],i,t,comparator,compare;if(arguments.length===1){a.sort();return;}else if(arguments.length===2){comparator=arguments[1];compare=function(a,b){return comparator['compare'](a,b);};a.sort(compare);}else if(arguments.length===3){t=a.slice(arguments[1],arguments[2]);t.sort();var r=a.slice(0,arguments[1]).concat(t,a.slice(arguments[2],a.length));a.splice(0,a.length);for(i=0;i<r.length;i++){a.push(r[i]);}
return;}else if(arguments.length===4){t=a.slice(arguments[1],arguments[2]);comparator=arguments[3];compare=function(a,b){return comparator['compare'](a,b);};t.sort(compare);r=a.slice(0,arguments[1]).concat(t,a.slice(arguments[2],a.length));a.splice(0,a.length);for(i=0;i<r.length;i++){a.push(r[i]);}
return;}};Arrays.asList=function(array){var arrayList=new javascript.util.ArrayList();for(var i=0,len=array.length;i<len;i++){arrayList.add(array[i]);}
return arrayList;};javascript.util.Arrays=Arrays;})();(function(){function Iterator(){};Iterator.prototype.hasNext=function(){};Iterator.prototype.next=function(){};Iterator.prototype.remove=function(){};javascript.util.Iterator=Iterator;})();(function(){var Iterator=javascript.util.Iterator;function Collection(){};Collection.prototype.add=function(o){};Collection.prototype.addAll=function(c){};Collection.prototype.isEmpty=function(){};Collection.prototype.iterator=function(){};Collection.prototype.size=function(){};Collection.prototype.toArray=function(){};Collection.prototype.remove=function(o){};javascript.util.Collection=Collection;})();(function(){var Collection=javascript.util.Collection;function List(){};List.prototype=new Collection;List.prototype.get=function(index){};List.prototype.set=function(index,element){};List.prototype.isEmpty=function(){};javascript.util.List=List;})();(function(){var Collection=javascript.util.Collection;var List=javascript.util.List;var OperationNotSupported=javascript.util.OperationNotSupported;var NoSuchElementException=javascript.util.NoSuchElementException;var IndexOutOfBoundsException=javascript.util.IndexOutOfBoundsException;function ArrayList(){this.array=[];if(arguments[0]instanceof Collection){this.addAll(arguments[0]);}};ArrayList.prototype=new List;ArrayList.prototype.array=null;ArrayList.prototype.add=function(e){this.array.push(e);return true;};ArrayList.prototype.addAll=function(c){for(var i=c.iterator();i.hasNext();){this.add(i.next());}
return true;};ArrayList.prototype.set=function(index,element){var oldElement=this.array[index];this.array[index]=element;return oldElement;};ArrayList.prototype.iterator=function(){return new ArrayList.Iterator(this);};ArrayList.prototype.get=function(index){if(index<0||index>=this.size()){throw new IndexOutOfBoundsException();}
return this.array[index];};ArrayList.prototype.isEmpty=function(){return this.array.length===0;};ArrayList.prototype.size=function(){return this.array.length;};ArrayList.prototype.toArray=function(){var array=[];for(var i=0,len=this.array.length;i<len;i++){array.push(this.array[i]);}
return array;};ArrayList.prototype.remove=function(o){var found=false;for(var i=0,len=this.array.length;i<len;i++){if(this.array[i]===o){this.array.splice(i,1);found=true;break;}}
return found;};ArrayList.Iterator=function(arrayList){this.arrayList=arrayList;};ArrayList.Iterator.prototype.arrayList=null;ArrayList.Iterator.prototype.position=0;ArrayList.Iterator.prototype.next=function(){if(this.position===this.arrayList.size()){throw new NoSuchElementException();}
return this.arrayList.get(this.position++);};ArrayList.Iterator.prototype.hasNext=function(){if(this.position<this.arrayList.size()){return true;}
return false;};ArrayList.Iterator.prototype.remove=function(){throw new OperationNotSupported();};javascript.util.ArrayList=ArrayList;})();(function(){var Map=javascript.util.Map;var ArrayList=javascript.util.ArrayList;function HashMap(){this.object={};};HashMap.prototype=new Map;HashMap.prototype.object=null;HashMap.prototype.get=function(key){return this.object[key]||null;};HashMap.prototype.put=function(key,value){this.object[key]=value;return value;};HashMap.prototype.values=function(){var arrayList=new javascript.util.ArrayList();for(var key in this.object){if(this.object.hasOwnProperty(key)){arrayList.add(this.object[key]);}}
return arrayList;};HashMap.prototype.size=function(){return this.values().size();};javascript.util.HashMap=HashMap;})();(function(){var Collection=javascript.util.Collection;function Set(){};Set.prototype=new Collection;Set.prototype.contains=function(o){};javascript.util.Set=Set;})();(function(){var Set=javascript.util.Set;function SortedSet(){};SortedSet.prototype=new Set;javascript.util.SortedSet=SortedSet;})();(function(){var Collection=javascript.util.Collection;var SortedSet=javascript.util.SortedSet;var OperationNotSupported=javascript.util.OperationNotSupported;var NoSuchElementException=javascript.util.NoSuchElementException;function TreeSet(){this.array=[];if(arguments[0]instanceof Collection){this.addAll(arguments[0]);}};TreeSet.prototype=new SortedSet;TreeSet.prototype.array=null;TreeSet.prototype.contains=function(o){for(var i=0,len=this.array.length;i<len;i++){var e=this.array[i];if(e['compareTo'](o)===0){return true;}}
return false;};TreeSet.prototype.add=function(o){if(this.contains(o)){return false;}
for(var i=0,len=this.array.length;i<len;i++){var e=this.array[i];if(e['compareTo'](o)===1){this.array.splice(i,0,o);return true;}}
this.array.push(o);return true;};TreeSet.prototype.addAll=function(c){for(var i=c.iterator();i.hasNext();){this.add(i.next());}
return true;};TreeSet.prototype.remove=function(o){throw new OperationNotSupported();};TreeSet.prototype.size=function(){return this.array.length;};TreeSet.prototype.isEmpty=function(){return this.array.length===0;};TreeSet.prototype.toArray=function(){var array=[];for(var i=0,len=this.array.length;i<len;i++){array.push(this.array[i]);}
return array;};TreeSet.prototype.iterator=function(){return new TreeSet.Iterator(this);};TreeSet.Iterator=function(treeSet){this.treeSet=treeSet;};TreeSet.Iterator.prototype.treeSet=null;TreeSet.Iterator.prototype.position=0;TreeSet.Iterator.prototype.next=function(){if(this.position===this.treeSet.size()){throw new NoSuchElementException();}
return this.treeSet.array[this.position++];};TreeSet.Iterator.prototype.hasNext=function(){if(this.position<this.treeSet.size()){return true;}
return false;};TreeSet.Iterator.prototype.remove=function(){throw new javascript.util.OperationNotSupported();};javascript.util.TreeSet=TreeSet;})();(function(){var List=javascript.util.List;var EmptyStackException=javascript.util.EmptyStackException;function Stack(){this.array=[];};Stack.prototype=new List;Stack.prototype.array=null;Stack.prototype.push=function(e){this.array.push(e);return e;};Stack.prototype.pop=function(e){if(this.array.length===0){throw new EmptyStackException();}
return this.array.pop();};Stack.prototype.peek=function(){if(this.array.length===0){throw new EmptyStackException();}
return this.array[this.array.length-1];};Stack.prototype.empty=function(e){if(this.array.length===0){return true;}else{return false;}};Stack.prototype.isEmpty=function(){return this.empty();};Stack.prototype.search=function(o){return this.array.indexOf(o);};Stack.prototype.size=function(){return this.array.length;};Stack.prototype.toArray=function(){var array=[];for(var i=0,len=this.array.length;i<len;i++){array.push(this.array[i]);}
return array;};javascript.util.Stack=Stack;})();(function(){var Map=javascript.util.Map;var SortedMap=javascript.util.SortedMap;var ArrayList=javascript.util.ArrayList;function TreeMap(){this.array=[];};TreeMap.prototype=new Map;TreeMap.prototype.array=null;TreeMap.prototype.get=function(key){for(var i=0,len=this.array.length;i<len;i++){var e=this.array[i];if(e.key['compareTo'](key)===0){return e.value;}}
return null;};TreeMap.prototype.put=function(key,value){var e=this.get(key);if(e){var oldValue=e.value;e.value=value;return oldValue;}
var newElement={key:key,value:value};for(var i=0,len=this.array.length;i<len;i++){e=this.array[i];if(e.key['compareTo'](key)===1){this.array.splice(i,0,newElement);return null;}}
this.array.push({key:key,value:value});return null;};TreeMap.prototype.values=function(){var arrayList=new javascript.util.ArrayList();for(var i=0,len=this.array.length;i<len;i++){arrayList.add(this.array[i].value);}
return arrayList;};TreeMap.prototype.size=function(){return this.values().size();};javascript.util.TreeMap=TreeMap;})();(function(){var Collection=javascript.util.Collection;var Set=javascript.util.Set;var OperationNotSupported=javascript.util.OperationNotSupported;var NoSuchElementException=javascript.util.NoSuchElementException;function HashSet(){this.array=[];if(arguments[0]instanceof Collection){this.addAll(arguments[0]);}};HashSet.prototype=new Set;HashSet.prototype.array=null;HashSet.prototype.contains=function(o){for(var i=0,len=this.array.length;i<len;i++){var e=this.array[i];if(e===o){return true;}}
return false;};HashSet.prototype.add=function(o){if(this.contains(o)){return false;}
this.array.push(o);return true;};HashSet.prototype.addAll=function(c){for(var i=c.iterator();i.hasNext();){this.add(i.next());}
return true;};HashSet.prototype.remove=function(o){throw new OperationNotSupported();};HashSet.prototype.size=function(){return this.array.length;};HashSet.prototype.isEmpty=function(){return this.array.length===0;};HashSet.prototype.toArray=function(){var array=[];for(var i=0,len=this.array.length;i<len;i++){array.push(this.array[i]);}
return array;};HashSet.prototype.iterator=function(){return new HashSet.Iterator(this);};HashSet.Iterator=function(hashSet){this.hashSet=hashSet;};HashSet.Iterator.prototype.hashSet=null;HashSet.Iterator.prototype.position=0;HashSet.Iterator.prototype.next=function(){if(this.position===this.hashSet.size()){throw new NoSuchElementException();}
return this.hashSet.array[this.position++];};HashSet.Iterator.prototype.hasNext=function(){if(this.position<this.hashSet.size()){return true;}
return false;};HashSet.Iterator.prototype.remove=function(){throw new javascript.util.OperationNotSupported();};javascript.util.HashSet=HashSet;})();
},{}],33:[function(require,module,exports){
var process=require("__browserify_process");'use strict'

var print, stdin

try { // node >= 0.3.0
  print = require('util').puts
} catch (e) { // node <= 0.3.0
  print = require('sys').puts
}

Object.defineProperties(exports, {
  stdout: {
    value: process.stdout,
    enumerable: true
  },
  stdin: {
    get: function() {
      return stdin || (stdin = process.openStdin())
    },
    enumerable: true
  },
  stderr: {
    get: function() {
      return stdin || (stdin = process.openStdin())
    },
    enumerable: true
  },
  env: {
    value: process.env,
    enumerable: true
  },
  args: {
    value: process.argv,
    enumerable: true
  },
  print: {
    value: print,
    enumerable: true
  },
  engine: {
    value: 'node',
    enumerable: true
  }
})

},{"__browserify_process":48,"sys":52,"util":52}],34:[function(require,module,exports){
//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.7.0';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var createCallback = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  _.iteratee = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return createCallback(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    if (obj == null) return obj;
    iteratee = createCallback(iteratee, context);
    var i, length = obj.length;
    if (length === +length) {
      for (i = 0; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    if (obj == null) return [];
    iteratee = _.iteratee(iteratee, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length),
        currentKey;
    for (var index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index = 0, currentKey;
    if (arguments.length < 3) {
      if (!length) throw new TypeError(reduceError);
      memo = obj[keys ? keys[index++] : index++];
    }
    for (; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== + obj.length && _.keys(obj),
        index = (keys || obj).length,
        currentKey;
    if (arguments.length < 3) {
      if (!index) throw new TypeError(reduceError);
      memo = obj[keys ? keys[--index] : --index];
    }
    while (index--) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    predicate = _.iteratee(predicate, context);
    _.some(obj, function(value, index, list) {
      if (predicate(value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    predicate = _.iteratee(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(_.iteratee(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    if (obj == null) return true;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    if (obj == null) return false;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (obj.length !== +obj.length) obj = _.values(obj);
    return _.indexOf(obj, target) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = obj && obj.length === +obj.length ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = low + high >>> 1;
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return obj.length === +obj.length ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = _.iteratee(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (!_.isArray(value) && !_.isArguments(value)) {
        if (!strict) output.push(value);
      } else if (shallow) {
        push.apply(output, value);
      } else {
        flatten(value, shallow, strict, output);
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = _.iteratee(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      if (isSorted) {
        if (!i || seen !== value) result.push(value);
        seen = value;
      } else if (iteratee) {
        var computed = iteratee(value, i, array);
        if (_.indexOf(seen, computed) < 0) {
          seen.push(computed);
          result.push(value);
        }
      } else if (_.indexOf(result, value) < 0) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true, []));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(slice.call(arguments, 1), true, true, []);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function(array) {
    if (array == null) return [];
    var length = _.max(arguments, 'length').length;
    var results = Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var idx = array.length;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var Ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    args = slice.call(arguments, 2);
    bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      Ctor.prototype = func.prototype;
      var self = new Ctor;
      Ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (_.isObject(result)) return result;
      return self;
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = hasher ? hasher.apply(this, arguments) : key;
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last > 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed before being called N times.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      } else {
        func = null;
      }
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    if (!_.isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
            obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj, iteratee, context) {
    var result = {}, key;
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      iteratee = createCallback(iteratee, context);
      for (key in obj) {
        var value = obj[key];
        if (iteratee(value, key, obj)) result[key] = value;
      }
    } else {
      var keys = concat.apply([], slice.call(arguments, 1));
      obj = new Object(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (key in obj) result[key] = obj[key];
      }
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    if (!_.isObject(obj)) return obj;
    for (var i = 1, length = arguments.length; i < length; i++) {
      var source = arguments[i];
      for (var prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (
      aCtor !== bCtor &&
      // Handle Object.create(x) cases
      'constructor' in a && 'constructor' in b &&
      !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
        _.isFunction(bCtor) && bCtor instanceof bCtor)
    ) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size, result;
    // Recursively compare objects and arrays.
    if (className === '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size === b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      size = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      result = _.keys(b).length === size;
      if (result) {
        while (size--) {
          // Deep compare each member
          key = keys[size];
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.
  if (typeof /./ !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    var pairs = _.pairs(attrs), length = pairs.length;
    return function(obj) {
      if (obj == null) return !length;
      obj = new Object(obj);
      for (var i = 0; i < length; i++) {
        var pair = pairs[i], key = pair[0];
        if (pair[1] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = createCallback(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? object[property]() : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],35:[function(require,module,exports){
/**
 * Main Javascript program for MinSquareCovering.html
 */
var jsts = window.jsts = require("../jsts-extended");
var _ = window._ = require("underscore");

var factory = new jsts.geom.GeometryFactory();

$(document).ready(function() {
	
/* SQUARES */

window.calcSimpleRectilinearPolygon = function(points) {
	var xy = [];
	for (var i=0; i<points.length; ++i) {
		xy.push(points[i].x)
		xy.push(points[i].y)
	}
	return factory.createSimpleRectilinearPolygon(xy);
}

window.calcMinSquareCovering = function(srp) {
	return jsts.algorithm.minSquareCovering(srp, factory);
}

window.calcShapesTouchingPoints = function(shapeName, points, walls) {
	var candidates = factory.createShapesTouchingPoints(
		shapeName, points, new jsts.geom.Envelope(walls.minx,walls.maxx, walls.miny,walls.maxy));
	return candidates;
}

window.calcMaxDisjointSet = function(candidates, stopAtCount) {
	return jsts.algorithm.maximumDisjointSet(candidates, stopAtCount);
}

window.getMaxDisjointSetSolver = function(candidates, stopAtCount) {
	return new jsts.algorithm.MaximumDisjointSetSolver(candidates, stopAtCount);
}

window.calcRepresentativeDisjointSet = function(candidateSets) {
	return jsts.algorithm.representativeDisjointSet	(candidateSets)
}

window.calcHalfProportionalDivision = function(pointsPerAgent, envelopeTemp, maxSlimness) {
	return factory.createHalfProportionalDivision(
			pointsPerAgent, envelopeTemp, maxSlimness);
}


}); // end of $(document).ready


},{"../jsts-extended":40,"underscore":46}],36:[function(require,module,exports){
var _ = require("underscore");

/**
 * Class ValueFunction represents a valuation function of an agent.
 * Defined by a list of points, all of which have the same value.
 * 
 * @param points either a list of {x:,y:} records, or a list of alternating x,y values.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */
var ValueFunction = function(totalValue, points, color, valuePerPoint) {
	if (!Array.isArray(points))
		throw new Error("points: expected an array but got "+JSON.stringify(points));
	if (!points.length)
		throw new Error("No points! totalValue="+totalValue);
	this.color = color? color: points.color? points.color: null;
	this.index = points.index? points.index: null;

	if (!isNaN(points[0])) {  // convert points from a list alternating x-y values to a list of {x:,y:} structures
		var xy = points;
		points = [];
		for (var i=0; i<xy.length; i+=2) 
			points.push({x:xy[i], y:xy[i+1]});
	}
	this.setPoints(points);
	this.setTotalValue(totalValue, points.length, valuePerPoint);
};

ValueFunction.prototype.setTotalValue = function(totalValue, numOfPoints, valuePerPoint) {
	this.totalValue = totalValue;
	if (!numOfPoints) numOfPoints = this.points.length;
	if (!valuePerPoint) valuePerPoint = totalValue/numOfPoints;
	this.valuePerPoint = valuePerPoint;
	this.pointsPerUnitValue = 1/valuePerPoint;
}

ValueFunction.prototype.setPoints = function(points) {
	this.points = points;
	
	// Don't change the totalValue and the valuePerPoint - they remain as they are 
	//	even when the points are filtered by an envelope!
	
	this.setYCuts();
}

ValueFunction.prototype.setYCuts = function() {
	var yVals = _.pluck(this.points, "y");
	yVals.sort(function(a,b){return a-b});

	var cuts = [0];
	var curPointsInPiece = 0;
	for (var i=0; i<yVals.length; ++i) {
		curPointsInPiece += 1;
		while (curPointsInPiece>=this.pointsPerUnitValue) {
			cuts.push(yVals[i]);
			curPointsInPiece -= this.pointsPerUnitValue;
		}
	}
	this.yCuts = cuts;
}


ValueFunction.prototype.cloneWithNewPoints = function(newPoints) {
	return new ValueFunction(this.totalValue, newPoints, this.color, this.valuePerPoint);
}

/**
 * @return the value of the given rectangle, according to this value function.
 */
ValueFunction.prototype.valueOf = function(envelope) {
	if (!envelope) 
		throw new Error("envelope is not defined");
	if (!('minx' in envelope)) 
		throw new Error("envelope does not contain minx: "+JSON.stringify(envelope));
	return this.valuePerPoint * jsts.algorithm.numPointsInEnvelope(this.points, envelope);
}

/**
 * @param direction direction of points relative to the corner: "NE", "SE", "NW" or "SW".
 * @return the smallest side-length of a square with the given corner {x,y}, containing at least the requested value. 
 * @return Infinity if no such square exists.
 */
ValueFunction.prototype.sizeOfSquareWithValue = function(corner, requestedValue, direction) {
	var requestedNumOfPoints = Math.ceil(requestedValue / this.valuePerPoint);
	if (isNaN(requestedNumOfPoints)) 
		throw new Error("requestedNumOfPoints is NaN: requestedValue="+requestedValue+" valuePerPoint="+this.valuePerPoint)
	if (requestedNumOfPoints==0) {
		console.dir(this);
		throw new Error("requestedNumOfPoints is 0: requestedValue="+requestedValue+" valuePerPoint="+this.valuePerPoint)
	}

	if (this.points.length<requestedNumOfPoints) return Infinity;
	
	var filterFunction = (
		direction=="NE"? function(point) {return point.x>=corner.x && point.y>=corner.y;}: 
		direction=="NW"? function(point) {return point.x<=corner.x && point.y>=corner.y;}: 
		direction=="SE"? function(point) {return point.x>=corner.x && point.y<=corner.y;}: 
		direction=="SW"? function(point) {return point.x<=corner.x && point.y<=corner.y;}:
		null);
	if (!filterFunction) throw new Error("Unsupported direction "+direction);
	var relevantPoints = this.points.filter(filterFunction);
	
	if (relevantPoints.length<requestedNumOfPoints) return Infinity;
	relevantPoints.forEach(function(point) {
		point.maxDistance = Math.max(Math.abs(point.x-corner.x), Math.abs(point.y-corner.y));
	})
	var pointsSortedByMaxDistance = _.sortBy(relevantPoints, "maxDistance");
	var farthestPoint = pointsSortedByMaxDistance[requestedNumOfPoints-1];
	if (!farthestPoint) 
		throw new Error("farthestPoint not defined: requestedNumOfPoints="+requestedNumOfPoints+" pointsSortedByMaxDistance="+JSON.stringify(pointsSortedByMaxDistance));
	return farthestPoint.maxDistance;
}

/** @return a ValueFunction object based on the given total value and list of points. */
ValueFunction.create = function(totalValue, points) {
	if (!points)
		throw new Error("points are undefined")
	return (points.prototype===ValueFunction.prototype? 
			points:
			new ValueFunction(totalValue, points));
}

/** @return an array of ValueFunction objects based on the given total value (same for all objects) and the lists of points. */
ValueFunction.createArray = function(totalValue, arraysOfPoints) {
	return arraysOfPoints.map(ValueFunction.create.bind(0,totalValue));
}

/** Order the given array of ValueFunction objects by an ascending order of the value they assign to a specific landplot */
/** WARNING: Not thread-safe! */
ValueFunction.orderArrayByLandplotValue = function(valueFunctions, landplot) {
	valueFunctions.forEach(function(a){a.valueOfLandplot = a.valueOf(landplot);})
	valueFunctions.sort(function(a,b){return a.valueOfLandplot-b.valueOfLandplot});
	valueFunctions.forEach(function(a){delete a.valueOfLandplot});
}

/** Order the given array of ValueFunction objects by an ascending order of the ratio of values they assign to two specific landplots */
/** WARNING: Not thread-safe! */
ValueFunction.orderArrayByLandplotValueRatio = function(valueFunctions, landplot1, landplot2) {
	valueFunctions.forEach(function(a){a.ratioOfValues = a.valueOf(landplot1)/a.valueOf(landplot2);})
	valueFunctions.sort(function(a,b){return a.ratioOfValues-b.ratioOfValues});
	valueFunctions.forEach(function(a){delete a.ratioOfValues});
}


module.exports = ValueFunction;

},{"underscore":46}],37:[function(require,module,exports){
/**
 * Divide a cake such that each color gets a square with 1/2n of its points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('../../computational-geometry');
var _ = require('underscore')
_.mixin(require("argminmax"));

var TRACE = function(){};
//var TRACE = console.log;



/*********************** 2 WALLS ************************/


/**
 * @param corners a list of points {x:,y:}, describing a north-eastern border. x is non-increasing and y is non-decreasing. Only southwestern corners are listed (i.e. only every other point).
 * @param landplot a rectangle {minx:,maxx:,miny:,maxy:} whose southwestern corner conicides with one of the existing corners.
 * @return a new list of corners describing the border after the landplot has been annexed. 
 */
jsts.algorithm.updatedCornersNorthEast = function(corners, landplot) {
	if (!Array.isArray(corners))
		throw new Error("corners: expected array but got "+JSON.stringify(corners));
	if (!('minx' in landplot && 'maxx' in landplot && 'miny' in landplot && 'maxy' in landplot))
		throw new Error("landplot: expected fields not fount: "+JSON.stringify(landplot));

	TRACE("  updatedCornersNorthEast with corners: "+JSON.stringify(corners)+"  landplot: "+JSON.stringify(landplot));
	var numOfCorners = corners.length;
	var newCorners = [];
	var c = 0;

	while (c<numOfCorners && corners[c].x>=landplot.maxx) {  // add corners to the southeast of the landplot
		newCorners.push(corners[c]);
		++c;
	}
	// HERE corners[c].x<landplot.maxx
	newCorners.push({x:landplot.maxx, y:corners[c].y});  // add southwest new corner
	while (c<numOfCorners && corners[c].y<landplot.maxy) { // skip corners shaded by the landplot
		++c;
	}
	// HERE corners[c].y>=landplot.maxy
	if (c>0)
		newCorners.push({x:corners[c-1].x, y:landplot.maxy});  // add northeast new corner
	while (c<numOfCorners) {  // add corners to the northwest of the landplot
		newCorners.push(corners[c]);
		++c;
	}
	
	return newCorners;
}


/**
 * @param corners a list of points {x:,y:}, describing a north-western border. x is non-decreasing and y is non-decreasing. Only southeastern corners are listed (i.e. only every other point).
 * @param landplot a rectangle {minx:,maxx:,miny:,maxy:} whose southeastern corner conicides with one of the existing corners.
 * @return a new list of corners describing the border after the landplot has been annexed. 
 */
jsts.algorithm.updatedCornersNorthWest = function(corners, landplot) {
	if (!Array.isArray(corners))
		throw new Error("corners: expected array but got "+JSON.stringify(corners));
	if (!('minx' in landplot && 'maxx' in landplot && 'miny' in landplot && 'maxy' in landplot))
		throw new Error("landplot: expected fields not fount: "+JSON.stringify(landplot));

	TRACE("  updatedCornersNorthWest with corners: "+JSON.stringify(corners)+"  landplot: "+JSON.stringify(landplot));
	var numOfCorners = corners.length;
	var newCorners = [];
	var c = 0;

	while (c<numOfCorners && corners[c].x<=landplot.minx) {  // add corners to the southwest of the landplot
		newCorners.push(corners[c]);
		++c;
	}
	// HERE corners[c].x>landplot.minx
	newCorners.push({x:landplot.minx, y:corners[c].y});  // add southeast new corner
	while (c<numOfCorners && corners[c].y<landplot.maxy) { // skip corners shaded by the landplot
		++c;
	}
	// HERE corners[c].y>=landplot.maxy
	if (c>0)
		newCorners.push({x:corners[c-1].x, y:landplot.maxy});  // add northwest new corner
	while (c<numOfCorners) {  // add corners to the northwest of the landplot
		newCorners.push(corners[c]);
		++c;
	}

	return newCorners;
}



/**
 * @return a list of all corner squares with the given value.
 */
jsts.algorithm.cornerSquares = function(valueFunction, corners, requiredLandplotValue, direction, origin) {
	if (valueFunction.points.length==0)
		throw new Error("No value points: "+JSON.stringify(valueFunction));
	if (typeof requiredLandplotValue != 'number')
		throw new Error("requiredLandplotValue: expected a number but got "+JSON.stringify(requiredLandplotValue));
	return corners.map(function(corner) {
		var squareSize = valueFunction.sizeOfSquareWithValue(corner, requiredLandplotValue, direction);
		var dx = Math.abs(corner.x-origin.x);
		var dy = Math.abs(corner.y-origin.y);
		var taxicabDistance = dx+dy+squareSize;
		return {x:corner.x, y:corner.y, dx:dx, dy:dy, s:squareSize, t:taxicabDistance};
	});
}


/**
 * @return a list of all corner squares with the given value; for each corner, pick the valueFunction that gives the smallest square.
 */
jsts.algorithm.smallestCornerSquares = function(valueFunctions, corners, requiredLandplotValue, direction, origin, otherCorners) {
	if (typeof requiredLandplotValue != 'number')
		throw new Error("requiredLandplotValue: expected a number but got "+JSON.stringify(requiredLandplotValue));
	return corners.map(function(corner) {
		var outgoingCorner = jsts.algorithm.outgoingCorner(corner, otherCorners);
		var maxAllowedSquareSize = Math.abs(outgoingCorner.x-corner.x);
		var squareSizes = valueFunctions.map(function(valueFunction) {
			return valueFunction.sizeOfSquareWithValue(corner, requiredLandplotValue, direction);
		})
		//console.log("  corner="+JSON.stringify(corner)+" outgoingCorner="+JSON.stringify(outgoingCorner)+" maxAllowedSquareSize="+maxAllowedSquareSize+"  squareSizes="+squareSizes);
		squareSizes = squareSizes.filter(function(size) {
			return size<=maxAllowedSquareSize;
		});
		if (squareSizes.length==0)
			return null;
		var iSmallestSquare = _.argmin(squareSizes)
		var smallestSquareSize = squareSizes[iSmallestSquare];
		var dx = Math.abs(corner.x-origin.x);
		var dy = Math.abs(corner.y-origin.y);
		var taxicabDistance = dx+dy+smallestSquareSize;
		return {x:corner.x, y:corner.y, dx:dx, dy:dy, s:smallestSquareSize, t:taxicabDistance, index:iSmallestSquare, direction:direction};
	}).filter(function(square) {
		return square!=null;
	});
}

jsts.algorithm.cornerSquareWithMinTaxicabDistance = function(valueFunction, corners, requiredLandplotValue, direction, origin) {
	var cornerSquares = jsts.algorithm.cornerSquares(valueFunction, corners, requiredLandplotValue, direction, origin);
	var minDistanceSquare = _.min(cornerSquares, function(square){return square.t});
	if (!minDistanceSquare)
		minDistanceSquare = {t: Infinity};
	return minDistanceSquare;
}




/**
 * @param corner {x,y}
 * @param otherCorners corners at another side; ordered by non-decreasing y.
 * @return the "out-going corner" {x,y} such that y is larger than corner.y.
 */
jsts.algorithm.outgoingCorner = function(corner, otherCorners) {
	if (corner.y < otherCorners[0].y)
		throw new Error("corner.y too low! corner="+JSON.stringify(corner)+"  otherCorners="+JSON.stringify(otherCorners));
	for (var i=0; i<otherCorners.length; ++i) 
		if (corner.y < otherCorners[i].y)  {
			var result = {x: (i>0?otherCorners[i-1].x:otherCorners[i].x), y:otherCorners[i].y};
			//console.log("corner="+JSON.stringify(corner)+" otherCorners="+JSON.stringify(otherCorners)+" i="+i+" outgoingCorner="+JSON.stringify(result))
			return result;
		}
	throw new Error("No outgoing corner found! corner="+JSON.stringify(corner)+"  otherCorners="+JSON.stringify(otherCorners));
}

/**
 * @param corners ordered by non-decreasing y.
 * @param otherCorners corners at another side; ordered by non-decreasing y.
 * remove from "corners" those corners whose x-distance to the other side is smaller than the y-distance.
 */
jsts.algorithm.removeCornersWithSmallXDistance = function(corners, otherCorners) {
	var newCorners = [];
	for (var i=corners.length-1; i>=0; i--) {
		var corner = corners[i];
		if (corner.y>1)
			continue; // skip corners above the valued square
		var nextCornerY = (i+1<corners.length? corners[i+1].y: 1);
		//console.log("\tcorner="+JSON.stringify(corner));
		var outgoingCorner = jsts.algorithm.outgoingCorner(corner, otherCorners);
		//console.log("\toutgoingCorner="+JSON.stringify(outgoingCorner));
		var dx = Math.abs(outgoingCorner.x-corner.x);
		var dy = Math.abs(Math.min(outgoingCorner.y,nextCornerY)-corner.y);
		if (dx<dy) {
			if (nextCornerY>outgoingCorner.y)
				newCorners.unshift({
					x:corner.x,
					y:Math.max(0,Math.min(1,outgoingCorner.y))
				});
			break;
		} else {
			newCorners.unshift(corner)
			continue;
		}
	}
	TRACE("  removeCornersWithSmallXDistance with corners: "+JSON.stringify(corners)+"  otherCorners: "+JSON.stringify(otherCorners)+"  returns "+JSON.stringify(newCorners));
	return newCorners; 
}





/*********************** 3 WALLS ************************/


/**
 * @param levels a list of {y:,minx:,maxx:}, describing a southern or northern border. x is non-decreasing: NW - SW - SE - NE 
 * @param landplot a rectangle {minx:,maxx:,miny:,maxy:} whose southern side is adjacent to the border from its north.
 * @param direction "N" (north) or "S" (south)
 * @return a new list of levels  describing the border after the landplot has been removed. 
 */
jsts.algorithm.updatedLevels = function(levels, landplot, direction) {
	if (!Array.isArray(levels))
		throw new Error("levels: expected array but got "+JSON.stringify(levels));
	if (!('minx' in landplot && 'maxx' in landplot && 'miny' in landplot && 'maxy' in landplot))
		throw new Error("landplot: expected fields not found: "+JSON.stringify(landplot));

	TRACE("  updating "+(direction=='S'? "south": "north")+" levels: "+JSON.stringify(levels)+"  with landplot: "+JSON.stringify(landplot));
	
	var numOfLevels = levels.length;
	var newLevels = [];
	var c = 0;

	// add all levels entirely to the west of minx:
	while (c<numOfLevels && levels[c].maxx<=landplot.minx) {
		TRACE("  west: "+JSON.stringify(levels[c]));
		newLevels.push(levels[c++]);
	}
	
	// HERE levels[c].maxx > landplot.minx

	if (c<numOfLevels) {
		var newLevelY = (direction=='S'? landplot.maxy: landplot.miny);
	//	console.log("newLevelY="+newLevelY+" levels[c]="+JSON.stringify(levels[c]));
		if (levels[c].minx < landplot.minx) {
			if (newLevelY!=levels[c].y) {
				newLevels.push({y:levels[c].y, minx:levels[c].minx, maxx:landplot.minx});
				newLevels.push({y:newLevelY, minx:landplot.minx, maxx:landplot.maxx});
			} else {
				newLevels.push({y:newLevelY, minx:levels[c].minx, maxx:landplot.maxx});
			}
		} else if (levels[c].minx == landplot.minx) {
			if (newLevelY!=levels[c].y) {
				newLevels.push({y:newLevelY, minx:landplot.minx, maxx:landplot.maxx});
			} 
		}
	}

	// HERE we have added all levels with minx weakly to the west of landplot.minx,
	// and the new level created by landplot.
	
	// skip all levels shaded by y:
	while (c<numOfLevels && levels[c].minx<landplot.maxx) {
		TRACE("  south: "+JSON.stringify(levels[c]));
		c++;
	}
	if (c>0) {
		c--;
		if (levels[c].maxx > landplot.maxx)
			newLevels.push({y:levels[c].y, minx:landplot.maxx, maxx:levels[c].maxx});
		c++;
	}
	
	// HERE levels[c].minx >= landplot.maxx

	// add all levels entirely to the west of minx:
	while (c<numOfLevels) {
		TRACE("  east: "+JSON.stringify(levels[c]));
		newLevels.push(levels[c++]);
	}
	
	TRACE("  updated "+(direction=='S'? "south": "north")+" levels: "+JSON.stringify(levels)+"  with landplot: "+JSON.stringify(landplot)+"  returns: "+JSON.stringify(newLevels));
	return newLevels;
}

/**
 * Add to each level the properties: "yWest", "yEast", "isKnob", "westMinx", "eastMaxx"
 */
addPropertiesToLevel = function(levels, i) {
	var level = levels[i];
	var west = (i-1>=0?            levels[i-1]: null);
	level.westMinx = (west? west.minx: 0);
	level.yWest = (west? west.y: Infinity);
	var east = (i+1<levels.length? levels[i+1]: null);
	level.yEast = (east? east.y: Infinity);
	level.eastMaxx = (east? east.maxx: 1);
	level.isKnob = (level.yEast>level.y && level.yWest>level.y);
}

/**
 * Add to each level the properties: "yWest", "yEast", "isKnob", "westMinx", "eastMaxx"
 */
jsts.algorithm.addPropertiesToLevels = function(levels) {
	for (var i=0; i<levels.length; ++i) 
		addPropertiesToLevel(levels, i);
}

/**
 * Remove a single level from a southern border.
 * @param levels sequence of [{minx,maxx,y}] with additional properties [{yWest,yEast,westMinx,eastMaxx,isKnob}], ordered by increasing minx. 
 * @param iLevelToRemove index of level to remove.
 * @return sequence of rectangles [{minx,maxx,miny,maxy}]. The number of rectangles should be equal to the number of levels.  
 * @note updates the additional information of the levels, but very inefficiently (calls jsts.algorithm.addPropertiesToLevels(levels) to do that).
 */
jsts.algorithm.removeLevel = function(levels, iLevelToRemove) {
	with (levels[iLevelToRemove]) {
		if (yWest < yEast) {
			levels.splice(
					/* go to index */ iLevelToRemove-1, 
					/* remove */      2 /* elements*/, 
					/* then add */    {minx: westMinx, maxx: maxx, y: yWest});
		} else if (yEast < yWest) {
			levels.splice(
					/* go to index */ iLevelToRemove, 
					/* remove */      2 /* elements*/, 
					/* then add */    {minx: minx, maxx: eastMaxx, y: yEast});
		} else if (isFinite(yWest)) { //  && yWest==yEast
			levels.splice(
					/* go to index */ iLevelToRemove-1, 
					/* remove */      3 /* elements*/, 
					/* then add */    {minx: westMinx, maxx: eastMaxx, y: yWest});
		} else {  // a single level remaining
			levels.splice(iLevelToRemove,1);
		}
	}
	jsts.algorithm.addPropertiesToLevels(levels);	
}


/**
 * Calculate a list of rectangles covering the cake whose southern border is defined by the given levels.
 * @param levels sequence of [{minx,maxx,y}].
 * @return sequence of rectangles [{minx,maxx,miny,maxy}]. The number of rectangles should be equal to the number of levels.  
 */
jsts.algorithm.rectanglesCoveringSouthernLevels = function(levelsParam) {
	var levels = levelsParam.slice(0);
	var covering = [];
	
	while (levels.length>0) {
		
		// cover the lowest (most southern) level and then remove it:
		var iLowestLevel = _.argmin(levels, function(level){return level.y});
		addPropertiesToLevel(levels, iLowestLevel);
		with (levels[iLowestLevel]) {
			var rectangle = {minx:minx, maxx:maxx, miny:y};
			if (yWest < yEast) {
				rectangle.maxy = yWest;
				levels.splice(
						/* go to index */ iLowestLevel-1, 
						/* remove */      2 /* elements*/, 
						/* then add */    {minx: westMinx, maxx: maxx, y: yWest});
			} else if (yEast < yWest) {
				rectangle.maxy = yEast;
				levels.splice(
						/* go to index */ iLowestLevel, 
						/* remove */      2 /* elements*/, 
						/* then add */    {minx: minx, maxx: eastMaxx, y: yEast});
			} else if (isFinite(yWest)) { //  && yWest==yEast
				rectangle.maxy = yWest;
				levels.splice(
						/* go to index */ iLowestLevel-1, 
						/* remove */      3 /* elements*/, 
						/* then add */    {minx: westMinx, maxx: eastMaxx, y: yWest});
			} else {  // a single level remaining
				rectangle.maxy = Infinity;
				levels.splice(iLowestLevel,1);
			}
		}
		covering.push(rectangle);  
	}
	
	return covering;
}

/**
 * Calculate a list of rectangles covering the cake whose northern border is defined by the given levels.
 * @param levels sequence of [{minx,maxx,y}] ordered by increasing minx. 
 * @return sequence of rectangles [{minx,maxx,miny,maxy}]. The number of rectangles should be equal to the number of levels.  
 */
jsts.algorithm.rectanglesCoveringNorthernLevels = function(levelsParam) {
	var levels = levelsParam.slice(0);
	var covering = [];
	
	while (levels.length>0) {
		
		// cover the highest (most northern) level:
		var iLowestLevel = _.argmax(levels, function(level){return level.y});
		var level = levels[iLowestLevel];
		var rectangle = {minx:level.minx, maxx:level.maxx, maxy:level.y};
		
		// remove the highest level:
		var west = (iLowestLevel-1>=0?            levels[iLowestLevel-1]: null);
		var yWest = (west? west.y: -Infinity);
		var east = (iLowestLevel+1<levels.length? levels[iLowestLevel+1]: null);
		var yEast = (east? east.y: -Infinity);
		
		if (yWest > yEast) {
			rectangle.miny = yWest;
			levels.splice(
					/* go to index */ iLowestLevel-1, 
					/* remove */      2 /* elements*/, 
					/* then add */    {minx: west.minx, maxx: level.maxx, y: yWest});
		} else if (yEast > yWest) {
			rectangle.miny = yEast;
			levels.splice(
					/* go to index */ iLowestLevel, 
					/* remove */      2 /* elements*/, 
					/* then add */    {minx: level.minx, maxx: east.maxx, y: yEast});
		} else if (west && east) { //  && yWest==yEast
			rectangle.miny = yWest;
			levels.splice(
					/* go to index */ iLowestLevel-1, 
					/* remove */      3 /* elements*/, 
					/* then add */    {minx: west.minx, maxx: east.maxx, y: yWest});
		} else {  // a single level remaining
			rectangle.miny = -Infinity;
			levels.splice(iLowestLevel,1);
		}
		covering.push(rectangle);  
	}
	
	return covering;
}





},{"../../computational-geometry":1,"argminmax":44,"underscore":46}],38:[function(require,module,exports){
/**
 * Divide a cake such that each color gets a fair number of points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('../../computational-geometry');
require("./square-with-max-points");
var _ = require("underscore");
var utils = require('../../computational-geometry/lib/numeric-utils');

var DEFAULT_ENVELOPE = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,Infinity);

/**
 * Find a set of axis-parallel squares representing a fair-and-square division of the points.
 * 
 * @param agents an array in which each entry represents the valuation of a single agent.
 * The valuation of an agent is represented by points with fields {x,y}.
 * 
 * @param envelope a jsts.geom.Envelope, defining the boundaries for the shapes.
 * 
 * @param maxAspectRatio maximum aspect ratio allowed for the pieces.
 * 
 * @return a list of AxisParallelRectangle's.
 */
jsts.geom.GeometryFactory.prototype.createFairAndSquareDivision = function(agents, envelope, maxAspectRatio) {
	var numOfAgents = agents.length;
	if (numOfAgents==0) 
		return [];

	if (!envelope)  envelope = DEFAULT_ENVELOPE;
	if (!maxAspectRatio) maxAspectRatio=1;
	if (numOfAgents==1) { // base case - single agent - find a square covering
		var agent = agents[0];
		var shape = this.createAxisParallelRectangle(
			jsts.algorithm.squareWithMaxNumOfPoints(
					agent, envelope, maxAspectRatio));
		if (agent.color)
			shape.color = agent.color;
		return [shape];
	}
	
	// here there are at least two agents.
	
	var width = envelope.maxx-envelope.minx, height = envelope.maxy-envelope.miny;

	var piece1, piece2;
	if (width>=height) {
		var cutPoint = (envelope.c+envelope.minx)/2;
		var piece1 = new jsts.geom.Envelope(envelope.minx,cutPoint, envelope.miny,envelope.maxy);
		var piece2 = new jsts.geom.Envelope(cutPoint,envelope.maxx, envelope.miny,envelope.maxy);
	} else {  // width<height
		var cutPoint = (envelope.maxy+envelope.miny)/2;
		var piece1 = new jsts.geom.Envelope(envelope.minx,envelope.maxx, envelope.miny,cutPoint);
		var piece2 = new jsts.geom.Envelope(envelope.minx,envelope.maxx, cutPoint,envelope.maxy);
	}
	var partners1 = [], partners2 = [];
	for (var i=0; i<agents.length; ++i) {
		partners1[i] = [i,numPartners(agents[i],piece1,numOfAgents,maxAspectRatio)];
		partners2[i] = [i,numPartners(agents[i],piece2,numOfAgents,maxAspectRatio)];
	}
	var sortByPartnersDecreasingOrder = function(a,b) { return b[1]-a[1]; }
	partners1.sort(sortByPartnersDecreasingOrder);
	
	var agentsForPiece1 = [], agentsForPiece2 = [];
	for (var i=0; i<partners1.length; ++i) {
		var agentIndex = partners1[i][0];
		if (agentsForPiece1.length<partners1[i][1])
			agentsForPiece1.push(agents[agentIndex]);
		else
			agentsForPiece2.push(agents[agentIndex]);
	}
//	if (agentsForPiece1.length<numOfAgents && agentsForPiece2<numOfAgents) {
		var fairDivision1 = this.createFairAndSquareDivision(agentsForPiece1, piece1, maxAspectRatio);
		var fairDivision2 = this.createFairAndSquareDivision(agentsForPiece2, piece2, maxAspectRatio);
		return fairDivision1.concat(fairDivision2);
//	} else {
//		return [];
//	}
}


/*---------------- UTILS ---------------*/

var numPartners = function(points, envelope, n, maxAspectRatio) {
	var A, B, T;
	if (maxAspectRatio<2) {
		A=6; B=8; T=2;
	} else {
		A=4; B=5; T=1;
	}
	var pointsInside = utils.numPointsInXY(points, envelope);
	var normalizedValue = (pointsInside/points.length*(A*n-B));
	if (normalizedValue<T)
		return 0;

	for (var k=1; k<=n-2; k++) {
		if (A*k-B<=normalizedValue && normalizedValue<A*(k+1)-B)
			return k;
	}

	if (A*(n-1)-B<=normalizedValue && normalizedValue<=A*n-B-T)
		return n-1;

	return n;
}

},{"../../computational-geometry":1,"../../computational-geometry/lib/numeric-utils":14,"./square-with-max-points":42,"underscore":46}],39:[function(require,module,exports){
/**
 * Divide a cake such that each color gets a square with 1/2n of its points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('../../computational-geometry');
require("./square-with-max-points");
require("./corners");
require("./rectilinear-polygon-division");
var numutils = require('../../computational-geometry/lib/numeric-utils');


var _ = require("underscore");
_.mixin(require("argminmax"));

var util = require("util");
var ValueFunction = require("./ValueFunction");

var DEFAULT_ENVELOPE = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,Infinity);

function logValueFunctions(valueFunctions) {
	console.log(util.inspect(valueFunctions,{depth:3}));
}

function TRACE (numOfAgents, s) {
	console.log(Array(Math.max(0,6-numOfAgents)).join("   ")+s);
};

function TRACE_NO_LANDPLOT(valueFunctions) {
	logValueFunctions(valueFunctions);
}


function TRACE_PARTITION(numOfAgents, s, y, k, northAgents, northPlots, southAgents, southPlots) {
	TRACE(numOfAgents,s+"(k="+k+", y="+round2(y)+"): "+southAgents.length+" south agents ("+_.pluck(southAgents,"color")+") got "+southPlots.length+" plots and "+northAgents.length+" north agents ("+_.pluck(northAgents,"color")+") got "+northPlots.length+" plots.");
}

var roundFields3 = Math.roundFields.bind(0, 3);
var round2 = function(x) { 	return Math.round(x*100)/100; }

var mapOpenSidesStringToSouthernSide = {
		"01": jsts.Side.North,
		"12": jsts.Side.East,
		"23": jsts.Side.South,
		"03": jsts.Side.West,
};

var openSidesToSouthernSide = function(openSides) {
	openSides.sort();
	var openSidesString = openSides.join("");
	if (!(openSidesString in mapOpenSidesStringToSouthernSide)) 
		return null;
	 else 
		return mapOpenSidesStringToSouthernSide[openSidesString];
};


jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION = false;    // convert a single value function to multi agents with the same value
//jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION = true;   // keep a single value function as a value function of a single agent

jsts.algorithm.FIND_DIVISION_WITH_LARGEST_MIN_VALUE = true;  // try to find division with min values decreasing from the maximum possible down to 1.
//jsts.algorithm.FIND_DIVISION_WITH_LARGEST_MIN_VALUE = false; // find only division with min value 1


/**
 * Find a set of axis-parallel fat rectangles representing a fair-and-square division for the valueFunctions
 * 
 * @param agentsValuePoints an array in which each entry represents the valuation of a single agent.
 * The valuation of an agent is represented by points with fields {x,y}. Each point has the same value.
 *    Each agent may also have a field "color", that is copied to the rectangle.
 * 
 * @param envelope object with fields {minx,miny, maxx,maxy}; defines the boundaries for the landplots.
 * 
 * @param maxAspectRatio maximum aspect ratio allowed for the pieces.
 * 
 * @return a list of rectangles; each rectangle is {minx,miny, maxx,maxy [,color]}.
 */
jsts.geom.GeometryFactory.prototype.createHalfProportionalDivision = function(agentsValuePoints, envelope, maxAspectRatio) {
	var landplots = jsts.algorithm.halfProportionalDivision(agentsValuePoints, envelope, maxAspectRatio);
	var prevColor = null;
	return landplots.map(function(landplot) {
		var rect = new jsts.geom.AxisParallelRectangle(landplot.minx, landplot.miny, landplot.maxx, landplot.maxy, this);
		rect.color = (landplot.color!=prevColor?
				landplot.color: 
				color(index++));
		prevColor = rect.color;
		rect.fill = landplot.fill;
		rect.stroke = landplot.stroke;
		return rect;
	});
};

jsts.algorithm.getOpenSides = function(envelope) {
	var openSides = [];
	if (envelope.minx==-Infinity) openSides.push(jsts.Side.West);
	if (envelope.miny==-Infinity) openSides.push(jsts.Side.South);
	if (envelope.maxx== Infinity) openSides.push(jsts.Side.East);
	if (envelope.maxy== Infinity) openSides.push(jsts.Side.North);
	return openSides;
}

jsts.algorithm.halfProportionalDivision = function(agentsValuePoints, envelope, maxAspectRatio) {
	TRACE(10,"")
	var landplots;
	var openSides = jsts.algorithm.getOpenSides(envelope);
//	TRACE(agentsValuePoints.length, "openSides="+openSides);
	if (openSides.length==0) {
		landplots = jsts.algorithm.halfProportionalDivision4Walls(agentsValuePoints, envelope, maxAspectRatio);
	} else if (openSides.length==1) {
		var openSide = openSides[0];
		landplots = jsts.algorithm.halfProportionalDivision3Walls(agentsValuePoints, envelope, maxAspectRatio, openSide);
	} else if (openSides.length==2) {
		var southernSide = openSidesToSouthernSide(openSides);
		if (southernSide==null) {  
			console.warn("Two opposite sides - treating as 3 walls. envelope="+JSON.stringify(envelope));
			var openSide;
			if (!isFinite(envelope.minx)) { envelope.minx = 0; openSide = jsts.Side.East; }
			if (!isFinite(envelope.miny)) { envelope.miny = 0; openSide = jsts.Side.North; }
			console.warn("  New envelope="+JSON.stringify(envelope));
			landplots = jsts.algorithm.halfProportionalDivision3Walls(agentsValuePoints, envelope, maxAspectRatio, openSide);
		} else {
			landplots = jsts.algorithm.halfProportionalDivision2Walls(agentsValuePoints, envelope, maxAspectRatio, southernSide);
		}
	} else if (openSides.length==3) {
		var closedSide = (jsts.Side.North+jsts.Side.East+jsts.Side.South+jsts.Side.West) - (openSides[0]+openSides[1]+openSides[2]);
//		TRACE(agentsValuePoints.length, "closedSide="+closedSide);
		landplots = jsts.algorithm.halfProportionalDivision1Walls(agentsValuePoints, envelope, maxAspectRatio, /*southernSide=*/closedSide);
	} else {  // all sides are open
		var closedSide = jsts.Side.South;  // arbitrary; TEMPORARY
		landplots = jsts.algorithm.halfProportionalDivision0Walls(agentsValuePoints, envelope, maxAspectRatio, /*southernSide=*/closedSide);
	}
	landplots.forEach(roundFields3);
	return landplots;
}


jsts.algorithm.halfProportionalDivision4Walls = function(agentsValuePoints, envelope, maxAspectRatio) {
	var width = envelope.maxx-envelope.minx, height = envelope.maxy-envelope.miny;
	var shorterSide = (width<=height? jsts.Side.South: jsts.Side.East);
	var valuePerAgent = 2*agentsValuePoints.length;
	return runDivisionAlgorithm(
			norm4Walls, shorterSide /* The norm4walls algorithm assumes that the southern side is shorter */,
			valuePerAgent, agentsValuePoints, envelope, maxAspectRatio, jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION);
}

jsts.algorithm.halfProportionalDivision3Walls = function(agentsValuePoints, envelope, maxAspectRatio, openSide) {
	var southernSide = (openSide+2)%4;  // the southern side is opposite to the open side.
	var valuePerAgent = 2*agentsValuePoints.length - 1;
	return runDivisionAlgorithm(
			norm3Walls, southernSide,
			valuePerAgent, agentsValuePoints, envelope, maxAspectRatio, jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION);
};

jsts.algorithm.halfProportionalDivision2Walls = function(agentsValuePoints, envelope, maxAspectRatio, southernSide) {
	var valueFunctions = ValueFunction.createArray(2*agentsValuePoints.length-1, agentsValuePoints);
	var valuePerAgent = 2*agentsValuePoints.length - 1;
	return runDivisionAlgorithm(
			norm2Walls, southernSide,
			valuePerAgent, agentsValuePoints, envelope, maxAspectRatio, jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION);
};

jsts.algorithm.halfProportionalDivision1Walls = function(agentsValuePoints, envelope, maxAspectRatio, closedSide) {
	var southernSide = closedSide;
	var valuePerAgent = Math.max(1, 2*agentsValuePoints.length - 2);
	return runDivisionAlgorithm(
			norm1Walls, southernSide,
			valuePerAgent, agentsValuePoints, envelope, maxAspectRatio, jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION);
};

jsts.algorithm.halfProportionalDivision0Walls = function(agentsValuePoints, envelope, maxAspectRatio, closedSide) {
	var southernSide = jsts.Side.South;
	var valuePerAgent = Math.max(1, 2*agentsValuePoints.length - 4);
	return runDivisionAlgorithm(
			norm0Walls, southernSide,
			valuePerAgent, agentsValuePoints, envelope, maxAspectRatio, jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION);
};




/************ NORMALIZATION *******************/

var runDivisionAlgorithm = jsts.algorithm.runDivisionAlgorithm = function(normalizedDivisionFunction, southernSide, valuePerAgent, agentsValuePoints, envelope, maxAspectRatio, allowSingleValueFunction) {
	return runDivisionAlgorithm2(normalizedDivisionFunction, southernSide,
			ValueFunction.createArray(valuePerAgent, agentsValuePoints),
			envelope, maxAspectRatio, allowSingleValueFunction);
}


var runDivisionAlgorithm2 = jsts.algorithm.runDivisionAlgorithm2 = function(normalizedDivisionFunction, southernSide, valueFunctions, envelope, maxAspectRatio, allowSingleValueFunction) {
	if (valueFunctions.length==0) 
		return [];

	var rotateTransformation = {rotateQuarters: southernSide - jsts.Side.South};
	enveloper = jsts.algorithm.transformAxisParallelRectangle(rotateTransformation, {minx:envelope.minx, maxx:envelope.maxx, miny:envelope.miny, maxy:envelope.maxy});

	var width = enveloper.maxx-enveloper.minx, height = enveloper.maxy-enveloper.miny;
	if (height<=0 && width<=0)
		throw new Error("Zero-sized envelope: "+JSON.stringify(enveloper));
	if (width<=0)
		width = height/1000;
	var scaleFactor = (isFinite(width)? 1/width: 1);
	var translateFactor = 
		[isFinite(enveloper.minx)? -enveloper.minx: isFinite(enveloper.maxx)? -enveloper.maxx: 0,
		 isFinite(enveloper.miny)? -enveloper.miny: isFinite(enveloper.maxy)? -enveloper.maxy: 0];
	var yLength = height*scaleFactor;

	// transform the system so that the envelope is [0,1]x[0,L], where L>=1:
	var transformation = 
		[rotateTransformation,
		 {translate: translateFactor},
		 {scale: scaleFactor}];

	valueFunctions = valueFunctions.map(function(valueFunction) {
		// transform the points of the agent to the envelope [0,1]x[0,L]:
		var pointsInEnvelope = jsts.algorithm.pointsInEnvelope(valueFunction.points, envelope);
		if (pointsInEnvelope.length==0)  {
			TRACE(valueFunctions.length, " -- No points from "+JSON.stringify(valueFunction)+" are in envelope "+JSON.stringify(envelope));
			return null;
		} else {
			return valueFunction.cloneWithNewPoints(
					pointsInEnvelope.map(jsts.algorithm.transformedPoint.bind(0,transformation)));
		}
	});
	valueFunctions = valueFunctions.filter(function(x){return x}); // remove null elements

	if (valueFunctions.length==0)
		return [];

	if (valueFunctions.length>1 || allowSingleValueFunction)  {  // subjective valuations
		var maxVal = jsts.algorithm.FIND_DIVISION_WITH_LARGEST_MIN_VALUE? 
			_.min(_.pluck(valueFunctions,"totalValue")): 
			1;
		var minVal = 1;
		var landplots = [];
		
		for (var requiredLandplotValue=maxVal; requiredLandplotValue>=minVal; requiredLandplotValue--) {
			if (jsts.algorithm.FIND_DIVISION_WITH_LARGEST_MIN_VALUE) TRACE(10, ":: Trying "+requiredLandplotValue+" value per agent: ");
			landplots = normalizedDivisionFunction(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue);
			if (landplots.length==valueFunctions.length) {
				if (!landplots.minValuePerAgent)
					landplots.minValuePerAgent = requiredLandplotValue;
				break;
			} else {
				delete landplots.minValuePerAgent;
			}
		}
	} else {   // identical valuations
		var valueFunction = valueFunctions[0];
		var valuePerAgent = valueFunction.points.length-1;
		
		var commonRequiredLandplotValue = 1;
		var maxNumOfAgents = valueFunction.points.length;
		var valueFunctions = [];
		for (var i=0; i<maxNumOfAgents; ++i) 
			valueFunctions.push(valueFunction);
		
		while (valueFunctions.length>0) {
			TRACE(10, ":: Trying "+valueFunctions.length+" agents: ");
			valueFunction.setTotalValue(valuePerAgent);
			landplots = normalizedDivisionFunction(valueFunctions, yLength, maxAspectRatio, commonRequiredLandplotValue);
			if (landplots.length==valueFunctions.length) {
				landplots.minValuePerAgent = commonRequiredLandplotValue;
				break;
			}
			valueFunctions.pop();
		}
	}

	// transform the system back:
	var reverseTransformation = jsts.algorithm.reverseTransformation(transformation);
	landplots.forEach(
		jsts.algorithm.transformAxisParallelRectangle.bind(0,reverseTransformation));

	return landplots;
}



var factory = new jsts.geom.GeometryFactory();


/**
 * Normalized 4-walls algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength]
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n
 */
var norm4Walls = function(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue) {
	var initial = factory.createSimpleRectilinearPolygon([{x:0,y:0}, {x:0,y:1}, {x:1,y:1}, {x:1,y:0}, {x:0,y:0}]);
	return jsts.algorithm.rectilinearPolygonDivision(valueFunctions, initial, requiredLandplotValue);
		// defined in a separate file rectilinear-polygon-division.js
}




/**
 * Normalized 3-walls algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength]
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n-1
 * - Landplots may overflow the northern border
 */
var norm3Walls = function(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue) {
	var initial = [{y:0,minx:0,maxx:1}];  // levels 
//	return staircase3walls_allCoveringRectangles(valueFunctions, initial, requiredLandplotValue);
	return staircase3walls_cornerSquares(valueFunctions, initial, requiredLandplotValue);
}



/**
 * Normalized 3-walls staircase algorithm.
 * Each agent can draw squares in *all* 2k southern corners of *all* k covering squares.
 * 
 * - valueFunctions.length>=1
 * - levels.length >= 1; each level is represented by {y,minx,maxx}.
 * - levels are ordered by non-decreasing x value, from west to east.
 * - Value per agent: at least 2*n-2+levels.length
 */
var staircase3walls_allCoveringRectangles = function recurse(valueFunctions, levels, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	var numOfLevels = levels.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" using a 3-walls staircase algorithm with "+numOfLevels+" levels: "+JSON.stringify(levels));

	var rectangles = jsts.algorithm.rectanglesCoveringSouthernLevels(levels);

	// for each agent, calculate all level squares with value 1:
	valueFunctions.forEach(function(valueFunction) {
		var levelSquares = [];
		
		for (var i=0; i<rectangles.length; ++i) {
			var rectangle = rectangles[i];
			var minx=rectangle.minx, maxx=rectangle.maxx, miny=rectangle.miny;
			var squareSizeEast = valueFunction.sizeOfSquareWithValue({x:minx,y:miny}, requiredLandplotValue, "NE");
			var squareSizeWest = valueFunction.sizeOfSquareWithValue({x:maxx,y:miny}, requiredLandplotValue, "NW");

			if (minx+squareSizeEast <= maxx)
				levelSquares.push({minx:minx, miny:miny, maxx:minx+squareSizeEast, maxy:miny+squareSizeEast});

			if (maxx-squareSizeWest >= minx)
				levelSquares.push({maxx:maxx, miny:miny, minx:maxx-squareSizeWest, maxy:miny+squareSizeWest});
		}
		
		valueFunction.square = _.min(levelSquares, function(square){return square.maxy});
	});

	// get the agent with the square with the smallest height overall:
	var iWinningAgent = _.argmin(valueFunctions, function(valueFunction) {
		return valueFunction.square.maxy;
	});
	var winningAgent = valueFunctions[iWinningAgent];
	var winningSquare = winningAgent.square;

	if (!winningSquare || !isFinite(winningSquare.maxy)) {
		TRACE(numOfAgents, "-- no square with the required value "+requiredLandplotValue);
		if (requiredLandplotValue<=1)
			TRACE_NO_LANDPLOT(valueFunctions);
		return [];
	}

	var landplot = winningSquare;
	if (winningAgent.color) landplot.color = winningAgent.color;
	TRACE(numOfAgents, "++ agent "+iWinningAgent+" gets the landplot "+JSON.stringify(landplot));

	if (valueFunctions.length==1)
		return [landplot];

	var remainingValueFunctions = valueFunctions.slice(0,iWinningAgent).concat(valueFunctions.slice(iWinningAgent+1,valueFunctions.length));
	var remainingLevels = jsts.algorithm.updatedLevels(levels, landplot, "S");
	var remainingLandplots = recurse(remainingValueFunctions, remainingLevels, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;
}




/**
 * Normalized 3-walls staircase algorithm - alternative algorithm:
 * Each agent can draw squares only in knobs or the original polygon, or in corners or the original polygon after knobs with no squares have been removed.
 * 
 * - valueFunctions.length>=1
 * - levels.length >= 1; each level is represented by {y,minx,maxx}.
 * - levels are ordered by non-decreasing x value, from west to east.
 * - Value per agent: at least 2*n-2+levels.length
 */
var staircase3walls_cornerSquares = function recurse(valueFunctions, levels, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	var numOfLevels = levels.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" using a 3-walls staircase algorithm with "+numOfLevels+" levels: "+JSON.stringify(levels));
	jsts.algorithm.addPropertiesToLevels(levels);    // Add to each level the properties: "yWest", "yEast", "isKnob", "westMinx", "eastMaxx"

	var winningSquaresInLevels = [];

	// Bid for squares in all knobs; Remove all knobs with no square:
	for (var iLevel=0; iLevel<levels.length; ++iLevel) {
		var level = levels[iLevel];
		if (!level.isKnob || level.squares) 
			continue;

		// HERE we found a knob with no squares yet:
		calculateLevelSquares(valueFunctions, level, requiredLandplotValue);

		if (level.squares.length==0) {  
			// HERE no one wants a square in the current knob so we can remove it:
			TRACE(numOfAgents,"  level "+JSON.stringify(level)+": no agent wants a square - removing level");
			jsts.algorithm.removeLevel(levels, iLevel);
			iLevel = -1;  // structure has changed - start looping again
		} else {
			// HERE some agents want squares in the current knob - find the lowest one:
			var lowestSquareInLevel = _.min(level.squares, function(square){return square.maxy});
			winningSquaresInLevels.push(lowestSquareInLevel);
			TRACE(numOfAgents,"  level "+JSON.stringify(level)+": winning square is "+JSON.stringify(lowestSquareInLevel));
		}
	}

	// Bid for corner squares in all other levels (non-knobs);
	for (var iLevel=0; iLevel<levels.length; ++iLevel) {
		var level = levels[iLevel];
		if (level.squares) 
			continue;
		calculateLevelSquares(valueFunctions, level, requiredLandplotValue);
		if (level.squares.length==0) {  // do nothing
		} else {
			var lowestSquareInLevel = _.min(level.squares, function(square){return square.maxy});
			winningSquaresInLevels.push(lowestSquareInLevel);
			TRACE(numOfAgents,"  level "+JSON.stringify(level)+": winning square is "+JSON.stringify(lowestSquareInLevel));
		}
	}

	if (winningSquaresInLevels.length==0) {
		TRACE(numOfAgents, "-- no square with the required value "+requiredLandplotValue);
		if (requiredLandplotValue<=1)
			TRACE_NO_LANDPLOT(util.inspect(valueFunctions,{depth:3}));
		return [];
	}

	// get the agent with the square with the smallest height overall:
	var landplot = _.min(winningSquaresInLevels, function(square){return square.maxy});
	var iWinningAgent = landplot.iAgent;
	delete landplot.iAgent;
	var winningAgent = valueFunctions[iWinningAgent];

	if (winningAgent.color) landplot.color = winningAgent.color;
	TRACE(numOfAgents, "++ agent "+iWinningAgent+" gets the landplot "+JSON.stringify(landplot));
	
	if (valueFunctions.length==1)
		return [landplot];

	var remainingValueFunctions = valueFunctions.slice(0,iWinningAgent).concat(valueFunctions.slice(iWinningAgent+1,valueFunctions.length));
	var remainingLevels = jsts.algorithm.updatedLevels(levels, landplot, "S");
	for (var iLevel=0; iLevel<remainingLevels.length; ++iLevel) 
		delete remainingLevels[iLevel].squares;
	var remainingLandplots = recurse(remainingValueFunctions, remainingLevels, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;
}




var calculateLevelSquares = function(valueFunctions, level, requiredLandplotValue) {
	level.squares = [];
	var minx=level.minx, maxx=level.maxx, miny=level.y;
	if (level.yWest>level.y) {  // western corner is convex - bid for squares
		var swCorner = {x:minx,y:miny};
		for (var iAgent=0; iAgent<valueFunctions.length; ++iAgent) {
			var valueFunction = valueFunctions[iAgent];
			var squareSizeEast = valueFunction.sizeOfSquareWithValue(swCorner, requiredLandplotValue, "NE");
			if (minx+squareSizeEast <= maxx)
				level.squares.push({minx:minx, miny:miny, maxx:minx+squareSizeEast, maxy:miny+squareSizeEast, iAgent:iAgent});
		}
	}
	if (level.yEast>level.y) {  // eastern corner is convex - bid for squares
		var seCorner = {x:maxx,y:miny};
		for (var iAgent=0; iAgent<valueFunctions.length; ++iAgent) {
			var valueFunction = valueFunctions[iAgent];
			var squareSizeWest = valueFunction.sizeOfSquareWithValue(seCorner, requiredLandplotValue, "NW");
			if (maxx-squareSizeWest >= minx)
				level.squares.push({maxx:maxx, miny:miny, minx:maxx-squareSizeWest, maxy:miny+squareSizeWest, iAgent:iAgent});
		};
	}
}





/**
 * Normalized 2-walls algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,inf]x[0,inf]
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n-1
 * - Landplots may overflow the northern and/or the eastern borders
 */
var norm2Walls = function(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue) {
	var origin = {x:0,y:0};
	return staircase2walls(valueFunctions, origin, [origin], requiredLandplotValue);
}

/**
 * Normalized staircase algorithm:
 * - valueFunctions.length>=1
 * - corners.length >= 1
 * - corners are ordered by increasing y = decreasing x (from south-east to north-west)
 * - Value per agent: at least 2*n-2+corners.length
 */
var staircase2walls = function recurse(valueFunctions, origin, corners, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	var numOfCorners = corners.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" using a 2-walls staircase algorithm with "+numOfCorners+" corners: "+JSON.stringify(corners));

	// for each agent, calculate the acceptable corner square with the smallest taxicab distance from the origin:
	valueFunctions.forEach(function(valueFunction) {
		valueFunction.square = jsts.algorithm.cornerSquareWithMinTaxicabDistance(valueFunction, corners, requiredLandplotValue, "NE", origin)
	});

	// get the agent with the square with the smallest taxicab distance overall:
	var iWinningAgent = _.argmin(valueFunctions, function(valueFunction) {
		return valueFunction.square.t;
	});
	var winningAgent = valueFunctions[iWinningAgent];

	if (winningAgent===Infinity) winningAgent = {square:{t:Infinity}};  // bug in _.min
	
	if (!isFinite(winningAgent.square.t)) {
		TRACE(numOfAgents, "-- no square with the required value "+requiredLandplotValue);
		if (requiredLandplotValue<=1) 
			TRACE_NO_LANDPLOT(valueFunctions);
		return [];
	}

	var landplot = {
			minx: winningAgent.square.x,
			miny: winningAgent.square.y,
			maxx: winningAgent.square.x+winningAgent.square.s,
			maxy: winningAgent.square.y+winningAgent.square.s,
	};
	if (winningAgent.color) landplot.color = winningAgent.color;
	TRACE(numOfAgents, "++ agent "+iWinningAgent+" gets from the square "+JSON.stringify(winningAgent.square)+" the landplot "+JSON.stringify(landplot));
	
	if (valueFunctions.length==1)
		return [landplot];

	var remainingValueFunctions = valueFunctions.slice(0,iWinningAgent).concat(valueFunctions.slice(iWinningAgent+1,valueFunctions.length));
	var remainingCorners = jsts.algorithm.updatedCornersNorthEast(corners, landplot);
	var remainingLandplots = recurse(remainingValueFunctions, origin, remainingCorners, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;
}


/**
 * @return [westernValueFunctions, easternValueFunctions]
 */
var halvingEastWest  = function(valueFunctions, totalValue) {
	if (!totalValue)
		throw new Error("totalValue is 0");
	var FARWEST = {x:-400,y:0}, FAREAST={x:800,y:0};
	var numOfAgents = valueFunctions.length;
	var westValue, eastValue, numOfWesternAgents;
	if (numOfAgents%2==0) {
		numOfWesternAgents = numOfAgents/2;
		westValue = eastValue = totalValue/2;
	} else {
		numOfWesternAgents = (numOfAgents+1)/2;
		westValue = totalValue*(1+1/numOfAgents)/2;
		eastValue = totalValue*(1-1/numOfAgents)/2;
	}
	for (var i=0; i<valueFunctions.length; ++i) {
		delete valueFunctions[i].yCuts;
		if (valueFunctions[i].points.length==0) { // no points
			TRACE(numOfAgents, " -- No value points for agent "+i);
			TRACE_NO_LANDPLOT(valueFunctions);
			return [];
		}
		var westHalvingPoint = FARWEST.x + valueFunctions[i].sizeOfSquareWithValue(FARWEST, westValue, 'NE');
		var eastHalvingPoint = FAREAST.x - valueFunctions[i].sizeOfSquareWithValue(FAREAST, eastValue, 'NW');
		valueFunctions[i].halvingPoint = (westHalvingPoint+eastHalvingPoint)/2;
	}
	
	valueFunctions.sort(function(a,b){return a.halvingPoint-b.halvingPoint});

	var westernValueFunctions = valueFunctions.slice(0, numOfWesternAgents);
	var easternValueFunctions = valueFunctions.slice(numOfWesternAgents, numOfAgents);
	var halvingPoint = (westernValueFunctions[westernValueFunctions.length-1].halvingPoint+easternValueFunctions[0].halvingPoint)/2;
	
	TRACE(numOfAgents, " -- Halving at x="+halvingPoint+", giving the west to "+_.pluck(westernValueFunctions,"color")+" with halving points "+_.pluck(westernValueFunctions,"halvingPoint")+" and the east to "+_.pluck(easternValueFunctions,"color")+" with halving points "+_.pluck(easternValueFunctions,"halvingPoint"));
	
	return [westernValueFunctions, halvingPoint, easternValueFunctions];
}

/**
 * Normalized 1-wall algorithm using an initial halving and then 2 calls to the 2-walls algorithm.
 * - valueFunctions.length>=1
 * - maxAspectRatio>=1
 * - Landplots may overflow the east, west and north borders
 */
var norm1Walls = function(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" with 1 wall");

	if (numOfAgents<=1) {
		var valueFunction = valueFunctions[0];
		var minx = _.min(valueFunction.points, function(point){return point.x});
		var maxx = _.max(valueFunction.points, function(point){return point.x});
		var landplot = {
				minx: minx,
				miny: 0,
				maxx: maxx,
				maxy: maxx-minx,
		};
		var landplots = [landplot];
		landplots.minValuePerAgent = valueFunction.totalValue;
		return landplots;
	}
	
	var halving = halvingEastWest(valueFunctions, valueFunctions[0].totalValue);
		var westernValueFunctions = halving[0];
		var halvingPoint = halving[1];
		var easternValueFunctions = halving[2];
	
	var westernLandplots = runDivisionAlgorithm2(
			norm2Walls, 
			jsts.Side.East,
			westernValueFunctions, 
			new jsts.geom.Envelope(-Infinity,halvingPoint, 0,Infinity), 
			maxAspectRatio, /*allow single value function = */true);
	var easternLandplots = runDivisionAlgorithm2(
			norm2Walls,
			jsts.Side.South,
			easternValueFunctions,
			new jsts.geom.Envelope(halvingPoint,Infinity, 0,Infinity),
			maxAspectRatio, /*allow single value function = */true);
	var halvingLandplots = westernLandplots.concat(easternLandplots);
	halvingLandplots.minValuePerAgent = Math.min(westernLandplots.minValuePerAgent||0, easternLandplots.minValuePerAgent||0);

	TRACE(numOfAgents, " -- Trying to put everyone at the west");
	var easternOpenLandplots = runDivisionAlgorithm2(
			norm2Walls,
			jsts.Side.South,
			valueFunctions,
			new jsts.geom.Envelope(0,Infinity, 0,Infinity),
			maxAspectRatio, /*allow single value function = */true);
	
	TRACE(numOfAgents, " -- Trying to put everyone at the east");
	var westernOpenLandplots = runDivisionAlgorithm2(
			norm2Walls, 
			jsts.Side.East,
			valueFunctions, 
			new jsts.geom.Envelope(-Infinity,400, 0,Infinity), 
			maxAspectRatio, /*allow single value function = */true);

	return _.max(
		[halvingLandplots, easternOpenLandplots, westernOpenLandplots], 
		function(landplots){return landplots.minValuePerAgent});
}

/**
 * Normalized 0-wall algorithm using an initial halving and then 2 calls to the 1-wall algorithm.
 * - valueFunctions.length>=1
 * - maxAspectRatio>=1
 * - Landplots may overflow all borders.
 */
var norm0Walls = function(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" with 0 walls");

	if (numOfAgents<=1) {
		var valueFunction = valueFunctions[0];
		var minx = _.min(valueFunction.points, function(point){return point.x});
		var maxx = _.max(valueFunction.points, function(point){return point.x});
		var miny = _.min(valueFunction.points, function(point){return point.y});
		var maxy = _.max(valueFunction.points, function(point){return point.y});
		if (maxy-miny<maxx-minx)
			maxy = miny+(maxx-minx)
		else
			maxx = minx+(maxy-miny)
		var landplot = {
				minx: minx,
				miny: miny,
				maxx: maxx,
				maxy: maxy,
		};
		var landplots = [landplot];
		landplots.minValuePerAgent = valueFunction.totalValue;
		return landplots;
	}
	
	var halving = halvingEastWest(valueFunctions, valueFunctions[0].totalValue);
		var westernValueFunctions = halving[0];
		var halvingPoint = halving[1];
		var easternValueFunctions = halving[2];
	
	var westernLandplots = runDivisionAlgorithm2(
			norm1Walls, 
			jsts.Side.East,
			westernValueFunctions, 
			new jsts.geom.Envelope(-Infinity,halvingPoint, -Infinity,Infinity), 
			maxAspectRatio, /*allow single value function = */true);
	var easternLandplots = runDivisionAlgorithm2(
			norm1Walls,
			jsts.Side.West,
			easternValueFunctions,
			new jsts.geom.Envelope(halvingPoint,Infinity, -Infinity,Infinity),
			maxAspectRatio, /*allow single value function = */true);
	var halvingLandplots = westernLandplots.concat(easternLandplots);
	halvingLandplots.minValuePerAgent = Math.min(westernLandplots.minValuePerAgent||0, easternLandplots.minValuePerAgent||0);

	TRACE(numOfAgents, " -- Trying to put everyone at the west");
	var westernOpenLandplots = runDivisionAlgorithm2(
			norm1Walls,
			jsts.Side.East,
			valueFunctions,
			new jsts.geom.Envelope(-Infinity,400, -Infinity,Infinity),
			maxAspectRatio, /*allow single value function = */true);
	TRACE(numOfAgents, " -- Trying to put everyone at the east");
	var easternOpenLandplots = runDivisionAlgorithm2(
			norm2Walls, 
			jsts.Side.West,
			valueFunctions, 
			new jsts.geom.Envelope(0,Infinity, -Infinity,Infinity), 
			maxAspectRatio, /*allow single value function = */true);

	TRACE(numOfAgents, " -- Trying to put everyone at the north");
	var southernOpenLandplots = runDivisionAlgorithm2(
			norm1Walls,
			jsts.Side.East,
			valueFunctions,
			new jsts.geom.Envelope(-Infinity,Infinity, 0,Infinity),
			maxAspectRatio, /*allow single value function = */true);
	TRACE(numOfAgents, " -- Trying to put everyone at the south");
	var northernOpenLandplots = runDivisionAlgorithm2(
			norm2Walls, 
			jsts.Side.West,
			valueFunctions, 
			new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,400), 
			maxAspectRatio, /*allow single value function = */true);

	return _.max(
		[halvingLandplots, easternOpenLandplots, westernOpenLandplots, southernOpenLandplots, northernOpenLandplots],
		function(landplots){return landplots.minValuePerAgent});
}





/**
 * Normalized 1-wall algorithm:
 * - valueFunctions.length>=1
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n-1
 * - Landplots may overflow the east, west and north borders
 */
var norm1Walls_old = function(valueFunctions, yLength, maxAspectRatio, requiredLandplotValue) {
	//var initialCorners = [{x:-800,y:Infinity}, {x:-800,y:0}, {x:800,y:0}, {x:800,y:Infinity}];
	//return staircase3walls(valueFunctions, initialCorners, requiredLandplotValue);
	var bestLandplots = [];
	for (var x=0; x<=400; x+=10) {
		var origin = {x:x,y:0};
		var landplots = staircase1walls(valueFunctions, origin, [origin], [origin], requiredLandplotValue);
		if (landplots.length>bestLandplots.length)
			bestLandplots = landplots;
	}
	return bestLandplots;
}

/**
 * Normalized staircase algorithm:
 * - valueFunctions.length>=1
 * - corners.length >= 1
 * - corners are ordered by increasing y = decreasing x (from south-east to north-west)
 * - Value per agent: at least 2*n-2+corners.length
 */
var staircase1walls = function(valueFunctions, origin, westCorners, eastCorners, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" using a 1-wall staircase algorithm with origin="+JSON.stringify(origin)+" westCorners="+JSON.stringify(westCorners)+" eastCorners="+JSON.stringify(eastCorners));

	// for each agent, calculate the acceptable corner square with the smallest taxicab distance from the origin:
	valueFunctions.forEach(function(valueFunction) {
		valueFunction.eastSquare = jsts.algorithm.cornerSquareWithMinTaxicabDistance(valueFunction, eastCorners, requiredLandplotValue, "NE", origin);
		valueFunction.westSquare = jsts.algorithm.cornerSquareWithMinTaxicabDistance(valueFunction, westCorners, requiredLandplotValue, "NW", origin);
	});

	// get the agent with the square with the smallest taxicab distance overall:
	var eastWinningAgent = _.min(valueFunctions, function(valueFunction) {
		return valueFunction.eastSquare.t;
	});
	if (eastWinningAgent===Infinity) eastWinningAgent = {eastSquare:{t:Infinity}};  // bug in _.min
	
	var westWinningAgent = _.min(valueFunctions, function(valueFunction) {
		return valueFunction.westSquare.t;
	});
	if (westWinningAgent===Infinity) westWinningAgent = {westSquare:{t:Infinity}};  // bug in _.min
	
	if (!isFinite(eastWinningAgent.eastSquare.t) && !isFinite(westWinningAgent.westSquare.t)) {
		TRACE(numOfAgents, "-- no square with the required value "+requiredLandplotValue);
		if (requiredLandplotValue<=1) 
			TRACE_NO_LANDPLOT(valueFunctions);
		return [];
	} else if (eastWinningAgent.eastSquare.t<westWinningAgent.westSquare.t) {
		var winningAgent = eastWinningAgent;
		var winningSquare = winningAgent.eastSquare;
		var landplot = {
				minx: winningSquare.x,
				miny: winningSquare.y,
				maxx: winningSquare.x+winningSquare.s,
				maxy: winningSquare.y+winningSquare.s,
		};
		var remainingEastCorners = jsts.algorithm.updatedCornersNorthEast(eastCorners, landplot);
		var remainingWestCorners = westCorners;
	} else {
		var winningAgent = westWinningAgent;
		var winningSquare = winningAgent.westSquare;
		var landplot = {
				minx: winningSquare.x-winningSquare.s,
				miny: winningSquare.y,
				maxx: winningSquare.x,
				maxy: winningSquare.y+winningSquare.s,
		};
		var remainingWestCorners = jsts.algorithm.updatedCornersNorthWest(westCorners, landplot);
		var remainingEastCorners = eastCorners;
	}

	if (winningAgent.color) landplot.color = winningAgent.color;
	TRACE(numOfAgents, "++ agent "+winningAgent.index+" gets from the square "+JSON.stringify(winningSquare)+" the landplot "+JSON.stringify(landplot));
	
	if (valueFunctions.length==1)
		return [landplot];

	var remainingValueFunctions = valueFunctions.slice(0,winningAgent.index).concat(valueFunctions.slice(winningAgent.index+1,valueFunctions.length));
	var remainingLandplots = staircase1walls(remainingValueFunctions, origin, remainingWestCorners, remainingEastCorners, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;
}




/// TEMP








var colors = ['#000','#f00','#0f0','#ff0','#088','#808','#880'];
function color(i) {return colors[i % colors.length]}

var norm1WallsTemp = function(valueFunctions, yLength, maxAspectRatio) {
	var numOfAgents = valueFunctions.length;
	var valueFunction = valueFunctions[0];
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"): 1 Wall Algorithm");
	TRACE_NO_LANDPLOT(valueFunctions);
	
	var landplots = [];
	var previousSquare = null;
	var iColor = 0;
	var previousSize = Infinity;
	for (var x=-390; x<=390; x+=10) {
		var size = valueFunction.sizeOfSquareWithValue({x:x,y:0}, 2*valueFunction.valuePerPoint, 'NE');
		if (size>previousSize)
			iColor++;
		previousSize = size;

		if (!isFinite(size)) continue;

		var square = {minx:x,maxx:x+size, miny:0,maxy:size};
		var containedInPrevious = (previousSquare && square.maxx<=previousSquare.maxx && square.maxy<=previousSquare.maxy);
		if (containedInPrevious) {
			previousSquare.fill='transparent';
		}

		square.fill = square.stroke = color(iColor);
		landplots.push(square);
		previousSquare = square;
	}
	return landplots;
}

jsts.algorithm.mapOpenSidesToNormalizedAlgorithm = [];
jsts.algorithm.mapOpenSidesToNormalizedAlgorithm[0] = (norm4Walls);
jsts.algorithm.mapOpenSidesToNormalizedAlgorithm[1] = (norm3Walls);
jsts.algorithm.mapOpenSidesToNormalizedAlgorithm[2] = (norm2Walls);
jsts.algorithm.mapOpenSidesToNormalizedAlgorithm[3] = (norm1Walls);
jsts.algorithm.mapOpenSidesToNormalizedAlgorithm[4] = (norm0Walls);

},{"../../computational-geometry":1,"../../computational-geometry/lib/numeric-utils":14,"./ValueFunction":36,"./corners":37,"./rectilinear-polygon-division":41,"./square-with-max-points":42,"argminmax":44,"underscore":46,"util":52}],40:[function(require,module,exports){
var jsts = require("../../computational-geometry");
require("./square-with-max-points");
require("./corners");
require("./fair-division-of-points");
require("./half-proportional-division-staircase");
require("./rectilinear-polygon-division");
require("./test-division-algorithm")
jsts.stringify = function(object) {
	if (object instanceof Array) {
		return object.map(function(cur) {
			return cur.toString();
		});
	}
	else return object.toString();
}
module.exports = jsts;

},{"../../computational-geometry":1,"./corners":37,"./fair-division-of-points":38,"./half-proportional-division-staircase":39,"./rectilinear-polygon-division":41,"./square-with-max-points":42,"./test-division-algorithm":43}],41:[function(require,module,exports){
/**
 * Fairly cut a SimpleRectilinearPolygon such that each agent receives a square.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-09
 */

var jsts = require("../../computational-geometry");
var SimpleRectilinearPolygon = jsts.geom.SimpleRectilinearPolygon;
var ValueFunction = require("./ValueFunction");
var _ = require("underscore");
_.mixin(require("argminmax"));
var util = require("util");

function logValueFunctions(valueFunctions) {
	console.log(util.inspect(valueFunctions,{depth:3}));
}

function TRACE (numOfAgents, s) {
	console.log(Array(Math.max(0,6-numOfAgents)).join("   ")+s);
};

function TRACE_NO_LANDPLOT(valueFunctions) {
	logValueFunctions(valueFunctions);
}

function TRACE_PARTITION(numOfAgents, s, y, k, northAgents, northPlots, southAgents, southPlots) {
	TRACE(numOfAgents,s+"(k="+k+", y="+round2(y)+"): "+southAgents.length+" south agents ("+_.pluck(southAgents,"color")+") got "+southPlots.length+" plots and "+northAgents.length+" north agents ("+_.pluck(northAgents,"color")+") got "+northPlots.length+" plots.");
}



/**
 * @param agentsValuePoints an array of n>=1 or more valuation functions, represented by value points (x,y).
 * @param cake a SimpleRectilinearPolygon representing the cake to divide.
 * @return an array of n squares (minx,maxx,miny,maxy) representing the shares of the n agents.
 */
jsts.algorithm.rectilinearPolygonDivision = function recursive(valueFunctions, cake, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" from a cake "+cake.toString());
	
	var cakeCoveringData = new jsts.algorithm.MinSquareCoveringData(cake);

	valueFunctions.forEach(function(valueFunction) {
		valueFunction.candidateSquares = [];
	});

	TRACE(numOfAgents,"\nP="+cakeCoveringData.corners.toString());
	var knobs = cakeCoveringData.findAllSegmentsWithContinuators();
	var shouldRemoveKnobs = false;
	knobs.forEach(function(knob) {
		var knobLength = knob.length();
		var continuator = knob.getAdjacentSquareInPolygon();
		TRACE(numOfAgents,"\tprocessing knob "+knob.toString()+"\twith continuator "+JSON.stringify(continuator))
		
		var numOfCandidatesPerKnob = 0;
		var corner = knob.c0;
		var cornerCount = Math.min(4,knob.knobCount+1);
		for (var i=0; i<=cornerCount; ++i) {   // loop over all (convex) corners of the continuator:
			var directionOfPolygonInterior = corner.directionOfPolygonInterior();
			valueFunctions.forEach(function(valueFunction) {
				var squareSize = valueFunction.sizeOfSquareWithValue(corner, requiredLandplotValue, directionOfPolygonInterior);
				if (squareSize<=knobLength) {
					var x0 = corner.x
					  , x1 = corner.x + corner.signOfPolygonInteriorX()*squareSize
					  , y0 = corner.y
					  , y1 = corner.y + corner.signOfPolygonInteriorY()*squareSize;
					valueFunction.candidateSquares.push({minx:Math.min(x0,x1), miny:Math.min(y0,y1), maxx:Math.max(x0,x1), maxy:Math.max(y0,y1), size:squareSize});
					numOfCandidatesPerKnob++;
				}
			});
			corner = corner.next;
		};
		
		if (!numOfCandidatesPerKnob) {
			cakeCoveringData.removeErasableRegion(knob);
			shouldRemoveKnobs = true;
		}
	});
	
	if (shouldRemoveKnobs) {
		var newCake = cakeCoveringData.getResidualPolygon();
		return recursive(valueFunctions, newCake, requiredLandplotValue)
	}

	valueFunctions.forEach(function(valueFunction) {
		valueFunction.square = _.min(valueFunction.candidateSquares, function(square){
			return square.size
		});
	});
	
	// get the agent with the square with the smallest height overall:
	var iWinningAgent = _.argmin(valueFunctions, function(valueFunction) {
		return valueFunction.square.size;
	});
	
	var winningAgent = valueFunctions[iWinningAgent];
	var winningSquare = winningAgent.square;

	if (!winningSquare || !isFinite(winningSquare.size)) {
		TRACE(numOfAgents, "-- no square with the required value "+requiredLandplotValue);
		if (requiredLandplotValue<=1)
			TRACE_NO_LANDPLOT(valueFunctions);
		return [];
	}

	var landplot = winningSquare;
	if (winningAgent.color) landplot.color = winningAgent.color;
	TRACE(numOfAgents, "++ agent "+iWinningAgent+" gets the landplot "+JSON.stringify(landplot));

	if (valueFunctions.length==1)
		return [landplot];

	var remainingValueFunctions = valueFunctions.slice(0,iWinningAgent).concat(valueFunctions.slice(iWinningAgent+1,valueFunctions.length));
	var remainingCake = cake.removeRectangle(landplot);
	var remainingLandplots = recursive(remainingValueFunctions, remainingCake, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;
}


},{"../../computational-geometry":1,"./ValueFunction":36,"argminmax":44,"underscore":46,"util":52}],42:[function(require,module,exports){
/**
 * Calculate a square containing a maximal number of points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 * 
 * REVIEWED AND CORRECTED BY:
 * * Flambino
 * * abuzittin gillifirca
 * http://codereview.stackexchange.com/questions/46531/reducing-code-duplication-in-a-geometric-function
 */

var jsts = require('../../computational-geometry');
var _ = require("underscore");
var utils = require('../../computational-geometry/lib/numeric-utils');

/**
 * @param points array of points, e.g. [{x:0,y:0}, {x:100,y:100}, etc.]
 * @param envelope defines the bounding rectangle, e.g. {minx: 0, maxx: 100, miny: 0, maxy: 200}
 * @param maxAspectRatio number>=1: the maximum width/height ratio of the returned rectangle.
 * @return a rectangle contained within the envelope, with aspect ratio at most maxAspectRatio, that contains a largest number of points. 
 */
jsts.algorithm.squareWithMaxNumOfPoints = function(points, envelope, maxAspectRatio) {
	if (!maxAspectRatio) maxAspectRatio=1;
	var width = envelope.maxx-envelope.minx;
	var height = envelope.maxy-envelope.miny;
	var largestWidthPerHeight = maxAspectRatio*height;
	var largestHeightPerWidth = maxAspectRatio*width;
	var result = {};
	points = jsts.algorithm.pointsInEnvelope(points, envelope);
	if (width<=largestWidthPerHeight && height<=largestHeightPerWidth) {  
		// the envelope has aspect ratio at most maxAspectRatio, so just return it entirely:
		result = envelope;
	} else if (width>largestWidthPerHeight) {
		var miny = result.miny = envelope.miny;
		var maxy = result.maxy = envelope.maxy;
		var xValues = utils.sortedUniqueValues(points, ["x"]);
		if (xValues.length==0) {  // no x values in the envelope - just return any rectangle within the envelope
			result.minx = envelope.minx;
			result.maxx = result.minx+largestWidthPerHeight;
		} else {
			var maxNum   = 0;
			for (var i=0; i<xValues.length; ++i) {
				var minx = Math.min(xValues[i], envelope.maxx-largestWidthPerHeight);
				var maxx = minx+largestWidthPerHeight;
				var curNum = jsts.algorithm.numPointsInXY(points, minx,miny,maxx,maxy);
				if (curNum>maxNum) {
					maxNum = curNum;
					result.minx = minx;
					result.maxx = maxx;
				}
			}
		}
	} else {  // height>largestHeightPerWidth
		var minx = result.minx = envelope.minx;
		var maxx = result.maxx = envelope.maxx;
		var yValues = utils.sortedUniqueValues(points, ["y"]);
		if (yValues.length==0) {  // no y values in the envelope - just return any rectangle within the envelope
			result.miny = envelope.miny;
			result.maxy = result.miny+largestHeightPerWidth;
		} else { 
			var maxNum   = 0;
			for (var i=0; i<yValues.length; ++i) {
				var miny = Math.min(yValues[i], envelope.maxy-largestHeightPerWidth);
				var maxy = miny+largestHeightPerWidth;
				var curNum = jsts.algorithm.numPointsInXY(points, minx,miny,maxx,maxy);
				if (curNum>maxNum) {
					maxNum = curNum;
					result.miny = miny;
					result.maxy = maxy;
				}
			}
		}
	}
	return result;
}

},{"../../computational-geometry":1,"../../computational-geometry/lib/numeric-utils":14,"underscore":46}],43:[function(require,module,exports){
/**
 * Divide a cake such that each color gets a square with 1/2n of its points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('../../computational-geometry');
var ValueFunction = require("./ValueFunction");

var _ = require("underscore");
_.mixin(require("argminmax"));

var util = require("util");
var ValueFunction = require("./ValueFunction");

/**
 * Test the given algorithm with the given args (array) and make sure that every agent gets the required num of points.
 * 
 * @param algorithm a cake-cutting algorithm.
 * @param args [array] the arguments with which to call the algorithm. The first argument must be the agentsValuePoints.
 * @param requiredNum [int] number of points that should be in the landplot of every agent.
 * 
 * @return the landplots (the result of the division algorithm)
 */
jsts.algorithm.testDivisionAlgorithm = function(algorithm, args, requiredNum)  {
	var landplots = algorithm.apply(0, args);
	var agentsValuePoints = args[0];
	
	if (landplots.length<agentsValuePoints.length) {
		console.error(jsts.algorithm.agentsValuePointsToString(agentsValuePoints));
		throw new Error("Not enough land-plots: "+JSON.stringify(landplots));
	}
	agentsValuePoints.forEach(function(points) {
		if (points instanceof ValueFunction)
			points = points.points;
		landplots.forEach(function(landplot) {
			if (points.color == landplot.color) {
				var pointsInLandplot = jsts.algorithm.numPointsInEnvelope(points, landplot);
				if (pointsInLandplot<requiredNum) {
					throw new Error("Not enough points for "+landplot.color+": expected "+requiredNum+" but found only "+pointsInLandplot+" from "+JSON.stringify(points)+" in landplot "+JSON.stringify(landplot));
				}
			}
		})
	})
	return landplots;
 }


},{"../../computational-geometry":1,"./ValueFunction":36,"argminmax":44,"underscore":46,"util":52}],44:[function(require,module,exports){
var _ = require("underscore");

  // Internal function: creates a callback bound to its context if supplied
  // Copied from underscore.js: 
  // https://github.com/jashkenas/underscore/blob/master/underscore.js
  var createCallback = function(func, context, argCount) {
    if (!context) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(this, arguments);
    };
  };

// An internal function to generate lookup iterators. 
// Copied from underscore.js: 
// https://github.com/jashkenas/underscore/blob/master/underscore.js
  var lookupIterator = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return createCallback(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  };


module.exports = {
	// return the index of the smallest element in the array "obj".
	// If "iterator" is given, it is called on each element and the result is used for comparison. 
	argmin: function(obj, iterator, context) {
		var min = null, argmin = null,  value;
		if (iterator) iterator = lookupIterator(iterator, context);
		for (var i = 0, length = obj.length; i < length; i++) {
		    value = iterator? iterator(obj[i]): obj[i];
		    if (min==null || value < min) {
		      min = value;
		      argmin = i;
		    }
		};
		return argmin;
	},
	
	

	// return the index of the largest element in the array "obj".
	// If "iterator" is given, it is called on each element and the result is used for comparison. 
	argmax: function(obj, iterator, context) {
		var max = null, argmax = null,  value;
		if (iterator) iterator = lookupIterator(iterator, context);
		for (var i = 0, length = obj.length; i < length; i++) {
		    value = iterator? iterator(obj[i]): obj[i];
		    if (max==null || value > max) {
		    	max = value;
		    	argmax = i;
		    }
		  };
		return argmax;
	}
	
}



},{"underscore":45}],45:[function(require,module,exports){
module.exports=require(34)
},{}],46:[function(require,module,exports){
module.exports=require(34)
},{}],47:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],48:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],49:[function(require,module,exports){
var process=require("__browserify_process");// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

},{"__browserify_process":48}],50:[function(require,module,exports){
exports.isatty = function () { return false; };

function ReadStream() {
  throw new Error('tty.ReadStream is not implemented');
}
exports.ReadStream = ReadStream;

function WriteStream() {
  throw new Error('tty.ReadStream is not implemented');
}
exports.WriteStream = WriteStream;

},{}],51:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],52:[function(require,module,exports){
var process=require("__browserify_process"),global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

},{"./support/isBuffer":51,"__browserify_process":48,"inherits":47}]},{},[35])