// A collection of shapes on an SVG paper
function ShapeCollection(svgpaper, defaultStyle) {
	var shapes = [];

	// Add a new shape: 
	shapes.add = function(shape, style) {
		for (var i in defaultStyle)
			if (!style[i])
				style[i] = defaultStyle[i];
		var shapeOnPaper = svgpaper.rect(shape.width,shape.height).move(shape.xmin,shape.ymin).attr(style);
		shapeOnPaper.back();  // send behind points
		this.push(shapeOnPaper);
	}

	//remove all rectangles from the SVG paper:
	shapes.clear = function() {
		for (var r=0; r<this.length; ++r)
			this[r].remove();
		this.length = 0;
	}

	return shapes;
}

