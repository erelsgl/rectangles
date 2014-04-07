(function() {

  /**
   * Represents an axis-parallel rectangle.
   * Defined by: xmin, ymin, xmax, ymax.
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
  jsts.geom.AxisParallelRectangle = function(xmin,ymin, xmax,ymax, factory) {
	  this.xmin = Math.min(xmin,xmax);
	  this.ymin = Math.min(ymin,ymax);
	  this.xmax = Math.max(xmin,xmax);
	  this.ymax = Math.max(ymin,ymax);
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
    return (this.xmin==this.xmax || this.ymin==this.ymax);
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
		  this.area = (this.xmax-this.xmin)*(this.ymax-this.ymin);
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
		  this.length = 2*((xmax-xmin)+(ymax-ymin));
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
    return new jsts.geom.Envelope(this.xmin, this.xmax, this.ymin, this.ymax);
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
    return this.xmin==other.xmin && this.xmax==other.xmax && this.ymin==other.ymin && this.ymax==other.ymax;
  };

  jsts.geom.AxisParallelRectangle.prototype.compareToSameClass = function(o) {
	  return this.xmin==other.xmin && this.xmax==other.xmax && this.ymin==other.ymin && this.ymax==other.ymax;
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
    return new jsts.geom.AxisParallelRectangle(this.xmin, this.ymin, this.xmax, this.ymax, this.factory);
  };

  jsts.geom.AxisParallelRectangle.prototype.normalize = function() {
  };
  
  jsts.geom.AxisParallelRectangle.prototype.intersects = function(other) {
	  if (other instanceof jsts.geom.AxisParallelRectangle) {
		  return (
				  this.xmax>=other.xmin && other.xmax>=this.xmin && 
				  this.ymax>=other.ymin && other.ymax>=this.ymin
				 )
	  } else {
		  throw new "not implemented for "+other;
	  }
  }

  var Location = jsts.geom.Location;

//  jsts.geom.AxisParallelRectangle.prototype.relate2 = function(other) {
//	var im = new jsts.geom.IntersectionMatrix();
//	var II = (
//			  this.xmax>other.xmin && other.xmax>this.xmin && 
//			  this.ymax>other.ymin && other.ymax>this.ymin
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
				  this.xmax<=other.xmin || other.xmax<=this.xmin || 
				  this.ymax<=other.ymin || other.ymax<=this.ymin
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
				  this.xmin<x && x<this.xmax &&
				  this.ymin<y && y<this.ymax
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
    return 'RECTANGLE(['+this.xmin+","+this.xmax+"]x["+this.ymin+","+this.ymax+"])";
  };
  
  jsts.geom.AxisParallelRectangle.prototype.CLASS_NAME = 'jsts.geom.AxisParallelRectangle';

  

  function coord(x,y)  {  return new jsts.geom.Coordinate(x,y); }

  /**
   * Constructs a <code>Polygon</code> that is an axis-parallel rectangle with the given x and y values.
   * 
   * Can be called either with 4 parameters (xmin,ymin, xmax,ymax)
   * or with a single parameter with 4 fields (xmin,ymin, xmax,ymax).
   */
  jsts.geom.GeometryFactory.prototype.createAxisParallelRectangle = function(xmin,ymin, xmax,ymax) {
	if (arguments.length==1) {
		var envelope = xmin;
		if ('xmin' in envelope)
			return this.createAxisParallelRectangle(envelope.xmin, envelope.ymin, envelope.xmax, envelope.ymax);
		else if ('minx' in envelope)
			return this.createAxisParallelRectangle(envelope.minx, envelope.miny, envelope.maxx, envelope.maxy);
		else 
			throw new Error("envelope contains neither xmin nor minx: "+JSON.stringify(envelope));
	} else if (arguments.length==4) {
		return new jsts.geom.AxisParallelRectangle(xmin,ymin, xmax,ymax, this);
	} else {
		throw new Error("createAxisParallelRectangle expected 1 or 4 arguments, but found "+arguments.length)
	}
  };
  
})();
