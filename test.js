#!/usr/bin/env node

// Run the tests defined in this file.
if (require.main == module) {
  const Mocha = require('./deps/mocha')
  const mocha = new Mocha
  mocha.ui('bdd').reporter('tap')
  for (let member in require.cache)  // make require('test.js') work
    delete require.cache[member]
  mocha.addFile('test.js')
  mocha.run((failures) => process.exit(failures))
  return
}

const assert = require('assert')
const path = require('path')
const fs = require('fs')

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

  it('fork should work', function(done) {
    const p = path.join(require('os').tmpdir(), 'yode-fork.js')
    fs.writeFileSync(p, "process.send('ok')")
    after(function() {
      fs.unlinkSync(p)
    })

    const child = require('child_process').fork(p)
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

    const child = require('child_process').fork(p)
    child.on('exit', (code) => {
      assert.equal(code, 123)
      done()
    })
  })

  it('start with asar', function() {
    const result = packageAndRun('exit_123')
    assert.equal(result.status, 123)
  })

  it('start with asar with output', function() {
    const result = packageAndRun('print_filename')
    assert.equal(result.status, 0)
    const p = path.join(__dirname, `print_filename_${path.basename(process.execPath)}`, 'asar', 'index.js')
    assert.equal(result.stdout.toString().trim(), p)
  })

  it('start with asar with fs', function() {
    const result = packageAndRun('print_self')
    assert.equal(result.status, 0)
    assert.ok(result.stdout.toString().includes('fs.readFile(__filename'))
  })

  it('start with asar with offset', function() {
    const result = packageAndRun('print_self', changeOffset)
    assert.equal(result.status, 0)
    assert.ok(result.stdout.toString().includes('fs.readFile(__filename'))
  })

  it('Promise can resolve', async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
  })
})

function packageAndRun(asar, modifyBinary = null) {
  const a = path.join(__dirname, 'fixtures', asar + '.asar')
  const p = path.join(__dirname, `${path.basename(asar, '.asar')}_${path.basename(process.execPath)}`)
  fs.writeFileSync(p, fs.readFileSync(process.execPath))
  if (modifyBinary)
    modifyBinary(p)
  fs.appendFileSync(p, fs.readFileSync(a))
  appendMeta(p, a)
  fs.chmodSync(p, 0o755)
  const result = require('child_process').spawnSync(p)
  if (result.status !== null)
    fs.unlinkSync(p)  // will be left for debugging if failed to run
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
