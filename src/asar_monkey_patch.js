const childProcess = require('child_process')
const path = require('path')

// The root dir of asar archive.
const rootDir = path._makeLong(path.join(process.execPath, 'asar'))

// Convert asar archive's Stats object to fs's Stats object.
let nextInode = 0

// Fake values.
const uid = process.getuid != null ? process.getuid() : 0
const gid = process.getgid != null ? process.getgid() : 0
const fakeTime = new Date()

// Separate asar package's path from full path.
function splitPath(p) {
  if (process.noAsar)
    return [false]
  if (Buffer.isBuffer(p))
    p = p.toString()
  if (typeof p !== 'string')
    return [false]

  // We inserted a virtual "asar" root directory to avoid treating execPath as
  // directory, which will cause problems in Node.js.
  p = path.normalize(path._makeLong(p))
  if (p === rootDir)
    return [true, '']
  if (!p.startsWith(rootDir + path.sep))
    return [false]
  return [true, p.substr(rootDir.length + 1)]
}

// Generate fake stats.
function generateStats(stats) {
  return {
    dev: 1,
    ino: ++nextInode,
    mode: 33188,
    nlink: 1,
    uid: uid,
    gid: gid,
    rdev: 0,
    atime: stats.atime || fakeTime,
    birthtime: stats.birthtime || fakeTime,
    mtime: stats.mtime || fakeTime,
    ctime: stats.ctime || fakeTime,
    size: stats.size,
    isFile: function() { return stats.isFile },
    isDirectory: function() { return stats.isDirectory },
    isSymbolicLink: function() { return stats.isLink },
    isBlockDevice: function() { return false },
    isCharacterDevice: function() { return false },
    isFIFO: function() { return false },
    isSocket: function() { return false },
  }
}

// Create a ENOENT error.
function notFoundError(filePath, callback) {
  const error = new Error(`ENOENT, ${filePath} not found`)
  error.code = 'ENOENT'
  error.errno = -2
  if (typeof callback !== 'function') {
    throw error
  } else {
    process.nextTick(function() {
      callback(error)
    })
  }
}

// Create a ENOTDIR error.
function notDirError(callback) {
  const error = new Error('ENOTDIR, not a directory')
  error.code = 'ENOTDIR'
  error.errno = -20
  if (typeof callback !== 'function') {
    throw error
  } else {
    process.nextTick(function() {
      callback(error)
    })
  }
}

// Create a EACCES error.
function accessError(filePath, callback) {
  const error = new Error(`EACCES: permission denied, access '${filePath}'`)
  error.code = 'EACCES'
  error.errno = -13
  if (typeof callback !== 'function') {
    throw error
  } else {
    process.nextTick(function() {
      callback(error)
    })
  }
}

// Override APIs that rely on passing file path instead of content to C++.
function overrideAPISync(module, name, arg = 0) {
  const old = module[name]
  module[name] = function() {
    const p = arguments[arg]
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return old.apply(this, arguments)

    const info = process.asarArchive.getFileInfo(filePath)
    if (!info)
      return notFoundError(filePath)

    const newPath = process.asarArchive.copyFileOut(info)
    if (!newPath)
      return notFoundError(filePath)

    arguments[arg] = newPath
    return old.apply(this, arguments)
  }
}

function overrideAPI(module, name, arg = 0) {
  const old = module[name]
  module[name] = function() {
    const p = arguments[arg]
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return old.apply(this, arguments)

    const callback = arguments[arguments.length - 1]
    if (typeof callback !== 'function')
      return overrideAPISync(module, name, arg)

    const info = process.asarArchive.getFileInfo(filePath)
    if (!info)
      return notFoundError(filePath, callback)

    const newPath = process.asarArchive.copyFileOut(info)
    if (!newPath)
      return notFoundError(filePath, callback)

    arguments[arg] = newPath
    return old.apply(this, arguments)
  }
}

// Override fs APIs.
exports.wrapFsWithAsar = function(fs) {
  const {lstatSync} = fs
  fs.lstatSync = function(p) {
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return lstatSync(p)
    const stats = process.asarArchive.stat(filePath)
    if (!stats)
      notFoundError(filePath)
    return generateStats(stats)
  }

  const {lstat} = fs
  fs.lstat = function(p, callback) {
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return lstat(p, callback)
    const stats = process.asarArchive.stat(filePath)
    if (!stats)
      return notFoundError(filePath, callback)
    process.nextTick(function() {
      callback(null, generateStats(stats))
    })
  }

  const {statSync} = fs
  fs.statSync = function(p) {
    const [isAsar] = splitPath(p)
    if (!isAsar)
      return statSync(p)
    // Do not distinguish links for now.
    return fs.lstatSync(p)
  }

  const {stat} = fs
  fs.stat = function(p, callback) {
    const [isAsar] = splitPath(p)
    if (!isAsar)
      return stat(p, callback)
    // Do not distinguish links for now.
    process.nextTick(function() {
      fs.lstat(p, callback)
    })
  }

  const {realpathSync} = fs
  fs.realpathSync = function(p) {
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return realpathSync.apply(this, arguments)
    const info = process.asarArchive.getFileInfo(filePath)
    if (!info)
      return notFoundError(filePath)
    const real = process.asarArchive.realpath(info)
    if (info.unpacked)
      return real
    else
      return path.join(realpathSync(process.execPath), 'asar', real)
  }

  const {realpath} = fs
  fs.realpath = function(p, cache, callback) {
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return realpath.apply(this, arguments)
    if (typeof cache === 'function') {
      callback = cache
      cache = undefined
    }
    const info = process.asarArchive.getFileInfo(filePath)
    if (!info)
      return notFoundError(filePath, callback)
    const real = process.asarArchive.realpath(info)
    if (info.unpacked) {
      callback(null, real)
    } else {
      realpath(process.execPath, function(err, p) {
        if (err)
          return callback(err)
        return callback(null, path.join(p, 'asar', real))
      })
    }
  }

  const {exists} = fs
  fs.exists = function(p, callback) {
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return exists(p, callback)
    process.nextTick(function() {
      // Disabled due to false positive in StandardJS
      // eslint-disable-next-line standard/no-callback-literal
      callback(process.asarArchive.stat(filePath) !== false)
    })
  }

  const {existsSync} = fs
  fs.existsSync = function(p) {
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return existsSync(p)
    return process.asarArchive.stat(filePath) !== false
  }

  const {access} = fs
  fs.access = function(p, mode, callback) {
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return access.apply(this, arguments)
    if (typeof mode === 'function') {
      callback = mode
      mode = fs.constants.F_OK
    }
    const info = process.asarArchive.getFileInfo(filePath)
    if (!info)
      return notFoundError(filePath, callback)
    if (info.unpacked) {
      const realPath = process.asarArchive.copyFileOut(info)
      return fs.access(realPath, mode, callback)
    }
    const stats = process.asarArchive.stat(filePath)
    if (!stats)
      return notFoundError(filePath, callback)
    if (mode & fs.constants.W_OK)
      return accessError(filePath, callback)
    process.nextTick(function() {
      callback()
    })
  }

  const {accessSync} = fs
  fs.accessSync = function(p, mode) {
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return accessSync.apply(this, arguments)
    if (mode == null)
      mode = fs.constants.F_OK
    const info = process.asarArchive.getFileInfo(filePath)
    if (!info)
      notFoundError(filePath)
    if (info.unpacked) {
      const realPath = process.asarArchive.copyFileOut(info)
      return fs.accessSync(realPath, mode)
    }
    const stats = process.asarArchive.stat(filePath)
    if (!stats)
      notFoundError(filePath)
    if (mode & fs.constants.W_OK)
      accessError(filePath)
  }

  const {readFile} = fs
  fs.readFile = function(p, options, callback) {
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return readFile.apply(this, arguments)
    if (typeof options === 'function') {
      callback = options
      options = {
        encoding: null
      }
    } else if (typeof options === 'string') {
      options = {
        encoding: options
      }
    } else if (options === null || options === undefined) {
      options = {
        encoding: null
      }
    } else if (typeof options !== 'object') {
      throw new TypeError('Bad arguments')
    }
    const {encoding} = options

    const info = process.asarArchive.getFileInfo(filePath)
    if (!info)
      return notFoundError(filePath, callback)
    if (info.size === 0) {
      return process.nextTick(function() {
        callback(null, encoding ? '' : Buffer.alloc(0))
      })
    }
    if (info.unpacked) {
      const realPath = process.asarArchive.copyFileOut(info)
      return fs.readFile(realPath, options, callback)
    }

    const buffer = Buffer.alloc(info.size)
    fs.open(process.execPath, 'r', function(error, fd) {
      if (error)
        return callback(error)
      fs.read(fd, buffer, 0, info.size, info.offset, function(error) {
        fs.close(fd, () => {
          callback(error, encoding ? buffer.toString(encoding) : buffer)
        })
      })
    })
  }

  const {readFileSync} = fs
  fs.readFileSync = function(p, options) {
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return readFileSync.apply(this, arguments)
    const info = process.asarArchive.getFileInfo(filePath)
    if (!info)
      return notFoundError(filePath)
    if (info.size === 0) {
      if (options) {
        return ''
      } else {
        return Buffer.alloc(0)
      }
    }
    if (info.unpacked) {
      const realPath = process.asarArchive.copyFileOut(info)
      return fs.readFileSync(realPath, options)
    }
    if (!options) {
      options = {
        encoding: null
      }
    } else if (typeof options === 'string') {
      options = {
        encoding: options
      }
    } else if (typeof options !== 'object') {
      throw new TypeError('Bad arguments')
    }
    const {encoding} = options
    const buffer = process.asarArchive.readFile(info)
    if (!buffer)
      return notFoundError(filePath)
    if (encoding)
      return buffer.toString(encoding)
    else
      return buffer
  }

  const {readdir} = fs
  fs.readdir = function(p, callback) {
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return readdir.apply(this, arguments)
    const files = process.asarArchive.readdir(filePath)
    if (!files)
      return notFoundError(filePath, callback)
    process.nextTick(function() {
      callback(null, files)
    })
  }

  const {readdirSync} = fs
  fs.readdirSync = function(p) {
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return readdirSync.apply(this, arguments)
    const files = process.asarArchive.readdir(filePath)
    if (!files)
      notFoundError(filePath)
    return files
  }

  const {internalModuleReadJSON} = process.binding('fs')
  process.binding('fs').internalModuleReadJSON = function(p) {
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return internalModuleReadJSON(p)
    const info = process.asarArchive.getFileInfo(filePath)
    if (!info)
      return
    if (info.size === 0)
      return ''
    if (info.unpacked) {
      const realPath = process.asarArchive.copyFileOut(info)
      return fs.readFileSync(realPath, {
        encoding: 'utf8'
      })
    }
    const buffer = process.asarArchive.readFile(info)
    if (!buffer)
      return notFoundError(filePath)
    return buffer.toString('utf8')
  }

  const {internalModuleStat} = process.binding('fs')
  process.binding('fs').internalModuleStat = function(p) {
    const [isAsar, filePath] = splitPath(p)
    if (!isAsar)
      return internalModuleStat(p)
    const stats = process.asarArchive.stat(filePath)
    if (!stats)
      return -34  // -ENOENT
    return stats.isDirectory ? 1 : 0
  }

  // Calling mkdir for directory inside asar archive should throw ENOTDIR
  // error, but on Windows it throws ENOENT.
  // This is to work around the recursive looping bug of mkdirp since it is
  // widely used.
  if (process.platform === 'win32') {
    const {mkdir} = fs
    fs.mkdir = function(p, mode, callback) {
      if (typeof mode === 'function') {
        callback = mode
      }
      const [isAsar, filePath] = splitPath(p)
      if (isAsar && filePath.length)
        return notDirError(callback)
      mkdir(p, mode, callback)
    }

    const {mkdirSync} = fs
    fs.mkdirSync = function(p, mode) {
      const [isAsar, filePath] = splitPath(p)
      if (isAsar && filePath.length)
        return notDirError()
      return mkdirSync(p, mode)
    }
  }

  // Executing a command string containing a path to an asar
  // archive confuses `childProcess.execFile`, which is internally
  // called by `childProcess.{exec,execSync}`, causing
  // Electron to consider the full command as a single path
  // to an archive.
  ['exec', 'execSync'].forEach(function(functionName) {
    const old = childProcess[functionName]
    childProcess[functionName] = function() {
      const processNoAsarOriginalValue = process.noAsar
      process.noAsar = true
      try {
        return old.apply(this, arguments)
      } finally {
        process.noAsar = processNoAsarOriginalValue
      }
    }
  })

  overrideAPI(fs, 'open')
  overrideAPI(childProcess, 'execFile')
  overrideAPISync(process, 'dlopen', 1)
  overrideAPISync(require('module')._extensions, '.node', 1)
  overrideAPISync(fs, 'openSync')
  overrideAPISync(childProcess, 'execFileSync')
}
