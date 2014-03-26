/**
 * Defines an array of points that can be dragged.
 * Uses svg.js, svg.draggable.js, and svg.math.js.
 * @author Erel Segal-Halevi
 * @since 2013-12-28
 */

function DraggablePoints(svgpaper, onDragEnd) {
	var points = [];
	points.byColor = {};
	
	var drawPoint=function(point) {
		point.draw(svgpaper, {
			stroke: point.color||'blue',
			fill: point.color||'blue',
			radius: 10
		});
	}

	// Add a new point (of type SVG.math.Point)
	points.add = function(point, color) {
		points.push(point);
		
		if (!points.byColor[color])
			points.byColor[color] = [];
		points.byColor[color].push(point);

		point.color = color;
		drawPoint(point);

		point.remove = function() {
			this.draw();
			var index = points.indexOf(this);
			if (index>=0)
				points.splice(index,1);
			index = points.byColor[this.color].indexOf(this);
			if (index>=0)
				points.byColor[this.color].splice(index,1);
		};

		point.circle.dragend = function(delta, event) {
			point.x = point.circle.attr('cx');
			point.y = point.circle.attr('cy');
			if (point.x<0 || point.y<0)
				point.remove();
			onDragEnd();
		};

		point.move = function (x,y) {
			point.x = x;
			point.y = y;
			point.circle.attr('cx', x);
			point.circle.attr('cy', y);
		}

		point.circle.draggable();
	}
	
	// Re-draw all the points
	points.redraw = function() {
		for (var p=0; p<this.length; ++p)
			this[p].draw();
		for (var p=0; p<this.length; ++p)
			drawPoint(this[p]);
	}

	//remove all points from the SVG paper:
	points.clear = function() {
		for (var p=0; p<this.length; ++p)
			this[p].draw();
		this.length = 0;
	}

	// Return a string representation of the x,y values of the points
	points.toString = function() {
		var s = "";
		for (var p=0; p<points.length; ++p) {
			if (s.length>0)
				s+=":";
			s += points[p].x + "," + points[p].y+","+points[p].color;
		}
		return s;
	}

	// Fill the points array from the given string (created by toString)
	//     or a default (if there is no string).
	points.fromString = function(s) {
		if (!s || s.length<10) {
			for (var i=1; i<=8; ++i) 
				points.add(new SVG.math.Point(40*i,40*i), "blue");
		} else {
			var pointsStrings = s.split(/:/);
			for (var i=0; i<pointsStrings.length; ++i) {
				var xyc = pointsStrings[i].replace(/\s*/g,"").split(/,/);
				if (xyc.length<2) continue;
				if (!xyc[2] || xyc[2]=='undefined') xyc[2]="blue";
				points.add(new SVG.math.Point(xyc[0], xyc[1]), xyc[2]);
			}
		}
	}

	return points;
}

