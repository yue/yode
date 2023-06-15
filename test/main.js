#!/usr/bin/env node

// Run the tests defined in this file.
if (require.main == module) {
  const Mocha = require('../deps/mocha')
  const mocha = new Mocha
  mocha.ui('bdd').reporter('tap')
  for (let member in require.cache)  // make require('test.js') work
    delete require.cache[member]
  mocha.addFile('test/main.js')
  mocha.run((failures) => process.exit(failures))
  return
}

const assert = require('assert')
const cp = require('child_process')
const path = require('path')
const fs = require('fs')
const asar = require('../deps/asar')

describe('property', function() {
  describe('process.versions.yode', function() {
    it('should be defined', function() {
      assert.equal(typeof process.versions.yode, 'string')
    })
  })

  describe('process.bootstrap', function() {
    it('should be deleted', function() {
      assert.equal(process.bootstrap, undefined)
    })
  })
})

describe('node', function() {
  it('async tasks should work', function(done) {
    process.nextTick(() => {
      setTimeout(() => {
        process.nextTick(() => {
          done()
        })
      }, 0)
    })
  })

  it('file stream should work', function(done) {
    const stream = fs.createReadStream(process.execPath)
    stream.on('data', () => {})
    stream.on('end', () => {
      done()
    })
  })

  it('network stream should work', function(done) {
    require('https').get('https://google.com', (res) => {
      res.on('data', () => {})
      res.on('end', () => {
        done()
      })
    })
  })

  it('fetch should work', async () => {
    const res = await fetch('https://google.com')
    assert.equal(res.status, 200)
  })

  it('fork should work', function(done) {
    const p = path.join(require('os').tmpdir(), 'yode-fork.js')
    fs.writeFileSync(p, "process.send('ok')")
    after(function() {
      fs.unlinkSync(p)
    })

    const child = cp.fork(p)
    let sent = false
    child.on('message', (msg) => {
      assert.equal(msg, 'ok')
      sent = true
    })
    child.on('exit', (code) => {
      assert.equal(code, 0)
      assert.ok(sent)
      done()
    })
  })

  it('process can quit', function(done) {
    const p = path.join(require('os').tmpdir(), 'yode-exit.js')
    fs.writeFileSync(p, "process.exit(123)")
    after(function() {
      fs.unlinkSync(p)
    })

    const child = cp.fork(p)
    child.on('exit', (code) => {
      assert.equal(code, 123)
      done()
    })
  })

  it('start with asar', async () => {
    const result = await packageAndRun('exit_123')
    assert.equal(result.status, 123)
  })

  it('start with asar with output', async () => {
    const result = await packageAndRun('print_filename')
    assert.equal(result.status, 0)
    const p = path.join(__dirname, '..', `print_filename_${path.basename(process.execPath)}`, 'asar', 'index.js')
    assert.equal(result.stdout.toString().trim(), p)
  })

  it('start with asar with offset', async function() {
    this.timeout(10 * 1000)
    const result = await packageAndRun('fs_async', changeOffset)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.toString().includes('fs.readFile(__filename'))
  })

  it('async fs works on asar', async () => {
    const result = await packageAndRun('fs_async')
    assert.equal(result.status, 0)
    assert.ok(result.stdout.toString().includes('fs.readFile(__filename'))
  })

  it('promise fs works on asar', async () => {
    const result = await packageAndRun('fs_promise')
    assert.equal(result.status, 0)
    assert.ok(result.stdout.toString().includes('fs.readFile(__filename'))
  })

  it('fs.realpathSync works on dir in asar', async () => {
    const result = await packageAndRun('fs_realpath_dir')
    assert.equal(result.status, 0)
    assert.ok(result.stdout.toString().endsWith(path.join('asar', 'dir')));
  })

  it('Promise can resolve', async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
  })
})

async function packageAndRun(filename, modifyBinary = null) {
  const a = path.join(__dirname, '..', filename + '.asar')
  await asar.createPackage(path.join(__dirname, 'asar_' + filename), a)
  const p = path.join(__dirname, '..', `${filename}_${path.basename(process.execPath)}`)
  fs.writeFileSync(p, fs.readFileSync(process.execPath))
  if (modifyBinary) {
    if (process.platform == 'darwin')
      cp.execSync(`codesign --remove-signature ${p}`)
    modifyBinary(p)
  }
  fs.appendFileSync(p, fs.readFileSync(a))
  appendMeta(p, a)
  fs.chmodSync(p, 0o755)
  if (modifyBinary && process.platform == 'darwin') {
    await require('./mac').extendStringTableSize(p)
    cp.execSync(`codesign --sign - ${p}`)
  }
  const result = cp.spawnSync(p)
  if (result.status !== null) {
    // Will be left for debugging if failed to run.
    fs.unlinkSync(a)
    fs.unlinkSync(p)
  }
  return result
}

function changeOffset(target) {
  const mark = '/* REPLACE_WITH_OFFSET */'
  const data = fs.readFileSync(target)
  const pos = data.indexOf(Buffer.from(mark))
  if (pos <= 0)
    throw new Error('Unable to find offset mark')
  const stat = fs.statSync(target)
  const replace = `, ${stat.size}`.padEnd(mark.length, ' ')
  data.write(replace, pos)
  fs.writeFileSync(target, data)
}

// Append ASAR meta information at end of target.
function appendMeta(target, asar) {
  const stat = fs.statSync(asar)
  const meta = Buffer.alloc(8 + 1 + 4)
  const asarSize = stat.size + meta.length
  meta.writeDoubleLE(asarSize, 0)
  meta.writeUInt8(2, 8)
  meta.write('ASAR', 9)
  fs.appendFileSync(target, meta)
}
