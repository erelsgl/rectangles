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
		var squares = factory.createSquaresTouchingPoints([p1,p2], new jsts.geom.Envelope(-Infinity,Infinity,-Infinity,Infinity)).
			map(function(cur){return cur.toString()});
		squares.should.eql([ 'POLYGON((-1 1,2 1,2 4,-1 4,-1 1))',
		                     'POLYGON((1 1,4 1,4 4,1 4,1 1))' ]);
	})
	it('works for two points at right end', function() {
		var squares = factory.createSquaresTouchingPoints([p3,p4], new jsts.geom.Envelope(-Infinity,Infinity,-Infinity,Infinity)).
			map(function(cur){return cur.toString()});
		squares.should.eql([ 'POLYGON((2 2,5 2,5 5,2 5,2 2))',
		                     'POLYGON((4 2,7 2,7 5,4 5,4 2))' ]);
	})
})

describe('squaresTouchingPoints with walls', function() {
	it('works for two points and a single left wall', function() {
		var squares = factory.createSquaresTouchingPoints([p1,p2], new jsts.geom.Envelope(0,Infinity, -Infinity,Infinity)).
			map(function(cur){return cur.toString()});
		squares.should.eql([ 'POLYGON((0 1,3 1,3 4,0 4,0 1))',
		          		   'POLYGON((1 1,4 1,4 4,1 4,1 1))' ]);
	})
	it('works for two points and a single right wall', function() {
		var squares = factory.createSquaresTouchingPoints([p3,p4], new jsts.geom.Envelope(-Infinity,5,-Infinity,Infinity)).
			map(function(cur){return cur.toString()});
		squares.should.eql([ 'POLYGON((2 2,5 2,5 5,2 5,2 2))',
		                      'POLYGON((2 2,5 2,5 5,2 5,2 2))' ]);
	})
})
