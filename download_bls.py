import requests
import json
import pprint

# This function returns the unemployment statistics for a given county id.
#
# A list of these county ids is available here:
# http://en.wikipedia.org/wiki/List_of_United_States_counties_and_county_equivalents
#
# Makes a HTTP POST request to the Bureau of Labor Statistics (BLS) website,
# using their public API, documented here:
# http://www.bls.gov/developers/api_sample_code.htm
# 
def get_data_from_bls(county_id, start_year, end_year):
  # Convert the county id into a string, and make sure it has five characters,
  # with zeros on the left.
  county_id = str(county_id).zfill(5)

  # The series ID for unemployment statistics can be pieced together from
  # information on this page: http://www.bls.gov/help/hlpforma.htm#LA
  series_id = "LAUCN" + county_id + "0000000003"

  # The BLS API has some pretty strict quotas (queries per day, for example)
  # for unregistered users, so I registered myself at this page:
  # http://data.bls.gov/registrationEngine/
  #
  # This is the registration key I was given to identify myself.
  registration_key = "f961d8c0689244699629478794a8de40"

  # These are the headers and POST data required by the BLS server.
  headers = {'Content-type': 'application/json'}
  data = json.dumps({
    "registrationKey": registration_key,
    "seriesid": [series_id],
    "startyear": str(start_year),
    "endyear": str(end_year)
  })

  # Perform the HTTP POST request.
  p = requests.post('http://api.bls.gov/publicAPI/v2/timeseries/data/',
                    data=data, headers=headers)

  # The BLS server returns its data in textual JSON form; parse it into an
  # object we can dig into, and return it.
  json_data = json.loads(p.text)
  return json_data

# This is where the Python program actually starts running! The function
# defined above doesn't actually do anything until it is called.
if __name__ == '__main__':
  # The county codes are non-sequential, and it's annoying to have to go look
  # them up. Instead, just ask for all of the county ids from xx000 to xx200.
  # The BLS server just won't return data for the counties that don't actually
  # exist.
  county_ids = range(37000, 37200) + range(45000, 45200)

  # Start the loop with an empty dictionary. Iterate over all of the counties
  # in county_ids.
  all_county_data = {}
  for county_id in county_ids:
    # Use the function get_data_from_bls(), defined above, to get the data
    # for this county_id, from years 2006-2014.
    json_data = get_data_from_bls(county_id, 2006, 2014)

    # The data returned by the BLS server has a bunch of stuff in it;
    # see the examples here:
    # 
    # http://www.bls.gov/developers/api_signature_v2.htm#multiple
    # 
    # We really only want the time series data itself, so we first extract it.
    try:
      time_series = json_data['Results']['series'][0]['data']
    except:
      print "Couldn't extract time series from BLS response:"
      pprint.pprint(json_data)
      continue

    # If the time series is empty (has zero length), then that county
    # must not have existed. Go back to the top of the loop and try the next
    # county.
    if len(time_series) == 0:
      print "County ID", county_id, "did not exist"
      continue

    print "Got", len(time_series), "data items for county id", county_id

    # Each time series data item looks like this originally:
    # 
    # {
    #   'footnotes': [{'code': 'M',
    #                'text': 'Data are provisional, subject to revision on April 21.'}],
    #   'period': 'M12',
    #   'periodName': 'December',
    #   'value': '6.0',
    #   'year': '2013'
    # }
    # 
    # This is okay, but can be improved. The footnotes section is basically
    # just useless cruft, so we can remove it and make the file smaller.
    # 
    # We can lop off the 'M' off the period (M1 means January, M12 means 
    # December). It'll be easier to use the month value as a integer.
    # 
    # The 'year' and 'value' elements are given as strings; let's turn them
    # into numbers, too.
    # 
    # After clean up, the data items look like this:
    # 
    # {'month': 12, u'periodName': u'December', u'value': 7.4, u'year': 2013}
    # 
    # This function clean_up() just makes these changes to one item at a time.
    def clean_up(item):
      del item['footnotes']

      item['month'] = int(item['period'][1:])
      del item['period']

      item['year'] = int(item['year'])
      item['value'] = float(item['value'])

      return item

    # Apply the clean_up function to each item in the time series.
    time_series = [ clean_up(item) for item in time_series ]

    # Add this county's time series to the whole collection of all the data.
    all_county_data[str(county_id)] = time_series

    # Finally, dump all the data into a single JSON file.
    json_data = json.dumps(all_county_data)
    open('county_unemployment_data.json', 'w').write(json_data)