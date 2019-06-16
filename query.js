process.env.GOOGLE_APPLICATION_CREDENTIALS = 'C:/video-scene-search-6b86db97fbf7.json'
const {Translate} = require('@google-cloud/translate')
const _ = require('lodash')
const PROJECT_ID = 'video-scene-search'


const translate = new Translate({PROJECT_ID})

async function googleTranslate(text, target){
	const [translation] = await translate.translate(text, target)
	return translation
}

Promise.allValues = async (object) => {
	return _.zipObject(_.keys(object), await Promise.all(_.values(object)))
}

const invertedIndex = require('./index/invertedIndex.json')
const wordListCollection = require('./index/wordList.json')
const docList = require('./index/docList.json')
const parser = require('subtitles-parser')
const fs = require('fs')
const stemmer = require('stemmer')
const levenshtein = require('js-levenshtein')
const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())

const wordList = Object.keys(wordListCollection)
const clearHtml = (text) => {
	return text.replace(/<(?:.|\n)*?>/gm, '')
}
const zipper = (listA, listB) => {
	if (listA.length === 0){
		return listB
	}
	if (listB.length === 0){
		return listA
	}
	let i = 0
	let j = 0
	let resultDoc = []
	while (i < listA.length && j < listB.length){
		if (listA[i] === listB[i]){
			resultDoc.push(listA[i])
			i++
			j++
		} else if (listA[i] > listB[j]){
			j++
		} else {
			i++
		}
	} 
	return resultDoc
}

const getDocList = (queryA) => {
	if (invertedIndex[queryA]){
		return Object.keys(invertedIndex[queryA].doc)
	}
	return []
}

const getSubList = (docID, queryA) => {
	if (invertedIndex[queryA] &&
        invertedIndex[queryA].doc[docID]){
		return invertedIndex[queryA].doc[docID].sub
	}
	return []
}

const correct = (incorrectWord) => {
	let distanceList = {}
	wordList.some(word=>{
		if (incorrectWord[0] === word[0]){
			const distance = levenshtein(incorrectWord, word)
			distanceList[distance] = word
			return distance === 1
		}
	})
	let firstRankIndex = Object.keys(distanceList)[0]
	return distanceList[firstRankIndex]
}

const parseQuery = (queryString) => {
	let querylist = queryString.split(' ')
	querylist = querylist.map(query => stemmer(query))
	return querylist
}

const suggestion = (queryString) => {
	let querylist = parseQuery(queryString)
	let lastWord = querylist.pop()
	let prevWord = []
	let suggestList = []
	wordList.some(word => {
		if(word.startsWith(lastWord)){
			suggestList.push(word)
		}
		return suggestList.length === 10
	})
	suggestList = suggestList.map(word => wordListCollection[word].full)
	if (querylist.length === 0){
		return suggestList
	}
	querylist.forEach(word => {
		if (!(word in wordListCollection)){
			prevWord.push(correct(word))
		} else {
			prevWord.push(word)
		}
	})
	prevWord = prevWord.map(word => wordListCollection[word].full)
	suggestList = suggestList.map(word => prevWord.join(' ').concat(' ' , word))
	
	return(suggestList)
}

const suggestionSub = (docid,queryString) => {
	let querylist = parseQuery(queryString)
	let lastWord = querylist.pop()
	let prevWord = []
	let suggestList = []
	const wordListSub = require(`./entities/${docid}.json`)
	wordListSub.some(word => {
		if(word.startsWith(lastWord) && !suggestList.includes(word) ){
			suggestList.push(word)
		}
		return suggestList.length === 10
	})
	if (querylist.length === 0){
		return suggestList
	}
	querylist.forEach(word => {
		if (!(word in wordListCollection)){
			prevWord.push(correct(word))
		} else {
			prevWord.push(word)
		}
	})
	prevWord = prevWord.map(word => wordListCollection[word].full)
	suggestList = suggestList.map(word => prevWord.join(' ').concat(' ' , word))
	
	return(suggestList)
}

const query = (queryString) => {
	let querylist = parseQuery(queryString)
	let returnList = {}
	let returnDoc = []
	if (querylist.length === 1) {
		returnDoc = getDocList(querylist[0])
	}
	else {
		let docLists = querylist.map(query => getDocList(query))
		returnDoc = []
		docLists.forEach(docList => returnDoc = zipper(returnDoc, docList))
	}
	returnDoc.forEach(docID =>{
		let docInfo = docList[docID]
		if (!returnList[docInfo.c]){
			returnList[docInfo.c] = {}
		}
		returnList[docInfo.c][docInfo.n.replace('.srt','')] = {id:docID}
	})
	Object.keys(returnList).forEach(category=>{
		Object.keys(returnList[category]).forEach(docName=>{
			let srt = fs.readFileSync(`./public/srt/${category}/${docName}.srt`, 'utf8')
			let data = parser.fromSrt(srt, true)
			let description = ''
			for(let i=0; i < 5; i++){
				description = description + ' ' + clearHtml(data[i].text)
			}
			returnList[category][docName]['d'] = description 
		})
	})
	// console.log(returnList)
	return returnList 
}

const positionalIntersect = (p1, p2, k) => {
	if (p1.length === 0){
		return p2
	}
	if (p2.length === 0){
		return p1
	}
        
	let i = 0
	let j = 0
	let resultDoc = []
	let oldB = 0
	while (i < p1.length){
		let p1ID = parseInt(p1[i])
		let p2ID = parseInt(p2[j])
		if (p1ID < oldB + k){
			i++
		} else if (p2ID < p1ID) {
			j++
		} else if (p2ID <= p1ID + k){
			resultDoc.push(p1ID)
			i++
			oldB = p2ID
		} else {
			i++
		}
	} 
	return resultDoc
}

const subQuery = (category,docName, docID, queryString) => {
	let srt = fs.readFileSync(`./public/srt/${category}/${docName}.srt`, 'utf8')
	let data = parser.fromSrt(srt, true)
	let querylist = parseQuery(queryString)
	let returnDoc = []
	if (querylist.length === 1) {
		returnDoc = getSubList( docID, querylist[0] )
	}
	else {
		let docLists = querylist.map(query => getSubList(docID, query))
		returnDoc = []
		docLists.forEach(docList => returnDoc = positionalIntersect(returnDoc, docList, 5))
	}
	if (returnDoc.length > 10){
		returnDoc = returnDoc.slice(0,10)
	}
	returnDoc = returnDoc.map(doc=>{
		return {id:doc,text:clearHtml(data[doc-1].text), start:data[doc-1].startTime/1000}
	})
	// console.log(returnDoc)
	// returnDoc.forEach(docID =>{
	// 	let docInfo = docList[docID]
	// 	if (!returnList[docInfo.c]){
	// 		returnList[docInfo.c] = {}
	// 	}
	// 	returnList[docInfo.c][docInfo.n.replace('.srt','')] = docID
	// })
	return returnDoc
}

const getWordCloud = (docid) => {
	const wordcloud = require(`./wordCloud/${docid}.json`)
	return wordcloud
}

const getDescription = (docid) => {
	const description = require(`./description/${docid}.json`)
	return description
}

app.get('/suggest/:q', (req,res) => {
	return res.send(JSON.stringify(suggestion(req.params.q)))
})

app.get('/suggestSub/:id/:q', (req,res) => {
	return res.send(JSON.stringify(suggestionSub(req.params.id,req.params.q)))
})


app.get('/search/:q', (req,res) => {
	console.log(req.params.q)
	return res.send(JSON.stringify(query(req.params.q)))
})

app.get('/sub/:category/:docName/:docid/:q', (req,res) => {
	return res.send(JSON.stringify(subQuery(req.params.category,req.params.docName,req.params.docid,req.params.q)))
})

app.get('/wordCloud/:docid', (req,res) => {
	return res.send(JSON.stringify(getWordCloud(req.params.docid)))
})

app.get('/description/:docid', async (req,res) => {
	const description = getDescription(req.params.docid) 
	const lang = req.query.lang
	if (!lang || lang == 'en'){
		return res.send(JSON.stringify(description))
	} else {
		let translated_description = await Promise.allValues(_.mapValues(description, async function(value) {	
			return googleTranslate(value, lang)
		}))
		return res.send(JSON.stringify(translated_description))
	}
})


app.listen(5000, () => {
	console.log('query api listening of port 5000 ')
})