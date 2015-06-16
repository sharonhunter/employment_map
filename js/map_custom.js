//TODO: Refactor to elimainate global/window variables

var width = 860,
    height = 500;

var projection = d3.geo.albers()
    .scale(5000)
    .translate([ -800, -20]);

// adds threshold-type quantization with 12 2% data ranges and 13 colors
// refer to http://bl.ocks.org/mbostock/3306362
var color = d3.scale.threshold()
    .domain([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24])
    .range(['#006400', '#4e8f3e', '#87bc74', '#c0ebac','#ffe6e6','#ffc5d3','#ffa5bc','#f884a3','#ec6588','#db476b','#c62a4c','#ab0f2a','#8b0000']);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

function convertToYearAndMonth(decimalDate){ 
  var year = Math.trunc(decimalDate);
  var month = Math.round((decimalDate - year) * 12) +1;
  var array = [year, month];
  return array;
}

window.yearAndMonth = [2006, 1];

queue()
    .defer(d3.json, "nc_sc_geo.json")          // The geo data
    .defer(d3.json, "unemployment_data.json")  // The unemployment data
    .await(allDataLoaded);

function allDataLoaded(error, topology, unemployment) {
  window.topology = topology;
  window.unemployment = unemployment;
  createMap();
  redrawMap();
}

function createMap(){
  svg.selectAll("path.counties")
      .data(topojson.feature(topology, topology.objects.counties).features)
    .enter().append("path")
    .classed('counties', true)
      .attr("d", path);

  svg.selectAll("path.states")
      .data(topojson.feature(topology, topology.objects.states).features)
    .enter().append("path")
    .classed('states', true)
      .attr("d", path);
}

function redrawMap(){

  function getCountyColor(county) {
    for(x in unemployment[county.id]){
      var element = unemployment[county.id][x];
      if (element.year === window.yearAndMonth[0] && element.month === window.yearAndMonth[1]){
         return color(element.value);
      }
    }
  }
  svg.selectAll("path.counties").style("fill", getCountyColor);
}

// creates new slider object
window.slider = d3.slider()
      .axis(true)
      .min(2006)
      .max(2015)
      .step(1.0/12.0)
      .on("slide", function(evt, value) {
        window.yearAndMonth = convertToYearAndMonth(value);
        redrawMap();
      });
// connects div to the slider object
d3.select('#slider').call(window.slider);

d3.select("#animate_map").on("click", function(evt, value) {
  window.animationTimer = setInterval(animateStep, 250);
});

function animateStep(){
  
  window.yearAndMonth[1] += 1;
  if (window.yearAndMonth[1] === 13) {
    window.yearAndMonth[0] += 1;
    window.yearAndMonth[1] = 1; 
  }
  if (window.yearAndMonth[0] === 2015 && window.yearAndMonth[1] === 1) {
    clearInterval(window.animationTimer);
    return;
  }
  //take year and month from array and convert to year.month
  var sliderValue = window.yearAndMonth[0] + (window.yearAndMonth[1]/12.0);
  //moves slider handle to new position
  window.slider.value(sliderValue);
  redrawMap();

}
