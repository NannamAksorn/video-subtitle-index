const stemmer = require('stemmer')
const fs = require('fs')

const wordList = require('./index/wordList.json')
const invertedIndex = require('./index/invertedIndex.json')

let lastWordId = Object.keys(wordList).length

const isWordExist = (stemmedWord) => {
	return stemmedWord in wordList
}

const addWord = (stemmedWord, word) => {
	wordList[stemmedWord] = {'id': lastWordId,'full':word}
	invertedIndex[stemmedWord] = {'id':lastWordId, 'doc': {}, 'df': 0}
	lastWordId += 1
}

const addWords = (entities) =>{
	// console.log('addword', entities)
	const entities_list = entities.map(element => {
		return element.name
	})
	entities_list.forEach(words =>{
		let kword = words.split(' ')
		kword.forEach(word => {
			let stemmedWord = stemmer(word)
			if (!isWordExist(stemmedWord)) {
				addWord(stemmedWord, word)
			}
		})
	})
	saveWordList()
}
const handleError = (err) =>{
	if (err) {
		console.log(err)
	}
}

const saveEntitiesList = (entities, docId) => {
	const entities_list = entities.map(element => {
		return element.name
	})
	fs.writeFile( `entities/${docId}.json` , JSON.stringify(entities_list),err => handleError(err))
}

const saveWordList = () => {
	fs.writeFile('index/wordList.json', JSON.stringify(wordList),err => handleError(err))
}

const saveInvertedIndex  = () => {
	fs.writeFile('index/invertedIndex.json', JSON.stringify(invertedIndex),err => handleError(err))
}

const saveWordCloud = (docId, wordCloudList) => {
	fs.writeFile(`index/wordCloud/${docId}.json`, JSON.stringify(wordCloudList),err => handleError(err))
}

const clearHtml = (text) => {
	return text.replace(/<(?:.|\n)*?>/gm, '')
}

const createDescription = (data, docid, entities) => {
	const entities_list = entities.map(element => {
		return element.name
	})
	const shuffled = entities_list.sort(() => 0.5 - Math.random())
	const entities_list80 = shuffled.slice(0, parseInt(shuffled.length* 0.8 ))
	const entities_list60 = shuffled.slice(0, parseInt(shuffled.length* 0.6 ))
	const entities_list40 = shuffled.slice(0, parseInt(shuffled.length* 0.4 ))
	const entities_list20 = shuffled.slice(0, parseInt(shuffled.length* 0.2 ))

	const description = {d80:'', d60:'',d40:'',d20:''}

	data.forEach(srt => {
		let words = clearHtml(srt.text)
		entities_list80.some(word=>{
			if (words.includes(word)){
				description['d80'] += ' ' + words
				return true
			}
		})
		entities_list60.some(word=>{
			if (words.includes(word)){
				description['d60'] += ' ' + words
				return true
			}
		})
		entities_list40.some(word=>{
			if (words.includes(word)){
				description['d40'] += ' ' + words
				return true
			}
		})
		entities_list20.some(word=>{
			if (words.includes(word)){
				description['d20'] += ' ' + words
				return true
			}
		})
	})
	fs.writeFile( `description/${docid}.json` , JSON.stringify(description),err => handleError(err))
}

const addWordList = (data, docid, entities) => {
	addWords(entities)
	createDescription(data, docid, entities )
	saveEntitiesList(entities, docid)
	let wordCloud = {0:{}}
	data.forEach(srt =>{
		let wordCloud_new = JSON.parse(JSON.stringify(wordCloud[srt.id - 1]))
		let words = clearHtml(srt.text).match(/\S+/g) || []
		words.forEach(word =>{
			word = stemmer(word)
			if(isWordExist(word)){
				let fullWord = wordList[word].full
				if (fullWord in wordCloud_new){
					invertedIndex[word]['doc'][docid]['sub'].push(srt.id)
					wordCloud_new[fullWord] += 1
				} else {
					invertedIndex[word]['doc'][docid] = {}
					invertedIndex[word]['doc'][docid]['sub'] =[srt.id]
					wordCloud_new[fullWord] = 1
				}
				invertedIndex[word]['df'] += 1
			}
		})
		wordCloud[srt.id] = wordCloud_new
	})
	// console.log(wordCloud)
	saveWordCloud(docid, wordCloud)
	saveInvertedIndex()

}

module.exports = {addWordList}