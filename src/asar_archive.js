const fs = require('fs')
const path = require('path')
const os = require('os')
const Pickle = require('pickle')

class AsarArchive {
  constructor(asarPath) {
    const fd = fs.openSync(asarPath, 'r')
    try {
      this.readExtendedMeta(fd, fs.statSync(asarPath))

      // Read size.
      let buffer = Buffer.alloc(8)
      fs.readSync(fd, buffer, 0, 8, this.contentOffset)
      const size = (new Pickle(buffer)).createIterator().readUInt32()
      this.contentOffset += 8

      // Read header.
      buffer = Buffer.alloc(size)
      fs.readSync(fd, buffer, 0, size, this.contentOffset)
      const header = (new Pickle(buffer)).createIterator().readString()
      this.header = JSON.parse(header)
      this.contentOffset += size
    } finally {
      fs.closeSync(fd)
    }

    // Manage temprary files.
    this.tmpFiles = {}
  }

  readExtendedMeta(fd, stats) {
    // Read last 13 bytes, which are | size(8) | version(1) | magic(4) |.
    const buffer = Buffer.alloc(8)
    fs.readSync(fd, buffer, 0, 4, stats.size - 4)
    const magic = buffer.toString('utf8', 0, 4)
    if (magic != 'ASAR')
      throw new Error('Not an ASAR archive')
    fs.readSync(fd, buffer, 0, 1, stats.size - 5)
    const version = buffer.readUInt8(0)
    if (version != 2)
      throw new Error('Unsupported ASAR version')
    fs.readSync(fd, buffer, 0, 8, stats.size - 13)
    const size = buffer.readDoubleLE(0)
    this.contentOffset = stats.size - size
  }

  getTmpDir() {
    if (this.tmpDir)
      return this.tmpDir
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asar-'))
    process.once('exit', () => {
      for (const name in this.tmpFiles)
        fs.unlinkSync(this.tmpFiles[name])
      fs.rmdirSync(this.tmpDir)
    })
    return this.tmpDir
  }

  getNode(filePath) {
    let node = this.header
    if (filePath === '')
      return node
    const components = path.normalize(filePath).split(path.sep)
    while (components.length > 0) {
      const name = components.shift()
      if (name.length == 0)
        continue
      if (node.files && node.files[name])
        node = node.files[name]
      else
        return null
    }
    return node
  }

  getFileInfo(filePath) {
    const node = this.getNode(filePath)
    if (!node)
      return null
    if (node.files)
      return null
    if (node.link)
      return this.getFileInfo(node.link)
    const info = { size: node.size }
    if (node.unpacked)
      info.unpacked = true
    else
      info.offset = this.contentOffset + parseInt(node.offset)
    return info
  }

  readFile(filePath, info) {
    if (info.unpacked)
      throw new Error('Should not use readFile for unpacked path')
    const buffer = Buffer.alloc(info.size)
    const fd = fs.openSync(process.execPath, 'r')
    try {
      fs.readSync(fd, buffer, 0, info.size, info.offset)
    } catch (e) {
      return null
    } finally {
      fs.closeSync(fd)
    }
    return buffer
  }

  copyFileOut(filePath, info) {
    if (this.tmpFiles[filePath])
      return this.tmpFiles[filePath]
    if (info.unpacked)
      return path.resolve(process.execPath, '..', 'res', filePath)
    const tmpFile = path.join(this.getTmpDir(), filePath.replace(/[\\\/]/g, '_'))
    fs.writeFileSync(tmpFile, this.readFile(filePath, info))
    this.tmpFiles[filePath] = tmpFile
    return tmpFile
  }

  stat(filePath) {
    const node = this.getNode(filePath)
    if (!node)
      return null
    return {
      isFile: !node.files && !node.link,
      isDirectory: !!node.files,
      isLink: !!node.link,
    }
  }

  realpath(filePath) {
    const node = this.getNode(filePath)
    if (!node)
      return null
    if (node.link)
      return this.realpath(node.link)
    return filePath
  }

  readdir(filePath) {
    const node = this.getNode(filePath)
    if (!node || !node.files)
      return null
    return Object.keys(node.files)
  }
}

module.exports = AsarArchive
