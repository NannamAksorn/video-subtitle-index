const md5File = require('md5-file')
const Hashids = require('hashids')
const path = require('path')
const CRC32 = require('crc-32')
const fs = require('fs')

const hashList = require('./index/hashList.json')
const docList = require('./index/docList.json')
const categoryList = require('./index/categoryList.json')
const hashids = new Hashids()

let lastDID = Object.keys(docList).length

const getHash = (filePath) => {
	let hash = md5File.sync(filePath)
	hash = CRC32.str(hash)
	hash = hashids.encode(Math.abs(hash))
	return hash
}

const isExist = (filePath) => {
	let hash = getHash(filePath)
	return hash in hashList
}

const isCategoryExist = (category) => {
	let hash = CRC32.str(category)
	hash = hashids.encode(Math.abs(hash))
	return hash in categoryList
}

const addCategory = (category) => {
	let hash = CRC32.str(category)
	hash = hashids.encode(Math.abs(hash))
	categoryList[hash] = category
}

const addDoc = (filePath) => {
	let hash = getHash(filePath)
	let dir = path.parse(filePath).dir.split('/')
	let category = dir[ dir.length-1 ]
	if (!isCategoryExist(category)){
		addCategory(category)
	}
	docList[lastDID] = {
		'n': path.parse(filePath).base,
		'd': new Date().getTime(),
		'c': category,
		'h': hash
	}
	hashList[hash] = lastDID
	lastDID += 1
	return [lastDID - 1, hash]
}

const handleError = (err) =>{
	if (err) {
		console.log(err)
	}
}

const saveList = () => {
	fs.writeFile('index/docList.json', JSON.stringify(docList),err => handleError(err))
	fs.writeFile('index/categoryList.json', JSON.stringify(categoryList),err=>handleError(err))
	fs.writeFile('index/hashList.json', JSON.stringify(hashList),err=>handleError(err))
}

module.exports = {isExist, addDoc, saveList}