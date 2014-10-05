/**
 * Fairly cut a SimpleRectilinearPolygon such that each agent receives a square.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-09
 */

var jsts = require("../jsts-extended");
var ValueFunction = require("../jsts-extended/ValueFunction");
var _ = require("underscore");
require("should")

var COLORS = ['blue','green','red','yellow','black','cyan','magenta','white'];

var factory = new jsts.geom.GeometryFactory();
var testAlgorithm = function(agents, cake, requiredNumOfPoints) {
	var valuePerAgent = 2*(agents.length-1) + cake.length/2;
	var requiredLandplotValue = 1;
	agents = ValueFunction.createArray(valuePerAgent, agents);
	if (agents[0].valuePerPoint>=1)
		throw new Error("valuePerPoint="+agents[0].valuePerPoint+": probably an error in the test data")
	//console.dir(agents[0])
	for (var i=0; i<agents.length; ++i) 
		agents[i].color = COLORS[i];
	cake = factory.createSimpleRectilinearPolygon(cake);
	var landplots = jsts.algorithm.testDivisionAlgorithm(
		jsts.algorithm.rectilinearPolygonDivision, [agents,cake,requiredLandplotValue], 
		requiredNumOfPoints);
}

/* cakes */
var square = [0,0, 10,10];
var mediumLshape = [0,0, 10,10, 20,20];
var fatLshape = [0,0, 14,6, 20,20];
var pack3cards = [0,0, 10,1, 11,2, 12,3, 13,13, 3,12, 2,11, 1,10];
var hall4rooms = [0,0,4,1,12,0, 16,4,15,12,16,16, 12,15,4,16,0,12, 1,4];
var hall4roomsRectangular = [0,0, 300,50, 350,0, 390,60, 350,340, 390,400, 350,360, 50,400, 0,340, 50,310]

describe('Single agent', function() {
	var agent0 = [1,1, 1,9, 9,1, 9,9];
	it('square', function() {
		testAlgorithm([agent0], square, 4);  //... give the north-western square
	});
	
	
	var agent1 = [5,5, 5,15, 6,16, 7,17, 15,15];
	it('L-shape', function() {
		testAlgorithm([agent1], mediumLshape, 3);  //... give the north-western square
	});
	it('Fat L-shape', function() {
		testAlgorithm([agent1], fatLshape, 3);  //... give the north-eastern square
	});

	var agent2 = [0.5,0.5, 9.5,0.5, 10.5,1.5, 1.5,10.5, 1.6,10.6, 2.5,11.5, 11.5,2.5];
	it('Pack of 3 cards', function() {
		testAlgorithm([agent2], pack3cards, 3);  //... give the 2nd covering square
	});

	var agent3 = [0.5,2, 2,15.5, 14,0.5, 15.5,15.5, 8,8, 2,0.5];
	it('Hall and 4 rooms A', function() {
		testAlgorithm([agent3], hall4rooms, 2);  //... give the south-western room
	});

	var agent4 = [6,7, 7,7, 7,8, 7,9, 8,7, 8,8, 8,9, 9,7, 9,8, 9,9, 9,10];
	it('Hall and 4 rooms B', function() {
		// This test-case breaks the algorithm that uses only corner squares
		//		because all value is concentrated in the hall, which is not adjacent to any corner.
		testAlgorithm([agent4], hall4rooms, 2);
	});
});

describe('Two agents', function() {
	it('square', function() {
		var agent = [1,1, 1,9, 9,1, 9,9, 5,5];
		testAlgorithm([agent, agent], square, 2);
	});
	
	it('medium L-shape', function() {
		var agent = [1,1, 5,1, 9,1, 1,8, 1,19, 19,19];
		testAlgorithm([agent, agent], mediumLshape, 2);
	});
	
	it('fat L-shape', function() {  
		// This test-case breaks the algorithm that uses all covering squares, 
		//		because one of the selected squares makes the cake not-simply-connected.
		var land = [0,0, 20,10, 30,30];
		var agent = [18,18, 19,19, 1,1, 1,29, 29,29, 29,11]
		testAlgorithm([agent, agent], land, 2);
	});
	
	it('long fat L-shape A', function() {  
		var land = [0,0, 20,1, 21,30];
		var agent1 = [1,0, 19,0, 21,3, 21,5, 21,7, 21,9];
		testAlgorithm([agent1, agent1], land, 2);
	});
	
	it('long fat L-shape B', function() {  
		var land = [0,0, 20,1, 21,30];
		var agent2 = [1,0, 19,0, 21,3, 21,7, 21,30, 0,30];
		testAlgorithm([agent2, agent2], land, 2);
	});
	
	it('fLag-shape', function() {  
		// This test-case breaks the algorithm that uses all covering squares, 
		//		because one of the selected squares makes the cake not-simply-connected.
		var land = [0,0, 20,10, 60,60];
		var agent = [1,11, 21,11, 59,11, 59,59, 30,59, 1,59];
		testAlgorithm([agent, agent], land, 2);
	});
	
	it.only('hall with 4 rectangular rooms', function() {
		// This test-case breaks the algorithm that uses only corner squares
		//		because after allocating a single square, the remaining value is concentrated in the hall, which is not adjacent to any corner.
		var land = [0,0, 300,50, 350,0, 390,60, 350,340, 390,400, 350,360, 50,400, 0,340, 50,310];
		var agent = [0,0,300,0,0,310, 390,0,390,60, 390,340,390,400, 0,340,0,400, 350,90,350,150,350,210,350,260];
		testAlgorithm([agent, agent], hall4roomsRectangular, 2);
	})
});
