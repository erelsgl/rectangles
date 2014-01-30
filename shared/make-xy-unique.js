/**
 * Make sure the x values and the y values of the points are all unique, by adding a small constant to non-unique values.
 * 
 * @param points an array of points.
 * Each point should contain the fields: x, y.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */
function makeXYunique(points) {
	var xvalues={};
	var yvalues={};
	for (var i=0; i<points.length; ++i) {
		var p = points[i];
		
		p.x = parseInt(p.x);
		while (xvalues[p.x]) 
			p.x += 1;
		xvalues[p.x] = true;
		
		p.y = parseInt(p.y);
		while (yvalues[p.y])
			p.y += 1;
		yvalues[p.y] = true;
	}
}


module.exports = makeXYunique;
