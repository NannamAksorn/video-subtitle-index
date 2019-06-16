const fs = require( 'fs')
const hashList = require('./index/hashList.json')
const invertedIndex = require('./index/invertedIndex.json')
const invertedIndex_all = require('./index/invertedIndex_all.json')

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

const saveInvertedIndex_all = () => {
	fs.writeFile('index/invertedIndex_all.json', JSON.stringify(invertedIndex_all),err => handleError(err))
}

Object.keys(invertedIndex).forEach(word=>{
	let df = invertedIndex[word]['df']
	let iiwd =invertedIndex[word]['d']
	Object.keys(iiwd).forEach(doc=>{
		let tf = iiwd[doc]['tf']
		iiwd[doc]['tfidf'] = tf * Math.log10(docCount/df)
	})
})

Object.keys(invertedIndex_all).forEach(word=>{
	let df = invertedIndex_all[word]['df']
	let iiwd =invertedIndex_all[word]['d']
	Object.keys(iiwd).forEach(doc=>{
		let tf = iiwd[doc]['tf']
		iiwd[doc]['tfidf'] = tf * Math.log10(docCount/df)
	})
})

saveInvertedIndex()
saveInvertedIndex_all()

