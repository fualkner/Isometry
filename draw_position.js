//Isometry -- Graph Theory Project
//    draw_position.js >> contains methods for calculating desired draw location
//        of vertices and edges.
	function completeGraphPosition(angle){
		var direction = [Math.cos(angle), Math.sin(angle)];
		var xMag = width/2;
		var yMag = height/2;
		var ret = [(direction[0]*(xMag-10))+(xMag), (direction[1]*(yMag-10))+(yMag)];
		//console.log(ret);
		return ret;
	}
	//From & To: Array holding an (x,y) pair.
	function getUnitSlope(from, to){
		var slope = [(to[0]-from[0]),(to[1]-from[1])];//vector notation
		var slopeLength = Math.sqrt( (slope[0]*slope[0])+(slope[1]*slope[1]) );
		var unitSlope = [slope[0]/slopeLength , slope[1]/slopeLength];
		return unitSlope;
	}

	function getOrthogonalUnitSlope(from, to){
		var unitSlope = getUnitSlope(from, to);
		var orthoSlope = [-1*unitSlope[1], unitSlope[0]];
		return orthoSlope;
	}

	function getDistance(from, to){
		var slope = [(to[0]-from[0]),(to[1]-from[1])];//vector notation
		var slopeLength = Math.sqrt( (slope[0]*slope[0])+(slope[1]*slope[1]) );
		return slopeLength;
	}

	//calculateEdge: a d3 method for positioning an edge correctly.
	function calculateEdge(d, i){

		// console.log("Calculating edge: "+d.returnKey());
		// console.log([d.from,d.to].join(","));
		var from = calculateTrueVertexPosition(d.from);
		var to = calculateTrueVertexPosition(d.to);

		// console.log([d.from," : ",from[0],from[1]].join(" "));
		// console.log([d.to," : ",to[0],to[1]].join(" "));
		unitSlope = getUnitSlope(from, to);

		// Now, what the hell are we doing? Calculating a unit vector
		// in order to chop off enough of the line so that it doesn't
		// intersect with the vertex (circle)
		from[0] += unitSlope[0] * d3.select('#v'+d.from+" circle").attr("r");
		from[1] += unitSlope[1] * d3.select('#v'+d.from+" circle").attr("r");
		to[0]   -= unitSlope[0] * d3.select('#v'+d.to+" circle").attr("r");
		to[1]   -= unitSlope[1] * d3.select('#v'+d.to+" circle").attr("r");

		//Now, to draw the arrowhead: calculate orthogonal line,
		//position desired distance from end point
		//calculate the endpoint a given magnitude away
		//and draw from the end point of the orthogonal line
		//to the endpoint of the shaft.
		var orthoSlope = getOrthogonalUnitSlope(from,to);
		var crossDistance = [to[0] - (unitSlope[0]*4),to[1] - (unitSlope[1]*4)];//Location that the ortho-line crosses the shaft
		var leftArrowEnd = [crossDistance[0]+(orthoSlope[0]*5), crossDistance[1]+(orthoSlope[1]*5)];
		var rightArrowEnd = [crossDistance[0]-(orthoSlope[0]*5), crossDistance[1]-(orthoSlope[1]*5)];
		// this, in context, is the line element being adjusted. I hope.
		d3.select(this).classed("edge",true).classed("e"+d.from, true).classed("e"+d.to, true);
		d3.select(this).select(".shaft").attr("x1", from[0]).attr("y1",from[1])
		.attr("x2", to[0]).attr("y2", to[1]);
		
		d3.select(this).select(".edgeWeight")
		.attr("x",(to[0] - (0.2 * getDistance(from, to)* unitSlope[0]))).attr("y",(to[1] - (0.2 * getDistance(from, to) * unitSlope[1])))
		.text(function(d){return d.weight;});

		d3.select(this).select(".leftArrow").attr("x1", to[0]).attr("y1",to[1])
		.attr("x2", leftArrowEnd[0]).attr("y2", leftArrowEnd[1]);
		d3.select(this).select(".rightArrow").attr("x1", to[0]).attr("y1",to[1])
		.attr("x2", rightArrowEnd[0]).attr("y2", rightArrowEnd[1]);
	}

	//shiftDoubleEdges: shifts 1-vertex cycles so you can see both vertices.
	//  Vertex A has an edge to B, which has an edge to A. This algorithm detects those,
	//  and shifts them so both are visible.
	//  MUTATES EDGE CODE NUMBERS.
	function shiftDoubleEdges(selection){
		resetGraphCodes();
		var up = new Array();
		var down = new Array();
		selection.each(function(d){//d = each vertex once.
			for(i=0; i<d.edges.length; i++){
				var edge = d.edges[i];
				//console.log("on edge: "+edge.returnKey());
				if(edge.code!==1){
					var filteredEdges = d3.selectAll('.e'+edge.from).filter('.e'+edge.to);
					if(filteredEdges[0].length > 1){
						//This line does not support multigraphs.
						//You should feel bad if you're using a multigraph anyway.
						filteredEdges.data()[0].code = 1;
						filteredEdges.data()[1].code = 1;//Magically changes the base Edge object! Woot woot!
						up.push(filteredEdges[0][0]);//Do not ask
						down.push(filteredEdges[0][1]);//how the sausage is made
					}
					edge.code = 1;
				}
			}
		});
		d3.selectAll(up).each(function(d){
			var curLine = d3.select(this); console.log(curLine.attr("x1"));
			
			var from = [curLine.select('.shaft').attr("x1"), curLine.select('.shaft').attr("y1")];
			var to = [curLine.select('.shaft').attr("x2"), curLine.select('.shaft').attr("y2")];
			var vector = getOrthogonalUnitSlope(from, to);
			
			var translationStatement = ["translate(",-5*vector[0],",",-5*vector[1],")"].join("");
			curLine.attr("transform", translationStatement);
		});
		d3.selectAll(down).each(function(d){
			var curLine = d3.select(this);
			
			var from = [curLine.select('.shaft').attr("x1"), curLine.select('.shaft').attr("y1")];
			var to = [curLine.select('.shaft').attr("x2"), curLine.select('.shaft').attr("y2")];
			var vector = getOrthogonalUnitSlope(from, to);
			
			var translationStatement = ["translate(",-5*vector[0],",",-5*vector[1],")"].join("");
			curLine.attr("transform", translationStatement);
		});
	}
	
	//Finds the position of a vertex in the <svg>. Includes the translation of the <g> surrounding the vertex.
	function calculateTrueVertexPosition(vertName){
		var transLine = d3.select("#v"+vertName).attr("transform");
		// console.log("On "+vertName+" Found: "+transLine);
		var translateRegExp = /translate\(-?\d+,-?\d+\)/ig;
		var translation = [0, 0];
		if(translateRegExp.test(transLine)){
			console.log("translation detected!");
			var transStatement = transLine.match(translateRegExp);
			//console.log(transStatement);
			var numbersRegExp = /-?\d+/g;
			var numbers = transStatement[0].match(numbersRegExp);
			translation[0] = numbers[0];
			translation[1] = numbers[1];
			//console.log(vertName+" "+translation);
		}
		return [parseFloat(d3.select('#v'+vertName+" circle").attr("cx"))+parseFloat(translation[0]), parseFloat(d3.select('#v'+vertName+" circle").attr("cy"))+parseFloat(translation[1])];	
	}