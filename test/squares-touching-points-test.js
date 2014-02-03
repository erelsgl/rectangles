/**
 * a unit-test for maximum-disjoint-set
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */

var should = require('should');
var squaresTouchingPoints = require('../shared/squares-touching-points');

var p1={x:1,y:1};
var p2={x:2,y:4};
var p3={x:4,y:2};
var p4={x:5,y:5};

describe('squaresTouchingPoints in simple cases', function() {
	it('works for empty sets', function() {
		squaresTouchingPoints([]).should.have.lengthOf(0);
	})

	it('works for a single point', function() {
		squaresTouchingPoints([p1]).should.have.lengthOf(0);
	})
})

describe('squaresTouchingPoints without walls', function() {
	it('works for two points at left end', function() {
		squaresTouchingPoints([p1,p2],-Infinity,Infinity,-Infinity,Infinity).should.eql([
            {xmin:-1,ymin:1, xmax:2,ymax:4, color:'#000'},
            {xmin:1,ymin:1,  xmax:4,ymax:4, color:'#000'}]);
	})
	it('works for two points at right end', function() {
		squaresTouchingPoints([p3,p4],-Infinity,Infinity,-Infinity,Infinity).should.eql([
            {xmin:2,ymin:2, xmax:5,ymax:5, color:'#000'},
            {xmin:4,ymin:2, xmax:7,ymax:5, color:'#000'}]);
	})
})

describe('squaresTouchingPoints with walls', function() {
	it('works for two points and a single left wall', function() {
		squaresTouchingPoints([p1,p2], 0,Infinity, -Infinity,Infinity).should.eql([
            {xmin:0,ymin:1,  xmax:3,ymax:4, color:'#000'},
            {xmin:1,ymin:1,  xmax:4,ymax:4, color:'#000'}]);
	})
	it('works for two points and a single right wall', function() {
		squaresTouchingPoints([p3,p4],-Infinity,5,-Infinity,Infinity).should.eql([
            {xmin:2,ymin:2, xmax:5,ymax:5, color:'#000'},
            {xmin:2,ymin:2, xmax:5,ymax:5, color:'#000'}]);
	})
})
