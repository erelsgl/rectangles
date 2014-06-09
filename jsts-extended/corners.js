/**
 * Divide a cake such that each color gets a square with 1/2n of its points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('jsts');
var _ = require('underscore')
_.mixin(require("argminmax"));

//var TRACE = function(){};
var TRACE = console.log;

/**
 * @param corners a list of points {x:,y:}, describing a northern border. x is non-decreasing: NW - SW - SE - NE 
 * @param landplot a rectangle {minx:,maxx:,miny:,maxy:} whose southern side is adjacent to the border from its north.
 * @return a new list of corners describing the border after the landplot has been annexed. 
 */
jsts.algorithm.updatedCornersNorth = function(corners, landplot) {
	if (!Array.isArray(corners))
		throw new Error("corners: expected array but got "+JSON.stringify(corners));
	if (!('minx' in landplot && 'maxx' in landplot && 'miny' in landplot && 'maxy' in landplot))
		throw new Error("landplot: expected fields not fount: "+JSON.stringify(landplot));

	TRACE("  updatedCornersNorth with corners: "+JSON.stringify(corners)+"  landplot: "+JSON.stringify(landplot));
	var numOfCorners = corners.length;
	var newCorners = [];
	var c = 0;

	// add all corners to the west of minx:
	while (c<numOfCorners && corners[c].x<landplot.minx) {
		TRACE("west: "+JSON.stringify(corners[c]));
		newCorners.push(corners[c++]);
	}

	// handle corners at minx:
	var minXCorner = null;
	if (corners[c].x==landplot.minx) {
		minXCorner = corners[c++];
	} else if (corners[c].y<landplot.miny) {
		minXCorner = {x:landplot.minx, y:corners[c].y};
	} else {
		minXCorner = {x:landplot.minx, y:landplot.miny};
	}
	TRACE("minx: "+JSON.stringify(minXCorner));
	newCorners.push(minXCorner);
	newCorners.push({x:landplot.minx, y:landplot.maxy});

	// skip corners between minx and maxx:
	while (c<numOfCorners && corners[c].x<=landplot.maxx) {
		TRACE("south: "+JSON.stringify(corners[c]));
		c++;
	}
	
	// handle corners at maxx:
	var maxXCorner = null;
	if (c>0 && corners[c-1].x==landplot.maxx) {
		maxXCorner = corners[c-1];
	} else if (c>0 && corners[c-1].y<landplot.miny) {
		maxXCorner = {x:landplot.maxx, y:corners[c-1].y};
	} else {
		maxXCorner = {x:landplot.maxx, y:landplot.miny};
	}
	TRACE("maxx: "+JSON.stringify(maxXCorner));
	newCorners.push({x:landplot.maxx, y:landplot.maxy});
	newCorners.push(maxXCorner);

	// add all corners to the east of maxx:
	while (c<numOfCorners) {
		TRACE("east: "+JSON.stringify(corners[c]));
		newCorners.push(corners[c++]); 
	}

	return newCorners;
}



/**
 * @param corners a list of points {x:,y:}, describing a north-eastern border. x is non-increasing and y is non-decreasing. Only southwestern corners are listed (i.e. only every other point).
 * @param landplot a rectangle {minx:,maxx:,miny:,maxy:} whose southwestern corner conicides with one of the existing corners.
 * @return a new list of corners describing the border after the landplot has been annexed. 
 */
jsts.algorithm.updatedCornersNorthEast = function(corners, landplot) {
	if (!Array.isArray(corners))
		throw new Error("corners: expected array but got "+JSON.stringify(corners));
	if (!('minx' in landplot && 'maxx' in landplot && 'miny' in landplot && 'maxy' in landplot))
		throw new Error("landplot: expected fields not fount: "+JSON.stringify(landplot));

	TRACE("  updatedCornersNorthEast with corners: "+JSON.stringify(corners)+"  landplot: "+JSON.stringify(landplot));
	var numOfCorners = corners.length;
	var newCorners = [];
	var c = 0;

	while (c<numOfCorners && corners[c].x>=landplot.maxx) {  // add corners to the southeast of the landplot
		newCorners.push(corners[c]);
		++c;
	}
	// HERE corners[c].x<landplot.maxx
	newCorners.push({x:landplot.maxx, y:corners[c].y});  // add southwest new corner
	while (c<numOfCorners && corners[c].y<landplot.maxy) { // skip corners shaded by the landplot
		++c;
	}
	// HERE corners[c].y>=landplot.maxy
	if (c>0)
		newCorners.push({x:corners[c-1].x, y:landplot.maxy});  // add northeast new corner
	while (c<numOfCorners) {  // add corners to the northwest of the landplot
		newCorners.push(corners[c]);
		++c;
	}
	
	return newCorners;
}


/**
 * @param corners a list of points {x:,y:}, describing a north-western border. x is non-decreasing and y is non-decreasing. Only southeastern corners are listed (i.e. only every other point).
 * @param landplot a rectangle {minx:,maxx:,miny:,maxy:} whose southeastern corner conicides with one of the existing corners.
 * @return a new list of corners describing the border after the landplot has been annexed. 
 */
jsts.algorithm.updatedCornersNorthWest = function(corners, landplot) {
	if (!Array.isArray(corners))
		throw new Error("corners: expected array but got "+JSON.stringify(corners));
	if (!('minx' in landplot && 'maxx' in landplot && 'miny' in landplot && 'maxy' in landplot))
		throw new Error("landplot: expected fields not fount: "+JSON.stringify(landplot));

	TRACE("  updatedCornersNorthWest with corners: "+JSON.stringify(corners)+"  landplot: "+JSON.stringify(landplot));
	var numOfCorners = corners.length;
	var newCorners = [];
	var c = 0;

	while (c<numOfCorners && corners[c].x<=landplot.minx) {  // add corners to the southwest of the landplot
		newCorners.push(corners[c]);
		++c;
	}
	// HERE corners[c].x>landplot.minx
	newCorners.push({x:landplot.minx, y:corners[c].y});  // add southeast new corner
	while (c<numOfCorners && corners[c].y<landplot.maxy) { // skip corners shaded by the landplot
		++c;
	}
	// HERE corners[c].y>=landplot.maxy
	if (c>0)
		newCorners.push({x:corners[c-1].x, y:landplot.maxy});  // add northwest new corner
	while (c<numOfCorners) {  // add corners to the northwest of the landplot
		newCorners.push(corners[c]);
		++c;
	}
	
	return newCorners;
}



/**
 * @return a list of all corner squares with the given value.
 */
jsts.algorithm.cornerSquares = function(valueFunction, corners, requiredLandplotValue, direction, origin) {
	if (typeof requiredLandplotValue != 'number')
		throw new Error("requiredLandplotValue: expected a number but got "+JSON.stringify(requiredLandplotValue));
	return corners.map(function(corner) {
		var squareSize = valueFunction.sizeOfSquareWithValue(corner, requiredLandplotValue, direction);
		var dx = Math.abs(corner.x-origin.x);
		var dy = Math.abs(corner.y-origin.y);
		var taxicabDistance = dx+dy+squareSize;
		return {x:corner.x, y:corner.y, dx:dx, dy:dy, s:squareSize, t:taxicabDistance};
	});
}


/**
 * @return a list of all corner squares with the given value; for each corner, pick the valueFunction that gives the smallest square.
 */
jsts.algorithm.smallestCornerSquares = function(valueFunctions, corners, requiredLandplotValue, direction, origin, otherCorners) {
	if (typeof requiredLandplotValue != 'number')
		throw new Error("requiredLandplotValue: expected a number but got "+JSON.stringify(requiredLandplotValue));
	return corners.map(function(corner) {
		var outgoingCorner = jsts.algorithm.outgoingCorner(corner, otherCorners);
		var maxAllowedSquareSize = Math.abs(outgoingCorner.x-corner.x);
		var squareSizes = valueFunctions.map(function(valueFunction) {
			return valueFunction.sizeOfSquareWithValue(corner, requiredLandplotValue, direction);
		})
		console.log("  corner="+JSON.stringify(corner)+" outgoingCorner="+JSON.stringify(outgoingCorner)+" maxAllowedSquareSize="+maxAllowedSquareSize+"  squareSizes="+squareSizes);
		squareSizes = squareSizes.filter(function(size) {
			return size<=maxAllowedSquareSize;
		});
		if (squareSizes.length==0)
			return null;
		var iSmallestSquare = _.argmin(squareSizes)
		var smallestSquareSize = squareSizes[iSmallestSquare];
		var dx = Math.abs(corner.x-origin.x);
		var dy = Math.abs(corner.y-origin.y);
		var taxicabDistance = dx+dy+smallestSquareSize;
		return {x:corner.x, y:corner.y, dx:dx, dy:dy, s:smallestSquareSize, t:taxicabDistance, index:iSmallestSquare, direction:direction};
	}).filter(function(square) {
		return square!=null;
	});
}

jsts.algorithm.cornerSquareWithMinTaxicabDistance = function(valueFunction, corners, requiredLandplotValue, direction, origin) {
	var cornerSquares = jsts.algorithm.cornerSquares(valueFunction, corners, requiredLandplotValue, direction, origin);
	var minDistanceSquare = _.min(cornerSquares, function(square){return square.t});
	if (!minDistanceSquare)
		minDistanceSquare = {t: Infinity};
	return minDistanceSquare;
}




/**
 * @param corner {x,y}
 * @param otherCorners corners at another side; ordered by non-decreasing y.
 * @return the "out-going corner" {x,y} such that y is larger than corner.y.
 */
jsts.algorithm.outgoingCorner = function(corner, otherCorners) {
	if (corner.y < otherCorners[0].y)
		throw new Error("corner.y too low! corner="+JSON.stringify(corner)+"  otherCorners="+JSON.stringify(otherCorners));
	for (var i=0; i<otherCorners.length; ++i) 
		if (corner.y < otherCorners[i].y)  {
			var result = {x: (i>0?otherCorners[i-1].x:otherCorners[i].x), y:otherCorners[i].y};
			console.log("corner="+JSON.stringify(corner)+" otherCorners="+JSON.stringify(otherCorners)+" i="+i+" outgoingCorner="+JSON.stringify(result))
			return result;
		}
	throw new Error("No outgoing corner found! corner="+JSON.stringify(corner)+"  otherCorners="+JSON.stringify(otherCorners));
}

/**
 * @param corners ordered by non-decreasing y.
 * @param otherCorners corners at another side; ordered by non-decreasing y.
 * remove from "corners" those corners whose x-distance to the other side is smaller than the y-distance.
 */
jsts.algorithm.removeCornersWithSmallXDistance = function(corners, otherCorners) {
	var newCorners = [];
	for (var i=corners.length-1; i>=0; i--) {
		var corner = corners[i];
		if (corner.y>1)
			continue; // skip corners above the valued square
		var nextCornerY = (i+1<corners.length? corners[i+1].y: 1);
		//console.log("\tcorner="+JSON.stringify(corner));
		var outgoingCorner = jsts.algorithm.outgoingCorner(corner, otherCorners);
		//console.log("\toutgoingCorner="+JSON.stringify(outgoingCorner));
		var dx = Math.abs(outgoingCorner.x-corner.x);
		var dy = Math.abs(Math.min(outgoingCorner.y,nextCornerY)-corner.y);
		if (dx<dy) {
			if (nextCornerY>outgoingCorner.y)
				newCorners.unshift({
					x:corner.x,
					y:Math.max(0,Math.min(1,outgoingCorner.y))
				});
			break;
		} else {
			newCorners.unshift(corner)
			continue;
		}
	}
	TRACE("  removeCornersWithSmallXDistance with corners: "+JSON.stringify(corners)+"  otherCorners: "+JSON.stringify(otherCorners)+"  returns "+JSON.stringify(newCorners));
	return newCorners; 
}


/**
 * @param levels a list of {y:,minx:,maxx:}, describing a southern or northern border. x is non-decreasing: NW - SW - SE - NE 
 * @param landplot a rectangle {minx:,maxx:,miny:,maxy:} whose southern side is adjacent to the border from its north.
 * @param direction "N" (north) or "S" (south)
 * @return a new list of levels  describing the border after the landplot has been removed. 
 */
jsts.algorithm.updatedLevels = function(levels, landplot, direction) {
	if (!Array.isArray(levels))
		throw new Error("levels: expected array but got "+JSON.stringify(levels));
	if (!('minx' in landplot && 'maxx' in landplot && 'miny' in landplot && 'maxy' in landplot))
		throw new Error("landplot: expected fields not found: "+JSON.stringify(landplot));

	TRACE("  updating "+(direction=='S'? "south": "north")+" levels: "+JSON.stringify(levels)+"  with landplot: "+JSON.stringify(landplot));
	
	var numOfLevels = levels.length;
	var newLevels = [];
	var c = 0;

	// add all levels entirely to the west of minx:
	while (c<numOfLevels && levels[c].maxx<=landplot.minx) {
		TRACE("  west: "+JSON.stringify(levels[c]));
		newLevels.push(levels[c++]);
	}
	
	// HERE levels[c].maxx > landplot.minx

	if (c<numOfLevels) {
		var newLevelY = (direction=='S'? landplot.maxy: landplot.miny);
	//	console.log("newLevelY="+newLevelY+" levels[c]="+JSON.stringify(levels[c]));
		if (levels[c].minx < landplot.minx) {
			if (newLevelY!=levels[c].y) {
				newLevels.push({y:levels[c].y, minx:levels[c].minx, maxx:landplot.minx});
				newLevels.push({y:newLevelY, minx:landplot.minx, maxx:landplot.maxx});
			} else {
				newLevels.push({y:newLevelY, minx:levels[c].minx, maxx:landplot.maxx});
			}
		} else if (levels[c].minx == landplot.minx) {
			if (newLevelY!=levels[c].y) {
				newLevels.push({y:newLevelY, minx:landplot.minx, maxx:landplot.maxx});
			} 
		}
	}

	// HERE we have added all levels with minx weakly to the west of landplot.minx,
	// and the new level created by landplot.
	
	// skip all levels shaded by y:
	while (c<numOfLevels && levels[c].minx<landplot.maxx) {
		TRACE("  south: "+JSON.stringify(levels[c]));
		c++;
	}
	if (c>0) {
		c--;
		if (levels[c].maxx > landplot.maxx)
			newLevels.push({y:levels[c].y, minx:landplot.maxx, maxx:levels[c].maxx});
		c++;
	}
	
	// HERE levels[c].minx >= landplot.maxx

	// add all levels entirely to the west of minx:
	while (c<numOfLevels) {
		TRACE("  east: "+JSON.stringify(levels[c]));
		newLevels.push(levels[c++]);
	}
	
	TRACE("  updated "+(direction=='S'? "south": "north")+" levels: "+JSON.stringify(levels)+"  with landplot: "+JSON.stringify(landplot)+"  returns: "+JSON.stringify(newLevels));
	return newLevels;
}



/**
 * Calculate, for each level, its most distant x-values that do not run through walls.
 * @param levels sequence of [{x,y}] ordered by increasing x. 
 * - Adds, to each level fields xw (west) and xe (east), such that xw <= x < xe.
 * @param xFarwest, xFareast - x-values of the extreme boundaries
 * @return levels after the change.
 * @deprecated not used anymore.
 */
jsts.algorithm.calculateSpansOfLevels = function(levels, xFarWest, xFarEast) {
	// add the xw field:
	var westWalls = [{y:Infinity, x:xFarWest}];  // ordered from west to east
	for (var l=0; l<levels.length; ++l) {
		var level = levels[l];

		// add the xw field:
		for (var w=westWalls.length-1; w>=0; --w) 
			if (westWalls[w].y>level.y)
				level.xw = westWalls[w].x;
		
		// add a new westWall:
		if (l+1<levels.length) {
			var nextLevel = levels[l+1];
			if (nextLevel.y<level.y)
				westWalls.push[{y:level.y, x:nextLevel.x}]
		}
	}

	// add the xe field:
	var eastWalls = [{y:Infinity, x:xFarEast}];  // ordered from east to west
	for (var l=levels.length-1; l>=0; --l) {
		var level = levels[l];

		// add the xe field:
		for (var w=eastWalls.length-1; w>=0; --w) 
			if (eastWalls[w].y>level.y)
				level.xe = eastWalls[w].x;

		// add a new eastWall:
		if (l-1>=0) {
			var nextLevel = levels[l-1];
			if (nextLevel.y<level.y)
				eastWalls.push[{y:level.y, x:level.x}]
		}
	}

	return levels;
}


/**
 * Calculate a list of rectangles covering the cake whose southern border is defined by the given levels.
 * @param levels sequence of [{minx,maxx,y}] ordered by increasing minx. 
 * @return sequence of rectangles [{minx,maxx,miny,maxy}]. The number of rectangles should be equal to the number of levels.  
 */
jsts.algorithm.rectanglesCoveringSouthernLevels = function(levelsParam) {
	var levels = levelsParam.slice(0);
	var covering = [];
	
	while (levels.length>0) {
		
		// cover the lowest (most southern) level:
		var iLowestLevel = _.argmin(levels, function(level){return level.y});
		var level = levels[iLowestLevel];
		var rectangle = {minx:level.minx, maxx:level.maxx, miny:level.y};
		
		// remove the lowest level:
		var west = (iLowestLevel-1>=0?            levels[iLowestLevel-1]: null);
		var yWest = (west? west.y: Infinity);
		var east = (iLowestLevel+1<levels.length? levels[iLowestLevel+1]: null);
		var yEast = (east? east.y: Infinity);
		
		if (yWest < yEast) {
			rectangle.maxy = yWest;
			levels.splice(
					/* go to index */ iLowestLevel-1, 
					/* remove */      2 /* elements*/, 
					/* then add */    {minx: west.minx, maxx: level.maxx, y: yWest});
		} else if (yEast < yWest) {
			rectangle.maxy = yEast;
			levels.splice(
					/* go to index */ iLowestLevel, 
					/* remove */      2 /* elements*/, 
					/* then add */    {minx: level.minx, maxx: east.maxx, y: yEast});
		} else if (west && east) { //  && yWest==yEast
			rectangle.maxy = yWest;
			levels.splice(
					/* go to index */ iLowestLevel-1, 
					/* remove */      3 /* elements*/, 
					/* then add */    {minx: west.minx, maxx: east.maxx, y: yWest});
		} else {  // a single level remaining
			rectangle.maxy = Infinity;
			levels.splice(iLowestLevel,1);
		}
		covering.push(rectangle);  
	}
	
	return covering;
}

/**
 * Calculate a list of rectangles covering the cake whose northern border is defined by the given levels.
 * @param levels sequence of [{minx,maxx,y}] ordered by increasing minx. 
 * @return sequence of rectangles [{minx,maxx,miny,maxy}]. The number of rectangles should be equal to the number of levels.  
 */
jsts.algorithm.rectanglesCoveringNorthernLevels = function(levelsParam) {
	var levels = levelsParam.slice(0);
	var covering = [];
	
	while (levels.length>0) {
		
		// cover the highest (most northern) level:
		var iLowestLevel = _.argmax(levels, function(level){return level.y});
		var level = levels[iLowestLevel];
		var rectangle = {minx:level.minx, maxx:level.maxx, maxy:level.y};
		
		// remove the highest level:
		var west = (iLowestLevel-1>=0?            levels[iLowestLevel-1]: null);
		var yWest = (west? west.y: -Infinity);
		var east = (iLowestLevel+1<levels.length? levels[iLowestLevel+1]: null);
		var yEast = (east? east.y: -Infinity);
		
		if (yWest > yEast) {
			rectangle.miny = yWest;
			levels.splice(
					/* go to index */ iLowestLevel-1, 
					/* remove */      2 /* elements*/, 
					/* then add */    {minx: west.minx, maxx: level.maxx, y: yWest});
		} else if (yEast > yWest) {
			rectangle.miny = yEast;
			levels.splice(
					/* go to index */ iLowestLevel, 
					/* remove */      2 /* elements*/, 
					/* then add */    {minx: level.minx, maxx: east.maxx, y: yEast});
		} else if (west && east) { //  && yWest==yEast
			rectangle.miny = yWest;
			levels.splice(
					/* go to index */ iLowestLevel-1, 
					/* remove */      3 /* elements*/, 
					/* then add */    {minx: west.minx, maxx: east.maxx, y: yWest});
		} else {  // a single level remaining
			rectangle.miny = -Infinity;
			levels.splice(iLowestLevel,1);
		}
		covering.push(rectangle);  
	}
	
	return covering;
}
