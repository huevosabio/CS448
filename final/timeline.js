//modified from https://github.com/nyquist212/CMSMSPB/blob/master/js/drawCharts.js
function plotTimeline (byDate, containerId, chartSize) {

    var width = chartSize.width - chartSize.margin.left - chartSize.margin.right,
        height = chartSize.height - chartSize.margin.top - chartSize.margin.bottom;

    var xScale = d3.scaleTime().range([0, width]);

    var yScale = d3.scaleLinear().range([height, 0]);

    var barPadding = 1;

    var byDateGroup = byDate.group().reduceSum(function(d) { return d.dailySum; });

    //console.log(byDateGroup.all());

    xScale.domain(d3.extent(byDateGroup.all(), function(d) { return d.key; }));
    yScale.domain([0,d3.extent(byDateGroup.all(), function(d) { return d.value; })[1]]);

    // bar tool tip
    /*
    var tip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function(d) { return  d.value + " hospitals" + "<br/>" + "achieved " + d.key; });
	*/
    // brush
    var brush = d3.brushX()
            .on("brush", brushmove)
            .on("end", brushend);

    var svg = d3.select(containerId)
            .append("svg")
            .attr("width", chartSize.width)
            .attr("height", chartSize.height)
            //.attr("transform", "translate(" + chartSize.margin.left + "," + chartSize.margin.top + ")")
            //.call(tip)
    var _barChart = svg.append("g").attr("transform", "translate(" + chartSize.margin.left + "," + chartSize.margin.top + ")");

    var brushg = svg.append("g")
            .attr("class", "brush")
            .attr("height", chartSize.height)
            .attr("transform", "translate(" + chartSize.margin.left + "," + chartSize.margin.top + ")")
            .call(brush)

        brushg.selectAll("rect")
            .attr("height", chartSize.height);

        brushg.selectAll(".resize")
            .append("path")
            .attr("d", resizePath);

    render();        

        // Add Y Axis Label 
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("dy", "1em")
            .attr("x",0-(chartSize.height/2))
            .attr("class", "x-axis-label")
            .style("text-anchor", "middle")
            .text("Total Daily Consumption (MWh)");

    // Histogram Y Axis 
    var yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(d3.format(".2s"));

        _barChart.append("g")
            .attr("class", "axis")
            .attr("class", "axis axis--y y-axis-label")
            .call(yAxis);

    // Histogram X Axis Object
    var xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat("%b"));

        _barChart.append("g")
            .attr("class", "axis axis--x x-axis-label")
      		.attr("transform", "translate(0," + height + ")")
            .call(xAxis);
    
    function render() {
        console.log(snap_to_zero(byDateGroup).all());
        // Histogram bars
        var bars = _barChart.selectAll("rect")
            .data(snap_to_zero(byDateGroup).all(),function(d) { 
                return d ? String(d.key) + String(d.value) : this.id; 
            });

        bars.enter().append("rect")
            .attr("x", function (d) {return xScale(d.key); })
            .attr("width", width / byDateGroup.size() - barPadding)
            .attr("y", function (d) { return yScale(d.value); })
            .attr("height", function (d) { return (height- yScale(d.value)); })
            .attr("class", "foreground.bar") 
            .attr("fill", "#91C194")
        
        bars.exit().remove();  
    }


    // Dark arts of ugly hackery ahead 
    function brushmove() { 
        // Get brush extent vals
        var s = d3.event.selection, lower = s[0], upper = s[1];
        // Select bar rects and adjust opacity
        _barChart.selectAll("rect")
            .style("opacity", function(d) {
                // Get data value keys and scale them
                var k = xScale(d.key)// + barPadding * xScale.rangeBand();
                // If d.key is within extent adjust opacity
                return lower <= k && k <= upper ? "1" : ".2";  
             });
        // Filter crossfilter by brush
        byDate.filterRange([ xScale.invert(lower).getTime(), xScale.invert(upper).getTime()]);
        // Render filtered hospital plots
        /* not yet 
        _mapChart.selectAll("g.hospital").remove();
        _mapChart.selectAll("g.hospital").transition(); 
        _mapChart.select("g.hospital").attr("d", plotHospitals(filt));
        */

    } // End brushmove

    function brushend(){
        if (d3.event.selection === null){
            // Select bar rects and adjust opacity
            _barChart.selectAll("rect")
                .style("opacity","1");
            byDate.filter(null);
        }
    }

    function resizePath(d) {
        // Style the brush resize handles. No idea what these vals do.
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = chartSize.height / 4; // Relative positon if handles
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
	}

    return render;
}