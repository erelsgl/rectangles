/**
 * a unit-test for half-proportional-division
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var should = require('should');
var jsts = require("../jsts-extended");

var alg = jsts.algorithm.halfProportionalDivision; // shorthand
var quarterplane_NE    = new jsts.geom.Envelope(0,Infinity, 0,Infinity);
var quarterplane_SW    = new jsts.geom.Envelope(-Infinity,400, -Infinity,400);
var halfplane_N    = new jsts.geom.Envelope(-Infinity,Infinity, 0,Infinity);
var halfplane_S    = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,400);

var testAlgorithm = jsts.algorithm.testAlgorithm;

describe('2 walls algorithm', function() {
	it('single agent with 2 points', function() {
		var agent1 = [{x:100,y:100},{x:300,y:300}]; agent1.color='blue';
		testAlgorithm(alg, [[agent1], quarterplane_NE], 2);
	})

	it('single agent on rotated quarterplane', function() {
		var agent1 = [{x:100,y:100},{x:300,y:300}]; agent1.color='blue';
		testAlgorithm(alg, [[agent1], quarterplane_SW], 2);
	})
	
	it('2 agents with same 4 points in corners', function() {
		var agent1 = [{x:0,y:0},{x:0,y:400},{x:400,y:0},{x:400,y:400}]; agent1.color='blue';
		var agent2 = agent1.slice(0);  agent2.color='red';
		alg([agent1,agent2], quarterplane_NE).should.eql(
				[{ minx: 400, maxx: 800, miny: 0, maxy: 400, color:'red' },
				 { minx: 0, maxx: 400, miny: 0, maxy: 400, color:'blue' }]);
		alg([agent1,agent2], quarterplane_NE).should.eql(
				[{ minx: 400, maxx: 800, miny: 0, maxy: 400, color:'red' },
				 { minx: 0, maxx: 400, miny: 0, maxy: 400, color:'blue' }, ]);
	});
	
	it('2 agents with 4 points, simple solution fails', function() {
		var blue = [{x:10,y:390},{x:150,y:390},{x:250,y:390},{x:350,y:390},]; blue.color='blue'
		var red  = [{x:10,y:340},{x:350,y:340},{x:10,y:370},{x:350,y:370},];  red.color='red'
		testAlgorithm(alg, [[blue,red], quarterplane_NE], 2);
	})
	
	it('3 agents with 6 points, simple solution fails', function() {
		var blue = [{x:10,y:390},{x:80,y:390},{x:160,y:390},{x:240,y:390},{x:320,y:390},{x:390,y:390},]; blue.color='blue'
		var green = blue.slice(0);   green.color='green';
		var red  = [{x:10,y:340},{x:350,y:340},{x:10,y:355},{x:350,y:355},{x:10,y:370},{x:350,y:370},];  red.color='red'
		testAlgorithm(alg, [[blue,red,green], quarterplane_NE], 2);
	})
})


var alg3walls = jsts.algorithm.halfProportionalDivision3Walls; // shorthand
var sukka    = new jsts.geom.Envelope(0,400, 0,Infinity);

describe('3 walls algorithm', function() {
	it('single agent with 2 points A', function() {
		var agent1 = [{x:100,y:100},{x:250,y:100}]; agent1.color='blue';
		testAlgorithm(alg3walls, [[agent1], sukka], 2);
	})
	it('single agent with 2 points B', function() {
		var agent1 = [{x:100,y:100},{x:350,y:100}]; agent1.color='blue';
		testAlgorithm(alg3walls, [[agent1], sukka], 2);
	})

	it('2 agents with 4 points in corners - no intersection', function() {
		var agent1 = [{x:0,y:0},{x:0,y:300},{x:300,y:0},{x:300,y:300}]; agent1.color='blue';
		var agent2 = [{x:0,y:0},{x:0,y:400},{x:400,y:0},{x:400,y:400}]; agent2.color='red';
		//testAlgorithm(alg3walls, [[agent1,agent2], sukka], 6);
		alg3walls([agent1,agent2], sukka).should.eql(
				[{ maxx: 400, miny: 300, minx: 0, maxy: 700, color:'red' },
				 { minx: 0, miny: 0, maxx: 300, maxy: 300, color:'blue' }, ]);
	})

	it('3 agents with 6 points - r-shape bug', function() {
		var agent1 = [{x:10,y:0},{x:50,y:0},{x:100,y:0},{x:250,y:0},{x:310,y:0},{x:390,y:0}]; agent1.color='green';
		var agent2 = [{x:10,y:0},{x:60,y:0},{x:150,y:0},{x:200,y:0},{x:220,y:0},{x:390,y:0}]; agent2.color='blue';
		var agent3 = [{x:200,y:350},{x:210,y:350},{x:220,y:350},{x:230,y:350},{x:240,y:350},{x:250,y:350}]; agent2.color='red';
		//testAlgorithm(alg3walls, [[agent1,agent2], sukka], 6);
		testAlgorithm(alg3walls, [[agent1,agent2,agent3], sukka], 2);
	})

	it('3 agents with 6 points - 2-thin bug', function() {
		var agent1 = [{x:0,y:0},{x:180,y:0},{x:0,y:200},{x:100,y:200},{x:200,y:200},{x:300,y:200}]; agent1.color='blue';
		var agent2 = [{x:0,y:0},{x:0,y:190},{x:370,y:370},{x:370,y:380},{x:370,y:390},{x:370,y:400}]; agent2.color='green';
		var agent3 = [{x:0,y:0},{x:400,y:0},{x:0,y:220},{x:400,y:320},{x:400,y:360},{x:400,y:400}]; agent2.color='red';
		//testAlgorithm(alg3walls, [[agent1,agent2], sukka], 6);
		testAlgorithm(alg3walls, [[agent1,agent2,agent3], sukka], 2);
	})
});


var alg1walls = jsts.algorithm.halfProportionalDivision1Walls; // shorthand

describe('1 wall algorithm', function() {
	it('single agent with 2 points', function() {
		var agent1 = [{x:100,y:100},{x:300,y:300}]; agent1.color='blue';
		testAlgorithm(alg, [[agent1], halfplane_N], 2);
	})

	it('single agent on rotated quarterplane', function() {
		var agent1 = [{x:100,y:100},{x:300,y:300}]; agent1.color='blue';
		testAlgorithm(alg, [[agent1], halfplane_S], 2);
	})
	
	it('2 agents with 4 points, simple solution fails', function() {
		var blue = [{x:10,y:390},{x:150,y:390},{x:250,y:390},{x:350,y:390},]; blue.color='blue'
		var red  = [{x:10,y:340},{x:350,y:340},{x:10,y:370},{x:350,y:370},];  red.color='red'
		testAlgorithm(alg, [[blue,red], halfplane_N], 2);
	})
	
	it('3 agents with 6 points, simple solution fails', function() {
		var blue = [{x:10,y:390},{x:80,y:390},{x:160,y:390},{x:240,y:390},{x:320,y:390},{x:390,y:390},]; blue.color='blue'
		var green = blue.slice(0);   green.color='green';
		var red  = [{x:10,y:340},{x:350,y:340},{x:10,y:355},{x:350,y:355},{x:10,y:370},{x:350,y:370},];  red.color='red'
		testAlgorithm(alg, [[blue,red,green], halfplane_N], 2);
	})
	
	it('3 agents with 6 points, simple solution fails', function() {
		var blue = [{x:10,y:390},{x:80,y:390},{x:160,y:390},{x:240,y:390},{x:320,y:390},{x:390,y:390},]; blue.color='blue'
		var green = blue.slice(0);   green.color='green';
		var red  = [{x:10,y:340},{x:350,y:340},{x:10,y:355},{x:350,y:355},{x:10,y:370},{x:350,y:370},];  red.color='red'
		testAlgorithm(alg, [[blue,red,green], halfplane_N], 2);
	})

	it('2 agents with 4 points, 2-leg tower', function() {
		var points = [{x:150,y:10},{x:250,y:10},{x:170,y:110},{x:230,y:110},,]; points.color='blue';
		alg1walls([points], halfplane_N, 1, jsts.Side.South).length.should.be.above(2);
	})

	it('6 agents with 10 points, eastern desert', function() {
		var points = [{x:5,y:10},{x:100,y:10},{x:150,y:10},{x:175,y:10},{x:190,y:10},{x:191,y:20},{x:192,y:40},{x:193,y:80},{x:194,y:160},{x:395,y:10},]; points.color='blue';
		alg1walls([points], halfplane_N, 1, jsts.Side.South).length.should.be.above(6);
	})
})

