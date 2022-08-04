#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const os = require('os')
const cp = require('child_process')

const host_arch = os.arch()

// Parse args.
let cc_wrapper
let build_type = 'Release'
let target_arch = host_arch
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--cc-wrapper='))
    cc_wrapper = arg.substr(arg.indexOf('=') + 1)
  else if (arg in ['Debug', 'Release'])
    build_type = arg
  else if (!arg.startsWith('-'))
    target_arch = arg
}

// Current version.
const version = commandResult('git describe --always --tags')

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

// Handle wrapper.
if (cc_wrapper) {
  Object.assign(process.env, {
    'CC_wrapper': cc_wrapper,
    'CXX_wrapper': cc_wrapper,
    'CC.host_wrapper': cc_wrapper,
    'CXX.host_wrapper': cc_wrapper,
  })
}

// Find Python 3
const python = findPython3()

// Generate some dynamic gyp files.
execSync(`${python} configure --with-intl=small-icu --openssl-no-asm --dest-cpu=${target_arch}`, {cwd: 'node'})

// Update the build configuration.
const config = {
  variables: {
    python,
    target_arch,
    host_arch,
    want_separate_host_toolset: host_arch === target_arch ? 0 : 1,
  }
}
if (process.platform === 'darwin') {
  // Set SDK version to the latest installed.
  const sdks = commandResult('xcodebuild -showsdks')
  const SDKROOT = sdks.match(/-sdk (macosx\d+\.\d+)/)[1]
  config.xcode_settings = {SDKROOT}
}
// Read node_library_files from config.gypi.
config.variables.node_library_files = readNodeLibraryFiles()
fs.writeFileSync(path.join(__dirname, 'config.gypi'), JSON.stringify(config, null, '  '))

execSync(`${python} node/tools/gyp/gyp_main.py yode.gyp --no-parallel -f ninja -Dbuild_type=${build_type} -Iconfig.gypi -Icommon.gypi --depth .`)

// Build.
process.env.PATH = `${path.join('deps', 'ninja')}${path.delimiter}${process.env.PATH}`
execSync(`ninja -j ${os.cpus().length} -C out/${build_type} yode`)

if (process.platform === 'linux')
  execSync(`strip out/${build_type}/yode`)

// Remove old zip.
const files = fs.readdirSync(`out/${build_type}`)
for (let f of files) {
  if (f.endsWith('.zip'))
    fs.unlinkSync(`out/${build_type}/${f}`)
}

// Create zip.
const yazl = require('./deps/yazl')
const zip = new yazl.ZipFile()
const distname = `yode-${version}-${process.platform}-${target_arch}.zip`
const filename = process.platform == 'win32' ? 'yode.exe' : 'yode'
zip.addFile('node/LICENSE', 'LICENSE')
zip.addFile(`out/${build_type}/${filename}`, filename)
zip.outputStream.pipe(fs.createWriteStream(`out/${build_type}/${distname}`))
zip.end()

function readNodeLibraryFiles() {
  const config_gypi = fs.readFileSync(path.join(__dirname, 'node', 'config.gypi')).toString()
  const node_library_files = JSON.parse(config_gypi.split('\n').slice(1).join('\n').replace(/'/g, '"')).variables.node_library_files
  return node_library_files.map(l => 'node/' + l)
}

function findPython3() {
  for (const python of ['python', 'python3']) {
    try {
      const version = commandResult(`${python} --version`)
      if (version.startsWith('Python 3'))
        return python
    } catch (error) {}
  }
  return 'python'
}

function commandResult(command) {
  return String(execSync(command, {stdio: null})).trim()
}

// Wrapper of execSync that prints output.
function execSync(command, options = {}) {
  if (options.stdio === undefined)
    options.stdio = 'inherit'
  if (options.env)
    options.env = Object.assign(options.env, options.env)
  else
    options.env = Object.assign({}, process.env)
  return cp.execSync(command, options)
}
