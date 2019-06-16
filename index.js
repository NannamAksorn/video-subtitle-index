const srt2vtt = require('srt-to-vtt') 
const fs = require( 'fs')
const glob = require('glob') 
const path = require('path')
const parser = require('subtitles-parser')
const { isExist, addDoc, saveList} = require('./docId.js')
const { addWordList } = require('./WordCloud.js')

process.env.GOOGLE_APPLICATION_CREDENTIALS = './video-scene-search-6b86db97fbf7.json'
const language = require('@google-cloud/language')

const client = new language.LanguageServiceClient()

async function getEntities (text)  {
	const document = {
		content: text,
		type: 'PLAIN_TEXT',
	}
	const [result] = await client.analyzeEntities({document})
		.catch((error)=>{
			console.log(error)
		})
	console.log('done')
	// console.log(result.entities)
	return result.entities
}

function handleError (err) {
	if (err) {
		console.log(err)
	}
}

function clearHtml  (text)  {
	return text.replace(/<(?:.|\n)*?>/gm, '')
}

function createVtt  (file, hash)  {
	let output = path.join('public/vtt', `${hash}.vtt`)
	fs.createReadStream(file)
		.pipe(srt2vtt())
		.pipe(fs.createWriteStream(output))
}

function createSubObj  (data, hash)  {
	fs.writeFile(`subObj/${hash}.json`, JSON.stringify(data),err => handleError(err))
}

glob('public/srt/*/*', (err, files) => {
	files.forEach(file => {
		if( !isExist(file)){
			let [docid, hash] = addDoc(file)
			let srt = fs.readFileSync(file, 'utf8')
			let data = parser.fromSrt(srt, true)
			let textAll = data.map(item => {
				return item['text']
			}).join(' ')
			textAll = clearHtml(textAll)
			getEntities(textAll)
				.then(entities =>{
					addWordList(data, docid, entities)
				})
			createVtt(file, hash)
			createSubObj(data, hash)
		}
	})
	saveList()
})
// eslint-disable-next-line no-console
console.log('end')