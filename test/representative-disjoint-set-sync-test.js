/**
 * a unit-test for maximum-disjoint-set based on JSTS.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var should = require('should');
var jsts = require("../jsts-extended");
var representativeDisjointSet = jsts.algorithm.representativeDisjointSet; // shorthand

var factory = new jsts.geom.GeometryFactory();

var r0101 = factory.createAxisParallelRectangle({xmin:0,xmax:1, ymin:0,ymax:1});
var r0112 = factory.createAxisParallelRectangle({xmin:0,xmax:1, ymin:1,ymax:2});
var r0123 = factory.createAxisParallelRectangle({xmin:0,xmax:1, ymin:2,ymax:3});
var r0134 = factory.createAxisParallelRectangle({xmin:0,xmax:1, ymin:3,ymax:4});
var r1201 = factory.createAxisParallelRectangle({xmin:1,xmax:2, ymin:0,ymax:1});
var r2301 = factory.createAxisParallelRectangle({xmin:2,xmax:3, ymin:0,ymax:1});
var r3401 = factory.createAxisParallelRectangle({xmin:3,xmax:4, ymin:0,ymax:1});

var r1212 = factory.createAxisParallelRectangle({xmin:1,xmax:2, ymin:1,ymax:2});
var r2323 = factory.createAxisParallelRectangle({xmin:2,xmax:3, ymin:2,ymax:3});
var r3434 = factory.createAxisParallelRectangle({xmin:3,xmax:4, ymin:3,ymax:4});

var r0202 = factory.createAxisParallelRectangle({xmin:0,xmax:2, ymin:0,ymax:2});
var r0213 = factory.createAxisParallelRectangle({xmin:0,xmax:2, ymin:1,ymax:3});
var r0224 = factory.createAxisParallelRectangle({xmin:0,xmax:2, ymin:2,ymax:4});
var r1302 = factory.createAxisParallelRectangle({xmin:1,xmax:3, ymin:0,ymax:2});
var r2402 = factory.createAxisParallelRectangle({xmin:2,xmax:4, ymin:0,ymax:2});

var r1313 = factory.createAxisParallelRectangle({xmin:1,xmax:3, ymin:1,ymax:3});
var r2424 = factory.createAxisParallelRectangle({xmin:2,xmax:4, ymin:2,ymax:4});
var r0303 = factory.createAxisParallelRectangle({xmin:0,xmax:3, ymin:0,ymax:3});
var r1414 = factory.createAxisParallelRectangle({xmin:1,xmax:4, ymin:1,ymax:4});
var r0404 = factory.createAxisParallelRectangle({xmin:0,xmax:4, ymin:0,ymax:4});

describe('representativeDisjointSet in simple cases', function() {
	it('works for empty set of sets', function() {
		representativeDisjointSet([]).should.have.lengthOf(0);
	})

	it('works for single set with single rectangles', function() {
		var rep = representativeDisjointSet([[r0101]]);
		rep.should.have.lengthOf(1);
		rep[0].should.equal(r0101);
	})

	it('works for single set with two rectangles', function() {
		var rep = representativeDisjointSet([[r0101, r1212]]);
		rep.should.have.lengthOf(1);
	})

	it('works for two sets with a single rectangles', function() {
		var rep = representativeDisjointSet([[r0101],[r1212]]);
		rep.should.have.lengthOf(2);
		rep[0].should.equal(r0101);
		rep[1].should.equal(r1212);
	})

	it('works for two identical sets with a single rectangles', function() {
		var rep = representativeDisjointSet([[r0101],[r0101]]);
		rep.should.have.lengthOf(1);
		rep[0].should.equal(r0101);
	})

	it('works for two identical sets with two rectangles', function() {
		var rep = representativeDisjointSet([[r0101,r1212],[r0101,r1212]]);
		rep.should.have.lengthOf(2);
		if (rep[0]!=r0101 && rep[0]!=r1212)
			throw new Error("wrong rep[0]");
		if (rep[1]!=r0101 && rep[1]!=r1212)
			throw new Error("wrong rep[1]");
	})
})

describe('representativeDisjointSet in interesting cases', function() {
	it('works for 2 sets with two different rectangles', function() {
		var blue1 = factory.createAxisParallelRectangle({xmin:300,xmax:390, ymin:150,ymax:250});
		var blue2 = factory.createAxisParallelRectangle({xmin:310,xmax:400, ymin:150,ymax:250});
		var red1 = factory.createAxisParallelRectangle({xmin:150,xmax:250, ymin:300,ymax:390});
		var red2 = factory.createAxisParallelRectangle({xmin:150,xmax:250, ymin:310,ymax:400});
		var candidateSets = [[blue1,blue2],[red1,red2]];
		var rep = representativeDisjointSet(candidateSets);
		rep.should.have.lengthOf(2);
//		console.dir(candidateSets[0]);
//		console.dir(candidateSets[1]);
	})
})


