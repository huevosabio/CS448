//modified from https://github.com/nyquist212/CMSMSPB/blob/master/js/drawCharts.js
function plotTimeline (byDate, containerId, chartSize) {

    var xScale = d3.scaleTime().range([0, chartSize.width]);

    var yScale = d3.scaleLinear().range([height, 0]);

    // bar tool tip
    /*
    var tip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function(d) { return  d.value + " hospitals" + "<br/>" + "achieved " + d.key; });
	*/
    // brush
    var brush = d3.brush()
            .on("brush", brushmove);

    var _barChart = d3.select(containerId).append("svg:svg")
            .attr("width", chartSize.width + chartSize.margin.left + chartSize.margin.right)
            .attr("height", chartSize.height + chartSize.margin.top + chartSize.margin.bottom)
            .attr("transform", "translate(" + chartSize.margin.left + "," + chartSize.margin.top + ")")
            //.call(tip)

    var brushg = _barChart.append("g")
            .attr("class", "brush")
            .call(brush)

        brushg.selectAll("rect")
            .attr("height", chartSize.height);

        brushg.selectAll(".resize")
            .append("path")
            .attr("d", resizePath);
        
        // Histogram bars
        _barChart.selectAll("rect")
            .data(byDate.all())
            .enter().append("rect")
            .attr("x", function (d) {return xScale(d.key); })
            .attr("width", chartSize.width / byScrGrp.size() - barPadding)
            .attr("y", function (d) { return yScale(d.value); })
            .attr("height", function (d) { return (chartSize.height - yScale(d.value)); })
            .attr("fill", function(d){ return color(d.key); })   
            //.on("mouseover",  tip.show ) 
            //.on("mouseout",  tip.hide )

        // Histogram Title (below)
        _barChart.append("text")
            .attr("x", chartSize.width/2)
            .attr("y", chartSize.height + chartSize.margin.top)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("MSPB Score Distribution");

        // Add Y Axis Label 
        _barChart.append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 45)
            .attr("text-anchor", "end")
            .text("Number of Hospitals");

    // Histogram Y Axis 
    var yAxis = d3.axis()
            .scale(yScale)
            .orient("right")
            .ticks(5);

        _barChart.append("g")
            .attr("class", "axis")
            .call(yAxis);

    // Histogram X Axis Object
    var xAxis = d3.axis()
            .scale(xScale)
            .orient("bottom");
        
        _barChart.append("g")
            .attr("class", "axis")
            .call(xAxis)
            .attr("transform", "translate(0, " + chartSize.height + ")") ;
        


    // Dark arts of ugly hackery ahead 
    function brushmove() { 
        // Get brush extent vals
        var s = brush.extent(), lower = s[0], upper = s[1];
        // Select bar rects and adjust opacity
        _barChart.selectAll("rect")
            .style("opacity", function(d) {
                // Get data value keys and scale them
                var k = xScale(d.key) + barPadding * xScale.rangeBand();
                // If d.key is within extent adjust opacity
                return lower <= k && k <= upper ? "1" : ".2";  
             });
        
        // Calculate pseudo extent from .range() and .rangeBand()
        var leftEdge = xScale.range(), width = xScale.rangeBand(); 
        for (var _l=0; lower > (leftEdge[_l] + width); _l++) {};
        for (var _u=0; upper > (leftEdge[_u] + width); _u++) {};
        // Filter crossfilter by the pseudo extent
        filt = byScr.filterRange([ xScale.domain()[_l], xScale.domain()[_u] ])
        // Render filtered hospital plots
        /* not yet 
        _mapChart.selectAll("g.hospital").remove();
        _mapChart.selectAll("g.hospital").transition(); 
        _mapChart.select("g.hospital").attr("d", plotHospitals(filt));
        */

    } // End brushmove
}

function resizePath(d) {
        // Style the brush resize handles. No idea what these vals do.
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 4; // Relative positon if handles
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