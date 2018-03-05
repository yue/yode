(function bootstrap(NativeModule) {
  // Turn our modules into built-in modules.
  let exports = this
  NativeModule._source.asar_archive = exports.asar_archive
  NativeModule._source.pickle = exports.pickle
})
