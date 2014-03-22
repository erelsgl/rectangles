/**
 * a test for maximum-disjoint-set of the output of squares-touching-points
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var should = require('should');
var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();
var maximumDisjointSet = jsts.algorithm.maximumDisjointSet; // shorthand

describe('squaresTouchingPoints without walls', function() {
	it('works for two horizontal points', function() {
		var candidates = factory.createSquaresTouchingPoints([{x:1,y:1}, {x:2,y:1}]);
		candidates.should.have.lengthOf(2);
		maximumDisjointSet(candidates).should.have.lengthOf(1);
	})
	it('works for two vertical points', function() {
		var candidates = factory.createSquaresTouchingPoints([{x:1,y:1}, {x:1,y:2}]);
		candidates.should.have.lengthOf(2);
		maximumDisjointSet(candidates).should.have.lengthOf(1);
	})
})
