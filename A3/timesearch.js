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

//var quadtree = d3.quadtree()
//      .extent([[0, 0], [width + 1, height + 1]])
//      .x(function(d){ return x(d.date); })
//      .y(function(d){return y(d.price); });

var trees;

var metrics = [];
var fname = "IJGResults";
var csvContent = "data:text/csv;charset=utf-8,";

$("#pressme").click(function(){
    metrics.forEach(function(infoArray, index){
      dataString = infoArray.join(",");
      csvContent += dataString+ "\n";
    });

    var encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
});

d3.csv("data_06-08.csv", type, function(error, data) {
  if (error) throw error;

  var stocks = data.columns.slice(1).map(function(id, index) {
    values = data.map(function(d) {
        return {date: d.date, price: d[id], id: id, index: index};
      });

    return {
      id: id,
      values: values
    };
  });



  // create tree
  var allValues = [];
  stocks.forEach(function(data){
    allValues = allValues.concat(data.values);
  });

  var extent = [
    [
      d3.min(stocks, function(c) { return d3.min(c.values, function(d) { return x(d.date); }); }) -1,
      d3.min(stocks, function(c) { return d3.max(c.values, function(d) { return y(d.price); }); }) -1
    ],
    [
      d3.max(stocks, function(c) { return d3.min(c.values, function(d) { return x(d.date); }); }) + 1,
      d3.max(stocks, function(c) { return d3.max(c.values, function(d) { return y(d.price); }); }) + 1
    ]
  ]

  x.domain(d3.extent(data, function(d) { return d.date; }));

  y.domain([
    d3.min(stocks, function(c) { return d3.min(c.values, function(d) { return d.price; }); }),
    d3.max(stocks, function(c) { return d3.max(c.values, function(d) { return d.price; }); })
  ]);

  z.domain(stocks.map(function(c) { return c.id; }));

  trees = data.columns.slice(1).map(function(id, index) {
    values = data.map(function(d) {
        return {date: d.date, price: d[id], id: id, index: index};
      });

    var tree = d3.quadtree()
      .extent([[0, 0], [width + 1, height + 1]])
      .x(function(d){ return x(d.date); })
      .y(function(d){return y(d.price); })
      .extent(extent)
      .addAll(values);
      
    return {
      id: id,
      tree: tree
    };
  });

  //quadtree.extent(extent)
    //.addAll(allValues);

  g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

   g.append("g")
       .attr("class", "axis axis--y")
       .call(d3.axisLeft(y))
     .append("text")
       .attr("transform", "rotate(-90)")
       .attr("y", 0)
       .attr("dy", "0.71em")
       .attr("fill", "#000")
       .text("Stock Price, $");

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
    .attr("class", "stock line--scanned")
    .each(function(d) { d.selected = false; });;

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
  
  
  //stock.each(function(d) { d.scanned = d.selected = false; });
  //var t0 = performance.now();
  //var selected = treeSearch(quadtree, x0, y0, x1, y1);
  //var t1 = performance.now();
  //var ts = t1 - t0;
  //console.log("treeSearch took " + (t1 - t0) + " milliseconds.")
  //stock.classed("line--scanned", function(d) { return true; });
  //stock.classed("line--selected", function(d) { return selected.has(d.id); });
  //t0 = performance.now();
  //search(stock, x0, y0, x1, y1);
  //t1 = performance.now();
  //var s1 = t1 - t0
  //console.log("Search took " + (t1 - t0) + " milliseconds.")
  //stock.classed("line--selected", function(d) { return d.selected; });
  //t0 = performance.now();
  //search2(stock, x0, y0, x1, y1);
  //t1 = performance.now();
  //var s2 = t1 - t0
  //console.log("Search2 took " + (t1 - t0) + " milliseconds.")
  //t0 = performance.now();
  var selected = treeSearch2(trees, x0, y0, x1, y1);
  stock = g.selectAll(".stock").filter(function(d, i){
    var shouldSelect = selected.has(d.id);
    var isSelected = d.selected;
    if (shouldSelect != isSelected) {
      d.selected = shouldSelect;
      return true;
    } else {
      return false;
    }
  })
  stock.attr("class", function(d){
    if (d.selected){
      return "stock line line--selected";
    } else {
      return "stock line line--scanned"
    }
  })
  //stock.classed("line--selected", function(d) { return selected.has(d.id); });
  //t1 = performance.now();
  //var ts2 = t1 - t0;
  //console.log("treeSearch2 took " + (t1 - t0) + " milliseconds.")

  //area = (x1 - x0) * (y1 - y0);
  //metrics.push([area, ts, ts2, s1, s2])
}

// Find the lines within the specified rectangle.
// this is a painfully slow implementation, since it searches
// ofr each series and for each point.
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

function search2(stock, x0, y0, x3, y3) {
  stock.each( function(d){
    if (d.values.some(function(v){
      return (x(v.date) >= x0) && (x(v.date) < x3) && (y(v.price) >= y0) && (y(v.price) < y3);
    })){
      d.selected = true;
    }
  })
}


function treeSearch(quadtree, x0, y0, x3, y3) {
  var selected = new Set();
  quadtree.visit(function(node, x1, y1, x2, y2) {
    //console.log([x1, y1, x2, y2]);
    if (!node.length) {
      do {
        var d = node.data;
        //d.scanned = true;

        if ((x(d.date) >= x0) && (x(d.date) < x3) && (y(d.price) >= y0) && (y(d.price) < y3)){
          selected.add(d.id);
        };
        //d.selected = (d[0] >= x0) && (d[0] < x3) && (d[1] >= y0) && (d[1] < y3);
      } while (node = node.next);
    }
    //return false;
    return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
  });
  return selected;
}

function treeSearchBool(quadtree, x0, y0, x3, y3) {
  var found = false;
  quadtree.visit(function(node, x1, y1, x2, y2) {
    //console.log([x1, y1, x2, y2]);
    if (!node.length) {
      do {
        var d = node.data;
        //d.scanned = true;

        if ((x(d.date) >= x0) && (x(d.date) < x3) && (y(d.price) >= y0) && (y(d.price) < y3)){
          found = true;
          return true;
        };
        //d.selected = (d[0] >= x0) && (d[0] < x3) && (d[1] >= y0) && (d[1] < y3);
      } while (node = node.next && !found);
    }
    //return false;
    return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0 || found;
  });
  return found;
}

function treeSearch2(trees, x0, y0, x3, y3) {
  // for each tree search for the point, if point, add to set.
  var selected = new Set();
  trees.forEach(function(t){
    if (treeSearchBool(t.tree, x0, y0, x3, y3)){
      selected.add(t.id);
    };

  });
  return selected;
}
