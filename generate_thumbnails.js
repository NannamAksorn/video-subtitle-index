const glob = require('glob')
const ThumbnailGenerator = require( 'video-thumbnail-generator').default
glob('public/video/*', (err, files) => {
	files.forEach(file => {
		const tg = new ThumbnailGenerator({
			sourcePath: file,
			thumbnailPath: './public/tmp/'
		})
		tg.generateOneByPercent(1)
			.then(console.log)
	})
})