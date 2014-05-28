/**
 * a unit-test for half-proportional-division
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var should = require('should');
var jsts = require("../jsts-extended");

var alg = jsts.algorithm.halfProportionalDivision; // shorthand
var halfplane_N    = new jsts.geom.Envelope(-Infinity,Infinity, 0,Infinity);
var halfplane_S    = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,400);

var testAlgorithm = jsts.algorithm.testAlgorithm;
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

