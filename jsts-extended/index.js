var jsts = require("jsts");
require("./intersection-cache");
require("./factory-utils");
require("./point-utils");
require("./AxisParallelRectangle");
require("./maximum-disjoint-set-sync");
require("./maximum-disjoint-set-async");
require("./representative-disjoint-set-sync");
require("./shapes-touching-points");
require("./square-with-max-points");
require("./corners");
require("./transformations");
require("./fair-division-of-points");
require("./half-proportional-division-staircase");
jsts.stringify = function(object) {
	if (object instanceof Array) {
		return object.map(function(cur) {
			return cur.toString();
		});
	}
	else return object.toString();
}
module.exports = jsts;
