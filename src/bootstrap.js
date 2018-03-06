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
    NativeModule.require('asar_monkey_patch')

    // Redirect Node to execute from current ASAR archive.
    process.argv.splice(1, 0, process.execPath)
  } catch (e) {
    // Not an ASAR archive, continue to Node's default routine.
  }
})
