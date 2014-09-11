var jsts = require("../../computational-geometry");
require("./point-utils");
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
