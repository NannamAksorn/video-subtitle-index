const fs = require('fs')

const handleError = (err) =>{
	if (err) {
		console.log(err)
	}
}

fs.writeFile('index/invertedIndex.json', '{}',err => handleError(err))
fs.writeFile('index/categoryList.json', '{}',err => handleError(err))
fs.writeFile('index/docList.json', '{}',err => handleError(err))
fs.writeFile('index/hashList.json', '{}',err => handleError(err))
fs.writeFile('index/wordList.json', '{}',err => handleError(err))
