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

