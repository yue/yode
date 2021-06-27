#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const os = require('os')
const cp = require('child_process')

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
  return cp.execSync(command, options)
}

// Current version.
const version = String(execSync('git describe --always --tags', {stdio: null})).trim()

// Sync submodule.
execSync('git submodule sync --recursive', {stdio: null})
execSync('git submodule update --init --recursive', {stdio: null})

// Find out where VS is installed.
if (process.platform === 'win32') {
  const vswhere = path.join(process.env['ProgramFiles(x86)'], 'Microsoft Visual Studio', 'Installer', 'vswhere.exe')
  const args = ['-format', 'json']
  const result = JSON.parse(String(cp.execFileSync(vswhere, args)))
  if (result.length == 0)
    throw new Error('Unable to find Visual Studio')
  const vs = result[0]
  process.env.GYP_MSVS_VERSION = vs.displayName.match(/(\d+)$/)[1]
  process.env.GYP_MSVS_OVERRIDE_PATH = vs.installationPath
}

// Required for cross compilation on macOS.
if (host_arch !== target_arch && process.platform === 'darwin') {
  process.env.GYP_CROSSCOMPILE = '1'
  Object.assign(process.env, {
    CC: `cc -arch ${target_arch}`,
    CXX: `c++ -arch ${target_arch}`,
    CC_target: `cc -arch ${target_arch}`,
    CXX_target: `c++ -arch ${target_arch}`,
    CC_host: 'cc -arch x86_64',
    CXX_host: 'c++ -arch x86_64',
  })
}

// Generate some dynamic gyp files.
execSync(`python3 configure --with-intl=small-icu --openssl-no-asm --dest-cpu=${target_arch}`, {cwd: 'node'})

// Update the build configuration.
const config = {
  variables: {
    target_arch,
    host_arch,
    want_separate_host_toolset: host_arch === target_arch ? 0 : 1
  }
}
if (process.platform === 'darwin') {
  // Set SDK version to the latest installed.
  const sdks = String(execSync('xcodebuild -showsdks', {stdio: null})).trim()
  const SDKROOT = sdks.match(/-sdk (macosx\d+\.\d+)/)[1]
  config.xcode_settings = {SDKROOT}
}
fs.writeFileSync(path.join(__dirname, 'arch.gypi'), JSON.stringify(config, null, '  '))
execSync('python3 node/tools/gyp/gyp_main.py yode.gyp --no-parallel -f ninja -Iarch.gypi -Icommon.gypi --depth .')

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
