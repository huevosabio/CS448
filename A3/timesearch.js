var svg = d3.select("svg"),
    margin = {top: 30, right: 50, bottom: 30, left: 50},
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var parseDate = d3.timeParse("%m/%e/%y");

var x = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    z = d3.scaleOrdinal(d3.schemeCategory10);

var line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.price); });

var brush = d3.brush()
    .on("start brush", brushed);

 svg.append("g")
      .attr("class", "brush")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")") // super important!
      .call(brush)
      //.call(brush.move, null);

d3.csv("data_06-08.csv", type, function(error, data) {
  if (error) throw error;

  var stocks = data.columns.slice(1).map(function(id) {
    return {
      id: id,
      values: data.map(function(d) {
        return {date: d.date, price: d[id]};
      })
    };
  });

  x.domain(d3.extent(data, function(d) { return d.date; }));

  y.domain([
    d3.min(stocks, function(c) { return d3.min(c.values, function(d) { return d.price; }); }),
    d3.max(stocks, function(c) { return d3.max(c.values, function(d) { return d.price; }); })
  ]);

  z.domain(stocks.map(function(c) { return c.id; }));

  g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  // g.append("g")
  //     .attr("class", "axis axis--y")
  //     .call(d3.axisLeft(y))
  //   .append("text")
  //     .attr("transform", "rotate(-90)")
  //     .attr("y", 0)
  //     .attr("dy", "0.71em")
  //     .attr("fill", "#000")
  //     .text("Stock Price, $");

    svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Stock Price ($)");

  var stock = g.selectAll(".stock")
    .data(stocks)
    .enter().append("g")
      .attr("class", "stock");

  stock.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return z(d.id); });

  stock.append("text")
      .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.price) + ")"; })
      .attr("x", 3)
      .attr("dy", "0.35em")
      .style("font", "10px sans-serif")
      .text(function(d) { return d.id; });
});


function type(d, _, columns) {
  d.date = parseDate(d.date);
  for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
  return d;
}

function brushed() {
  var s = d3.event.selection,
      x0 = s[0][0],
      y0 = s[0][1],
      x1 = s[1][0],
      y1 = s[1][1],
      max = 0;
  
  stock = g.selectAll(".stock")
  stock.each(function(d) { d.scanned = d.selected = false; });
  search(stock, x0, y0, x1, y1);
  stock.classed("line--scanned", function(d) { return d.scanned; });
  stock.classed("line--selected", function(d) { return d.selected; });

}

// Find the lines within the specified rectangle.
function search(stock, x0, y0, x3, y3) {
  stock.each( function(d){
    d.values.forEach( function(v) {
        if ((x(v.date) >= x0) && (x(v.date) < x3) && (y(v.price) >= y0) && (y(v.price) < y3)){
          d.selected = true;
        };
    });
    d.scanned = true;
  })
}
