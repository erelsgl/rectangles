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

var valuePerAgent= 1;
var factory = new jsts.geom.GeometryFactory();
var testAlgorithm = function(agents, cake, requiredNumOfPoints, requiredLandPlots) {
	agents = ValueFunction.createArray(valuePerAgent, agents);
	cake = factory.createSimpleRectilinearPolygon(cake);
	var landplots = jsts.algorithm.testDivisionAlgorithm(
		jsts.algorithm.rectilinearPolygonDivision, [agents,cake], 
		requiredNumOfPoints);
	if (requiredLandPlots)
		landplots.should.eql(requiredLandPlots);
	
}

describe('Rectilinear polygon division algorithm', function() {
	it('single agent', function() {
		var agent1 = [5,5, 5,15, 6,16, 7,17, 15,15];
		testAlgorithm([agent1], [0,0, 10,10, 20,20],   // an L-shape
				3, [{ minx: 0, maxx: 10, miny: 10, maxy: 20 }]);  //... give the north-western square
		testAlgorithm([agent1], [0,0, 14,6, 20,20],   // a larger L-shape
				3, [{ minx: 6, maxx: 20, miny: 6, maxy: 20 }]);  //... give the north-eastern square

		var agent2 = [0.5,0.5, 9.5,0.5, 10.5,1.5, 1.5,10.5, 1.6,10.6, 2.5,11.5, 11.5,2.5];
		testAlgorithm([agent2], [0,0, 10,1, 11,2, 12,3, 13,13, 3,12, 2,11, 1,10],  // 3 overlapping squares
				3, [{ minx: 1, maxx: 11, miny: 1, maxy: 11}]);  //... give the 2nd covering square
	})
});
