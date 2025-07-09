import json
import matplotlib.pyplot as plt

# Load JSON data
with open("contentLength.json") as f:
    data = json.load(f)


plt.figure(figsize=(10, 5))
plt.hist(
    [x for x in data if x < 500], bins=900, edgecolor="black"
)  # Adjust bins as needed
plt.xlabel("Datetime")
plt.ylabel("Frequency")
plt.title("Datetime Histogram")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
