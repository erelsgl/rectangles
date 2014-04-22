/**
 * Walls.js - handling the 4 walls of the land.
 */

function setWallStyle(direction, isChecked) {
	$("#svg").css("border-"+direction, isChecked? "solid #000": "dotted #ccc");
}

function setWallFlag(direction, isChecked) {
	$("#wall-"+direction).prop("checked", isChecked);
	setWallStyle(direction, isChecked);
}

function wallsToString() {
	return ""+
		($("#wall-top").is(":checked")? 1: 0)+","+
		($("#wall-bottom").is(":checked")? 1: 0)+","+
		($("#wall-left").is(":checked")? 1: 0)+","+
		($("#wall-right").is(":checked")? 1: 0);
}

function wallsFromString(string) {
	if (!string) return;
	var flags = string.split(/,/);
	if (flags.length != 4)
		throw new Error("expected a string with 4 values but found '"+string+"'");
	setWallFlag("top", flags[0]=='1');
	setWallFlag("bottom", flags[1]=='1');
	setWallFlag("left", flags[2]=='1');
	setWallFlag("right", flags[3]=='1');
}

$(document).ready(function() {
	setWallStyle("top", $("#wall-top").is(":checked"));
	setWallStyle("bottom", $("#wall-bottom").is(":checked"));
	setWallStyle("left", $("#wall-left").is(":checked"));
	setWallStyle("right", $("#wall-right").is(":checked"));
	
	$(".wall").change(function() {
		var isChecked = $(this).is(':checked');
		var direction = $(this).attr("id").replace(/^wall-/,"");
		setWallStyle(direction, isChecked);
	})
})

