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

var testAllNumsOfPoints = function(setsOfPoints, landplots, requiredNum) {
	if (landplots.length<setsOfPoints.length) {
		console.dir(setsOfPoints);
		console.dir(landplots);
		throw new Error("Not enough land-plots");
	}
	setsOfPoints.forEach(function(points) {
		landplots.forEach(function(landplot) {
			if (points.color == landplot.color) {
				var pointsInLandplot = jsts.algorithm.numPointsInEnvelope(points, landplot);
				if (pointsInLandplot<requiredNum) {
					throw new Error("Not enough points for "+landplot.color+": expected "+requiredNum+" but found only "+pointsInLandplot+" from "+JSON.stringify(points)+" in landplot "+JSON.stringify(landplot));
				}
			}
		})
	})
}

var testAlgorithm = function(algorithm, args, requiredNum)  {
	var landplots = algorithm.apply(0, args);
	var agents = args[0];
	testAllNumsOfPoints(agents, landplots, requiredNum);
}

describe('4 walls algorithm', function() {
	it('single agent with 2 points', function() {
		var agent1 = [{x:100,y:100},{x:300,y:300}]; agent1.color='blue';
		testAlgorithm(alg4walls, [[agent1], square], 2);
		testAlgorithm(alg4walls, [[agent1], fatrect1], 1);
		testAlgorithm(alg4walls, [[agent1], thinrect1], 1);
	})

	it.skip('single agent with 2 points B', function() {
		var agent1 = [{x:0,y:0},{x:200,y:200},{x:600,y:600}]; agent1.color='blue';
		var envelope = {minx:0, miny:0, maxx:200, maxy:400}
		testAlgorithm(alg4walls, [[agent1], envelope], 2);
	})

	it.skip('single agent with 2 points C', function() {
		var agent1 = [{x:0,y:0},{x:200,y:200},{x:600,y:600}]; agent1.color='blue';
		var envelope = {minx:0, miny:0, maxx:400, maxy:200}
		testAlgorithm(alg4walls, [[agent1], envelope], 2);
	})
	
	it('single agent with 3 points on a diagonal', function() {
		var agent1 = [ { x: 0.25, y: 0.25 },
		               { x: 0.5, y: 0.5 },
		               { x: 0.75, y: 0.75 }]; agent1.color='blue';
		var envelope = { minx: 0, maxx: 1, miny: 0.5, maxy: 1 };
		testAlgorithm(alg4walls, [[agent1],envelope], 2);
	})

	it.skip('2 agents with same 3 points on a diagonal', function() {
		var agent1 = [{x:0,y:0},{x:200,y:200},{x:400,y:400}];  agent1.color='blue';
		var agent2 = agent1.slice(0);  agent2.color='red';
		testAlgorithm(alg4walls, [[agent1,agent2],square], 2);
	})

	it('2 agents with same 5 points - diagonal', function() {
		var agent1 = [{x:0,y:0},{x:100,y:100},{x:200,y:200},{x:300,y:300},{x:400,y:400}]; agent1.color='blue';
		var agent2 = agent1.slice(0);  agent2.color='red';
		testAlgorithm(alg4walls, [[agent1,agent2], square], 2);
	})

	it('2 agents with different 5 points - horizontal', function() {
		var agent1 = [{x:0,y:0},{x:100,y:0},{x:200,y:0},{x:300,y:0},{x:400,y:0}];  agent1.color='blue';
		var agent2 = [{x:0,y:400},{x:100,y:400},{x:200,y:400},{x:300,y:400},{x:400,y:400}];  agent2.color='red';
		testAlgorithm(alg4walls, [[agent1,agent2], square], 2);
	})
	
	it('2 agents with different 5 points - vertical', function() {
		var agent1 = [{y:0,x:0},{y:100,x:0},{y:200,x:0},{y:300,x:0},{y:400,x:0}];  agent1.color='blue';
		var agent2 = [{y:0,x:400},{y:100,x:400},{y:200,x:400},{y:300,x:400},{y:400,x:400}];  agent2.color='red';
		testAlgorithm(alg4walls, [[agent1,agent2], square], 2);
	})

	it.only('2 agents with same 5 points - L-shapes', function() {
		var agent1 = [{x:0,y:0},{x:0,y:100},{x:0,y:400},{x:100,y:0},{x:400,y:0}];  agent1.color='blue';
		var agent2 = agent1.slice(0);  agent2.color='red';
		testAlgorithm(alg4walls, [[agent1,agent2], square], 2);
	})

	it.skip('2 agents with same 5 points - L-shapes', function() {
		var agent1 = [{x:0,y:0},{x:0,y:100},{x:0,y:400},{x:100,y:400},{x:400,y:400}];  agent1.color='blue';
		var agent2 = agent1.slice(0);  agent2.color='red';
		testAlgorithm(alg4walls, [[agent1,agent2], square], 2);
	})
})

describe('3 walls algorithm', function() {
	var agent1 = [{x:0,y:0},{x:100,y:400}];  agent1.color='blue';
	it('single agent with 2 points and square', function() {
		alg3walls([agent1], square,  1, jsts.Side.East).should.eql([{ minx: 0, maxx: 400, miny: 0, maxy: 400, color:'blue' }]);
	});
	it('single agent with 2 points and fatrect', function() {
		alg3walls([agent1], fatrect1,1, jsts.Side.East).should.eql([{ minx: 0, maxx: 400, miny: 0, maxy: 400, color:'blue' }]);
	});
	it('single agent with 2 points', function() {
		alg3walls([agent1], fatrect1,1, jsts.Side.West).should.eql([{ minx: -100, maxx: 300, miny: 0, maxy: 400, color:'blue' }]);
		alg3walls([agent1], fatrect1,1, jsts.Side.North).should.eql([{ minx: 0, maxx: 300, miny: 0, maxy: 300, color:'blue' }]);
		alg3walls([agent1], fatrect1,1, jsts.Side.South).should.eql([{ minx: 0, maxx: 300, miny: 100, maxy: 400, color:'blue' }]);
		alg3walls([agent1], thinrect1,1, jsts.Side.East).should.eql([{ minx: 0, maxx: 400, miny: 0, maxy: 400, color:'blue' }]);
		alg3walls([agent1], thinrect1,1, jsts.Side.West).should.eql([{ minx: -300, maxx: 100, miny: 0, maxy: 400, color:'blue' }]);
		alg3walls([agent1], thinrect1,1, jsts.Side.North).should.eql([{ minx: 0, maxx: 100, miny: 0, maxy: 100, color:'blue' }]);
		alg3walls([agent1], thinrect1,1, jsts.Side.South).should.eql([{ minx: 0, maxx: 100, miny: 300, maxy: 400, color:'blue' }]);
	})
	it('single agent with infinite envelope', function() {
		alg3walls([agent1], new jsts.geom.Envelope(-Infinity,400, 0,400),  1, jsts.Side.West).should.eql([{ minx: -300, maxx: 100, miny: 0, maxy: 400, color: 'blue' }]);
		alg3walls([agent1], new jsts.geom.Envelope(0,Infinity, 0,400),  1, jsts.Side.East).should.eql([{ minx: 0, maxx: 400, miny: 0, maxy: 400, color: 'blue' }]);
		alg3walls([agent1], new jsts.geom.Envelope(0,400, -Infinity,400),  1, jsts.Side.South).should.eql([{ minx: 0, maxx: 400, miny: 0, maxy: 400, color: 'blue' }]);
		alg3walls([agent1], new jsts.geom.Envelope(0,400, 0,Infinity),  1, jsts.Side.North).should.eql([{ minx: 0, maxx: 400, miny: 0, maxy: 400, color: 'blue' }]);
	});
	
	it('2 agents with same 4 points in corners', function() {
		var agent1 = [{x:0,y:0},{x:0,y:400},{x:400,y:0},{x:400,y:400}]; agent1.color='blue';
		var agent2 = agent1.slice(0);  agent2.color='red';
		alg3walls([agent1,agent2], square,  1, jsts.Side.East).should.eql(
				[{ minx: 0, maxx: 400, miny: 0, maxy: 400, color:'blue' },
				 { minx: 400, maxx: 800, miny: 0, maxy: 400, color:'red' }]);
		alg3walls([agent1,agent2], square,  1, jsts.Side.West).should.eql(
				[{ minx: 0, maxx: 400, miny: 0, maxy: 400, color:'blue' },
				 { minx: -400, maxx: 0, miny: 0, maxy: 400, color:'red' }]);
	});
	
	it('2 agents with 4 points, simple solution fails', function() {
		var blue = [{x:10,y:390},{x:150,y:390},{x:250,y:390},{x:350,y:390},]; blue.color='blue'
		var red  = [{x:10,y:340},{x:350,y:340},{x:10,y:370},{x:350,y:370},];  red.color='red'
		testAlgorithm(alg3walls, [[blue,red], square,  1, jsts.Side.South], 2);
	})
	
	it('3 agents with 6 points, simple solution fails', function() {
		var blue = [{x:10,y:390},{x:80,y:390},{x:160,y:390},{x:240,y:390},{x:320,y:390},{x:390,y:390},]; blue.color='blue'
		var green = blue.slice(0);   green.color='green';
		var red  = [{x:10,y:340},{x:350,y:340},{x:10,y:355},{x:350,y:355},{x:10,y:370},{x:350,y:370},];  red.color='red'
		testAlgorithm(alg3walls, [[blue,red,green], square,  1, jsts.Side.South], 2);
	})
})
