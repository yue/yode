#!/usr/bin/env node

const fs = require('fs')

// Wrapper of execSync that prints output.
const execSync = (command, options = {}) => {
  if (!options.stdio)
    options.stdio = 'inherit'
  if (options.env)
    options.env = Object.assign(options.env, process.env)
  return require('child_process').execSync(command, options)
}

// Usually dynamically generated, but we skipped Node's build script.
const icu_config_gypi = 'node/icu_config.gypi'
if (!fs.existsSync(icu_config_gypi))
  execSync('python configure', {cwd: 'node'})
const config_gypi = 'node/config.gypi'
if (!fs.existsSync(config_gypi))
  fs.writeFileSync(config_gypi, "\n{'variables':{}}")

// Update the build configuration.
execSync('./node/tools/gyp/gyp yode.gyp -f ninja -Dhost_arch=x64 -Dtarget_arch=x64 -Icommon.gypi --depth .')

// Build.
execSync('ninja -C out/Release yode')
