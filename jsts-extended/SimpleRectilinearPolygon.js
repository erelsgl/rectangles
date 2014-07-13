var jsts = require('jsts');

var LinkedList = require('jsclass/src/linked_list').LinkedList;
var DoublyLinkedList = LinkedList.Doubly.Circular;
var ListNode = LinkedList.Node;


(function() {
	
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
		this.length = Math.abs(this.c0.x-this.c1.x)+Math.abs(this.c0.y-this.c1.y);
		
		this.projectionList = new DoublyLinkedList();	 // All vertices visible to this segment; filled during initialization of polygon
		
		this.coveringSquares = new DoublyLinkedList();	 // All squares s selected for the cover and having the following properties:
			// a. s intersects the segment. (Note: every intersection of a square with the segment is on an original concave point???)
			// b. The two edges of s which are orthogonal to the segment are exposed.
			// c. There is a point in the polygon which is covered only by s (and not by any other square selected so far).
			// The squares for each segment are kept sorted by their appearance order.
	}
	
	Segment.prototype.addVisibleCorner = function(corner)	 {	
		var node = new ListNode(corner);   // we need a node because the same corner participates in two different projection lists - positive and negative
		this.projectionList.push(node);
		return node;
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
	
	Segment.prototype.distanceToCorner = function(corner) {
		return (this.isVertical()? 	
				Math.abs(corner.x-this.c0.x):
				Math.abs(corner.y-this.c0.y));
	}

	Segment.prototype.distanceToNearestCorner = function() {
		var nearestSoFar = Infinity;
		this.projectionList.forEach(function(node) {
			var corner = node.data;
			var distance = this.distanceToCorner(corner);
			if (distance<nearestSoFar)
				nearestSoFar = distance;
		}, this);
		return nearestSoFar;
	}

	Segment.prototype.isKnob = function() {
		return this.c0.isConvex && this.c1.isConvex;
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
		this.s0 = s0;  // incoming segment
		this.s1 = s1;  // outgoing segment
		this.turn = jsts.turn(s0.direction, s1.direction);
		this.isConvex = "?"; // will be calculated later
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
		this.positiveVisibilitySegment = positiveVisibilitySegment; // in the direction of the incoming segment, s0
		this.positiveVisibilityNode = positiveVisibilitySegment.addVisibleCorner(this);
		this.negativeVisibilitySegment = negativeVisibilitySegment; // in the opposite direction to the outgoing segment, s1
		this.negativeVisibilityNode = negativeVisibilitySegment.addVisibleCorner(this);
	}
	
	Corner.prototype.distanceToNearestSegment = function(direction) {
		if (this.isConvex) {
			if (direction==jsts.inverseSide(this.s0.direction)) {
				var segmentLength = this.s0.length;
				var nextCorner = this.s0.c0;
			} else if (direction==this.s1.direction) {
				var segmentLength = this.s1.length;
				var nextCorner = this.s1.c1;
			} else {
				return 0;
			}
			return segmentLength + 
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
		return "("+this.x+","+this.y+"; "+this.turn+","+(this.isConvex?"convex":"concave")+")";
	}
	

	
	
	jsts.geom.SimpleRectilinearPolygon.prototype.createDataStructuresForSquareCovering = function() {
		/* Clone the sequence of corners in order to add more information: */
		var points = this.points;
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
				totalTurn += corner.turn;
			}
			previousSegment = segment;
		}, this);
		this.segments = segments;
		corners.first.setSegments(segments.last, segments.first);
		totalTurn += corners.first.turn;
		this.turnDirection = jsts.turnDirection(totalTurn);

		/* Decide whether the corners are convex or concave, and calculate visibility information: */
		corners.forEach(function(corner) {
			var isConvex = corner.isConvex = (corner.turn==this.turnDirection);
			if (!isConvex) {   // concave corner - calculate visibility information:
				var positiveVisibilitySegment = this.findClosestSegment(corner.s0.direction, corner);
				var negativeVisibilitySegment = this.findClosestSegment(jsts.inverseSide(corner.s1.direction), corner);
				corner.setVisibilityInfo(positiveVisibilitySegment,negativeVisibilitySegment);
			}
		}, this)
	}
	

	jsts.geom.SimpleRectilinearPolygon.prototype.findClosestSegment = function(direction, point) {
		var segments = this.segments;
		var closestSoFar = null;
		segments.forEach(function(segment) {
			if (segment.isInDirectionOf(direction,point)) {
				if (!closestSoFar || closestSoFar.isInDirectionOfSegment(direction,segment))
					closestSoFar = segment;
			}
		});
		return closestSoFar;
	}

	/**
	 * @param point {x,y}
	 * @return true if the point is in the interior of the polygon.
	 * Uses the "even-odd rule" algorithm: https://en.wikipedia.org/wiki/Point_in_polygon
	 */
	jsts.geom.SimpleRectilinearPolygon.prototype.contains = function(point) {
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


	jsts.geom.SimpleRectilinearPolygon.prototype.getAllContinuators = function() {
		continuators = [];
		this.segments.forEach(function(segment) {
			if (!segment.isKnob()) return;
			
			// check if knob is continuator
			
			continuators.push(segment);
		});
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

