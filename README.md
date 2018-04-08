# Yode

Yode is a fork of Node.js that replaces its event loop with GUI message loop,
it is designed to be used together with [the Yue library](http://libyue.com).

## Changes to Node.js

* The event loop is replaced with native GUI message loops:
  * On Linux it is `GTK+` event loop;
  * On macOS it is `Cocoa` run loop;
  * On Windows it is `Win32` message loop.
* When the executable is appended with ASAR archive, Yode will try to start with
  with app inside the archive.
* The process will not automatically quit when there is no work, you have to
  call the native APIs to quit the GUI message loop.
* The process will quit when **BOTH** the GUI message loop and Node.js event
  loop have quit. So if there are still Node.js requests pending, the process
  will wait until all of them have finished.
* There is a new `process.versions.yode` property added.
* The `process.stdin` is not supposed to work.
* On Windows the executable uses `WINDOWS` subsystem instead of `CONSOLE`
  subsystem, so unlike Node.js there is no console attached and REPL won't
  work.

## Usage

The prebuilt binaries can be found in the Releases page, modules installed by
`npm` can be used directly in Yode.

To package your Node.js project with Yode, you should use [yackage][yackage].

Note that it is strong recommended to install the official Node.js with the
same version of Yode, otherwise native modules installed by `npm` may not work
correctly in Yode.

## Build

```bash
$ node ./build.js [x64|ia32]
```

## License

The MIT license.

[yackage]: https://github.com/yue/yackage
