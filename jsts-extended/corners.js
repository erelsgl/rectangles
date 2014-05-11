/**
 * Divide a cake such that each color gets a square with 1/2n of its points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('jsts');
var _ = require('underscore')

//var TRACE = console.log;
var TRACE = function(){};

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

	TRACE("corners: "+JSON.stringify(corners));
	TRACE("landplot: "+JSON.stringify(landplot));
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

	TRACE("corners: "+JSON.stringify(corners));
	TRACE("landplot: "+JSON.stringify(landplot));
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

	TRACE("corners: "+JSON.stringify(corners));
	TRACE("landplot: "+JSON.stringify(landplot));
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

jsts.algorithm.cornerSquareWithMinTaxicabDistance = function(valueFunction, corners, requiredLandplotValue, direction, origin) {
	var cornerSquares = corners.map(function(corner) {
		var squareSize = valueFunction.sizeOfSquareWithValue(corner, requiredLandplotValue, direction);
		var taxicabDistance = Math.abs(corner.x-origin.x)+Math.abs(corner.y-origin.y)+squareSize;
		return {x:corner.x, y:corner.y, s:squareSize, t:taxicabDistance};
	});
	var minDistanceSquare = _.min(cornerSquares, function(square){return square.t});
	if (!minDistanceSquare)
		minDistanceSquare = {t: Infinity};
	return minDistanceSquare;
}



function oldNorth(corners, landplot) {
	if (!Array.isArray(corners))
		throw new Error("corners: expected array but got "+JSON.stringify(corners));
	if (!('minx' in landplot && 'maxx' in landplot && 'miny' in landplot && 'maxy' in landplot))
		throw new Error("landplot: expected fields not fount: "+JSON.stringify(landplot));

	var numOfCorners = corners.length;

	var remainingCorners = [];
	remainingCorners.push(corners[0]);
	var westShadow = false, eastShadow = true;
	for (var c=1; c<numOfCorners-1; ++c) {
		var cur  = corners[c];
		if (cur.y>=landplot.maxy) {
			remainingCorners.push(cur);
			continue;
		}
		
		// HERE cur.y < landplot.maxy
		var yDistance = landplot.maxy-cur.y;

		var prev = corners[c-1];
		var next = corners[c+1];
		var LShape = (prev.y>cur.y && cur.x<next.x);
		var JShape = (prev.x<cur.x && cur.y<next.y);
		
		// Check the x-value of the current corner; note that x is non-decreasing:
		if (cur.x<landplot.minx) {       // WEST
			if (westShadow)  continue;     // skip all corners from the beginning of the west shadow to landplot.maxx

			if (xDistance<yDistance) {   // need to add a corner to the west
				if (prev.y > landplot.maxy) { // cur is an LShape
					remainingCorners.push({x:cur.x, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.miny});
				} else if (prev.x < cur.x) {  // cur is a ר shape
					remainingCorners.push({x:landplot.minx, y:cur.y});
					remainingCorners.push({x:landplot.minx, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.miny});
				} else if (prev.y > cur.y) {  // cur is an L Shape
					remainingCorners.pop(); // remove prev
					remainingCorners.push({x:landplot.minx, y:prev.y});
					remainingCorners.push({x:landplot.minx, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.miny});
				} else {
					console.warn("Unhandled condition in the west: prev="+JSON.stringify(prev)+" cur="+JSON.stringify(cur)+" next="+JSON.stringify(next));
					remainingCorners.push({x:landplot.minx, y:landplot.miny});
					remainingCorners.push({x:landplot.minx, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.miny});
				}
				westShadow = true;     // skip all corners from here to landplot.maxx
				continue;
			}
			remainingCorners.push(cur);

		} else 	if (cur.x<=landplot.maxx) { // SOUTH 
			if (westShadow)  continue;     // skip all corners from the beginning of the south shadow to landplot.maxx
			
			remainingCorners.push({x:landplot.minx, y:landplot.miny});
			remainingCorners.push({x:landplot.minx, y:landplot.maxy});
			remainingCorners.push({x:landplot.maxx, y:landplot.maxy});
			remainingCorners.push({x:landplot.maxx, y:landplot.miny});
			westShadow = true;
			
		} else {                           // EAST
			var xDistance = cur.x - landplot.maxx;
			if (xDistance<yDistance) 
				continue;
			
			if (eastShadow) {
				if (next.y > landplot.maxy) { // cur is a J Shape
					remainingCorners.pop();  // remove (maxx,miny)
					remainingCorners.pop();  // remove (maxx,maxy)
					remainingCorners.push({x:cur.x, y:landplot.maxy});
					// skip cur
				} else if (cur.x < next.x) {  // cur is an r shape
					remainingCorners.pop();  // remove (maxx,miny)
					remainingCorners.push({x:landplot.maxx, y:cur.y});
					//remainingCorners.push(cur); // skip cur
				} else if (next.y > cur.y) { // cur is a J Shape
					remainingCorners.pop();  // remove (maxx,miny)
					remainingCorners.push({x:landplot.maxx, y:cur.y});
					remainingCorners.push(cur);
				} else {
					console.warn("Unhandled condition in the east: prev="+JSON.stringify(prev)+" cur="+JSON.stringify(cur)+" next="+JSON.stringify(next));
				}
				eastShadow = false;
				continue;
			}
			remainingCorners.push(cur);
		}
	}
	remainingCorners.push(corners[numOfCorners-1]);
	return remainingCorners;
}
