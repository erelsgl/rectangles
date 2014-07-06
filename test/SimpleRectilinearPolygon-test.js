/**
 * a unit-test for maximum-disjoint-set based on JSTS.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var should = require('should');
var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

describe('SimpleRectilinearPolygon', function() {
	it('initializes from minimal set of xy values', function() {
		var srp = new jsts.geom.SimpleRectilinearPolygon([0,0,100,100]);
		srp.getCoordinates().should.eql(
			[ { x: 0, y: 0 }, { x: 0, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 0 },  { x: 0, y: 0 } ]);
	})
})

