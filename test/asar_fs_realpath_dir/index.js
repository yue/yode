const fs = require('node:fs')
const path = require('node:path')

process.stdout.write(fs.realpathSync(path.join(__dirname, 'dir')))
process.exit(0)
