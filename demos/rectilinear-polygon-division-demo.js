/**
 * Fairly cut a SimpleRectilinearPolygon such that each agent receives a square.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-09
 */

var jsts = require("../jsts-extended");
var SimpleRectilinearPolygon = jsts.geom.SimpleRectilinearPolygon;
var ValueFunction = require("../jsts-extended/ValueFunction");
var _ = require("underscore");

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

