const fs = require('node:fs/promises');

(async function() {
  process.stdout.write((await fs.readFile(__filename)).toString());
  process.exit(0)
})()
