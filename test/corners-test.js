/**
 * a unit-test for the algorithms for updating lists of corners.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var should = require('should');
var jsts = require("../jsts-extended");


var rectanglesCoveringSouthernLevels = jsts.algorithm.rectanglesCoveringSouthernLevels;
describe('rectanglesCoveringSouthernLevels', function() {
	it('single level', function() {
		rectanglesCoveringSouthernLevels([{y:0,minx:0,maxx:1}]).should.eql(
			[{minx:0,maxx:1,miny:0,maxy:Infinity}]);
	})
	it('two levels 01', function() {
		rectanglesCoveringSouthernLevels([{y:0,minx:0,maxx:1}, {y:1,minx:1,maxx:2}]).should.eql(
			[{minx:0,maxx:1,miny:0,maxy:1}, {minx:0,maxx:2,miny:1,maxy:Infinity}]);
	})
	it('two levels 10', function() {
		rectanglesCoveringSouthernLevels([{y:1,minx:0,maxx:1}, {y:0,minx:1,maxx:2}]).should.eql(
			[{minx:1,maxx:2,miny:0,maxy:1}, {minx:0,maxx:2,miny:1,maxy:Infinity}]);
	})
	it('three levels 012', function() {
		rectanglesCoveringSouthernLevels([{y:0,minx:0,maxx:1}, {y:1,minx:1,maxx:2}, {y:2,minx:2,maxx:4}]).should.eql(
			[{minx:0,maxx:1,miny:0,maxy:1}, {minx:0,maxx:2,miny:1,maxy:2}, {minx:0,maxx:4,miny:2,maxy:Infinity}]);
	})
	it('three levels 102', function() {
		rectanglesCoveringSouthernLevels([{y:1,minx:0,maxx:1}, {y:0,minx:1,maxx:2}, {y:2,minx:2,maxx:4}]).should.eql(
			[{minx:1,maxx:2,miny:0,maxy:1}, {minx:0,maxx:2,miny:1,maxy:2}, {minx:0,maxx:4,miny:2,maxy:Infinity}]);
	})
	it('three levels 021', function() {
		rectanglesCoveringSouthernLevels([{y:0,minx:0,maxx:1}, {y:2,minx:1,maxx:2}, {y:1,minx:2,maxx:4}]).should.eql(
			[{minx:0,maxx:1,miny:0,maxy:2}, {minx:2,maxx:4,miny:1,maxy:2}, {minx:0,maxx:4,miny:2,maxy:Infinity}]);
	})
	it('three levels 201', function() {
		rectanglesCoveringSouthernLevels([{y:2,minx:0,maxx:1}, {y:0,minx:1,maxx:2}, {y:1,minx:2,maxx:4}]).should.eql(
			[{minx:1,maxx:2,miny:0,maxy:1}, {minx:1,maxx:4,miny:1,maxy:2}, {minx:0,maxx:4,miny:2,maxy:Infinity}]);
	})
	it('three levels 210', function() {
		rectanglesCoveringSouthernLevels([{y:2,minx:0,maxx:1}, {y:1,minx:1,maxx:2}, {y:0,minx:2,maxx:4}]).should.eql(
			[{minx:2,maxx:4,miny:0,maxy:1}, {minx:1,maxx:4,miny:1,maxy:2}, {minx:0,maxx:4,miny:2,maxy:Infinity}]);
	})
	it('three levels 120', function() {
		rectanglesCoveringSouthernLevels([{y:1,minx:0,maxx:1}, {y:2,minx:1,maxx:2}, {y:0,minx:2,maxx:4}]).should.eql(
			[{minx:2,maxx:4,miny:0,maxy:2}, {minx:0,maxx:1,miny:1,maxy:2}, {minx:0,maxx:4,miny:2,maxy:Infinity}]);
	})
})


var updatedLevels = jsts.algorithm.updatedLevels;
describe('updatedLevels', function() {
	it('single level', function() {
		var levels = [{"y":0,"minx":0,"maxx":1}];
		var landplot = {"minx":0,"miny":0,"maxx":0.75,"maxy":0.75};
		updatedLevels(levels,landplot,"S").should.eql([{"y":0.75,"minx":0,"maxx":0.75},{"y":0,"minx":0.75,"maxx":1}]);
	})
	it('zero-sized plot at south', function() {
		var levels = [{"y":0,"minx":0,"maxx":1}];
		var landplot = {"minx":0,"miny":0,"maxx":0,"maxy":0};
		updatedLevels(levels,landplot,"S").should.eql(levels);
	})
	it('zero-sized plot at north', function() {
		var levels = [{"y":0,"minx":0,"maxx":1}];
		var landplot = {"minx":1,"miny":0,"maxx":1,"maxy":0};
		updatedLevels(levels,landplot,"S").should.eql(levels);
	})
});
