/**
 * Search for a point that gives the required proportionality.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-02
 */
var X_RANGE = Y_RANGE = 400;

var xminWall = -Infinity; //0;//
var xmaxWall = Infinity; // X_RANGE; //
var yminWall = -Infinity; // 0; // 
var ymaxWall = Y_RANGE; //Infinity; // 

var maximumDisjointSet = require("../shared/maximum-disjoint-set");
var makeXYUnique = require("../shared/make-xy-unique");
var squaresTouchingPoints = require("../shared/squares-touching-points");
var pointsToString = require("../shared/points-to-string");

var initial_points = [
  {x:000, y:Y_RANGE},
  {x:100, y:Y_RANGE},
  {x:200, y:Y_RANGE},
  {x:300, y:Y_RANGE},
  {x:400, y:Y_RANGE},
  
  {x:200,y:0},
  
  {x:320, y:Y_RANGE-71},
  {x:80, y:Y_RANGE-70},
  ];

var points = initial_points.slice(0);
//makeXYUnique(points);
var disjointset = maximumDisjointSet(squaresTouchingPoints(points, xminWall, xmaxWall, yminWall, ymaxWall));
console.log(disjointset.length);

var start=new Date();

var fs = require('fs');
var results = "";
for (var x=0; x<=400; x+=5) {
	for (var y=0; y<=400; y+=5) {
		var points = initial_points.slice(0);
		points[5].x = x;
		points[5].y = Y_RANGE-y;
		makeXYUnique(points);
		var disjointset = maximumDisjointSet(squaresTouchingPoints(points, xminWall, xmaxWall, yminWall, ymaxWall));
		results += (x+"\t"+y+"\t"+disjointset.length+"\n");
	}
}
fs.writeFile("results.dat", results);

var elapsed=new Date()-start;
console.log("time: "+elapsed+" [ms]");

