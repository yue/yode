#!/usr/bin/env zx

$.verbose = argv.verbose

const hostArch = os.arch()

// Parse args.
let buildType = 'Release'
let targetArch = hostArch
for (const arg of argv._) {
  if (arg in ['Debug', 'Release'])
    buildType = arg
  else
    targetArch = arg
}

// Current version.
const version = (await $`git describe --always --tags`).valueOf()

// Sync submodule.
await $`git submodule sync --recursive`
await $`git submodule update --init --recursive`

// Find out where VS is installed.
if (process.platform == 'win32') {
  const vswhere = `${process.env['ProgramFiles(x86)']}/Microsoft Visual Studio/Installer/vswhere.exe`
  const result = JSON.parse(await $`${vswhere} -format json`)
  if (result.length == 0)
    throw new Error('Unable to find Visual Studio')
  const vs = result[0]
  process.env.GYP_MSVS_VERSION = vs.displayName.match(/(\d+)$/)[1]
  process.env.GYP_MSVS_OVERRIDE_PATH = vs.installationPath
}

// Required for cross compilation on macOS.
if (hostArch != targetArch && process.platform == 'darwin') {
  process.env.GYP_CROSSCOMPILE = '1'
  Object.assign(process.env, {
    CC: `cc -arch ${targetArch}`,
    CXX: `c++ -arch ${targetArch}`,
    CC_target: `cc -arch ${targetArch}`,
    CXX_target: `c++ -arch ${targetArch}`,
    CC_host: 'cc -arch x86_64',
    CXX_host: 'c++ -arch x86_64',
  })
}

// Handle ccache.
try {
  const ccache = await which('ccache')
  Object.assign(process.env, {
    'CC_wrapper': ccache,
    'CXX_wrapper': ccache,
    'CC.host_wrapper': ccache,
    'CXX.host_wrapper': ccache,
  })
  console.log('Using ccache located at', ccache)
} catch {}

// Find Python 3
let python = 'python'
for (const p of ['python', 'python3']) {
  try {
    const version = await $`${p} --version`
    if (version.startsWith('Python 3')) {
      python = p
      break
    }
  } catch (error) {}
}

// Generate some dynamic gyp files.
const configureArgs = [
  '--with-intl=small-icu',
  '--without-node-code-cache',
  '--openssl-no-asm',
  `--dest-cpu=${targetArch}`,
]
await $({cwd: 'node'})`${python} configure.py ${configureArgs}`

// Update the build configuration.
const config = {
  variables: {
    python,
    target_arch: targetArch,
    host_arch: hostArch,
    want_separate_host_toolset: hostArch == targetArch ? 0 : 1,
  }
}
if (process.platform == 'darwin') {
  // Set SDK version to the latest installed.
  const sdks = await $`xcodebuild -showsdks`
  const SDKROOT = sdks.stdout.match(/-sdk (macosx\d+\.\d+)/)[1]
  config.xcode_settings = {SDKROOT}
}
// Copy fields from config.gypi of node.
const configGypiPath = fs.readFileSync(path.join(__dirname, 'node', 'config.gypi')).toString()
const configGypi = JSON.parse(configGypiPath.split('\n').slice(1).join('\n').replace(/'/g, '"'))
for (const key of ['clang', 'node_builtin_shareable_builtins']) {
  config.variables[key] = configGypi.variables[key]
}
// Read node_library_files from config.gypi.
config.variables.node_library_files = configGypi.variables.node_library_files.map(l => 'node/' + l)
fs.writeFileSync(`${__dirname}/config.gypi`, JSON.stringify(config, null, '  '))

await $`${python} node/tools/gyp/gyp_main.py yode.gyp --no-parallel -f ninja -Dbuild_type=${buildType} -Iconfig.gypi -Icommon.gypi --depth .`

// Build.
const ninja = process.platform == 'win32' ? 'deps/ninja/ninja.exe'
                                          : 'deps/ninja/ninja'
const jobs = argv.j ?? os.cpus().length
await $`${ninja} -j ${jobs} -C out/${buildType} yode`

if (process.platform == 'linux')
  await $`strip out/${buildType}/yode`

// Remove old zip.
const files = fs.readdirSync(`out/${buildType}`)
for (let f of files) {
  if (f.endsWith('.zip'))
    fs.unlinkSync(`out/${buildType}/${f}`)
}

// Create zip.
const distname = `out/${buildType}/yode-${version}-${process.platform}-${targetArch}.zip`
const filename = process.platform == 'win32' ? 'yode.exe' : 'yode'
await fs.emptyDir('dist')
await fs.copy('node/LICENSE', 'dist/LICENSE')
await fs.copy(`out/${buildType}/${filename}`, `dist/${filename}`)
await $`${python} -c "import shutil; shutil.make_archive('${distname}', 'zip', 'dist')"`
await fs.remove('dist')
