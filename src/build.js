const argv = require('yargs').argv
const fs = require('fs-extra')
const sourceFiles = require('../package.json').sourceFiles
const util = require('util')
const yuiCompress = require('yuicompressor').compress

;(async () => {
  try {
    const header = `/* Dailymotion SDK - ${new Date().toISOString()} */`
    await fs.emptyDir('dist')
    await build('all', header)
    await build('player_api', header)
    process.exitCode = 0
  }
  catch(error) {
    console.log(`Build error: ${error.message} (${error.stack})`)
    process.exitCode = 1
  }
})()

async function build(target, header) {
  const rawJs = await Promise.all(sourceFiles[target].map((file) => fs.readFile(file, 'utf8')))
  const yuiParams = { charset: 'utf8', type: 'js' }
  const compressedJs = await util.promisify(yuiCompress)(rawJs.join('\n'), yuiParams)
  return fs.writeFile(`dist/${target}.js`, `${header}\n${compressedJs}`, 'utf8')
}
