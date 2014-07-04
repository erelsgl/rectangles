/**
 * Divide a cake such that each color gets a square with 1/2n of its points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('jsts');
var _ = require('underscore')
_.mixin(require("argminmax"));

var TRACE = function(){};
//var TRACE = console.log;



/*********************** 2 WALLS ************************/


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
	if (valueFunction.points.length==0)
		throw new Error("No value points: "+JSON.stringify(valueFunction));
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
		//console.log("  corner="+JSON.stringify(corner)+" outgoingCorner="+JSON.stringify(outgoingCorner)+" maxAllowedSquareSize="+maxAllowedSquareSize+"  squareSizes="+squareSizes);
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
			//console.log("corner="+JSON.stringify(corner)+" otherCorners="+JSON.stringify(otherCorners)+" i="+i+" outgoingCorner="+JSON.stringify(result))
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





/*********************** 3 WALLS ************************/


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
 * Add to each level the properties: "yWest", "yEast", "isKnob", "westMinx", "eastMaxx"
 */
addPropertiesToLevel = function(levels, i) {
	var level = levels[i];
	var west = (i-1>=0?            levels[i-1]: null);
	level.westMinx = (west? west.minx: 0);
	level.yWest = (west? west.y: Infinity);
	var east = (i+1<levels.length? levels[i+1]: null);
	level.yEast = (east? east.y: Infinity);
	level.eastMaxx = (east? east.maxx: 1);
	level.isKnob = (level.yEast>level.y && level.yWest>level.y);
}

/**
 * Add to each level the properties: "yWest", "yEast", "isKnob", "westMinx", "eastMaxx"
 */
jsts.algorithm.addPropertiesToLevels = function(levels) {
	for (var i=0; i<levels.length; ++i) 
		addPropertiesToLevel(levels, i);
}

/**
 * Remove a single level from a southern border.
 * @param levels sequence of [{minx,maxx,y}] with additional properties [{yWest,yEast,westMinx,eastMaxx,isKnob}], ordered by increasing minx. 
 * @param iLevelToRemove index of level to remove.
 * @return sequence of rectangles [{minx,maxx,miny,maxy}]. The number of rectangles should be equal to the number of levels.  
 * @note updates the additional information of the levels, but very inefficiently (calls jsts.algorithm.addPropertiesToLevels(levels) to do that).
 */
jsts.algorithm.removeLevel = function(levels, iLevelToRemove) {
	with (levels[iLevelToRemove]) {
		if (yWest < yEast) {
			levels.splice(
					/* go to index */ iLevelToRemove-1, 
					/* remove */      2 /* elements*/, 
					/* then add */    {minx: westMinx, maxx: maxx, y: yWest});
		} else if (yEast < yWest) {
			levels.splice(
					/* go to index */ iLevelToRemove, 
					/* remove */      2 /* elements*/, 
					/* then add */    {minx: minx, maxx: eastMaxx, y: yEast});
		} else if (isFinite(yWest)) { //  && yWest==yEast
			levels.splice(
					/* go to index */ iLevelToRemove-1, 
					/* remove */      3 /* elements*/, 
					/* then add */    {minx: westMinx, maxx: eastMaxx, y: yWest});
		} else {  // a single level remaining
			levels.splice(iLevelToRemove,1);
		}
	}
	jsts.algorithm.addPropertiesToLevels(levels);	
}


/**
 * Calculate a list of rectangles covering the cake whose southern border is defined by the given levels.
 * @param levels sequence of [{minx,maxx,y}].
 * @return sequence of rectangles [{minx,maxx,miny,maxy}]. The number of rectangles should be equal to the number of levels.  
 */
jsts.algorithm.rectanglesCoveringSouthernLevels = function(levelsParam) {
	var levels = levelsParam.slice(0);
	var covering = [];
	
	while (levels.length>0) {
		
		// cover the lowest (most southern) level and then remove it:
		var iLowestLevel = _.argmin(levels, function(level){return level.y});
		addPropertiesToLevel(levels, iLowestLevel);
		with (levels[iLowestLevel]) {
			var rectangle = {minx:minx, maxx:maxx, miny:y};
			if (yWest < yEast) {
				rectangle.maxy = yWest;
				levels.splice(
						/* go to index */ iLowestLevel-1, 
						/* remove */      2 /* elements*/, 
						/* then add */    {minx: westMinx, maxx: maxx, y: yWest});
			} else if (yEast < yWest) {
				rectangle.maxy = yEast;
				levels.splice(
						/* go to index */ iLowestLevel, 
						/* remove */      2 /* elements*/, 
						/* then add */    {minx: minx, maxx: eastMaxx, y: yEast});
			} else if (isFinite(yWest)) { //  && yWest==yEast
				rectangle.maxy = yWest;
				levels.splice(
						/* go to index */ iLowestLevel-1, 
						/* remove */      3 /* elements*/, 
						/* then add */    {minx: westMinx, maxx: eastMaxx, y: yWest});
			} else {  // a single level remaining
				rectangle.maxy = Infinity;
				levels.splice(iLowestLevel,1);
			}
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



/*********************** 4 WALLS ************************/

function isCornerOfRectangle(point, rectangle) {
	return (
		(point.x==rectangle.minx || point.x==rectangle.maxx) &&
		(point.y==rectangle.miny || point.y==rectangle.maxy) );
}


/**
 * @param border a list of {x:, y:}, describing a border of a hole-free rectilinear polygon, in clockwise or counter-clockwise order.
 * The border must be closed, i.e. the last corner should be equal to the first corner.
 * @param landplot a rectangle {minx:,maxx:,miny:,maxy:} contained in the polygon and adjacent to the border.
 * @return the new border after the landplot has been removed. 
 */
jsts.algorithm.updatedBorder = function(border, landplot) {
	var newBorder = [];

	for (var i=1; i<border.length; ++i) {
		var corner0 = border[i-1];
		var corner1 = border[i];
		
		if (isCornerOfRectangle(corner0, landplot)) {
			if (newBorder.length>0) {
				// handle the special case in which landplot covers two adjacent corners:
				lastCornerAdded = newBorder[newBorder.length-1];
				if (corner0.x==lastCornerAdded.x&&corner0.y==lastCornerAdded.y)
					newBorder.pop();
			}
			continue;
		}
		
		newBorder.push(corner0);
		
		if (corner0.x==corner1.x) {  // vertical wall
			var x = corner0.x;       // x value of wall
			if (landplot.minx==x) {  // landplot is adjacent to western vertical wall
				if (corner0.y>corner1.y) {   // wall goes from north to south
					if (corner0.y>landplot.maxy)
						newBorder.push({x:x,y:landplot.maxy});
					newBorder.push({x:landplot.maxx,y:landplot.maxy});
					newBorder.push({x:landplot.maxx,y:landplot.miny});
					if (landplot.miny>corner1.y) 
						newBorder.push({x:x,y:landplot.miny});
				} else if (corner0.y<corner1.y) { // wall goes from south to north
					if (corner0.y<landplot.miny)
						newBorder.push({x:x,y:landplot.miny});
					newBorder.push({x:landplot.maxx,y:landplot.miny});
					newBorder.push({x:landplot.maxx,y:landplot.maxy});
					if (landplot.maxy<corner1.y)
						newBorder.push({x:x,y:landplot.maxy});
				} else {  // corner0 is identical to corner1 - error:
					throw new Error("Illegal border - two identical corners: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
				}
			} else if (landplot.maxx==x) {  // landplot is adjacent to eastern vertical wall
				if (corner0.y>corner1.y) {   // wall goes from north to south
					if (corner0.y>landplot.maxy)
						newBorder.push({x:x,y:landplot.maxy});
					newBorder.push({x:landplot.minx,y:landplot.maxy});
					newBorder.push({x:landplot.minx,y:landplot.miny});
					if (landplot.miny>corner1.y) 
						newBorder.push({x:x,y:landplot.miny});
				} else if (corner0.y<corner1.y) { // wall goes from south to north
					if (corner0.y<landplot.miny)
						newBorder.push({x:x,y:landplot.miny});
					newBorder.push({x:landplot.minx,y:landplot.miny});
					newBorder.push({x:landplot.minx,y:landplot.maxy});
					if (landplot.maxy<corner1.y)
						newBorder.push({x:x,y:landplot.maxy});
				} else {  // corner0 is identical to corner1 - error:
					throw new Error("Illegal border - two identical corners: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
				}
			} // else, landplot is not adjacent to current wall.
		} else if (corner0.y==corner1.y) {  // horizontal wall
			var y = corner0.y;       //  value of wall
			if (landplot.miny==y) {  // landplot is adjacent to southern horizontal wall
				if (corner0.x>corner1.x) {   // wall goes from east to west
					if (corner0.x>landplot.maxx)
						newBorder.push({y:y,x:landplot.maxx});
					newBorder.push({y:landplot.maxy,x:landplot.maxx});
					newBorder.push({y:landplot.maxy,x:landplot.minx});
					if (landplot.minx>corner1.x) 
						newBorder.push({y:y,x:landplot.minx});
				} else if (corner0.x<corner1.x) { // wall goes from west to east
					if (corner0.x<landplot.minx)
						newBorder.push({y:y,x:landplot.minx});
					newBorder.push({y:landplot.maxy,x:landplot.minx});
					newBorder.push({y:landplot.maxy,x:landplot.maxx});
					if (landplot.maxx<corner1.x)
						newBorder.push({y:y,x:landplot.maxx});
				} else {  // corner0 is identical to corner1 - error:
					throw new Error("Illegal border - two identical corners: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
				}
			} else if (landplot.maxy==y) {  // landplot is adjacent to northern horizontal wall
				if (corner0.x>corner1.x) {   // wall goes from east to west
					if (corner0.x>landplot.maxx)
						newBorder.push({y:y,x:landplot.maxx});
					newBorder.push({y:landplot.miny,x:landplot.maxx});
					newBorder.push({y:landplot.miny,x:landplot.minx});
					if (landplot.minx>corner1.x) 
						newBorder.push({y:y,x:landplot.minx});
				} else if (corner0.x<corner1.x) { // wall goes from west to east
					if (corner0.x<landplot.minx)
						newBorder.push({y:y,x:landplot.minx});
					newBorder.push({y:landplot.miny,x:landplot.minx});
					newBorder.push({y:landplot.miny,x:landplot.maxx});
					if (landplot.maxx<corner1.x) 
						newBorder.push({y:y,x:landplot.maxx});
				} else {  // corner0 is identical to corner1 - error:
					throw new Error("Illegal border - two identical corners: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
				}
			} // else, landplot is not adjacent to current wall
		} else {   // corner0 and corner1 are different in both coordinates - not an axis-parallel polygon
			throw new Error("Illegal border - not an axis-parallel polygon: corner0="+JSON.stringify(corner0)+" corner1="+JSON.stringify(corner1));
		}
	}

	// remove redundant corners of the landplot, that overlap corners of the polygon:
	lastCornerAdded = newBorder[newBorder.length-1];
	if (corner1.x==lastCornerAdded.x&&corner1.y==lastCornerAdded.y)
		newBorder.pop();
	if (border[1].x==lastCornerAdded.x&&border[1].y==lastCornerAdded.y)
		newBorder.pop();

	// keep the border cyclic:
	newBorder.push(newBorder[0]);
	
	return newBorder;
}



