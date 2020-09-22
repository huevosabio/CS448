var shapeParser = dataParser(d3.timeParse("%m/%e/%y %H:%M"), ['date'], new Set(["dailySum","avg"])),
	chartSize = {
		width: document.getElementById('shapesCard').clientWidth,
		height: 200,
    	margin: {top: 20, right: 16, bottom: 40, left: 50}
	},
	meterParser = dataParser(d3.timeParse("%m/%e/%y"), ['id','date'], new Set(["dailySum", "avg"]));

var renderEvent = new Event("render")
var renderTimes = [];
//var cf;
//var byId;

d3.queue()
    .defer(d3.csv, 'dic_profiles.csv', shapeParser)
    .defer(d3.csv, 'encodedMeterData.csv', meterParser)
    .defer(d3.json, 'ca.topojson')
    .await(function(error, shapeData, meterData, zipCodes) {
      	if (error) throw error;
      	// makeshift event

      	// Crossfilter dimensions and groups
      	cf = crossfilter(meterData);
      	var	byDate = cf.dimension(function(d, idx){return d.date; });
      	var byZip = cf.dimension(function(d, idx){return d.zip5});
      	var byShape = cf.dimension(function(d, idx){return d.shapeCode;});
        //var byId = cf.dimension(function(d, idx){return d.id;});
        //var byIdGroup = byId.group();
        //var byAvg = cf.dimension(function(d, idx) {return d.avg});
        
        // get those averages
        //var reducer = reductio().count(true).sum(function(d){ return d.dailySum;}).avg(true);
        //reducer(byIdGroup);
        //var idAverages = byIdGroup.all();

        plotShapes(shapeData, '#shapesChart', chartSize, byShape, renderEvent);
      	renderTimeline = plotTimeline(byDate, '#timeline', chartSize, renderEvent);
        //renderHistogram = plotHistogram (byAvg, idAverages, '#histogram', chartSize, renderEvent);

      	// ignore the # in this case
      	renderMap = plotMap(zipCodes, 'mapId', byZip);
      	window.addEventListener("render", function(e){
          var t1 = (new Date).getTime();
      		renderTimeline();
          renderMap();
          var t3 = (new Date).getTime();
          renderTimes.push(t3 - t1);
          //renderHistogram();
      	})
    });

function dataParser(timeParser, nonNumericCols, roundCols){
	return function type(d, _, columns) {
	  d.date = timeParser(d.date);
	  for (var i = 1, n = columns.length, c; i < n; ++i) {
	  	if (nonNumericCols.indexOf(columns[i]) === -1){
	  		if (roundCols.has(columns[i])){
	  			d[c = columns[i]] = Math.round(d[c] * 1000);
	  		} else {
	  			d[c = columns[i]] = +d[c];
	  		}
	  		
	  	}
	  }
	  return d;
	}
}


function snap_to_zero(source_group) {
    return {
        all:function () {
            return source_group.all().map(function(d) {
                return {key: d.key, 
                        value: (Math.abs(d.value)<1e-6) ? 0 : d.value};
            });
        }
    };
}