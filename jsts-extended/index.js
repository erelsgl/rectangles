var jsts = require("jsts");
require("./intersection-utils");
require("./factory-utils");
require("./AxisParallelRectangle");
require("./maximum-disjoint-set-sync");
require("./maximum-disjoint-set-async");
require("./squares-touching-points");
jsts.stringify = function(object) {
	if (object instanceof Array) {
		return object.map(function(cur) {
			return cur.toString();
		});
	}
	else return object.toString();
}
module.exports = jsts;
