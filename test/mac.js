const fs = require('node:fs/promises')

// Implementation taken from https://github.com/vercel/pkg/pull/1164.
//
// The MIT License (MIT)
//
// Copyright (c) 2021 Vercel, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
function parseCStr(buf) {
  for (let i = 0; i < buf.length; i += 1) {
    if (buf[i] === 0) {
      return buf.slice(0, i).toString();
    }
  }
}

function patchCommand(type, buf, file) {
  // segment_64
  if (type === 0x19) {
    const name = parseCStr(buf.slice(0, 16));

    if (name === '__LINKEDIT') {
      const fileoff = buf.readBigUInt64LE(32);
      const vmsize_patched = BigInt(file.length) - fileoff;
      const filesize_patched = vmsize_patched;

      buf.writeBigUInt64LE(vmsize_patched, 24);
      buf.writeBigUInt64LE(filesize_patched, 40);
    }
  }

  // symtab
  if (type === 0x2) {
    const stroff = buf.readUInt32LE(8);
    const strsize_patched = file.length - stroff;

    buf.writeUInt32LE(strsize_patched, 12);
  }
}

async function extendStringTableSize(target) {
  const file = await fs.readFile(target)

  const align = 8;
  const hsize = 32;

  const ncmds = file.readUInt32LE(16);
  const buf = file.slice(hsize);

  for (let offset = 0, i = 0; i < ncmds; i += 1) {
    const type = buf.readUInt32LE(offset);

    offset += 4;
    const size = buf.readUInt32LE(offset) - 8;

    offset += 4;
    patchCommand(type, buf.slice(offset, offset + size), file);

    offset += size;
    if (offset & align) {
      offset += align - (offset & align);
    }
  }

  await fs.writeFile(target, file)
}

module.exports = {extendStringTableSize}
