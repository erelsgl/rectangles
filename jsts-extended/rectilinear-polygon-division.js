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
_.mixin(require("argminmax"));
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
jsts.algorithm.rectilinearPolygonDivision = function recursive(valueFunctions, cake, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" from a cake "+cake.toString());
	
	var cakeCoveringData = new jsts.algorithm.MinSquareCoveringData(cake);
	var covering = jsts.algorithm.minSquareCovering(cake);
	
	if (false && numOfAgents==1) {
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

		// for each agent, calculate all corner squares with value 1:
		valueFunctions.forEach(function(valueFunction) {
			var candidateSquares = [];

			for (var i=0; i<covering.length; ++i) {
				var coveringSquare = covering[i];
				var minx=coveringSquare.minx, maxx=coveringSquare.maxx, miny=coveringSquare.miny, maxy=coveringSquare.maxy;
				
				var SW = {x:minx,y:miny}
				  , SE = {x:maxx,y:miny}
				  , NW = {x:minx,y:maxy}
				  , NE = {x:maxx,y:maxy}
				  ;
				
				var squareSizeSW = valueFunction.sizeOfSquareWithValue(SW, requiredLandplotValue, "NE")
				  , squareSizeSE = valueFunction.sizeOfSquareWithValue(SE, requiredLandplotValue, "NW")
				  , squareSizeNW = valueFunction.sizeOfSquareWithValue(NW, requiredLandplotValue, "SE")
				  , squareSizeNE = valueFunction.sizeOfSquareWithValue(NE, requiredLandplotValue, "SW")
				  ;

				if (minx+squareSizeSW <= maxx && miny+squareSizeSW <= maxy && cakeCoveringData.hasConvexCorner(SW))
					candidateSquares.push({minx:minx, miny:miny, maxx:minx+squareSizeSW, maxy:miny+squareSizeSW, size:squareSizeSW});

				if (maxx-squareSizeSE >= minx && miny+squareSizeSE <= maxy && cakeCoveringData.hasConvexCorner(SE))
					candidateSquares.push({minx:maxx-squareSizeSE, miny:miny, maxx:maxx, maxy:miny+squareSizeSE, size:squareSizeSE});

				if (minx+squareSizeNW <= maxx && maxy-squareSizeNW >= miny && cakeCoveringData.hasConvexCorner(NW))
					candidateSquares.push({minx:minx, miny:maxy-squareSizeNW, maxx:minx+squareSizeNW, maxy:maxy, size:squareSizeNW});

				if (maxx-squareSizeNE >= minx && maxy-squareSizeNE >= miny && cakeCoveringData.hasConvexCorner(NE))
					candidateSquares.push({minx:maxx-squareSizeNE, maxx:maxx, miny:maxy-squareSizeNE, maxy:maxy, size:squareSizeNE});
			}
			valueFunction.square = _.min(candidateSquares, function(square){return square.size});
		});


		// get the agent with the square with the smallest height overall:
		var iWinningAgent = _.argmin(valueFunctions, function(valueFunction) {
			return valueFunction.square.size;
		});
		var winningAgent = valueFunctions[iWinningAgent];
		var winningSquare = winningAgent.square;

		if (!winningSquare || !isFinite(winningSquare.size)) {
			TRACE(numOfAgents, "-- no square with the required value "+requiredLandplotValue);
			if (requiredLandplotValue<=1)
				TRACE_NO_LANDPLOT(valueFunctions);
			return [];
		}

		var landplot = winningSquare;
		if (winningAgent.color) landplot.color = winningAgent.color;
		TRACE(numOfAgents, "++ agent "+iWinningAgent+" gets the landplot "+JSON.stringify(landplot));

		if (valueFunctions.length==1)
			return [landplot];

		var remainingValueFunctions = valueFunctions.slice(0,iWinningAgent).concat(valueFunctions.slice(iWinningAgent+1,valueFunctions.length));
		var remainingCake = cake.removeRectangle(landplot);
		var remainingLandplots = recursive(remainingValueFunctions, remainingCake, requiredLandplotValue);
		remainingLandplots.push(landplot);
		return remainingLandplots;
		
	}
}

