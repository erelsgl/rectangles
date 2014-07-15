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
	
	DoublyLinkedList.prototype.isEmpty = function() {
		return this.length == 0; 
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
		var first = xy[0];
		if ((typeof first === 'object') && ('x' in first)) {
			points = xy;	// xy is already an array of points
			if (points.length%2==0)
				throw new Error("even number of points: "+JSON.stringify(points));
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
		
		if (this.isEmpty())
			throw new Error("Polygon is empty after initialization")
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
		
		this.projectionList = new DoublyLinkedList();	 // All vertices visible to this segment; filled during initialization of polygon
		
		this.coveringSquares = new DoublyLinkedList();	 // All squares s selected for the cover and having the following properties:
			// a. s intersects the segment. (Note: every intersection of a square with the segment is on an original concave point???)
			// b. The two edges of s which are orthogonal to the segment are exposed.
			// c. There is a point in the polygon which is covered only by s (and not by any other square selected so far).
			// The squares for each segment are kept sorted by their appearance order.
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

	Segment.prototype.isKnob = function() {
		return this.c0.isConvex && this.c1.isConvex;
	}

	Segment.prototype.distanceToNearestBorder = function() {
		return Math.min(
			this.distanceToNearestConcaveCorner(),
			Math.min(
				this.c0.distanceToNearestSegment(jsts.inverseSide(this.prev.direction)),
				this.c1.distanceToNearestSegment(this.next.direction)
			)
		);
	}
	
	Segment.prototype.hasContinuator = function() {
		if (!this.isKnob())
			return false;
		if (this.distanceToNearestBorder < this.length())
			return false;
		return true;
	}
	
	Segment.prototype.signOfPolygonInterior = function() {
		if (this.isVertical()) 
			return this.next.direction==jsts.Side.East? 1: -1;
		else
			return this.next.direction==jsts.Side.North? 1: -1;
	}
	
	Segment.prototype.continuator = function() {
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

	Segment.prototype.toString = function() {
		return "["+
			this.c0+" - "+this.c1+
			" , dir="+this.direction+
			(this.knobCount? ", knobCount="+this.knobCount: "") +
			"]";
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
				var segmentLength = this.s0.length();
				var nextCorner = this.s0.c0;
			} else if (direction==this.s1.direction) {
				var segmentLength = this.s1.length();
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
		}, this);
	}
	
	jsts.geom.SimpleRectilinearPolygon.prototype.isEmpty = function() {
		return this.corners.isEmpty();
	}
	
	jsts.geom.SimpleRectilinearPolygon.prototype.removeRectangle = function(knob,width) {
		
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

	
	/**
	 * @return the first knob in a continuator.
	 */
	jsts.geom.SimpleRectilinearPolygon.prototype.findContinuatorSegment = function() {
		var continuatorSegment = null;
		this.segments.forEach(function(segment) {
			if (!continuatorSegment && segment.hasContinuator()) {
				continuatorSegment = segment;
				// should break here, but it is not possible in JS...
			}
		});
		if (!continuatorSegment)
			throw new Error("No continuator found - this is impossible!");
		var knobCount = 1;
		var continuatorLength = continuatorSegment.length();
		while (continuatorSegment.prev.length()==continuatorLength && continuatorSegment.prev.isKnob() && knobCount<4) {
			continuatorSegment = continuatorSegment.prev;
			knobCount++;
		}
		var firstKnob = continuatorSegment;
		//console.log(firstKnob.toString())
		if (knobCount<3) {
			knobCount = 1;
			while (continuatorSegment.next.length() == continuatorLength && continuatorSegment.next.isKnob()) {
				continuatorSegment = continuatorSegment.next;
				knobCount++
			}
		}
		firstKnob.knobCount = knobCount;
		return firstKnob;
	}
	
	/**
	 *  remove the given segments and their c0 corners:
	 */
	jsts.geom.SimpleRectilinearPolygon.prototype.removeSegments = function(segments, removeCornersBeforeSegments) {
		for (var i=0; i<segments.length; ++i) {
			var segment = segments[i];
			this.segments.remove(segment);
			this.corners.remove(
					removeCornersBeforeSegments?
							segment.c0: segment.c1);
		}
	}
	
	
	jsts.geom.SimpleRectilinearPolygon.prototype.removeErasableRegion = function(knob) {
		if (!knob.isKnob()) {
			console.dir(knob);
			throw new Error("non-knob disguised as a knob!")
		}
		var exposedDistance0 = knob.prev.length();
		var exposedDistance1 = knob.next.length();
		var exposedDistance = Math.min(exposedDistance0,exposedDistance1);
		var coveredDistance = knob.length(); // TODO: calculate the actual covering distance
		var securityDistance = knob.distanceToNearestBorder() - knob.length();
		var nonExposedDistance = Math.min(coveredDistance,securityDistance);
		console.log("nonExposedDistance=min("+exposedDistance0+","+exposedDistance1+")="+nonExposedDistance+" exposedDistance="+exposedDistance);

		if (nonExposedDistance < exposedDistance) { // The knob just moves into the polygon:
			//console.log("knob before: "+knob);
			if (knob.isVertical())
				knob.c0.x = knob.c1.x = knob.c1.x + knob.signOfPolygonInterior()*nonExposedDistance;
			else 
				knob.c0.y = knob.c1.y = knob.c1.y + knob.signOfPolygonInterior()*nonExposedDistance;
			//console.log("knob after: "+knob);
		} else {  // nonExposedDistance >= exposedDistance some corners should be removed
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
	}
	
	jsts.geom.SimpleRectilinearPolygon.prototype.removeAll = function() {
		this.segments.initialize();
		this.corners.initialize();
	}


	jsts.geom.SimpleRectilinearPolygon.prototype.findMinimalCovering = function() {
		var P = this.clone();   // P is the residual polygon.
		if (P.isEmpty())
			throw new Error("cloned P is empty");
		var covering = [];       // C is the current covering.
		while (!P.isEmpty()) {
			var knob = P.findContinuatorSegment(); // returns the first knob in a continuator.
			var continuator = knob.continuator();
			console.log("P="+P.corners.toString())
			console.log("\tprocessing knob "+knob.toString()+" with continuator "+JSON.stringify(continuator))
			
			var balconyOfContinuatorIsCovered = false; // TODO: check whether the balcony is really covered, to avoid redundant squares.!
			if (!balconyOfContinuatorIsCovered)
				covering.push(continuator); 

			// Take action based on the continuator type - there are 7 options in the paper:
			switch (knob.knobCount) {
			case 1:
//				if (knob.prev.length() > knob.length && knob.next.length() > knob.length()) { // 1-knob, type right 
//					
//				} else if (knob.prev.length() > knob.length() && knob.next.length() < knob.length()) { // 1-knob, type middle
//					
//				} else if (knob.prev.length() < knob.length() && knob.next.length() > knob.length()) { // 1-knob, type middle
//					
//				} else if (knob.prev.length() < knob.length() && knob.next.length() < knob.length()) { // 1-knob, type left
//					
//				}
				P.removeErasableRegion(knob);
				break;
			case 2:
				if (knob.prev.length() < knob.length() && knob.next.next.length() < knob.length()) { // 2-knob, type right
					
				} else if (knob.prev.length() > knob.length() && knob.next.next.length() < knob.length()) { // 2-knob, type middle
					
				} else if (knob.prev.length() < knob.length() && knob.next.next.length() > knob.length()) { // 2-knob, type middle
					
				}
//				P.removeErasableRegion(knob);
				break;
			case 3:
//				P.removeErasableRegion(knob);
				break;
			case 4:
				P.removeAll();
				break;
			default: 
				console.dir(knob);
				throw new Error("illegal knobCount");
			}
		}
		
		return covering;
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
		return 'SimpleRectilinearPolygon(\n'+this.corners+"\n)";
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

