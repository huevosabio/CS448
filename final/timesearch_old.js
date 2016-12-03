/*
Highly useful links:
https://bl.ocks.org/mbostock/1550e57e12e73b86ad9e
http://bl.ocks.org/syntagmatic/2409451
http://bl.ocks.org/sxv/4485778
http://bl.ocks.org/mbostock/6466603
https://github.com/d3/d3/blob/master/API.md
http://bl.ocks.org/mbostock/3808218
http://blog.schedulenaut.com/multiple-no-collision-brushes-in-d3js/ 
http://bl.ocks.org/jssolichin/54b4995bd68275691a23
*/

//var scenario = 'stock';
var scenario = 'energy';

var filename = scenario === 'energy' ? 'dic_profiles.csv' :  "data_06-08.csv";

var svgwidth = 500,
    svgheight = 200,
    margin = {top: 30, right: 50, bottom: 30, left: 50};

var canvas = d3.select('#shapesChart')
    .append('canvas')
    .attr('width', svgwidth)
    .attr('height', svgheight)
    .style("padding", margin.top + "px " + margin.right + "px " + margin.bottom + "px " + margin.left + "px "),
    context = canvas.node().getContext('2d');

//if(navigator.userAgent.toLowerCase().indexOf('firefox') <= -1){
     // If not Firefox
//    canvas.style('top', titlebox.height + titlebox.top + titlebox.bottom + "px")
//}

var svg = d3.select('#shapesChart')
    .append('svg')
    .attr('width', svgwidth)
    .attr('height', svgheight)
    //.style('top', titlebox.height + titlebox.top + titlebox.bottom),
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    width = svgwidth - margin.left - margin.right,
    height = svgheight - margin.top - margin.bottom;

//brushes container
//svg.append("g")
//   .attr("class", "brush")
//   .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); // super important!

if (scenario === 'stock'){
  var parseDate = d3.timeParse("%m/%e/%y");
} else if (scenario === 'energy'){
  var parseDate = d3.timeParse("%m/%e/%Y %H:%M");
}

var x = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    z = d3.scaleOrdinal(d3.schemeCategory10);

var line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.price); });

var backgroundline = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.price); })
    .context(context);

// keep track of brushes
var brushes = [];
var brushCounter = 0;
var selectedIds, allIds;
newBrush();


var trees,
    stocks;


d3.csv(filename, type, function(error, data) {
  if (error) throw error;

  stocks = data.columns.slice(1).map(function(id, index) {
    values = data.map(function(d) {
        return {date: d.date, price: d[id], id: id, index: index};
      });

    return {
      id: id,
      values: values
    };
  });

  allIds = stocks.map(function(d){
    return d.id;
  })


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

  // plot canvas
  context.beginPath();
  stocks.forEach(function(d){
    backgroundline(d.values);
  });
  context.lineWidth = 1.5;
  context.strokeStyle = "gray";
  context.globalAlpha = 0.1;
  context.stroke();


  g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

   g.append("g")
       .attr("class", "axis axis--y")
       .call(d3.axisLeft(y))

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("dy", "1em")
    .attr("x",0-(svgheight/2))
    .style("text-anchor", "middle")
    .text("Energy Fraction");

});


function type(d, _, columns) {
  d.date = parseDate(d.date);
  for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
  return d;
}

function brushend(){
  // add brush only if the last brush is not empty
  var topBrush = 'b' + (brushCounter -1);
  // if this the top brush AND there has been a change in the
  // selection
  if (this.id === topBrush){
    var lastBrushSelection = d3.brushSelection(this);
    if (lastBrushSelection[0] !== lastBrushSelection[1]){
      newBrush();
    }
  }
}

function brushed() {
  var thisId = this.id; // for some reason I cant dynamically access it
  if (d3.event.sourceEvent.shiftKey){
    brushes = brushes.filter(function(d){
      return d.id !== thisId;
    })
    this.remove();
    updateFilter();
    stock_filtered = stocks.filter(function(d, i){
        return selectedIds.has(d.id)
      });
    update(stock_filtered);
    return
  }
  var s = d3.event.selection,
      x0 = s[0][0],
      y0 = s[0][1],
      x1 = s[1][0],
      y1 = s[1][1],
      max = 0;
  var thisBrush = brushes.find(function(d){
    return thisId == d.id;
  });
  thisBrush.selection = treeSearch2(trees, x0, y0, x1, y1);
  thisBrush.selected = true;
  
  updateFilter();
  
  stock_filtered = stocks.filter(function(d, i){
        return selectedIds.has(d.id)
      });
  update(stock_filtered);
}

function updateFilter() {
  var activeBrushes = brushes.filter(function(b){
    return b.selected;
  })
  if (activeBrushes.length === 0){
    selectedIds = [];
  } else{
    selectedIds = allIds;
    activeBrushes.forEach(function(b){
      selectedIds = selectedIds.filter(function(i){
        return b.selection.has(i);
      })
    });
  }
  selectedIds = new Set(selectedIds);
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

function newBrush(){
  var brush = d3.brush()
      .on("brush", brushed)
      .on("end", brushend)
  brushes.push({
    id: 'b' + brushCounter, 
    brush: brush, 
    selection: [], 
    selected: false
    }); //d3 doesn't like all numeric ids
  brushCounter += 1;
  updateBrushes();
}

function updateBrushes() {
  var gBrush = svg
    .selectAll('.brush')
    .data(brushes,  function (d){ return d ? d.id : this.id; });

  gBrush.enter()
    .insert("g", '.brush')
    .attr('class', 'brush')
    .attr('id', function(d, i){return d.id})
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .each(function(brushWrapper) {
      //call the brush
      brushWrapper.brush(d3.select(this));
    });

  gBrush.attr('class', function(d,i){return 'brush brush-'+i})
    .selectAll('.overlay')
    .attr('pointer-events', function(brushWrapper, i){
          var brush = brushWrapper.brush;

          return i === brushes.length-1 &&
            brush !== undefined &&
            brush.brushSelection() === brush.brushSelection()
              ? 'all' : 'none';
    })

  gBrush.exit()
    .remove();
}

function update(data) {

  var stock = g.selectAll(".stock")
    .data(data, function(d) { return d ? d.id : this.id; });

  var update_stock = stock.enter().append("g")
    .attr("class", "stock line--selected");

  update_stock.append("path")
    .attr("class", "line")
    .attr("d", function(d) { return line(d.values); })
    .style("stroke", function(d) { return z(d.id); });  

  update_stock.append("text")
      .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.price) + ")"; })
      .attr("x", 3)
      .attr("dy", "0.35em")
      .style("font", "10px sans-serif")
      .text(function(d) { return d.id; });
  stock.exit().remove();
}
