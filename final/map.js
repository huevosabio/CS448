// javascript stuff
// built on top of https://bl.ocks.org/zross/11186669
function plotMap(data, containerId, byZip){
	// some groups
	var byZipGroup = byZip.group().reduceSum(function(d) { return d.dailySum; });


	// initialize map
	var mymap = L.map(containerId).setView([37.1347, -119.3034], 7);

	// add layer
	L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaHVldm9zYWJpbyIsImEiOiJmTHplSnY0In0.7eT8FT5PcjhjC6Z5mJaKCA', {
    	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    	detectRetina: true
	}).addTo(mymap);

	// svg objects
	var svg = d3.select(mymap.getPanes().overlayPane).append("svg"),
    	g = svg.append("g").attr("class", "leaflet-zoom-hide");

    var zips = topojson.feature(data, data.objects.zip),
    	transform = d3.geoTransform({point: projectPoint}),
    	path = d3.geoPath().projection(transform);

    var fill = d3.scaleLinear()
    	.domain([0, d3.extent(byZipGroup.all(), function(d) { return d.value; })[1]])
    	.range(["steelblue", "brown"]);

    var zipEnergy = {};
    byZipGroup.all().forEach(function(d){
    	zipEnergy[d.key] = d.value;
    });

    //Create freaking object with all the zip values; this might need to go away once we have filtering


    var feature = g.selectAll("path")
      	.data(zips.features)
      	.enter().append("path")
      	.attr("class", "zipcodes")
        .attr("d", path)
        .style("fill", function(d) {
        	if (d.properties.zipcode in zipEnergy){
        		return fill(zipEnergy[d.properties.zipcode]);
        	} else{
        		return fill(0);
        	}
        });

    mymap.on("viewreset", reset);
    mymap.on("viewreset", function (e) { console.log("viewreset", e); });
    mymap.on("zoomend", reset);
    reset();

    function reset() {
        var bounds = path.bounds(zips),
        topLeft = bounds[0],
        bottomRight = bounds[1];

        svg.attr("width", bottomRight[0] - topLeft[0])
        	.attr("height", bottomRight[1] - topLeft[1])
        	.style("left", topLeft[0] + "px")
        	.style("top", topLeft[1] + "px");

        g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        feature.attr("d", path);
     }

     function projectPoint(x, y) {
        var point = mymap.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
     }

     function hasZipcode(arr, zipcode){
     	return arr.some(function(element){
     		return element.zip5 === zipcode;
     	});
     }
}
