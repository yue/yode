#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const os = require('os')

const host_arch = os.arch()

// Specify target_arch.
let target_arch = host_arch
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

// Generate some dynamic gyp files.
execSync(`python3 configure --with-intl=small-icu --openssl-no-asm --dest-cpu=${target_arch}`, {cwd: 'node'})

// Cross compilation.
if (host_arch !== target_arch) {
  if (process.platform === 'darwin' || process.platform === 'win32')
    process.env.GYP_CROSSCOMPILE = '1'
  if (process.platform === 'darwin') {
    Object.assign(process.env, {
      CC: `cc -arch ${target_arch}`,
      CXX: `c++ -arch ${target_arch}`,
      CC_target: `cc -arch ${target_arch}`,
      CXX_target: `c++ -arch ${target_arch}`,
      CC_host: 'cc -arch x86_64',
      CXX_host: 'c++ -arch x86_64',
    })
  }
}

// Update the build configuration.
const config = {
  variables: {
    target_arch,
    host_arch,
    want_separate_host_toolset: host_arch === target_arch ? 0 : 1
  }
}
if (process.platform === 'darwin') {
  const sdks = String(execSync('xcodebuild -showsdks', {stdio: null})).trim()
  const SDKROOT = sdks.match(/-sdk (macosx\d+\.\d+)/)[1]
  config.xcode_settings = {SDKROOT}
}
fs.writeFileSync(path.join(__dirname, 'arch.gypi'), JSON.stringify(config, null, '  '))
execSync('python3 node/tools/gyp/gyp_main.py yode.gyp -f ninja -Iarch.gypi -Icommon.gypi --depth .')

// Build.
const epath = `${path.join('deps', 'ninja')}${path.delimiter}${process.env.PATH}`
execSync(`ninja -j ${os.cpus().length} -C out/Release yode`, {env: {PATH: epath}})

if (process.platform === 'linux')
  execSync('strip out/Release/yode')

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
