/**
 * Search for a point that gives the required proportionality.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-02
 */
var X_RANGE = Y_RANGE = 400;
var xminWall = 0; //-Infinity; //
var xmaxWall = Infinity; // X_RANGE; //
var yminWall = 0; // -Infinity; // 
var ymaxWall = Infinity; // Y_RANGE; //

var fs = require('fs');
var exec = require('child_process').exec;
var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var envelope = new jsts.geom.Envelope(xminWall, xmaxWall, yminWall, ymaxWall);

function createResults(fromX, toX, fromY, toY, step, newPoints, callback) {
	var startTime=new Date();
	var results = "";
	var minDisjointSetSize=Infinity, maxDisjointSetSize=0;
	for (var x=fromX; x<=toX; x+=step) {
		for (var y=fromY; y<=toY; y+=step) {
			var points = newPoints(x,y)
			var candidates = factory.createSquaresTouchingPoints(points, envelope);
			var disjointset = jsts.algorithm.maximumDisjointSet(candidates, points.length-1);
			results += (x+"\t"+y+"\t"+disjointset.length+"\n");
			if (disjointset.length<minDisjointSetSize)
				minDisjointSetSize = disjointset.length;
			if (disjointset.length>maxDisjointSetSize)
				maxDisjointSetSize = disjointset.length;
		}
	}
	console.log("sizes="+minDisjointSetSize+".."+maxDisjointSetSize+". Time: "+(new Date()-startTime)+" [ms]");
	callback(results, minDisjointSetSize, maxDisjointSetSize);
}


for (var yy=0; yy<400; yy+=25) {
	createResults(0,400, 0,400, 5, 
		function newPoints(x,y) {
			return [
			  	  {x:0, y:0},
			  	  {x:100, y:yy},
			  	  {x:x, y:y},
			  	];
		},
		function callback(results, minDisjointSetSize, maxDisjointSetSize) {
			var input = "results/"+(1000+yy)+".dat";
			var output = "results/"+(1000+yy)+".png";
			fs.writeFileSync(input, results);
			var command = "gnuplot --persist -e '"+
				"set size square; "+
				"rgb(r,g,b) = 65536 * int(r) + 256 * int(g) + int(b); "+
				"set term png; set output \""+output+"\";"+
				"plot \""+input+"\" using 1:2:(rgb(0,($3-"+minDisjointSetSize+")*"+(250/(maxDisjointSetSize-minDisjointSetSize))+",0)) with points pointsize 1 pointtype 5 linecolor rgbcolor variable title\"\""+
				"'";
			//console.log(command);
			exec(command, function (error, stdout, stderr) {
						if (stdout) console.log('stdout: ' + stdout);
						if (stderr) console.log('stderr: ' + stderr);
						if (error !== null) {
							console.log('exec error: ' + error);
						}
				}
			);
		}
	);
}	
