process.env.GOOGLE_APPLICATION_CREDENTIALS = 'C:/video-scene-search-6b86db97fbf7.json'
const {Translate} = require('@google-cloud/translate')
const _ = require('lodash')
const PROJECT_ID = 'video-scene-search'


const translate = new Translate({PROJECT_ID})

const text = 'Hello, World!'
const description = {
	'Design Thinking':{'Design Thinking - Tim Brown, CEO and President of IDEO':{'id':'1','d':' hi so yeah I get I guess Marisa gets to kind of finish everything off so you should expect that to be the high point at the afternoon I\'m doing my best to build up to that but you know it asked'},'Design Thinking workshop with Justin Ferrell of Stanford d. School at The Irish Times':{'id':'3','d':' I would like to thank firstly the Irish Times and specifically Tony for helping us organize this event in the understand and we are very delighted to have Justin here and thank you very much Justin for'},'The Design Thinking Process':{'id':'7','d':' Design Thinking is a 5-step process to come up with meaningful ideas that solve real problems for a particular group of people. The process is taught in top design and business schools around the world.'}},'Microbit':{'Best DIY Robot kit for beginners - Micro_Bit':{'id':'19','d':' Dear friends welcome to another robot video! In this video, we are going to build a robot\nusing a robot kit for the MicroBit board. This is by far the easiest and most fun robot\nkit I have ever seen.Let’s get started! Hello, guys, I am Nick and welcome to educ8s.tv\na channel that is all about DIY electronics projects.'},'microbit Tutorial Series Part 1 Getting Started':{'id':'24','d':' hi everyone I\'m Sean in this video series I\'m going to show you how to get up and running with the BBC micro bit we\'ll start off with some basic examples like pushing buttons blinking lights'},'microbit Tutorial Series Part 2 Images, Buttons, and Conditionals':{'id':'25','d':' welcome back on the last episode we unbox the micro bit and scroll to phrase across the LED array now we\'ll take it to the next level and start interacting with the little board by pressing'}},'Negotiation Skill':{'7 Ways to Improve Your NEGOTIATION SKILLS - #7Ways':{'id':'27','d':' what\'s that believe nation it\'s Evan my one word is believe and I believe in you I believe that you\'ve got some insane potential inside you that I want to see burst out into the world to have a big'}}}
const target = 'th'

async function googleTranslate(text, target){
	const [translation] = await translate.translate(text, target)
	return translation
}

Promise.allValues = async (object) => {
	return _.zipObject(_.keys(object), await Promise.all(_.values(object)))
}

async function translateDescription (description, target){
	let translated_description = await Promise.allValues(_.mapValues(description, async function(value) {	
		return googleTranslate(value, target)
	}))
	
	console.log(translated_description)
}

translateDescription(description)

module. export ={
	googleTranslate,
	translateDescription
}