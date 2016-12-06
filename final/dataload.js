var shapeParser = dataParser(d3.timeParse("%m/%e/%Y %H:%M")),
	chartSize = {
		width: document.getElementById('shapesCard').clientWidth,
		height: 200,
    	margin: {top: 20, right: 16, bottom: 40, left: 50}
	}



d3.queue()
    .defer(d3.csv, 'dic_profiles.csv', shapeParser)
    .await(function(error, shapeData) {
      if (error) throw error;
      plotShapes(shapeData, '#shapesChart', chartSize)
    });

function dataParser(timeParser){
	return function type(d, _, columns) {
	  d.date = timeParser(d.date);
	  for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
	  return d;
	}
}