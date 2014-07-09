/**
 * a unit-test for maximum-disjoint-set based on JSTS.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var should = require('should');
var _ = require('underscore');
var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var South = jsts.Side.South;
var North = jsts.Side.North;
var East  = jsts.Side.East;
var West  = jsts.Side.West;
var Right = jsts.Turn.Right;
var Left = jsts.Turn.Left;

describe('SimpleRectilinearPolygon', function() {
	var srp1 = new jsts.geom.SimpleRectilinearPolygon([0,0, 10,20]);  // rectangle
	var srp2 = new jsts.geom.SimpleRectilinearPolygon([-10,0, 0,10, 10,0, 20,20]); // ח shape
	it('initializes from minimal set of xy values', function() {
		srp1.getCoordinates().should.eql(
			[ { x: 0, y: 0}, { x: 10, y: 0}, { x: 10, y: 20}, { x: 0, y: 20},  { x: 0, y: 0} ]);
		srp2.points.should.eql(
			[{x:-10,y:0}, {x:0,y:0}, {x:0,y:10}, {x:10,y:10},{x:10,y:0}, {x:20,y:0}, {x:20,y:20}, {x:-10,y:20}, {x:-10,y:0}]);
	})
	
	it('calculates the turn direction and convexity of corners', function() {
		_.pluck(srp1.corners, "turn").should.eql([Left,Left,Left,Left,Left]);
		_.pluck(srp2.corners, "turn").should.eql([Left,Left,Right,Right,Left,Left,Left,Left,Left]);

		_.pluck(srp1.corners, "isConvex").should.eql([true,true,true,true,true]);
		_.pluck(srp2.corners, "isConvex").should.eql([true,true,false,false,true,true,true,true,true]);
	})

	it('knows whether points are internal or external', function() {
		srp1.contains({x:5,y:10}).should.equal(true);   // internal
		srp1.contains({x:10,y:10}).should.equal(false); // boundary
		srp1.contains({x:16,y:10}).should.equal(false); // external
	})
	
	it('finds closest segments', function() {
		var point1 = {x:5,y:10};
		srp1.findClosestSegment(East, point1).getX().should.equal(10);
		srp1.findClosestSegment(West, point1).getX().should.equal(0);
		srp1.findClosestSegment(North, point1).getY().should.equal(20);
		srp1.findClosestSegment(South, point1).getY().should.equal(0);

		var point2 = {x:-5,y:5};
		srp2.findClosestSegment(East, point2).getX().should.equal(0);
		srp2.findClosestSegment(West, point2).getX().should.equal(-10);
		srp2.findClosestSegment(North, point2).getY().should.equal(20);
		srp2.findClosestSegment(South, point2).getY().should.equal(0);

		var point3 = {x:15,y:5};
		srp2.findClosestSegment(East, point3).getX().should.equal(20);
		srp2.findClosestSegment(West, point3).getX().should.equal(10);
		srp2.findClosestSegment(North, point3).getY().should.equal(20);
		srp2.findClosestSegment(South, point3).getY().should.equal(0);
	})
})
