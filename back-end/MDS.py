import json
from sklearn.manifold import MDS


def loadDataFromFile(path):
    with open(path, mode='r', encoding='utf8') as file:
        stream = file.read()
        data = json.loads(stream)
    return data


def normalize(matrix):
    normalizedMatrix = []
    for line in matrix:
        newLine = []
        for _ in line:
            newLine.append(0)
        normalizedMatrix.append(newLine)
    for columnIndex in range(len(matrix[0])):
        minimum = 0
        maximum = 1         # prevent from ending up 0, occurring ZeroDivisionError
        for line in matrix:
            each = line[columnIndex]
            minimum = min(minimum, each)
            maximum = max(maximum, each)
        for lineIndex in range(len(matrix)):
            each = matrix[lineIndex][columnIndex]
            normalizedMatrix[lineIndex][columnIndex] = (each - minimum) / (maximum - minimum)
    return normalizedMatrix


def convertData(origin):
    labels = [
        'Gdp0101', 'Gdp0102', 'Gdp0103', 'Gdp0104', 'Gdp0105', 'Gdp0106', 'Gdp0107', 'Gdp0108',
        'Gdp0109', 'Gdp0110', 'Gdp0111', 'Gdp0112', 'Gdp0113', 'Gdp0114', 'Gdp0115', 'Gdp0116',
        'Gdp0126', 'Gdp0127', 'Gdp0128', 'Gdp0131'
    ]
    gatheredByYear = {}
    for record in origin:
        year = record['Sgnyea']
        if year not in gatheredByYear:
            gatheredByYear[year] = {}
        city = record['Prvcnm_id']
        if city == 142:         # 中国
            continue
        items = []
        for label in labels:
            each = record[label]
            if not isinstance(each, (int, float)):   # Not a number
                each = 0
            items.append(each)
        gatheredByYear[year][city] = items
    return gatheredByYear


if __name__ == '__main__':
    path = "../front-end/gdp.json"
    origin = loadDataFromFile(path)
    data = convertData(origin)

    embedding = MDS(n_components=2)

    outputAll = {}                  # Use a dict to store the output data

    for year in data:
        labels = []     # Record the ids by order
        matrix = []
        for city in data[year]:
            labels.append(city)
            matrix.append(data[year][city])
        coordinates = embedding.fit_transform(normalize(matrix))        # Get 2-d matrix
        output = {}
        for i in range(len(labels)):
            output[labels[i]] = list(coordinates[i])    # IMPORTANT: output of MDS is not a common list object \
                                                        # so we must convert it into Python list object
        outputAll[year] = output

    with open("./output_file_MDS.json", mode='w', encoding='utf8') as file:
        json.dump(outputAll, file)

    pass
