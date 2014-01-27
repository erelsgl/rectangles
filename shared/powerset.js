/**
 * @param list a list.
 * @return a list of lists that are subsets of the original list.
 * 
 * @author Tom Demuyt
 * @link http://codereview.stackexchange.com/a/39747/20684
 */
function powerSet(list) {
    var powerset = [],
    listLength = list.length,
    combinationsCount = (1 << listLength);

	for (var i=0; i<combinationsCount; i++, powerset.push(combination) )
	    for (var j=0, combination=[]; j<listLength; j++)
	        if ((i & (1 << j)))
	            combination.push(list[j]);
	return powerset;	
}

module.exports = powerSet;
