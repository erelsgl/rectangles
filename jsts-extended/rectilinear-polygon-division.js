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

