const srt2vtt = require('srt-to-vtt') 
const fs = require( 'fs')
const glob = require('glob') 
const path = require('path')
const parser = require('subtitles-parser')
const { isExist, addDoc, saveList} = require('./docId.js')
const { addWordList } = require('./WordCloud.js')

process.env.GOOGLE_APPLICATION_CREDENTIALS = 'C:/video-scene-search-6b86db97fbf7.json'
const language = require('@google-cloud/language')

const client = new language.LanguageServiceClient()

const getEntities = async (text) => {
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

const clearHtml = (text) => {
	return text.replace(/<(?:.|\n)*?>/gm, '')
}

const createVtt = (file) => {
	let filename = path.basename(file)
	let ext = path.extname(file)
	let output = path.join('public/vtt', filename.replace(ext, '.vtt'))
	fs.createReadStream(file)
		.pipe(srt2vtt())
		.pipe(fs.createWriteStream(output))

}

glob('public/srt/*/*', (err, files) => {
	files.forEach(file => {
		if( !isExist(file)){
			let docid = addDoc(file)
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
			createVtt(file)
		}
	})
	saveList()
})

// eslint-disable-next-line no-console
console.log('end')
