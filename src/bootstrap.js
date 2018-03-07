(function bootstrap(NativeModule) {
  // Turn our modules into built-in modules.
  let exports = this
  NativeModule._source.asar_archive = exports.asar_archive
  NativeModule._source.asar_monkey_patch = exports.asar_monkey_patch
  NativeModule._source.pickle = exports.pickle

  try {
    // Is the executable concatenated with ASAR archive?
    const AsarArchive = NativeModule.require('asar_archive')
    process.asarArchive = new AsarArchive(process.execPath)

    // Monkey patch built-in modules.
    const fs = NativeModule.require('fs')
    NativeModule.require('asar_monkey_patch').wrapFsWithAsar(fs)

    // Redirect Node to execute from current ASAR archive, using a virtual
    // "asar" directory as root.
    const path = NativeModule.require('path')
    process.argv.splice(1, 0, path.join(process.execPath, 'asar'))
  } catch (e) {
    // Not an ASAR archive, continue to Node's default routine.
  }
})
