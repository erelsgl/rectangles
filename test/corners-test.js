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

var updatedBorder = jsts.algorithm.updatedBorder;
describe('updatedBorder with square land', function() {
	var land = [{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:10,y:0},{x:0,y:0}];
	it('SW corner', function() {
		updatedBorder(land, {minx:0,miny:0, maxx:2,maxy:3}).should.eql([{x:0,y:10},{x:10,y:10},{x:10,y:0},{x:2,y:0},{x:2,y:3},{x:0,y:3},{x:0,y:10}]);
	});
	it('west wall', function() {
		updatedBorder(land, {minx:0,miny:1, maxx:2,maxy:3}).should.eql([{x:0,y:0},{x:0,y:1},{x:2,y:1},{x:2,y:3},{x:0,y:3},{x:0,y:10},{x:10,y:10},{x:10,y:0},{x:0,y:0}]);
	});
	it('entire west wall', function() {
		updatedBorder(land, {minx:0,miny:0, maxx:2,maxy:10}).should.eql([{x:10,y:10},{x:10,y:0},{y:0,x:2},{y:10,x:2},{x:10,y:10}]);
	});
	it('NW corner', function() {
		updatedBorder(land, {minx:0,miny:1, maxx:2,maxy:10}).should.eql([{x:0,y:0},{x:0,y:1},{x:2,y:1},{x:2,y:10},{x:10,y:10},{x:10,y:0},{x:0,y:0}]);
	});
	it('north wall', function() {
		updatedBorder(land, {minx:1,miny:1, maxx:9,maxy:10}).should.eql([{x:0,y:0},{x:0,y:10},{x:1,y:10},{x:1,y:1},{x:9,y:1},{x:9,y:10},{x:10,y:10},{x:10,y:0},{x:0,y:0}]);
	});
	it('entire north wall', function() {
		updatedBorder(land, {minx:0,miny:1, maxx:10,maxy:10}).should.eql([{x:0,y:0},{x:0,y:1},{x:10,y:1},{x:10,y:0},{x:0,y:0}]);
	});
	it('NE corner', function() {
		updatedBorder(land, {minx:1,miny:1, maxx:10,maxy:10}).should.eql([{x:0,y:0},{x:0,y:10},{x:1,y:10},{x:1,y:1},{x:10,y:1},{x:10,y:0},{x:0,y:0}]);
	});
	it('east wall', function() {
		updatedBorder(land, {minx:1,miny:1, maxx:10,maxy:9}).should.eql([{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:10,y:9},{x:1,y:9},{x:1,y:1},{x:10,y:1},{x:10,y:0},{x:0,y:0}]);
	});
	it('entire east wall', function() {
		updatedBorder(land, {minx:1,miny:0, maxx:10,maxy:10}).should.eql([{x:0,y:0},{x:0,y:10},{y:10,x:1},{y:0,x:1},{x:0,y:0}]);
	});
	it('SE corner', function() {
		updatedBorder(land, {minx:1,miny:0, maxx:10,maxy:3}).should.eql([{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:10,y:3},{x:1,y:3},{x:1,y:0},{x:0,y:0}]);
	});
	it('south wall', function() {
		updatedBorder(land, {minx:1,miny:0, maxx:8,maxy:3}).should.eql([{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:10,y:0},{x:8,y:0},{x:8,y:3},{x:1,y:3},{x:1,y:0},{x:0,y:0}]);
	});
	it('entire south wall', function() {
		updatedBorder(land, {minx:0,miny:0, maxx:10,maxy:3}).should.eql([{x:0,y:10},{x:10,y:10},{x:10,y:3},{x:0,y:3},{x:0,y:10}]);
	});
});

