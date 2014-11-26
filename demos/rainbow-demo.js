var _ = require("underscore");
_.mixin(require("../jsts-extended/rainbow"));

var object = {x:1,y:2};
console.dir(_.rainbowDuplicate(object,5));
