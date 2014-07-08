var jsts = require('jsts');

var DoublyLinkedList = require('listish').DoublyLinkedList;

//console.dir(DoublyLinkedList.prototype.toString);


(function() {
	
	// return the first item of the list:
	DoublyLinkedList.prototype.begin = function() {
		return this.sentinel.next;
	}
	
	DoublyLinkedList.prototype.end = function() {
		return this.sentinel;
	}
	

	DoublyLinkedList.prototype.toJSON = function() {
		return this.items();
	}

	
	

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
	 * @param xy an array of alternating x and y values. 
	 * The points of the polygon are: (xy[0],xy[1]), (xy[2],xy[1]), (xy[2],xy[3]), ...
	 * @note the first side is always horizontal.
	 * @constructor
	 */
	jsts.geom.SimpleRectilinearPolygon = function(xy, factory) {
		if (!Array.isArray(xy))
			throw new Error("xy should be an array but is "+JSON.stringify(xy));
		if (xy.length==0)
			throw new Error("xy is empty: "+JSON.stringify(xy));

		var points;
		if (xy[0].x) {
			points = xy;	// xy is already an array of points
			if (points.length%2==0)
				throw new Error("odd number of points: "+JSON.stringify(points));
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
		jsts.geom.LinearRing.apply(this, [points, factory]);
		
		this.createDataStructuresForSquareCovering();
	};

	
	jsts.geom.SimpleRectilinearPolygon.prototype = new jsts.geom.LinearRing();
	jsts.geom.SimpleRectilinearPolygon.constructor = jsts.geom.SimpleRectilinearPolygon;

	
	/**	 DATA STRUCTURES FOR SQUARE COVERING
	 * Based on chapter 4 of Bar-Yehuda, R. and Ben-Hanoch, E. (1996). A linear-time algorithm for covering simple polygons with similar rectangles. International Journal of Computational Geometry & Applications, 6.01:79-102.
	 * 	http://www.citeulike.org/user/erelsegal-halevi/article/12475038
	 */
	
	var error = function(msg) {throw new Error(msg);}
	
	var Segment = function(v0, v1) {
		this.v0 = v0;
		this.v1 = v1;
		this.direction = (
			v0.y<v1.y? jsts.Side.North:
			v0.y>v1.y? jsts.Side.South:
			v0.x<v1.x? jsts.Side.East:
			v0.x>v1.x? jsts.Side.West:
			error("cannot decide the direction: "+JSON.stringify(v0)+", "+JSON.stringify(v1))
		);
		this.projectionList = new DoublyLinkedList();	 // all vertices visible to this segment
	}

	Segment.prototype.isVertical = function()	 {	return jsts.isVertical(this.direction);	}
	Segment.prototype.isHorizontal = function() {	return jsts.isHorizontal(this.direction);	}

	Segment.prototype.contains = function(point) {
		if (this.isVertical()) {
			return this.v0.x == point.x && (
				(this.v0.y >= point.y && point.y >= this.v1.y) ||
				(this.v0.y <= point.y && point.y <= this.v1.y) );
		} else {
			return this.v0.y == point.y && (
					(this.v0.x >= point.x && point.x >= this.v1.x) ||
					(this.v0.x <= point.x && point.x <= this.v1.x) );
		}
	}

	Segment.prototype.isEastOf = function(point) {
		return this.v0.x > point.x && (
				(this.v0.y >= point.y && point.y >= this.v1.y) ||
				(this.v0.y <= point.y && point.y <= this.v1.y) );
	}


	jsts.geom.SimpleRectilinearPolygon.prototype.createDataStructuresForSquareCovering = function() {
		var points = this.points;
		var segments = new DoublyLinkedList();
		var previousSegment = null;
		for (var i=0; i<points.length-1; ++i) {
			var segment = new Segment(points[i],points[i+1]);
			segments.append(segment);
			if (previousSegment) {
				points[i].turn = jsts.turn(previousSegment.direction, segment.direction);
			}
			previousSegment = segment;
		}
		points[0].turn = points[points.length-1].turn = jsts.turn(segments.last().direction, segments.first().direction);
		this.segments = segments;
	}

	/**
	 * @param point {x,y}
	 * @return true if the point is in the interior of the polygon.
	 * Uses the "even-odd rule" algorithm: https://en.wikipedia.org/wiki/Point_in_polygon
	 */
	jsts.geom.SimpleRectilinearPolygon.prototype.contains = function(point) {
		var intersections = 0;
		for (var item=this.segments.begin(); item!=this.segments.end(); item=item.next) {
			if (item.data.contains(point))
				return false; // point is on the boundary.
			if (item.data.isEastOf(point))
				intersections++;
		}
		return (intersections%2==1); // odd = internal; even = external
	}



	/**
	 * Creates and returns a full copy of this {@link Polygon} object. (including
	 * all coordinates contained by it).
	 *
	 * @return a clone of this instance.
	 */
	jsts.geom.SimpleRectilinearPolygon.prototype.clone = function() {
		return new jsts.geom.SimpleRectilinearPolygon(this.points, this.factory);
	};


	/**
	 * @return {String} String representation of Polygon type.
	 */
	jsts.geom.SimpleRectilinearPolygon.prototype.toString = function() {
		return 'SimpleRectilinearPolygon('+this.points+")";
	};
 
	jsts.geom.SimpleRectilinearPolygon.prototype.CLASS_NAME = 'jsts.geom.SimpleRectilinearPolygon';

	

	function coord(x,y)	{	return new jsts.geom.Coordinate(x,y); }

	/**
	 * Constructs a <code>Polygon</code> that is an axis-parallel rectangle with the given x and y values.
	 * 
	 * Can be called either with 4 parameters (minx,miny, maxx,maxy)
	 * or with a single parameter with 4 fields (minx,miny, maxx,maxy).
	 */
	jsts.geom.GeometryFactory.prototype.createSimpleRectilinearPolygon = function(xy) {
	return new jsts.geom.SimpleRectilinearPolygon(xy, this);
	};
	
	
})();

