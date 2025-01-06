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

(function bootstrap(process, internalRequire, exports) {
  // The |require| here is actually |nativeModuleRequire|.
  const {BuiltinModule, internalBinding, require} = internalRequire('internal/bootstrap/realm')
  const {compileFunctionForCJSLoader} = internalBinding('contextify')

  // Make async method work.
  const timers = require('timers')
  process.nextTick = wrapWithActivateUvLoop(process.nextTick)
  this.setImmediate = wrapWithActivateUvLoop(timers.setImmediate)
  this.setTimeout = wrapWithActivateUvLoop(timers.setTimeout)
  this.setInterval = wrapWithActivateUvLoop(timers.setInterval)

  // Use a virtual "asar" directory as root.
  const dirname = require('path').join(process.execPath, 'asar')

  // Implemented to be loaded by nativeModuleRequire.
  class YodeModule {
    constructor(id, source) {
      this.id = id
      this.source = source
      this.exports = {}
      this.loaded = false
      this.loading = false
    }

    compileForInternalLoader() {
      if (this.loaded || this.loading)
        return this.exports
      const filename = this.id + '.js'
      const {function: compiledWrapper} = compileFunctionForCJSLoader(this.source, filename)
      compiledWrapper.call(this.exports, this.exports, require, this, filename, dirname);
      return this.exports
    }
  }

  // Turn our modules into built-in modules.
  for (const id in exports)
    BuiltinModule.map.set(id, new YodeModule(id, exports[id], require))

  try {
    // Is the executable concatenated with ASAR archive?
    const AsarArchive = require('asar_archive')
    process.asarArchive = new AsarArchive(process.execPath/* REPLACE_WITH_OFFSET */)

    // Monkey patch built-in modules.
    require('asar_monkey_patch').wrapFsWithAsar(require('fs'))

    // Redirect Node to execute from current ASAR archive.
    return dirname
  } catch (error) {
    // Not an ASAR archive, continue to Node's default routine.
    if (error.message != 'Not an ASAR archive')
      throw error
  }
})
