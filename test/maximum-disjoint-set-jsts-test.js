/**
 * a unit-test for maximum-disjoint-set based on JSTS.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var should = require('should');
var jsts = require("../jsts-extended");
var maximumDisjointSet = jsts.algorithm.maximumDisjointSet; // shorthand

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

var candidateRects = [r0101, r1212, r2323, r3434, r0202, r1313, r2424, r0303, r1414, r0404];

describe('MaximumDisjointSet in simple cases', function() {
	it('works for empty sets', function() {
		maximumDisjointSet([]).should.have.lengthOf(0);
	})

	it('works for single rectangles', function() {
		for (var i=0; i<candidateRects.length; ++i)
			maximumDisjointSet([candidateRects[i]]).should.have.lengthOf(1);
	})

	it('works for two identical rectangles', function() {
		for (var i=0; i<candidateRects.length; ++i)
			maximumDisjointSet([candidateRects[i], candidateRects[i]]).should.have.lengthOf(1);
	})
})

describe('MaximumDisjointSet with diagonal rectangles', function() {
	it('works for disjoint rectangles', function() {
		maximumDisjointSet([r0101,r2323]).should.have.lengthOf(2);
		maximumDisjointSet([r3434,r1212]).should.have.lengthOf(2);
	})

	it('works for interior-disjoint rectangles', function() {
		maximumDisjointSet([r0101,r1212]).should.have.lengthOf(2);
		maximumDisjointSet([r2323,r1212]).should.have.lengthOf(2);
	})

	it('works for intersecting rectangles', function() {
		maximumDisjointSet([r0202,r1313]).should.have.lengthOf(1);
		maximumDisjointSet([r2424,r1313]).should.have.lengthOf(1);
	})
})

describe('MaximumDisjointSet with vertical rectangles', function() {
	it('works for disjoint rectangles', function() {
		maximumDisjointSet([r0101,r0123]).should.have.lengthOf(2);
		maximumDisjointSet([r0134,r0112]).should.have.lengthOf(2);
	})

	it('works for interior-disjoint rectangles', function() {
		maximumDisjointSet([r0101,r0112]).should.have.lengthOf(2);
		maximumDisjointSet([r0123,r0112]).should.have.lengthOf(2);
	})

	it('works for intersecting rectangles', function() {
		maximumDisjointSet([r0202,r0213]).should.have.lengthOf(1);
		maximumDisjointSet([r0224,r0213]).should.have.lengthOf(1);
	})
})

describe('MaximumDisjointSet with horizontal rectangles', function() {
	it('works for disjoint rectangles', function() {
		maximumDisjointSet([r0101,r2301]).should.have.lengthOf(2);
		maximumDisjointSet([r3401,r1201]).should.have.lengthOf(2);
	})

	it('works for interior-disjoint rectangles', function() {
		maximumDisjointSet([r0101,r1201]).should.have.lengthOf(2);
		maximumDisjointSet([r2301,r1201]).should.have.lengthOf(2);
	})

	it('works for intersecting rectangles', function() {
		maximumDisjointSet([r0202,r1302]).should.have.lengthOf(1);
		maximumDisjointSet([r2402,r1302]).should.have.lengthOf(1);
	})
})

describe('MaximumDisjointSet with complex scenarios', function() {
	it('works with 3 disjoint rectangles', function() {
		var candidates=
			[ factory.createAxisParallelRectangle({ xmin: 1, xmax: 4, ymin: 1, ymax: 4 }),
			  factory.createAxisParallelRectangle({ xmin: 2, xmax: 6, ymin: 4, ymax: 8 }),
			  factory.createAxisParallelRectangle({ xmin: 4, xmax: 6, ymin: 1, ymax: 3 }) ];
		maximumDisjointSet(candidates).should.have.lengthOf(3);
	})
	it('works with 3 disjoint rectangles one of them contained in another', function() {
		var candidates=
			[ factory.createAxisParallelRectangle({ xmin: 1, xmax: 4, ymin: 1, ymax: 4 }),
			  factory.createAxisParallelRectangle({ xmin: 3, xmax: 6, ymin: 1, ymax: 4 }),
			  factory.createAxisParallelRectangle({ xmin: 4, xmax: 6, ymin: 1, ymax: 3 }) ];
		maximumDisjointSet(candidates).should.have.lengthOf(2);
	})
	it('works with 4 rectangles one of them contained in another', function() {
		var candidates=
			[ factory.createAxisParallelRectangle({ xmin: 1, xmax: 4, ymin: 1, ymax: 4 }),
			  factory.createAxisParallelRectangle({ xmin: 2, xmax: 6, ymin: 4, ymax: 8 }),
			  factory.createAxisParallelRectangle({ xmin: 3, xmax: 6, ymin: 1, ymax: 4 }),
			  factory.createAxisParallelRectangle({ xmin: 4, xmax: 6, ymin: 1, ymax: 3 }) ];
		maximumDisjointSet(candidates).should.have.lengthOf(3);
	})
	it('works with 5 rectangles that once caught a bug', function() {
		var candidates=[
	            factory.createAxisParallelRectangle({"xmin":-70,"ymin":110,"xmax":140,"ymax":320}),
	            factory.createAxisParallelRectangle({"xmin":90,"ymin":210,"xmax":200,"ymax":320}),
	            factory.createAxisParallelRectangle({"xmin":100,"ymin":110,"xmax":200,"ymax":210}),
	            factory.createAxisParallelRectangle({"xmin":140,"ymin":130,"xmax":220,"ymax":210}),
	            factory.createAxisParallelRectangle({"xmin":200,"ymin":130,"xmax":280,"ymax":210}),
	            ];
		maximumDisjointSet(candidates).should.have.lengthOf(3);
	})
	it('works with other 5 rectangles that once caught a bug', function() {
		var candidates=[
	            factory.createAxisParallelRectangle({"xmin":80,"ymin":30,"xmax":150,"ymax":100}),
	            factory.createAxisParallelRectangle({"xmin":99.99,"ymin":30,"xmax":169.99,"ymax":100}),
	            factory.createAxisParallelRectangle({"xmin":100,"ymin":99.99,"xmax":200,"ymax":199.99}),
	            factory.createAxisParallelRectangle({"xmin":130,"ymin":30,"xmax":200,"ymax":100}),
	            factory.createAxisParallelRectangle({"xmin":149.99,"ymin":30,"xmax":219.99,"ymax":100}),
	            ];
		maximumDisjointSet(candidates).should.have.lengthOf(1);
	})
})

