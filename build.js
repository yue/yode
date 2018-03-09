#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Specify target_arch.
let target_arch = 'x64'
if (process.argv.length > 2)
  target_arch = process.argv[2]

// Wrapper of execSync that prints output.
const execSync = (command, options = {}) => {
  if (options.stdio === undefined)
    options.stdio = 'inherit'
  if (options.env)
    options.env = Object.assign(options.env, options.env)
  else
    options.env = Object.assign({}, process.env)
  return require('child_process').execSync(command, options)
}

// Current version.
const version = String(execSync('git describe --always --tags', {stdio: null})).trim()

// Sync submodule.
execSync('git submodule sync --recursive', {stdio: null})
execSync('git submodule update --init --recursive', {stdio: null})

// Usually dynamically generated, but we skipped Node's build script.
const icu_config_gypi = 'node/icu_config.gypi'
if (!fs.existsSync(icu_config_gypi))
  execSync('python configure', {cwd: 'node'})
const config_gypi = 'node/config.gypi'
if (!fs.existsSync(config_gypi))
  fs.writeFileSync(config_gypi, "\n{'variables':{}}")

// Update the build configuration.
execSync(`python node/tools/gyp/gyp_main.py yode.gyp -f ninja -Dhost_arch=x64 -Dtarget_arch=${target_arch} -Icommon.gypi --depth .`)

// Build.
const epath = `${path.join('deps', 'ninja')}${path.delimiter}${process.env.PATH}`
execSync(`ninja -C out/Release yode`, {env: {PATH: epath}})

// Remove old zip.
const files = fs.readdirSync('out/Release')
for (let f of files) {
  if (f.endsWith('.zip'))
    fs.unlinkSync(`out/Release/${f}`)
}

// Create zip.
const yazl = require('./deps/yazl')
const zip = new yazl.ZipFile()
const distname = `yode-${version}-${process.platform}-${target_arch}.zip`
const filename = process.platform == 'win32' ? 'yode.exe' : 'yode'
zip.addFile('node/LICENSE', 'LICENSE')
zip.addFile(`out/Release/${filename}`, filename)
zip.outputStream.pipe(fs.createWriteStream(`out/Release/${distname}`))
zip.end()
