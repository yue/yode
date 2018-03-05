const fs = require('fs')
const path = require('path')
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

  getFileInfo(filePath) {
    const components = path.normalize(filePath).split(path.sep)
    let node = this.header
    while (components.length > 0) {
      const name = components.shift()
      if (name.length == 0)
        continue
      if (node.files && node.files[name])
        node = node.files[name]
      else
        return null
    }
    if (node.files)
      return null
    if (node.link)
      return this.getFileInfo(node.link)
    return {
      size: node.size,
      offset: this.contentOffset + parseInt(node.offset)
    }
  }
}

module.exports = AsarArchive
