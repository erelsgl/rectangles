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
	
	/**
	 * Construct a segment between two corners
	 */
	var Segment = function(c0, c1) {
		this.c0 = c0;
		this.c1 = c1;
		this.direction = (
			c0.y<c1.y? jsts.Side.North:
			c0.y>c1.y? jsts.Side.South:
			c0.x<c1.x? jsts.Side.East:
			c0.x>c1.x? jsts.Side.West:
			error("cannot decide the direction: "+JSON.stringify(c0)+", "+JSON.stringify(c1))
		);
		this.projectionList = new DoublyLinkedList();	 // all vertices visible to this segment
	}
	
	Segment.prototype.addVisibleCorner = function(corner)	 {	
		this.projectionList.append(corner);
	}

	Segment.prototype.isVertical = function()	 {	return jsts.isVertical(this.direction);	}
	Segment.prototype.isHorizontal = function() {	return jsts.isHorizontal(this.direction);	}
	
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
		this.s0 = s0;
		this.s1 = s1;
		this.turn = jsts.turn(s0.direction, s1.direction);
	}

		
		

	jsts.geom.SimpleRectilinearPolygon.prototype.createDataStructuresForSquareCovering = function() {
		/* Clone the sequence of corners in order to add more information: */
		var points = this.points;
		var corners = [];
		for (var i=0; i<points.length; ++i) 
			corners.push(new Corner(points[i]));
		this.corners = corners;
		
		/* Calculate the sequence of segments and the turn directions of the corners: */
		var segments = new DoublyLinkedList();
		var previousSegment = null;
		var totalTurn = 0;
		for (var i=0; i<corners.length-1; ++i) {
			var segment = new Segment(corners[i], corners[i+1]);
			segments.append(segment);
			if (previousSegment) {
				corners[i].setSegments(previousSegment,segment);
				totalTurn += corners[i].turn;
			}
			previousSegment = segment;
		}
		this.segments = segments;
		corners[0].setSegments(segments.last(), segments.first());
		corners[corners.length-1] = corners[0];
		totalTurn += corners[0].turn;
		this.turnDirection = jsts.turnDirection(totalTurn);

		/* Decide whether the corners are convex or concave, and calculate visibility information: */
		for (var i=0; i<corners.length; ++i) {
			var corner = corners[i];
			var isConvex = corner.isConvex = (corner.turn==this.turnDirection);
			if (!isConvex) {   // concave corner - calculate visibility information:
				corner.positiveVisibilitySegment = this.findClosestSegment(corner.s0.direction, corner);
				corner.positiveVisibilitySegment.addVisibleCorner(corner);
				corner.negativeVisibilitySegment = this.findClosestSegment(corner.s1.direction, corner);
				corner.negativeVisibilitySegment.addVisibleCorner(corner);
			}
		}

		/* Calculate visibility information: */
	}
	

	jsts.geom.SimpleRectilinearPolygon.prototype.findClosestSegment = function(direction, point) {
		var segments = this.segments;
		var closestSoFar = null;
		for (var s=segments.begin(); s!=segments.end(); s=s.next) {
			var segment = s.data;
			if (segment.isInDirectionOf(direction,point)) {
				if (!closestSoFar || closestSoFar.isInDirectionOfSegment(direction,segment))
					closestSoFar = segment;
			}
		}
		return closestSoFar;
	}

	/**
	 * @param point {x,y}
	 * @return true if the point is in the interior of the polygon.
	 * Uses the "even-odd rule" algorithm: https://en.wikipedia.org/wiki/Point_in_polygon
	 */
	jsts.geom.SimpleRectilinearPolygon.prototype.contains = function(point) {
		var intersections = 0;
		for (var s=this.segments.begin(); s!=this.segments.end(); s=s.next) {
			var segment = s.data;
			if (segment.contains(point))
				return false; // point is on the boundary.
			if (segment.isVerticalEastOf(point))
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

