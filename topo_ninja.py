#!/usr/bin/env python

import json

# Open the US topo file, and read its contents into a variable named content.
content = open("us.json").read()
j = json.loads(content)

# Dig into the JSON object and get the list of geomtries (shapes) for all of
# the counties in every US state.
counties = j['objects']['counties']['geometries']
print "Found", len(counties), "counties in the dataset"

# Separate out just the counties with ids that start with 37, which belong
# to North Carolina.
# 
# This is called a "list comprehension," but it should have been called a list
# digester! This list digester iterates over the list of counties. It converts
# the ids of each county to strings. If keeps only those counties whose ids
# start with the characters '37'.
# 
# This is exactly the same as this code, but much faster and easier to write:
# 
# nc = []
# for c in counties:
#   string_id = str(c['id'])
#   if string_id.startswith('37'):
#     nc.append(c)
nc = [ c for c in counties if str(c['id']).startswith('37') ]
print "Found", len(nc), "counties in NC."

# Do the same for South Carolina.
sc = [ c for c in counties if str(c['id']).startswith('45') ]
print "Found", len(sc), "counties in SC."

# Replace the list of counties in the JSON object with our filtered list.
j['objects']['counties']['geometries'] = nc + sc

# Save the JSON object back to disk with a new name.
content = json.dumps(j)
open("nc_and_sc.json", "w").write(content)