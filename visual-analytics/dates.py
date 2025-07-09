import json
import matplotlib.pyplot as plt
from datetime import datetime

# Load JSON data
with open("dates.json") as f:
    data = json.load(f)

# Extract datetimes (assuming they are in a list)
datetimes = data  # Adjust this based on your JSON structure

# Convert string datetimes to datetime objects
datetime_objects = [datetime.strptime(dt, "%Y-%m-%dT%H:%M:%S.%fZ") for dt in datetimes]
# Plotting

plt.figure(figsize=(10, 5))
plt.hist(datetime_objects, bins=900, edgecolor="black")  # Adjust bins as needed
plt.xlabel("Datetime")
plt.ylabel("Frequency")
plt.title("Datetime Histogram")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
