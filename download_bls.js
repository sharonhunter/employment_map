// We're going to use the node.js "request" package to make HTTP requests.
var request = require('request');

// The county code for Mecklenburg County, NC is 37119.
//
// A list of these county ids is available here:
// http://en.wikipedia.org/wiki/List_of_United_States_counties_and_county_equivalents
var county_id = "37119";

//  The series ID for unemployment statistics can be pieced together from
// information on this page: http://www.bls.gov/help/hlpforma.htm#LA
var series_id = "LAUCN" + county_id + "0000000003";
console.log("Getting series with id = " + series_id);

// These options describe the HTTP request we want to make. It's a POST
// request to a BLS server.
//
// We're sending the series id, start and end years, etc. to the server.
// 
// We're sending the data TO the server in JSON form -- that's what the
// "Content-type: application/json" header means.
//
// We're also going to intepret the response FROM the server as JSON, also.
// That's what the "json: true" means.
var options = {
  url: "http://api.bls.gov/publicAPI/v2/timeseries/data/",
  method: "POST",
  headers: {
    'Content-type': 'application/json'
  },
  body: {
    registrationKey: "f961d8c0689244699629478794a8de40",
    seriesid: [ series_id ],
    startyear: "2006",
    endyear: "2014"
  },
  json: true,
};

// This is the function we want to be called when the POST request is complete.
// It takes an error, an httpResponse object with all of the gritty internal
// details of the request, and the body -- the actual response we're interested
// in. The body is going to be in JSON form already, because we used "json:true"
// in the options above.
function callback(err, httpResponse, body) {
  // If there's an error, print it out and give up.
  if (err) {
    console.log("Error while making POST request: " + err);
    return;
  }

  // Pull the timeseries data out of the response.
  var data = body['Results']['series'][0]['data'];
  console.log(data);

  // If the data has zero length, it means the county id probably didn't exist.
  if (data.length == 0) {
    console.log("BLS server had no data; county probably doesn't exist.");
    return;
  }
}

// Use the request library to make an HTTP request, using the options and the
// callback defined above.
request(options, callback);