import matplotlib.pyplot as plt

data = {
    "web": 4897,
    "name": 4897,
    "language": 4897,
    "defaultLanguage": 4897,
    "translation": 4897,
    "parent": 4897,
    "creator": 4897,
    "author": 4897,
    "customClass": 4897,
    "contentAuthor": 4897,
    "creationDate": 4897,
    "date": 4897,
    "contentUpdateDate": 4897,
    "version": 4897,
    "title": 4897,
    "template": 4897,
    "defaultTemplate": 4897,
    "validationScript": 4897,
    "comment": 4897,
    "minorEdit": 4897,
    "syntaxId": 4897,
    "hidden": 4897,
    "object": 4730,
    "content": 4897,
    "attachment": 828,
    "class": 36,
}

labels = list(data.keys())
values = list(data.values())

plt.bar(labels, values)
plt.xticks(rotation=45)
plt.ylabel("Count")
plt.title("Bar Graph of Data")
plt.tight_layout()
plt.show()
