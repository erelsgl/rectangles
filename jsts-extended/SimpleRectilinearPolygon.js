(function() {

  /**
   * Represents a hole-free simply-connected polygon.
   * Contains special data structures for calculating the minimum square covering.
   * Based on Bar-Yehuda, R. and Ben-Hanoch, E. (1996). A linear-time algorithm for covering simple polygons with similar rectangles. International Journal of Computational Geometry & Applications, 6.01:79-102.
   * 	http://www.citeulike.org/user/erelsegal-halevi/article/12475038
   * 
   * @author Erel Segal-Halevi
   * @since 2014-07
   */


  /**
   * @requires jsts/geom/Geometry.js
   */

  /**
   * @extends {jsts.geom.Geometry}
   * @param xy an array of alternating x and y values. The corners of the polygon are:
   * 	(xy[0],xy[1]),(xy[1],xy[2]),...,(xy[n],xy[0]).
   * @constructor
   */
  jsts.geom.SimpleRectilinearPolygon = function(xy, factory) {
	  var points = [];
	  for (var i=0; i<xy.length-1; ++i) {
		  var point = {x:xy[i], y:xy[i+1]};
		  points.push(point);
	  }
	  point = {x:xy[i], y:xy[0]};  points.push(point);
	  point = {x:xy[0], y:xy[1]};  points.push(point);
	  
	  jsts.geom.LinearRing.apply(this, [points, factory]);
  };

  jsts.geom.SimpleRectilinearPolygon.prototype = new jsts.geom.LinearRing();
  jsts.geom.SimpleRectilinearPolygon.constructor = jsts.geom.SimpleRectilinearPolygon;


  /**
   * @return {boolean}
   */
  jsts.geom.SimpleRectilinearPolygon.prototype.isEmpty = function() {
    return (this.minx==this.maxx || this.miny==this.maxy);
  };

  jsts.geom.SimpleRectilinearPolygon.prototype.getExteriorRing = function() {
	  return this;
  };

  jsts.geom.SimpleRectilinearPolygon.prototype.getInteriorRingN = function(n) {
	  throw new Error("not implemented");
  };

  jsts.geom.SimpleRectilinearPolygon.prototype.getNumInteriorRing = function() {
    return 0;
  };

  /**
   * Returns the area of this <code>Polygon</code>
   *
   * @return the area of the polygon.
   */
  jsts.geom.SimpleRectilinearPolygon.prototype.getArea = function() {
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
  jsts.geom.SimpleRectilinearPolygon.prototype.getLength = function() {
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
  jsts.geom.SimpleRectilinearPolygon.prototype.getBoundary = function() {
	  return this;
  };

  jsts.geom.SimpleRectilinearPolygon.prototype.computeEnvelopeInternal = function() {
    return new jsts.geom.Envelope(this.minx, this.maxx, this.miny, this.maxy);
  };

  jsts.geom.SimpleRectilinearPolygon.prototype.getDimension = function() {
    return 2;
  };

  jsts.geom.SimpleRectilinearPolygon.prototype.getBoundaryDimension = function() {
    return 1;
  };


  /**
   * @param {Geometry}
   *          other
   * @param {number}
   *          tolerance
   * @return {boolean}
   */
  jsts.geom.SimpleRectilinearPolygon.prototype.equalsExact = function(other, tolerance) {
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

  jsts.geom.SimpleRectilinearPolygon.prototype.compareToSameClass = function(o) {
	  return this.minx==other.minx && this.maxx==other.maxx && this.miny==other.miny && this.maxy==other.maxy;
  };

  jsts.geom.SimpleRectilinearPolygon.prototype.apply = function(filter) {
	  throw new "not implemented";
  };

  jsts.geom.SimpleRectilinearPolygon.prototype.apply2 = function(filter) {
	  throw new "not implemented";
  };

  /**
   * Creates and returns a full copy of this {@link Polygon} object. (including
   * all coordinates contained by it).
   *
   * @return a clone of this instance.
   */
  jsts.geom.SimpleRectilinearPolygon.prototype.clone = function() {
    return new jsts.geom.SimpleRectilinearPolygon(this.minx, this.miny, this.maxx, this.maxy, this.factory);
  };

  jsts.geom.SimpleRectilinearPolygon.prototype.normalize = function() {
  };
  
  jsts.geom.SimpleRectilinearPolygon.prototype.intersects = function(other) {
	  if (other instanceof jsts.geom.SimpleRectilinearPolygon) {
		  return (
				  this.maxx>=other.minx && other.maxx>=this.minx && 
				  this.maxy>=other.miny && other.maxy>=this.miny
				 )
	  } else {
		  throw new "not implemented for "+other;
	  }
  }

  var Location = jsts.geom.Location;

//  jsts.geom.SimpleRectilinearPolygon.prototype.relate2 = function(other) {
//	var im = new jsts.geom.IntersectionMatrix();
//	var II = (
//			  this.maxx>other.minx && other.maxx>this.minx && 
//			  this.maxy>other.miny && other.maxy>this.miny
//			 );
//    im.setAtLeast('FFFFFFFFF');
//	im.set(Location.INTERIOR, Location.INTERIOR, II? "2": "F");
//	return im;
//  }
  
  jsts.geom.SimpleRectilinearPolygon.prototype.overlaps = function(other) {
	  if (other instanceof jsts.geom.SimpleRectilinearPolygon) {
		  return !this.interiorDisjoint(other) && !this.contains(other) && !other.contains(this);
	  } else {
		  throw new "not implemented for "+other;
	  }
  }
  
  jsts.geom.SimpleRectilinearPolygon.prototype.interiorDisjoint = function(other) {
	  if (other instanceof jsts.geom.SimpleRectilinearPolygon) {
		  return (
				  this.maxx<=other.minx || other.maxx<=this.minx || 
				  this.maxy<=other.miny || other.maxy<=this.miny
				 );
	  } else {
		  throw new "not implemented for "+other;
	  }
  }
  
  jsts.geom.SimpleRectilinearPolygon.prototype.contains = function(other) {
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
  jsts.geom.SimpleRectilinearPolygon.prototype.getGeometryType = function() {
    return 'Polygon';
  };

  /**
   * @return {String} String representation of Polygon type.
   */
  jsts.geom.SimpleRectilinearPolygon.prototype.toString = function() {
    return 'RECTANGLE(['+this.minx+","+this.maxx+"]x["+this.miny+","+this.maxy+"])";
  };
  
  jsts.geom.SimpleRectilinearPolygon.prototype.CLASS_NAME = 'jsts.geom.SimpleRectilinearPolygon';

  

  function coord(x,y)  {  return new jsts.geom.Coordinate(x,y); }

  /**
   * Constructs a <code>Polygon</code> that is an axis-parallel rectangle with the given x and y values.
   * 
   * Can be called either with 4 parameters (minx,miny, maxx,maxy)
   * or with a single parameter with 4 fields (minx,miny, maxx,maxy).
   */
  jsts.geom.GeometryFactory.prototype.createSimpleRectilinearPolygon = function(minx,miny, maxx,maxy) {
	if (arguments.length==1) {
		var envelope = minx;
		return new jsts.geom.SimpleRectilinearPolygon(envelope.minx, envelope.miny, envelope.maxx, envelope.maxy, this);
	} else if (arguments.length==4) {
		return new jsts.geom.SimpleRectilinearPolygon(minx,miny, maxx,maxy, this);
	} else {
		throw new Error("createSimpleRectilinearPolygon expected 1 or 4 arguments, but found "+arguments.length)
	}
  };
})();


