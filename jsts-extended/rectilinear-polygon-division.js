/**
 * Fairly cut a SimpleRectilinearPolygon such that each agent receives a square.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-09
 */

var jsts = require("../../computational-geometry");
var SimpleRectilinearPolygon = jsts.geom.SimpleRectilinearPolygon;
var ValueFunction = require("./ValueFunction");
var _ = require("underscore");


/**
 * @param agentsValuePoints an array of n>=1 or more valuation functions, represented by value points (x,y).
 * @param cake a SimpleRectilinearPolygon representing the cake to divide.
 * @return an array of n squares (minx,maxx,miny,maxy) representing the shares of the n agents.
 */
jsts.algorithm.rectilinearPolygonDivision = function(valueFunctions, cake) {
	var numOfAgents = valueFunctions.length;
	//TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" using a 4-walls staircase algorithm with border: "+JSON.stringify(border));
	var covering = jsts.algorithm.minSquareCovering(cake);
	
	if (numOfAgents==1) {
		var theAgent = valueFunctions[0];
		var bestSquare = _.max(covering, function(square){
			return theAgent.valueOf(square);
		})
		return [bestSquare];
	} else {
		return covering
	}
}



////////// TEST

var valuePerAgent= 1;
var factory = new jsts.geom.GeometryFactory();
var makePolygon = factory.createSimpleRectilinearPolygon.bind(factory);
var makeValuations = function(points,color) {
	return ValueFunction.create(valuePerAgent,points,color);
}
var divide = jsts.algorithm.rectilinearPolygonDivision;

var cake =      makePolygon([0,0, 10,10, 20,20]); // simple L-shape
var agent1 = makeValuations([5,5, 5,15, 6,16, 7,17, 15,15],'blue');

console.dir(divide([agent1], cake));

