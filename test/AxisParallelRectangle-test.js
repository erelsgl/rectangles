/**
 * a unit-test for maximum-disjoint-set based on JSTS.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var should = require('should');
var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var r0101 = factory.createAxisParallelRectangle({xmin:0,xmax:1, ymin:0,ymax:1});
var r0112 = factory.createAxisParallelRectangle({xmin:0,xmax:1, ymin:1,ymax:2});
var r0123 = factory.createAxisParallelRectangle({xmin:0,xmax:1, ymin:2,ymax:3});
var r1201 = factory.createAxisParallelRectangle({xmin:1,xmax:2, ymin:0,ymax:1});
var r2301 = factory.createAxisParallelRectangle({xmin:2,xmax:3, ymin:0,ymax:1});

var r1212 = factory.createAxisParallelRectangle({xmin:1,xmax:2, ymin:1,ymax:2});
var r2323 = factory.createAxisParallelRectangle({xmin:2,xmax:3, ymin:2,ymax:3});

var r0202 = factory.createAxisParallelRectangle({xmin:0,xmax:2, ymin:0,ymax:2});
var r0213 = factory.createAxisParallelRectangle({xmin:0,xmax:2, ymin:1,ymax:3});
var r0224 = factory.createAxisParallelRectangle({xmin:0,xmax:2, ymin:2,ymax:4});
var r1302 = factory.createAxisParallelRectangle({xmin:1,xmax:3, ymin:0,ymax:2});
var r2402 = factory.createAxisParallelRectangle({xmin:2,xmax:4, ymin:0,ymax:2});

var r1313 = factory.createAxisParallelRectangle({xmin:1,xmax:3, ymin:1,ymax:3});
var r2424 = factory.createAxisParallelRectangle({xmin:2,xmax:4, ymin:2,ymax:4});

describe('AxisParallelRectangle', function() {
	it('knows the interiorDisjoint relation', function() {
		r0101.interiorDisjoint(r0112).should.equal(true);
		r0101.interiorDisjoint(r0123).should.equal(true);
		r0101.interiorDisjoint(r1201).should.equal(true);
		r0101.interiorDisjoint(r2301).should.equal(true);
		r0101.interiorDisjoint(r1212).should.equal(true);
		r0101.interiorDisjoint(r2323).should.equal(true);

		r0101.interiorDisjoint(r0202).should.equal(false);
		r0101.interiorDisjoint(r0213).should.equal(true);
		r0101.interiorDisjoint(r0224).should.equal(true);
		r0101.interiorDisjoint(r1302).should.equal(true);
		r0101.interiorDisjoint(r2402).should.equal(true);
		
		r0202.interiorDisjoint(r1313).should.equal(false);
		r0202.interiorDisjoint(r2424).should.equal(true);
	})
})

