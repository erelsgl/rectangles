/**
 * a unit-test for maximum-disjoint-set
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */

var should = require('should');
var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var p1={x:1,y:1};
var p2={x:2,y:4};
var p3={x:4,y:2};
var p4={x:5,y:5};

describe('squaresTouchingPoints in simple cases', function() {
	it('works for empty sets', function() {
		factory.createSquaresTouchingPoints([]).should.have.lengthOf(0);
	})

	it('works for a single point', function() {
		factory.createSquaresTouchingPoints([p1]).should.have.lengthOf(0);
	})
})

describe('squaresTouchingPoints without walls', function() {
	it('works for two points at left end', function() {
		var squares = factory.createSquaresTouchingPoints([p1,p2], new jsts.geom.Envelope(-Infinity,Infinity,-Infinity,Infinity));
		jsts.stringify(squares).should.eql(
			['RECTANGLE([-1,2]x[1,4])', 'RECTANGLE([1,4]x[1,4])']);
	})
	it('works for two points at right end', function() {
		var squares = factory.createSquaresTouchingPoints([p3,p4], new jsts.geom.Envelope(-Infinity,Infinity,-Infinity,Infinity));
		jsts.stringify(squares).should.eql(
			['RECTANGLE([2,5]x[2,5])', 'RECTANGLE([4,7]x[2,5])']);
	})
})

describe('squaresTouchingPoints with walls', function() {
	it('works for two points and a single left wall', function() {
		var squares = factory.createSquaresTouchingPoints([p1,p2], new jsts.geom.Envelope(0,Infinity, -Infinity,Infinity));
		jsts.stringify(squares).should.eql(
				['RECTANGLE([0,3]x[1,4])', 'RECTANGLE([1,4]x[1,4])']);
	})
	it('works for two points and a single right wall', function() {
		var squares = factory.createSquaresTouchingPoints([p3,p4], new jsts.geom.Envelope(-Infinity,5,-Infinity,Infinity));
		jsts.stringify(squares).should.eql(
				['RECTANGLE([2,5]x[2,5])', 'RECTANGLE([2,5]x[2,5])']);
	})
})

describe('rotatedSquaresTouchingPoints without walls', function() {
	var p1 = {x:0,y:0};
	var p2 = {x:3,y:1};
	var p3 = {x:3,y:0};
	var p4 = {x:3,y:-1};
	it('works', function() {
		jsts.stringify(factory.createRotatedSquaresTouchingPoints([p1,p2])).should.eql(
				[ 'POLYGON((3 1,0 0,1 -3,4 -2,3 1))',
				  'POLYGON((3 1,2 -1,0 0,1 2,3 1))',
				  'POLYGON((3 1,0 0,-1 3,2 4,3 1))' ]
				);
		jsts.stringify(factory.createRotatedSquaresTouchingPoints([p1,p3])).should.eql(
				[ 'POLYGON((3 0,0 0,0 -3,3 -3,3 0))',
				  'POLYGON((3 0,1.5 -1.5,0 0,1.5 1.5,3 0))',
				  'POLYGON((3 0,0 0,0 3,3 3,3 0))' ]
				);
		jsts.stringify(factory.createRotatedSquaresTouchingPoints([p1,p4])).should.eql(
				[ 'POLYGON((3 -1,0 0,-1 -3,2 -4,3 -1))',
				  'POLYGON((3 -1,1 -2,0 0,2 1,3 -1))',
				  'POLYGON((3 -1,0 0,1 3,4 2,3 -1))' ]
				);
	});
})


