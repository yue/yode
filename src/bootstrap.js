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

(function bootstrap(process, global, internalRequire, execPath) {
  delete process.bootstrap

  // The |require| here is actually |nativeModuleRequire|.
  const {BuiltinModule, internalBinding, require} = internalRequire('internal/bootstrap/loaders')

  // Make async method work.
  const timers = require('timers')
  process.nextTick = wrapWithActivateUvLoop(process.nextTick)
  global.setImmediate = wrapWithActivateUvLoop(timers.setImmediate)
  global.setTimeout = wrapWithActivateUvLoop(timers.setTimeout)
  global.setInterval = wrapWithActivateUvLoop(timers.setInterval)

  // Wrap the source code like Module.wrapSafe.
  const {compileFunction} = internalBinding('contextify')
  function wrapSafe(filename, content) {
    const compiled = compileFunction(
      content, filename, 0, 0, undefined, false, undefined, [],
      [ 'exports', 'require', 'module', '__filename', '__dirname', 'execPath' ])
    return compiled.function
  }

  // Implemented to be loaded by nativeModuleRequire.
  class YodeModule {
    constructor(id, source) {
      this.id = id
      this.source = source
    }

    compileForInternalLoader() {
      if (!this.exports) {
        this.exports = {}
        const filename = this.id + '.js'
        const compiledWrapper = wrapSafe(filename, this.source)
        compiledWrapper.call(this.exports, this.exports, require, this, filename, '', execPath);
      }
      return this.exports
    }
  }

  // Turn our modules into built-in modules.
  for (const id in this)
    BuiltinModule.map.set(id, new YodeModule(id, this[id], require))

  try {
    // Is the executable concatenated with ASAR archive?
    const AsarArchive = require('asar_archive')
    process.asarArchive = new AsarArchive(execPath/* REPLACE_WITH_OFFSET */)

    // If it is (i.e. no exception), then patch the fs module after bootstrap
    // is over.
    process.finishBootstrap = () => {
      delete process.finishBootstrap
      // Monkey patch built-in modules.
      require('asar_monkey_patch').wrapFsWithAsar(require('fs'))
    }

    // Redirect Node to execute from current ASAR archive, using a virtual
    // "asar" directory as root.
    return require('path').join(execPath, 'asar')
  } catch (e) {
    // Not an ASAR archive, continue to Node's default routine.
  }
})
