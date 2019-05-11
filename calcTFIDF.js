const fs = require( 'fs')
const hashList = require('./index/hashList.json')
const invertedIndex = require('./index/invertedIndex.json')

const docCount = Object.keys(hashList).length
console.log(docCount)

const handleError = (err) =>{
	if (err) {
		console.log(err)
	}
}

const saveInvertedIndex = () => {
	fs.writeFile('index/invertedIndex.json', JSON.stringify(invertedIndex),err => handleError(err))
}

Object.keys(invertedIndex).forEach(word=>{
	let df = Object.keys(invertedIndex[word]['doc']).length
	Object.keys(invertedIndex[word]['doc']).forEach(doc=>{
		let tf = invertedIndex[word]['doc'][doc]['sub'].length
		invertedIndex[word]['doc'][doc]['tfidf'] = tf * Math.log10(docCount/df)
	})
})
saveInvertedIndex()

