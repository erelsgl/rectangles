function sin(angleInDegrees) {
	return Math.sin(angleInDegrees/180*Math.PI)
}

function cos(angleInDegrees) {
	return Math.cos(angleInDegrees/180*Math.PI)
}

/**
 * @param A, B two angles of a triangle, in degrees.
 * @return the two-balls slimness factor of the triangle.
 */
function slimness(A,B) {
	var C = 180-A-B;
	var largestAngle = Math.max(A,B,C);
	var nominator = (largestAngle>90? sin(largestAngle): 1);
	var denominator = cos(A)+cos(B)+cos(C)-1;
	return nominator/denominator;
}

// slimness factor of an isosceles triangle:
for (var headAngle=1; headAngle<=179; ++headAngle) {
	var baseAngles = (180-headAngle)/2;
}