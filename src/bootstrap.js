// setImmediate and process.nextTick makes use of uv_check and uv_prepare to
// run the callbacks, however since we only run uv loop on requests, the
// callbacks wouldn't be called until something else activated the uv loop,
// which would delay the callbacks for arbitrary long time. So we should
// initiatively activate the uv loop once setImmediate and process.nextTick is
// called.
function wrapWithActivateUvLoop(func) {
  return function() {
    process.activateUvLoop()
    return func.apply(this, arguments)
  }
}

(function bootstrap(NativeModule) {
  // Make async method work.
  const timers = NativeModule.require('timers')
  process.nextTick = wrapWithActivateUvLoop(process.nextTick)
  global.setImmediate = wrapWithActivateUvLoop(timers.setImmediate)
  global.setTimeout = wrapWithActivateUvLoop(timers.setTimeout)
  global.setInterval = wrapWithActivateUvLoop(timers.setInterval)

  // Turn our modules into built-in modules.
  const exports = this
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
