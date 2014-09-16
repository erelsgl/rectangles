/**
 * a unit-test for half-proportional-division
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var should = require('should');
var jsts = require("../jsts-extended");
//console.dir(jsts.algorithm.transformPoint); process.exit(1)

var alg = jsts.algorithm.halfProportionalDivision; // shorthand
var halfplane_N    = new jsts.geom.Envelope(-Infinity,Infinity, 0,Infinity);
var halfplane_S    = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,400);

var testAlgorithm = jsts.algorithm.testAlgorithm;
var alg0walls = jsts.algorithm.halfProportionalDivision0Walls; // shorthand

describe('0 walls algorithm', function() {
	it('single agent with 2 points', function() {
		var agent1 = [{x:100,y:100},{x:300,y:300}]; agent1.color='blue';
		jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION = true;
		testAlgorithm(alg, [[agent1], halfplane_N], 2);
	})

	it('single agent on rotated quarterplane', function() {
		var agent1 = [{x:100,y:100},{x:300,y:300}]; agent1.color='blue';
		jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION = true;
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
		var points = [{x:150,y:10},{x:250,y:10},{x:170,y:110},{x:230,y:110}]; points.color='blue';
		jsts.algorithm.ALLOW_SINGLE_VALUE_FUNCTION = false;
		alg0walls([points], halfplane_N, 1, jsts.Side.South).length.should.be.above(1); // at least 2
	})
	
	it('2 agents with 4 points, bug', function() {
//			22,150,red:			22,50,red:			292,150,red:			292,50,red:
//			22,10,green:			162,200,green:			176,200,green:			292,10,green		
		var red  =  [{x:22,y:150},{x:22,y:50},{x:292,y:150},{x:292,y:50}];  red.color='red';
		var green = [{x:22,y:10},{x:162,y:200},{x:176,y:200},{x:292,y:10}];  green.color='green';
		alg0walls([red,green], halfplane_N, 1, jsts.Side.South).length.should.be.above(1); // at least 2
	})

	
	it('3 agents with 5/6 points, bug', function() {
//		10,50,red:	10,60,red:	80,50,red:	200,50,red:	360,50,red:
//		30,50,green:	290,50,green:	370,30,green:	370,40,green:	370,50,green:
//		50,50,blue:	50,60,blue:	130,130,blue:	150,250,blue:	270,120,blue:	270,260,blue		
		var red   = [{x:10,y:50},{x:10,y:60},{x:80,y:50},{x:200,y:50},{x:360,y:50}];  red.color='red';
		var green = [{x:30,y:50},{x:290,y:50},{x:370,y:30},{x:370,y:40},{x:370,y:50}];  green.color='green';
		var blue  = [{x:50,y:50},{x:50,y:60},{x:130,y:130},{x:150,y:250},{x:270,y:120},{x:270,y:260}];  blue.color='blue';
		alg0walls([red,green,blue], halfplane_N, 1, jsts.Side.South).length.should.be.above(2); // at least 3
	})
	
	it('6 agents with 10 points, eastern desert', function() {
		var points = [{x:5,y:10},{x:100,y:10},{x:150,y:10},{x:175,y:10},{x:190,y:10},{x:191,y:20},{x:192,y:40},{x:193,y:80},{x:194,y:160},{x:395,y:10},]; points.color='blue';
		alg0walls([points], halfplane_N, 1, jsts.Side.South).length.should.be.above(5);  // at least 6
	})
})


