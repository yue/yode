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

  it('start with asar', function(done) {
    const a = path.join(__dirname, 'deps', 'app.asar')
    const p = path.join(require('os').tmpdir(), 'asar-test-' + path.basename(process.execPath))
    fs.writeFileSync(p, fs.readFileSync(process.execPath))
    fs.appendFileSync(p, fs.readFileSync(a))
    fs.chmodSync(p, 0o755)

    let output = ''
    const child = require('child_process').exec(p)
    child.stdout.on('data', (chunk) => {
      output += String(chunk)
    })
    child.stderr.on('data', (chunk) => {
      output += String(chunk)
    })
    child.on('exit', (code) => {
      if (code == 0) {
        fs.unlinkSync(p)
      } else {
        console.log(p)
        console.log(output)
      }
      assert.equal(code, 0)
      assert.ok(String(fs.readFileSync(a)).includes(output))
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

  it('Promise can resolve', async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
  })
})
