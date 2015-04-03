// We're going to use the node.js "request" package to make HTTP requests.
var request = require('request');

// We need the filesystem (fs) package so we can file I/O.
var fs = require('fs');

// This function returns the unemployment statistics for a given county id.
// 
// A list of these county ids is available here:
// http://en.wikipedia.org/wiki/List_of_United_States_counties_and_county_equivalents
//
// Makes a HTTP POST request to the Bureau of Labor Statistics (BLS) website,
// using their public API, documented here:
// http://www.bls.gov/developers/api_sample_code.htm
function get_data_from_bls(county_id, start_year, end_year) {
  // The series ID for unemployment statistics can be pieced together from
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
      registrationKey: "f7cbaf1e32e145c8a959c9d6451c9930",
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

    if (body['Results'] === undefined) {
      return;
    }

    if (body['Results']['series'] === undefined) {
      return;
    }

    if (body['Results']['series'][0]['data'] === undefined) {
      return;
    }

    // Pull the timeseries data out of the response.
    var time_series = body['Results']['series'][0]['data'];

    // If the data has zero length, it means the county id probably didn't exist.
    if (time_series.length == 0) {
      console.log("BLS server had no data; county probably doesn't exist.");
      return;
    }

    console.log("Got " + time_series.length + " data items for county " + county_id);

    // Each time series data item looks like this originally:
    // 
    // {
    //   'footnotes': [{'code': 'M',
    //                'text': 'Data are provisional, subject to revision on April 21.'}],
    //   'period': 'M12',
    //   'periodName': 'December',
    //   'value': '6.0',
    //   'year': '2013'
    // }
    //
    // This is okay, but can be improved. The footnotes section is basically
    // just useless cruft, so we can remove it and make the file smaller.
    //
    // We can lop off the 'M' off the period (M1 means January, M12 means 
    // December). It'll be easier to use the month value as a integer.
    //
    // The 'year' and 'value' elements are given as strings; let's turn them
    // into numbers, too.
    //
    // After clean up, the data items look like this:
    //
    // {'month': 12, u'periodName': u'December', u'value': 7.4, u'year': 2013}
    time_series.map(function(item) {
      delete item['footnotes'];

      item['month'] = item['period'].substr(1, item['period'].length - 1);
      delete item['period'];

      item['month'] = parseInt(item['month']);
      item['year'] = parseInt(item['year']);
      item['value'] = parseFloat(item['value']);
    })

    // Add this county's time series to the whole collection of all the data.
    all_county_data[county_id] = time_series;

    // Finally, dump the data to a JSON file.
    var json_data = JSON.stringify(all_county_data);
    fs.writeFile("unemployment_data.json", json_data); 
  }

  // Use the request library to make an HTTP request, using the options and the
  // callback defined above.
  request(options, callback);
}

// Start with an empty structure to store the data for all the counties.
all_county_data = {};

// Iterate over NC counties.
for (var county_id = 37000; county_id < 37200; county_id++) {
  get_data_from_bls(county_id, 2006, 2014);
}

// Iterate over SC counties.
for (var county_id = 45000; county_id < 45200; county_id++) {
  get_data_from_bls(county_id, 2006, 2014);
}