const fs = require('fs')

fs.readFile(__filename, (err, content) => {
  process.stdout.write(String(content))
  process.exit(0)
})
