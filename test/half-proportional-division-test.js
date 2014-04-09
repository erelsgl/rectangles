/**
 * a unit-test for half-proportional-division
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var should = require('should');
var jsts = require("../jsts-extended");
var alg4walls = jsts.algorithm.halfProportionalDivision4Walls; // shorthand
var alg3walls = jsts.algorithm.halfProportionalDivision3Walls; // shorthand

var square    = new jsts.geom.Envelope(0,400, 0,400);
var fatrect1  = new jsts.geom.Envelope(0,300, 0,400); // a 2-fat rectangle
var fatrect2  = new jsts.geom.Envelope(0,400, 0,200); // a 2-fat rectangle
var thinrect1 = new jsts.geom.Envelope(0,100, 0,400); // a 2-fat rectangle
var thinrect2 = new jsts.geom.Envelope(0,400, 0,90); // a 2-fat rectangle

var testNumOfPoints = function(points, landplots, requiredNum) {
	landplots.forEach(function(landplot) {
		jsts.algorithm.numPointsInEnvelope(points, landplot).should.equal(requiredNum)
	})
}

describe('4 walls algorithm', function() {
	it('single agent with 2 points', function() {
		var agent1 = [{x:100,y:100},{x:300,y:300}];
		alg4walls([agent1],square).should.eql([{ minx: 0, maxx: 400, miny: 0, maxy: 400 }]);
		alg4walls([agent1],fatrect1).should.eql([{ minx: 0, maxx: 300, miny: 100, maxy: 400 }]);
		alg4walls([agent1],thinrect1).should.eql([{ minx: 0, maxx: 100, miny: 100, maxy: 200 }]);
	})

	it('single agent with 3 points on a diagonal', function() {
		var agent1 = [ { x: 0.25, y: 0.25 },
		               { x: 0.5, y: 0.5 },
		               { x: 0.75, y: 0.75 }];
		var envelope = { minx: 0, maxx: 1, miny: 0.5, maxy: 1 };
		testNumOfPoints(agent1, alg4walls([agent1],envelope), 2);
	})

	it('2 agents with same 3 points', function() {
		var agent = [{x:0,y:0},{x:200,y:200},{x:400,y:400}];
		alg4walls([agent,agent],square).should.eql(
				[{ minx: 0, maxx: 200, miny: 0, maxy: 200 },
				 { minx: 200, maxx: 400, miny: 200, maxy: 400 }]);
	})

	it('2 agents with same 5 points - diagonal', function() {
		var agent = [{x:0,y:0},{x:100,y:100},{x:200,y:200},{x:300,y:300},{x:400,y:400}];
		alg4walls([agent,agent],square).should.eql(
				[{ minx: 0, maxx: 200, miny: 0, maxy: 200 },
				 { minx: 200, maxx: 400, miny: 200, maxy: 400 }]);
	})

	it('2 agents with different 5 points - horizontal', function() {
		var agent1 = [{x:0,y:0},{x:100,y:0},{x:200,y:0},{x:300,y:0},{x:400,y:0}];
		var agent2 = [{x:0,y:400},{x:100,y:400},{x:200,y:400},{x:300,y:400},{x:400,y:400}];
		alg4walls([agent1,agent2],square).should.eql(
				[{ minx: 200, maxx: 400, miny: 0, maxy: 200 },
				 { minx: 200, maxx: 400, miny: 200, maxy: 400 }]);
	})
	
	it('2 agents with different 5 points - vertical', function() {
		var agent1 = [{y:0,x:0},{y:100,x:0},{y:200,x:0},{y:300,x:0},{y:400,x:0}];
		var agent2 = [{y:0,x:400},{y:100,x:400},{y:200,x:400},{y:300,x:400},{y:400,x:400}];
		alg4walls([agent1,agent2],square).should.eql(
				[{ minx: 0, maxx: 200, miny: 0, maxy: 200 },
				 { minx: 200, maxx: 400, miny: 200, maxy: 400 }]);
	})

	it('2 agents with same 5 points - L-shapes', function() {
		var agent = [{x:0,y:0},{x:0,y:100},{x:0,y:400},{x:100,y:0},{x:400,y:0}];
		alg4walls([agent,agent],square).should.eql(
				[{ minx: 0, maxx: 200, miny: 0, maxy: 200 },
				 { minx: 0, maxx: 200, miny: 200, maxy: 400 }]);
	})

	it('2 agents with same 5 points - L-shapes', function() {
		var agent = [{x:0,y:0},{x:0,y:100},{x:0,y:400},{x:100,y:400},{x:400,y:400}];
		alg4walls([agent,agent],square).should.eql(
				[{ minx: 0, maxx: 200, miny: 0, maxy: 200 },
				 { minx: 0, maxx: 200, miny: 200, maxy: 400 }]);
	})
})

describe('3 walls algorithm', function() {
	var agent1 = [{x:0,y:0},{x:100,y:400}];
	it('single agent with 2 points and square', function() {
		alg3walls([agent1], square,  1, jsts.Side.East).should.eql([{ minx: 0, maxx: 400, miny: 0, maxy: 400 }]);
	});
	it('single agent with 2 points and fatrect', function() {
		alg3walls([agent1], fatrect1,1, jsts.Side.East).should.eql([{ minx: 0, maxx: 400, miny: 0, maxy: 400 }]);
	});
	it('single agent with 2 points', function() {
		alg3walls([agent1], fatrect1,1, jsts.Side.West).should.eql([{ minx: -100, maxx: 300, miny: 0, maxy: 400 }]);
		alg3walls([agent1], fatrect1,1, jsts.Side.North).should.eql([{ minx: 0, maxx: 300, miny: 0, maxy: 300 }]);
		alg3walls([agent1], fatrect1,1, jsts.Side.South).should.eql([{ minx: 0, maxx: 300, miny: 100, maxy: 400 }]);
		alg3walls([agent1], thinrect1,1, jsts.Side.East).should.eql([{ minx: 0, maxx: 400, miny: 0, maxy: 400 }]);
		alg3walls([agent1], thinrect1,1, jsts.Side.West).should.eql([{ minx: -300, maxx: 100, miny: 0, maxy: 400 }]);
		alg3walls([agent1], thinrect1,1, jsts.Side.North).should.eql([{ minx: 0, maxx: 100, miny: 0, maxy: 100 }]);
		alg3walls([agent1], thinrect1,1, jsts.Side.South).should.eql([{ minx: 0, maxx: 100, miny: 300, maxy: 400 }]);
	})
})
