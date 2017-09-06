#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const version = 'v0.1.0'

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

// Create zip.
const JSZip = require('./deps/jszip')
const zip = new JSZip()
const distname = `yode-${version}-${process.platform}-${target_arch}.zip`
const filename = process.platform == 'win32' ? 'yode.exe' : 'yode'
zip.file(filename, fs.readFileSync(`out/Release/${filename}`))
   .generateNodeStream({streamFiles:true})
   .pipe(fs.createWriteStream(`out/Release/${distname}`))
