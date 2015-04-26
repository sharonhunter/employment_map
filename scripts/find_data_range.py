#!/usr/bin/env python

import json
import numpy as np

content = open("../unemployment_data.json").read()
json_object = json.loads(content)

values = []
for county in json_object.keys():
  for time_period in json_object[county]:
    values.append(time_period['value'])

print "Min is", min(values)
print "Max is", max(values)
print "Average is", sum(values) / len(values)
print "Median is", np.median(values)