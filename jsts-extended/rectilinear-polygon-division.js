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
var util = require("util");

function logValueFunctions(valueFunctions) {
	console.log(util.inspect(valueFunctions,{depth:3}));
}

function TRACE (numOfAgents, s) {
	console.log(Array(Math.max(0,6-numOfAgents)).join("   ")+s);
};

function TRACE_NO_LANDPLOT(valueFunctions) {
	logValueFunctions(valueFunctions);
}

function TRACE_PARTITION(numOfAgents, s, y, k, northAgents, northPlots, southAgents, southPlots) {
	TRACE(numOfAgents,s+"(k="+k+", y="+round2(y)+"): "+southAgents.length+" south agents ("+_.pluck(southAgents,"color")+") got "+southPlots.length+" plots and "+northAgents.length+" north agents ("+_.pluck(northAgents,"color")+") got "+northPlots.length+" plots.");
}



/**
 * @param agentsValuePoints an array of n>=1 or more valuation functions, represented by value points (x,y).
 * @param cake a SimpleRectilinearPolygon representing the cake to divide.
 * @return an array of n squares (minx,maxx,miny,maxy) representing the shares of the n agents.
 */
jsts.algorithm.rectilinearPolygonDivision = function(valueFunctions, cake, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" from a cake "+cake.toString());
	var covering = jsts.algorithm.minSquareCovering(cake);
	
	if (numOfAgents==1) {
		var theAgent = valueFunctions[0];
		var bestSquare = _.max(covering, function(square) {
			return theAgent.valueOf(square);
		})
		if (theAgent.valueOf(bestSquare)<requiredLandplotValue) {
			TRACE(numOfAgents, "-- no square with the required value "+requiredLandplotValue);
			if (requiredLandplotValue<=1)
				TRACE_NO_LANDPLOT(util.inspect(valueFunctions,{depth:3}));
			return [];
		}
		return [bestSquare];
	} else {
		return covering // just for trace
	}
}

