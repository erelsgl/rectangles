/**
 * Defines an array of rectangles in alternating colors.
 * Uses svg.js, svg.draggable.js, and svg.math.js.
 * @author Erel Segal-Halevi
 * @since 2013-12-28
 */
	/********** AXIS-PARALLEL RECTANGLE *************/

	/**
	 * Construct a rectangle from two opposite corners (points)
	 */
	SVG.math.Rectangle = function Rectangle(corner1, corner2) {
		this.xmin = Math.min(corner1.x,corner2.x);
		this.xmax = Math.max(corner1.x,corner2.x);
		this.ymin = Math.min(corner1.y,corner2.y);
		this.ymax = Math.max(corner1.y,corner2.y);

		this.width = this.xmax-this.xmin;
		this.height = this.ymax-this.ymin;
	};

	/**
	 * Default draw attributes
	 */
	SVG.math.Rectangle.attr = {
		stroke: '#000',
		fill: 'none',
	};
	
	SVG.extend(SVG.math.Rectangle, {
		/**
		 * With a single parameter - draw a rectangle with default attributes.
		 * With two parameters - draw a rectangle with the given attributes.  
		 */
		draw: function(svg, attr) {
			attr = attr || SVG.math.Rectangle.attr;
			this.svg = svg;
			this.rectangle = svg.rect(this.width,this.height).move(this.xmin,this.ymin).attr(attr);
			return this;
		},
		
		/**
		 * remove the currently drawn rectangle. 
		 */
		remove: function() {
			if (this.rectangle) {
				this.rectangle.remove();
				delete this.svg;
				delete this.rectangle;
			}
		},
		
		/**
		 * @return true if this rectangle interior-contains the given point
		 */
		contains: function(point) {
			var xcontains = this.xmin<point.x && point.x<this.xmax;
			var ycontains = this.ymin<point.y && point.y<this.ymax;
			return ycontains && xcontains;
		},
		
		/**
		 * @return true if this rectangle interior-intersects the other rectangle
		 */
		intersects: function(other) {
			var xintersects = this.xmax>other.xmin && other.xmax>this.xmin;
			var yintersects = this.ymax>other.ymin && other.ymax>this.ymin;
			return yintersects && xintersects;
		},
		
		/**
		 * @return the area of this rectangle.
		 */
		area: function() {
			return this.width*this.height;
		}
	});


function ColorfulRectangles(svgpaper) {

	var rects = [];

	// Add a new rectangle (of type SVG.math.Rectangle)
	rects.add = function(rect, color) {
		rect.draw(svgpaper, {
			stroke: '#000',
			'stroke-dasharray': '5,5',
			fill: color,
			opacity: 0.5,
		});
		rect.rectangle.back();
		rects.push(rect);
	}

	// Return true if any existing rectangle intersects the new rectangle
	rects.intersect = function(newRect) {
		for (var r=0; r<rects.length; ++r) 
			if (rects[r].intersects(newRect))
				return true;
		return false;
	}

	//remove all rectangles from the SVG paper:
	rects.clear = function() {
		for (var r=0; r<this.length; ++r)
			this[r].remove();
		this.length = 0;
	}

	return rects;
}

