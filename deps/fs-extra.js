// fs-extra@11.1.1
//
// (The MIT License)
//
// Copyright (c) 2011-2017 JP Richardson
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
// (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify,
//  merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
// OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
//  ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
!function(t){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).fsExtra=t()}}((function(){return function t(e,n,r){function i(s,c){if(!n[s]){if(!e[s]){var u="function"==typeof require&&require;if(!c&&u)return u(s,!0);if(o)return o(s,!0);var a=new Error("Cannot find module '"+s+"'");throw a.code="MODULE_NOT_FOUND",a}var f=n[s]={exports:{}};e[s][0].call(f.exports,(function(t){return i(e[s][1][t]||t)}),f,f.exports,t,e,n,r)}return n[s].exports}for(var o="function"==typeof require&&require,s=0;s<r.length;s++)i(r[s]);return i}({1:[function(t,e,n){"use strict";const r=t("graceful-fs"),i=t("path"),o=t("../mkdirs").mkdirsSync,s=t("../util/utimes").utimesMillisSync,c=t("../util/stat");function u(t,e,n,o){const s=(o.dereference?r.statSync:r.lstatSync)(e);if(s.isDirectory())return function(t,e,n,i,o){return e?l(n,i,o):function(t,e,n,i){return r.mkdirSync(n),l(e,n,i),f(n,t)}(t.mode,n,i,o)}(s,t,e,n,o);if(s.isFile()||s.isCharacterDevice()||s.isBlockDevice())return function(t,e,n,i,o){return e?function(t,e,n,i){if(i.overwrite)return r.unlinkSync(n),a(t,e,n,i);if(i.errorOnExist)throw new Error(`'${n}' already exists`)}(t,n,i,o):a(t,n,i,o)}(s,t,e,n,o);if(s.isSymbolicLink())return function(t,e,n,o){let s=r.readlinkSync(e);o.dereference&&(s=i.resolve(process.cwd(),s));if(t){let t;try{t=r.readlinkSync(n)}catch(t){if("EINVAL"===t.code||"UNKNOWN"===t.code)return r.symlinkSync(s,n);throw t}if(o.dereference&&(t=i.resolve(process.cwd(),t)),c.isSrcSubdir(s,t))throw new Error(`Cannot copy '${s}' to a subdirectory of itself, '${t}'.`);if(c.isSrcSubdir(t,s))throw new Error(`Cannot overwrite '${t}' with '${s}'.`);return function(t,e){return r.unlinkSync(e),r.symlinkSync(t,e)}(s,n)}return r.symlinkSync(s,n)}(t,e,n,o);if(s.isSocket())throw new Error(`Cannot copy a socket file: ${e}`);if(s.isFIFO())throw new Error(`Cannot copy a FIFO pipe: ${e}`);throw new Error(`Unknown file: ${e}`)}function a(t,e,n,i){return r.copyFileSync(e,n),i.preserveTimestamps&&function(t,e,n){(function(t){return 0==(128&t)})(t)&&function(t,e){f(t,128|e)}(n,t);(function(t,e){const n=r.statSync(t);s(e,n.atime,n.mtime)})(e,n)}(t.mode,e,n),f(n,t.mode)}function f(t,e){return r.chmodSync(t,e)}function l(t,e,n){r.readdirSync(t).forEach((r=>function(t,e,n,r){const o=i.join(e,t),s=i.join(n,t);if(r.filter&&!r.filter(o,s))return;const{destStat:a}=c.checkPathsSync(o,s,"copy",r);return u(a,o,s,r)}(r,t,e,n)))}e.exports=function(t,e,n){"function"==typeof n&&(n={filter:n}),(n=n||{}).clobber=!("clobber"in n)||!!n.clobber,n.overwrite="overwrite"in n?!!n.overwrite:n.clobber,n.preserveTimestamps&&"ia32"===process.arch&&process.emitWarning("Using the preserveTimestamps option in 32-bit node is not recommended;\n\n\tsee https://github.com/jprichardson/node-fs-extra/issues/269","Warning","fs-extra-WARN0002");const{srcStat:s,destStat:a}=c.checkPathsSync(t,e,"copy",n);if(c.checkParentPathsSync(t,s,e,"copy"),n.filter&&!n.filter(t,e))return;const f=i.dirname(e);return r.existsSync(f)||o(f),u(a,t,e,n)}},{"../mkdirs":17,"../util/stat":26,"../util/utimes":27,"graceful-fs":29,path:void 0}],2:[function(t,e,n){"use strict";const r=t("graceful-fs"),i=t("path"),o=t("../mkdirs").mkdirs,s=t("../path-exists").pathExists,c=t("../util/utimes").utimesMillis,u=t("../util/stat");function a(t,e,n,r){if(!n.filter)return r(null,!0);Promise.resolve(n.filter(t,e)).then((t=>r(null,t)),(t=>r(t)))}function f(t,e,n,i,o){(i.dereference?r.stat:r.lstat)(e,((s,c)=>s?o(s):c.isDirectory()?function(t,e,n,i,o,s){return e?d(n,i,o,s):function(t,e,n,i,o){r.mkdir(n,(r=>{if(r)return o(r);d(e,n,i,(e=>e?o(e):p(n,t,o)))}))}(t.mode,n,i,o,s)}(c,t,e,n,i,o):c.isFile()||c.isCharacterDevice()||c.isBlockDevice()?function(t,e,n,i,o,s){return e?function(t,e,n,i,o){if(!i.overwrite)return i.errorOnExist?o(new Error(`'${n}' already exists`)):o();r.unlink(n,(r=>r?o(r):l(t,e,n,i,o)))}(t,n,i,o,s):l(t,n,i,o,s)}(c,t,e,n,i,o):c.isSymbolicLink()?h(t,e,n,i,o):c.isSocket()?o(new Error(`Cannot copy a socket file: ${e}`)):c.isFIFO()?o(new Error(`Cannot copy a FIFO pipe: ${e}`)):o(new Error(`Unknown file: ${e}`))))}function l(t,e,n,i,o){r.copyFile(e,n,(r=>r?o(r):i.preserveTimestamps?function(t,e,n,r){if(function(t){return 0==(128&t)}(t))return function(t,e,n){return p(t,128|e,n)}(n,t,(i=>i?r(i):y(t,e,n,r)));return y(t,e,n,r)}(t.mode,e,n,o):p(n,t.mode,o)))}function y(t,e,n,i){!function(t,e,n){r.stat(t,((t,r)=>t?n(t):c(e,r.atime,r.mtime,n)))}(e,n,(e=>e?i(e):p(n,t,i)))}function p(t,e,n){return r.chmod(t,e,n)}function d(t,e,n,i){r.readdir(t,((r,o)=>r?i(r):m(o,t,e,n,i)))}function m(t,e,n,r,o){const s=t.pop();return s?function(t,e,n,r,o,s){const c=i.join(n,e),l=i.join(r,e);a(c,l,o,((e,i)=>e?s(e):i?void u.checkPaths(c,l,"copy",o,((e,i)=>{if(e)return s(e);const{destStat:u}=i;f(u,c,l,o,(e=>e?s(e):m(t,n,r,o,s)))})):m(t,n,r,o,s)))}(t,s,e,n,r,o):o()}function h(t,e,n,o,s){r.readlink(e,((e,c)=>e?s(e):(o.dereference&&(c=i.resolve(process.cwd(),c)),t?void r.readlink(n,((t,e)=>t?"EINVAL"===t.code||"UNKNOWN"===t.code?r.symlink(c,n,s):s(t):(o.dereference&&(e=i.resolve(process.cwd(),e)),u.isSrcSubdir(c,e)?s(new Error(`Cannot copy '${c}' to a subdirectory of itself, '${e}'.`)):u.isSrcSubdir(e,c)?s(new Error(`Cannot overwrite '${e}' with '${c}'.`)):function(t,e,n){r.unlink(e,(i=>i?n(i):r.symlink(t,e,n)))}(c,n,s)))):r.symlink(c,n,s))))}e.exports=function(t,e,n,r){"function"!=typeof n||r?"function"==typeof n&&(n={filter:n}):(r=n,n={}),r=r||function(){},(n=n||{}).clobber=!("clobber"in n)||!!n.clobber,n.overwrite="overwrite"in n?!!n.overwrite:n.clobber,n.preserveTimestamps&&"ia32"===process.arch&&process.emitWarning("Using the preserveTimestamps option in 32-bit node is not recommended;\n\n\tsee https://github.com/jprichardson/node-fs-extra/issues/269","Warning","fs-extra-WARN0001"),u.checkPaths(t,e,"copy",n,((c,l)=>{if(c)return r(c);const{srcStat:y,destStat:p}=l;u.checkParentPaths(t,y,e,"copy",(c=>{if(c)return r(c);a(t,e,n,((c,u)=>c?r(c):u?void function(t,e,n,r,c){const u=i.dirname(n);s(u,((i,s)=>i?c(i):s?f(t,e,n,r,c):void o(u,(i=>i?c(i):f(t,e,n,r,c)))))}(p,t,e,n,r):r()))}))}))}},{"../mkdirs":17,"../path-exists":24,"../util/stat":26,"../util/utimes":27,"graceful-fs":29,path:void 0}],3:[function(t,e,n){"use strict";const r=t("universalify").fromCallback;e.exports={copy:r(t("./copy")),copySync:t("./copy-sync")}},{"./copy":2,"./copy-sync":1,universalify:34}],4:[function(t,e,n){"use strict";const r=t("universalify").fromPromise,i=t("../fs"),o=t("path"),s=t("../mkdirs"),c=t("../remove"),u=r((async function(t){let e;try{e=await i.readdir(t)}catch{return s.mkdirs(t)}return Promise.all(e.map((e=>c.remove(o.join(t,e)))))}));function a(t){let e;try{e=i.readdirSync(t)}catch{return s.mkdirsSync(t)}e.forEach((e=>{e=o.join(t,e),c.removeSync(e)}))}e.exports={emptyDirSync:a,emptydirSync:a,emptyDir:u,emptydir:u}},{"../fs":11,"../mkdirs":17,"../remove":25,path:void 0,universalify:34}],5:[function(t,e,n){"use strict";const r=t("universalify").fromCallback,i=t("path"),o=t("graceful-fs"),s=t("../mkdirs");e.exports={createFile:r((function(t,e){function n(){o.writeFile(t,"",(t=>{if(t)return e(t);e()}))}o.stat(t,((r,c)=>{if(!r&&c.isFile())return e();const u=i.dirname(t);o.stat(u,((t,r)=>{if(t)return"ENOENT"===t.code?s.mkdirs(u,(t=>{if(t)return e(t);n()})):e(t);r.isDirectory()?n():o.readdir(u,(t=>{if(t)return e(t)}))}))}))})),createFileSync:function(t){let e;try{e=o.statSync(t)}catch{}if(e&&e.isFile())return;const n=i.dirname(t);try{o.statSync(n).isDirectory()||o.readdirSync(n)}catch(t){if(!t||"ENOENT"!==t.code)throw t;s.mkdirsSync(n)}o.writeFileSync(t,"")}}},{"../mkdirs":17,"graceful-fs":29,path:void 0,universalify:34}],6:[function(t,e,n){"use strict";const{createFile:r,createFileSync:i}=t("./file"),{createLink:o,createLinkSync:s}=t("./link"),{createSymlink:c,createSymlinkSync:u}=t("./symlink");e.exports={createFile:r,createFileSync:i,ensureFile:r,ensureFileSync:i,createLink:o,createLinkSync:s,ensureLink:o,ensureLinkSync:s,createSymlink:c,createSymlinkSync:u,ensureSymlink:c,ensureSymlinkSync:u}},{"./file":5,"./link":7,"./symlink":10}],7:[function(t,e,n){"use strict";const r=t("universalify").fromCallback,i=t("path"),o=t("graceful-fs"),s=t("../mkdirs"),c=t("../path-exists").pathExists,{areIdentical:u}=t("../util/stat");e.exports={createLink:r((function(t,e,n){function r(t,e){o.link(t,e,(t=>{if(t)return n(t);n(null)}))}o.lstat(e,((a,f)=>{o.lstat(t,((o,a)=>{if(o)return o.message=o.message.replace("lstat","ensureLink"),n(o);if(f&&u(a,f))return n(null);const l=i.dirname(e);c(l,((i,o)=>i?n(i):o?r(t,e):void s.mkdirs(l,(i=>{if(i)return n(i);r(t,e)}))))}))}))})),createLinkSync:function(t,e){let n;try{n=o.lstatSync(e)}catch{}try{const e=o.lstatSync(t);if(n&&u(e,n))return}catch(t){throw t.message=t.message.replace("lstat","ensureLink"),t}const r=i.dirname(e);return o.existsSync(r)||s.mkdirsSync(r),o.linkSync(t,e)}}},{"../mkdirs":17,"../path-exists":24,"../util/stat":26,"graceful-fs":29,path:void 0,universalify:34}],8:[function(t,e,n){"use strict";const r=t("path"),i=t("graceful-fs"),o=t("../path-exists").pathExists;e.exports={symlinkPaths:function(t,e,n){if(r.isAbsolute(t))return i.lstat(t,(e=>e?(e.message=e.message.replace("lstat","ensureSymlink"),n(e)):n(null,{toCwd:t,toDst:t})));{const s=r.dirname(e),c=r.join(s,t);return o(c,((e,o)=>e?n(e):o?n(null,{toCwd:c,toDst:t}):i.lstat(t,(e=>e?(e.message=e.message.replace("lstat","ensureSymlink"),n(e)):n(null,{toCwd:t,toDst:r.relative(s,t)})))))}},symlinkPathsSync:function(t,e){let n;if(r.isAbsolute(t)){if(n=i.existsSync(t),!n)throw new Error("absolute srcpath does not exist");return{toCwd:t,toDst:t}}{const o=r.dirname(e),s=r.join(o,t);if(n=i.existsSync(s),n)return{toCwd:s,toDst:t};if(n=i.existsSync(t),!n)throw new Error("relative srcpath does not exist");return{toCwd:t,toDst:r.relative(o,t)}}}}},{"../path-exists":24,"graceful-fs":29,path:void 0}],9:[function(t,e,n){"use strict";const r=t("graceful-fs");e.exports={symlinkType:function(t,e,n){if(n="function"==typeof e?e:n,e="function"!=typeof e&&e)return n(null,e);r.lstat(t,((t,r)=>{if(t)return n(null,"file");e=r&&r.isDirectory()?"dir":"file",n(null,e)}))},symlinkTypeSync:function(t,e){let n;if(e)return e;try{n=r.lstatSync(t)}catch{return"file"}return n&&n.isDirectory()?"dir":"file"}}},{"graceful-fs":29}],10:[function(t,e,n){"use strict";const r=t("universalify").fromCallback,i=t("path"),o=t("../fs"),s=t("../mkdirs"),c=s.mkdirs,u=s.mkdirsSync,a=t("./symlink-paths"),f=a.symlinkPaths,l=a.symlinkPathsSync,y=t("./symlink-type"),p=y.symlinkType,d=y.symlinkTypeSync,m=t("../path-exists").pathExists,{areIdentical:h}=t("../util/stat");function S(t,e,n,r){f(t,e,((s,u)=>{if(s)return r(s);t=u.toDst,p(u.toCwd,n,((n,s)=>{if(n)return r(n);const u=i.dirname(e);m(u,((n,i)=>n?r(n):i?o.symlink(t,e,s,r):void c(u,(n=>{if(n)return r(n);o.symlink(t,e,s,r)}))))}))}))}e.exports={createSymlink:r((function(t,e,n,r){r="function"==typeof n?n:r,n="function"!=typeof n&&n,o.lstat(e,((i,s)=>{!i&&s.isSymbolicLink()?Promise.all([o.stat(t),o.stat(e)]).then((([i,o])=>{if(h(i,o))return r(null);S(t,e,n,r)})):S(t,e,n,r)}))})),createSymlinkSync:function(t,e,n){let r;try{r=o.lstatSync(e)}catch{}if(r&&r.isSymbolicLink()){const n=o.statSync(t),r=o.statSync(e);if(h(n,r))return}const s=l(t,e);t=s.toDst,n=d(s.toCwd,n);const c=i.dirname(e);return o.existsSync(c)||u(c),o.symlinkSync(t,e,n)}}},{"../fs":11,"../mkdirs":17,"../path-exists":24,"../util/stat":26,"./symlink-paths":8,"./symlink-type":9,path:void 0,universalify:34}],11:[function(t,e,n){"use strict";const r=t("universalify").fromCallback,i=t("graceful-fs"),o=["access","appendFile","chmod","chown","close","copyFile","fchmod","fchown","fdatasync","fstat","fsync","ftruncate","futimes","lchmod","lchown","link","lstat","mkdir","mkdtemp","open","opendir","readdir","readFile","readlink","realpath","rename","rm","rmdir","stat","symlink","truncate","unlink","utimes","writeFile"].filter((t=>"function"==typeof i[t]));Object.assign(n,i),o.forEach((t=>{n[t]=r(i[t])})),n.exists=function(t,e){return"function"==typeof e?i.exists(t,e):new Promise((e=>i.exists(t,e)))},n.read=function(t,e,n,r,o,s){return"function"==typeof s?i.read(t,e,n,r,o,s):new Promise(((s,c)=>{i.read(t,e,n,r,o,((t,e,n)=>{if(t)return c(t);s({bytesRead:e,buffer:n})}))}))},n.write=function(t,e,...n){return"function"==typeof n[n.length-1]?i.write(t,e,...n):new Promise(((r,o)=>{i.write(t,e,...n,((t,e,n)=>{if(t)return o(t);r({bytesWritten:e,buffer:n})}))}))},n.readv=function(t,e,...n){return"function"==typeof n[n.length-1]?i.readv(t,e,...n):new Promise(((r,o)=>{i.readv(t,e,...n,((t,e,n)=>{if(t)return o(t);r({bytesRead:e,buffers:n})}))}))},n.writev=function(t,e,...n){return"function"==typeof n[n.length-1]?i.writev(t,e,...n):new Promise(((r,o)=>{i.writev(t,e,...n,((t,e,n)=>{if(t)return o(t);r({bytesWritten:e,buffers:n})}))}))},"function"==typeof i.realpath.native?n.realpath.native=r(i.realpath.native):process.emitWarning("fs.realpath.native is not a function. Is fs being monkey-patched?","Warning","fs-extra-WARN0003")},{"graceful-fs":29,universalify:34}],12:[function(t,e,n){"use strict";e.exports={...t("./fs"),...t("./copy"),...t("./empty"),...t("./ensure"),...t("./json"),...t("./mkdirs"),...t("./move"),...t("./output-file"),...t("./path-exists"),...t("./remove")}},{"./copy":3,"./empty":4,"./ensure":6,"./fs":11,"./json":13,"./mkdirs":17,"./move":20,"./output-file":23,"./path-exists":24,"./remove":25}],13:[function(t,e,n){"use strict";const r=t("universalify").fromPromise,i=t("./jsonfile");i.outputJson=r(t("./output-json")),i.outputJsonSync=t("./output-json-sync"),i.outputJSON=i.outputJson,i.outputJSONSync=i.outputJsonSync,i.writeJSON=i.writeJson,i.writeJSONSync=i.writeJsonSync,i.readJSON=i.readJson,i.readJSONSync=i.readJsonSync,e.exports=i},{"./jsonfile":14,"./output-json":16,"./output-json-sync":15,universalify:34}],14:[function(t,e,n){"use strict";const r=t("jsonfile");e.exports={readJson:r.readFile,readJsonSync:r.readFileSync,writeJson:r.writeFile,writeJsonSync:r.writeFileSync}},{jsonfile:32}],15:[function(t,e,n){"use strict";const{stringify:r}=t("jsonfile/utils"),{outputFileSync:i}=t("../output-file");e.exports=function(t,e,n){const o=r(e,n);i(t,o,n)}},{"../output-file":23,"jsonfile/utils":33}],16:[function(t,e,n){"use strict";const{stringify:r}=t("jsonfile/utils"),{outputFile:i}=t("../output-file");e.exports=async function(t,e,n={}){const o=r(e,n);await i(t,o,n)}},{"../output-file":23,"jsonfile/utils":33}],17:[function(t,e,n){"use strict";const r=t("universalify").fromPromise,{makeDir:i,makeDirSync:o}=t("./make-dir"),s=r(i);e.exports={mkdirs:s,mkdirsSync:o,mkdirp:s,mkdirpSync:o,ensureDir:s,ensureDirSync:o}},{"./make-dir":18,universalify:34}],18:[function(t,e,n){"use strict";const r=t("../fs"),{checkPath:i}=t("./utils"),o=t=>"number"==typeof t?t:{mode:511,...t}.mode;e.exports.makeDir=async(t,e)=>(i(t),r.mkdir(t,{mode:o(e),recursive:!0})),e.exports.makeDirSync=(t,e)=>(i(t),r.mkdirSync(t,{mode:o(e),recursive:!0}))},{"../fs":11,"./utils":19}],19:[function(t,e,n){"use strict";const r=t("path");e.exports.checkPath=function(t){if("win32"===process.platform){if(/[<>:"|?*]/.test(t.replace(r.parse(t).root,""))){const e=new Error(`Path contains invalid characters: ${t}`);throw e.code="EINVAL",e}}}},{path:void 0}],20:[function(t,e,n){"use strict";const r=t("universalify").fromCallback;e.exports={move:r(t("./move")),moveSync:t("./move-sync")}},{"./move":22,"./move-sync":21,universalify:34}],21:[function(t,e,n){"use strict";const r=t("graceful-fs"),i=t("path"),o=t("../copy").copySync,s=t("../remove").removeSync,c=t("../mkdirs").mkdirpSync,u=t("../util/stat");function a(t,e,n){try{r.renameSync(t,e)}catch(r){if("EXDEV"!==r.code)throw r;return function(t,e,n){return o(t,e,{overwrite:n,errorOnExist:true,preserveTimestamps:true}),s(t)}(t,e,n)}}e.exports=function(t,e,n){const o=(n=n||{}).overwrite||n.clobber||!1,{srcStat:f,isChangingCase:l=!1}=u.checkPathsSync(t,e,"move",n);return u.checkParentPathsSync(t,f,e,"move"),function(t){const e=i.dirname(t);return i.parse(e).root===e}(e)||c(i.dirname(e)),function(t,e,n,i){if(i)return a(t,e,n);if(n)return s(e),a(t,e,n);if(r.existsSync(e))throw new Error("dest already exists.");return a(t,e,n)}(t,e,o,l)}},{"../copy":3,"../mkdirs":17,"../remove":25,"../util/stat":26,"graceful-fs":29,path:void 0}],22:[function(t,e,n){"use strict";const r=t("graceful-fs"),i=t("path"),o=t("../copy").copy,s=t("../remove").remove,c=t("../mkdirs").mkdirp,u=t("../path-exists").pathExists,a=t("../util/stat");function f(t,e,n,r,i){return r?l(t,e,n,i):n?s(e,(r=>r?i(r):l(t,e,n,i))):void u(e,((r,o)=>r?i(r):o?i(new Error("dest already exists.")):l(t,e,n,i)))}function l(t,e,n,i){r.rename(t,e,(r=>r?"EXDEV"!==r.code?i(r):function(t,e,n,r){o(t,e,{overwrite:n,errorOnExist:!0,preserveTimestamps:!0},(e=>e?r(e):s(t,r)))}(t,e,n,i):i()))}e.exports=function(t,e,n,r){"function"==typeof n&&(r=n,n={});const o=(n=n||{}).overwrite||n.clobber||!1;a.checkPaths(t,e,"move",n,((n,s)=>{if(n)return r(n);const{srcStat:u,isChangingCase:l=!1}=s;a.checkParentPaths(t,u,e,"move",(n=>n?r(n):function(t){const e=i.dirname(t);return i.parse(e).root===e}(e)?f(t,e,o,l,r):void c(i.dirname(e),(n=>n?r(n):f(t,e,o,l,r)))))}))}},{"../copy":3,"../mkdirs":17,"../path-exists":24,"../remove":25,"../util/stat":26,"graceful-fs":29,path:void 0}],23:[function(t,e,n){"use strict";const r=t("universalify").fromCallback,i=t("graceful-fs"),o=t("path"),s=t("../mkdirs"),c=t("../path-exists").pathExists;e.exports={outputFile:r((function(t,e,n,r){"function"==typeof n&&(r=n,n="utf8");const u=o.dirname(t);c(u,((o,c)=>o?r(o):c?i.writeFile(t,e,n,r):void s.mkdirs(u,(o=>{if(o)return r(o);i.writeFile(t,e,n,r)}))))})),outputFileSync:function(t,...e){const n=o.dirname(t);if(i.existsSync(n))return i.writeFileSync(t,...e);s.mkdirsSync(n),i.writeFileSync(t,...e)}}},{"../mkdirs":17,"../path-exists":24,"graceful-fs":29,path:void 0,universalify:34}],24:[function(t,e,n){"use strict";const r=t("universalify").fromPromise,i=t("../fs");e.exports={pathExists:r((function(t){return i.access(t).then((()=>!0)).catch((()=>!1))})),pathExistsSync:i.existsSync}},{"../fs":11,universalify:34}],25:[function(t,e,n){"use strict";const r=t("graceful-fs"),i=t("universalify").fromCallback;e.exports={remove:i((function(t,e){r.rm(t,{recursive:!0,force:!0},e)})),removeSync:function(t){r.rmSync(t,{recursive:!0,force:!0})}}},{"graceful-fs":29,universalify:34}],26:[function(t,e,n){"use strict";const r=t("../fs"),i=t("path"),o=t("util");function s(t,e,n){const i=n.dereference?t=>r.stat(t,{bigint:!0}):t=>r.lstat(t,{bigint:!0});return Promise.all([i(t),i(e).catch((t=>{if("ENOENT"===t.code)return null;throw t}))]).then((([t,e])=>({srcStat:t,destStat:e})))}function c(t,e){return e.ino&&e.dev&&e.ino===t.ino&&e.dev===t.dev}function u(t,e){const n=i.resolve(t).split(i.sep).filter((t=>t)),r=i.resolve(e).split(i.sep).filter((t=>t));return n.reduce(((t,e,n)=>t&&r[n]===e),!0)}function a(t,e,n){return`Cannot ${n} '${t}' to a subdirectory of itself, '${e}'.`}e.exports={checkPaths:function(t,e,n,r,f){o.callbackify(s)(t,e,r,((r,o)=>{if(r)return f(r);const{srcStat:s,destStat:l}=o;if(l){if(c(s,l)){const r=i.basename(t),o=i.basename(e);return"move"===n&&r!==o&&r.toLowerCase()===o.toLowerCase()?f(null,{srcStat:s,destStat:l,isChangingCase:!0}):f(new Error("Source and destination must not be the same."))}if(s.isDirectory()&&!l.isDirectory())return f(new Error(`Cannot overwrite non-directory '${e}' with directory '${t}'.`));if(!s.isDirectory()&&l.isDirectory())return f(new Error(`Cannot overwrite directory '${e}' with non-directory '${t}'.`))}return s.isDirectory()&&u(t,e)?f(new Error(a(t,e,n))):f(null,{srcStat:s,destStat:l})}))},checkPathsSync:function(t,e,n,o){const{srcStat:s,destStat:f}=function(t,e,n){let i;const o=n.dereference?t=>r.statSync(t,{bigint:!0}):t=>r.lstatSync(t,{bigint:!0}),s=o(t);try{i=o(e)}catch(t){if("ENOENT"===t.code)return{srcStat:s,destStat:null};throw t}return{srcStat:s,destStat:i}}(t,e,o);if(f){if(c(s,f)){const r=i.basename(t),o=i.basename(e);if("move"===n&&r!==o&&r.toLowerCase()===o.toLowerCase())return{srcStat:s,destStat:f,isChangingCase:!0};throw new Error("Source and destination must not be the same.")}if(s.isDirectory()&&!f.isDirectory())throw new Error(`Cannot overwrite non-directory '${e}' with directory '${t}'.`);if(!s.isDirectory()&&f.isDirectory())throw new Error(`Cannot overwrite directory '${e}' with non-directory '${t}'.`)}if(s.isDirectory()&&u(t,e))throw new Error(a(t,e,n));return{srcStat:s,destStat:f}},checkParentPaths:function t(e,n,o,s,u){const f=i.resolve(i.dirname(e)),l=i.resolve(i.dirname(o));if(l===f||l===i.parse(l).root)return u();r.stat(l,{bigint:!0},((r,i)=>r?"ENOENT"===r.code?u():u(r):c(n,i)?u(new Error(a(e,o,s))):t(e,n,l,s,u)))},checkParentPathsSync:function t(e,n,o,s){const u=i.resolve(i.dirname(e)),f=i.resolve(i.dirname(o));if(f===u||f===i.parse(f).root)return;let l;try{l=r.statSync(f,{bigint:!0})}catch(t){if("ENOENT"===t.code)return;throw t}if(c(n,l))throw new Error(a(e,o,s));return t(e,n,f,s)},isSrcSubdir:u,areIdentical:c}},{"../fs":11,path:void 0,util:void 0}],27:[function(t,e,n){"use strict";const r=t("graceful-fs");e.exports={utimesMillis:function(t,e,n,i){r.open(t,"r+",((t,o)=>{if(t)return i(t);r.futimes(o,e,n,(t=>{r.close(o,(e=>{i&&i(t||e)}))}))}))},utimesMillisSync:function(t,e,n){const i=r.openSync(t,"r+");return r.futimesSync(i,e,n),r.closeSync(i)}}},{"graceful-fs":29}],28:[function(t,e,n){"use strict";e.exports=function(t){if(null===t||"object"!=typeof t)return t;if(t instanceof Object)var e={__proto__:r(t)};else e=Object.create(null);return Object.getOwnPropertyNames(t).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))})),e};var r=Object.getPrototypeOf||function(t){return t.__proto__}},{}],29:[function(t,e,n){var r,i,o=t("fs"),s=t("./polyfills.js"),c=t("./legacy-streams.js"),u=t("./clone.js"),a=t("util");function f(t,e){Object.defineProperty(t,r,{get:function(){return e}})}"function"==typeof Symbol&&"function"==typeof Symbol.for?(r=Symbol.for("graceful-fs.queue"),i=Symbol.for("graceful-fs.previous")):(r="___graceful-fs.queue",i="___graceful-fs.previous");var l,y=function(){};if(a.debuglog?y=a.debuglog("gfs4"):/\bgfs4\b/i.test(process.env.NODE_DEBUG||"")&&(y=function(){var t=a.format.apply(a,arguments);t="GFS4: "+t.split(/\n/).join("\nGFS4: "),console.error(t)}),!o[r]){var p=global[r]||[];f(o,p),o.close=function(t){function e(e,n){return t.call(o,e,(function(t){t||h(),"function"==typeof n&&n.apply(this,arguments)}))}return Object.defineProperty(e,i,{value:t}),e}(o.close),o.closeSync=function(t){function e(e){t.apply(o,arguments),h()}return Object.defineProperty(e,i,{value:t}),e}(o.closeSync),/\bgfs4\b/i.test(process.env.NODE_DEBUG||"")&&process.on("exit",(function(){y(o[r]),t("assert").equal(o[r].length,0)}))}function d(t){s(t),t.gracefulify=d,t.createReadStream=function(e,n){return new t.ReadStream(e,n)},t.createWriteStream=function(e,n){return new t.WriteStream(e,n)};var e=t.readFile;t.readFile=function(t,n,r){"function"==typeof n&&(r=n,n=null);return function t(n,r,i,o){return e(n,r,(function(e){!e||"EMFILE"!==e.code&&"ENFILE"!==e.code?"function"==typeof i&&i.apply(this,arguments):m([t,[n,r,i],e,o||Date.now(),Date.now()])}))}(t,n,r)};var n=t.writeFile;t.writeFile=function(t,e,r,i){"function"==typeof r&&(i=r,r=null);return function t(e,r,i,o,s){return n(e,r,i,(function(n){!n||"EMFILE"!==n.code&&"ENFILE"!==n.code?"function"==typeof o&&o.apply(this,arguments):m([t,[e,r,i,o],n,s||Date.now(),Date.now()])}))}(t,e,r,i)};var r=t.appendFile;r&&(t.appendFile=function(t,e,n,i){"function"==typeof n&&(i=n,n=null);return function t(e,n,i,o,s){return r(e,n,i,(function(r){!r||"EMFILE"!==r.code&&"ENFILE"!==r.code?"function"==typeof o&&o.apply(this,arguments):m([t,[e,n,i,o],r,s||Date.now(),Date.now()])}))}(t,e,n,i)});var i=t.copyFile;i&&(t.copyFile=function(t,e,n,r){"function"==typeof n&&(r=n,n=0);return function t(e,n,r,o,s){return i(e,n,r,(function(i){!i||"EMFILE"!==i.code&&"ENFILE"!==i.code?"function"==typeof o&&o.apply(this,arguments):m([t,[e,n,r,o],i,s||Date.now(),Date.now()])}))}(t,e,n,r)});var o=t.readdir;t.readdir=function(t,e,n){"function"==typeof e&&(n=e,e=null);var r=u.test(process.version)?function(t,e,n,r){return o(t,i(t,e,n,r))}:function(t,e,n,r){return o(t,e,i(t,e,n,r))};return r(t,e,n);function i(t,e,n,i){return function(o,s){!o||"EMFILE"!==o.code&&"ENFILE"!==o.code?(s&&s.sort&&s.sort(),"function"==typeof n&&n.call(this,o,s)):m([r,[t,e,n],o,i||Date.now(),Date.now()])}}};var u=/^v[0-5]\./;if("v0.8"===process.version.substr(0,4)){var a=c(t);h=a.ReadStream,S=a.WriteStream}var f=t.ReadStream;f&&(h.prototype=Object.create(f.prototype),h.prototype.open=function(){var t=this;w(t.path,t.flags,t.mode,(function(e,n){e?(t.autoClose&&t.destroy(),t.emit("error",e)):(t.fd=n,t.emit("open",n),t.read())}))});var l=t.WriteStream;l&&(S.prototype=Object.create(l.prototype),S.prototype.open=function(){var t=this;w(t.path,t.flags,t.mode,(function(e,n){e?(t.destroy(),t.emit("error",e)):(t.fd=n,t.emit("open",n))}))}),Object.defineProperty(t,"ReadStream",{get:function(){return h},set:function(t){h=t},enumerable:!0,configurable:!0}),Object.defineProperty(t,"WriteStream",{get:function(){return S},set:function(t){S=t},enumerable:!0,configurable:!0});var y=h;Object.defineProperty(t,"FileReadStream",{get:function(){return y},set:function(t){y=t},enumerable:!0,configurable:!0});var p=S;function h(t,e){return this instanceof h?(f.apply(this,arguments),this):h.apply(Object.create(h.prototype),arguments)}function S(t,e){return this instanceof S?(l.apply(this,arguments),this):S.apply(Object.create(S.prototype),arguments)}Object.defineProperty(t,"FileWriteStream",{get:function(){return p},set:function(t){p=t},enumerable:!0,configurable:!0});var v=t.open;function w(t,e,n,r){return"function"==typeof n&&(r=n,n=null),function t(e,n,r,i,o){return v(e,n,r,(function(s,c){!s||"EMFILE"!==s.code&&"ENFILE"!==s.code?"function"==typeof i&&i.apply(this,arguments):m([t,[e,n,r,i],s,o||Date.now(),Date.now()])}))}(t,e,n,r)}return t.open=w,t}function m(t){y("ENQUEUE",t[0].name,t[1]),o[r].push(t),S()}function h(){for(var t=Date.now(),e=0;e<o[r].length;++e)o[r][e].length>2&&(o[r][e][3]=t,o[r][e][4]=t);S()}function S(){if(clearTimeout(l),l=void 0,0!==o[r].length){var t=o[r].shift(),e=t[0],n=t[1],i=t[2],s=t[3],c=t[4];if(void 0===s)y("RETRY",e.name,n),e.apply(null,n);else if(Date.now()-s>=6e4){y("TIMEOUT",e.name,n);var u=n.pop();"function"==typeof u&&u.call(null,i)}else{var a=Date.now()-c,f=Math.max(c-s,1);a>=Math.min(1.2*f,100)?(y("RETRY",e.name,n),e.apply(null,n.concat([s]))):o[r].push(t)}void 0===l&&(l=setTimeout(S,0))}}global[r]||f(global,o[r]),e.exports=d(u(o)),process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH&&!o.__patched&&(e.exports=d(o),o.__patched=!0)},{"./clone.js":28,"./legacy-streams.js":30,"./polyfills.js":31,assert:void 0,fs:void 0,util:void 0}],30:[function(t,e,n){var r=t("stream").Stream;e.exports=function(t){return{ReadStream:function e(n,i){if(!(this instanceof e))return new e(n,i);r.call(this);var o=this;this.path=n,this.fd=null,this.readable=!0,this.paused=!1,this.flags="r",this.mode=438,this.bufferSize=65536,i=i||{};for(var s=Object.keys(i),c=0,u=s.length;c<u;c++){var a=s[c];this[a]=i[a]}this.encoding&&this.setEncoding(this.encoding);if(void 0!==this.start){if("number"!=typeof this.start)throw TypeError("start must be a Number");if(void 0===this.end)this.end=1/0;else if("number"!=typeof this.end)throw TypeError("end must be a Number");if(this.start>this.end)throw new Error("start must be <= end");this.pos=this.start}if(null!==this.fd)return void process.nextTick((function(){o._read()}));t.open(this.path,this.flags,this.mode,(function(t,e){if(t)return o.emit("error",t),void(o.readable=!1);o.fd=e,o.emit("open",e),o._read()}))},WriteStream:function e(n,i){if(!(this instanceof e))return new e(n,i);r.call(this),this.path=n,this.fd=null,this.writable=!0,this.flags="w",this.encoding="binary",this.mode=438,this.bytesWritten=0,i=i||{};for(var o=Object.keys(i),s=0,c=o.length;s<c;s++){var u=o[s];this[u]=i[u]}if(void 0!==this.start){if("number"!=typeof this.start)throw TypeError("start must be a Number");if(this.start<0)throw new Error("start must be >= zero");this.pos=this.start}this.busy=!1,this._queue=[],null===this.fd&&(this._open=t.open,this._queue.push([this._open,this.path,this.flags,this.mode,void 0]),this.flush())}}}},{stream:void 0}],31:[function(t,e,n){var r=t("constants"),i=process.cwd,o=null,s=process.env.GRACEFUL_FS_PLATFORM||process.platform;process.cwd=function(){return o||(o=i.call(process)),o};try{process.cwd()}catch(t){}if("function"==typeof process.chdir){var c=process.chdir;process.chdir=function(t){o=null,c.call(process,t)},Object.setPrototypeOf&&Object.setPrototypeOf(process.chdir,c)}e.exports=function(t){r.hasOwnProperty("O_SYMLINK")&&process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)&&function(t){t.lchmod=function(e,n,i){t.open(e,r.O_WRONLY|r.O_SYMLINK,n,(function(e,r){e?i&&i(e):t.fchmod(r,n,(function(e){t.close(r,(function(t){i&&i(e||t)}))}))}))},t.lchmodSync=function(e,n){var i,o=t.openSync(e,r.O_WRONLY|r.O_SYMLINK,n),s=!0;try{i=t.fchmodSync(o,n),s=!1}finally{if(s)try{t.closeSync(o)}catch(t){}else t.closeSync(o)}return i}}(t);t.lutimes||function(t){r.hasOwnProperty("O_SYMLINK")&&t.futimes?(t.lutimes=function(e,n,i,o){t.open(e,r.O_SYMLINK,(function(e,r){e?o&&o(e):t.futimes(r,n,i,(function(e){t.close(r,(function(t){o&&o(e||t)}))}))}))},t.lutimesSync=function(e,n,i){var o,s=t.openSync(e,r.O_SYMLINK),c=!0;try{o=t.futimesSync(s,n,i),c=!1}finally{if(c)try{t.closeSync(s)}catch(t){}else t.closeSync(s)}return o}):t.futimes&&(t.lutimes=function(t,e,n,r){r&&process.nextTick(r)},t.lutimesSync=function(){})}(t);t.chown=i(t.chown),t.fchown=i(t.fchown),t.lchown=i(t.lchown),t.chmod=e(t.chmod),t.fchmod=e(t.fchmod),t.lchmod=e(t.lchmod),t.chownSync=o(t.chownSync),t.fchownSync=o(t.fchownSync),t.lchownSync=o(t.lchownSync),t.chmodSync=n(t.chmodSync),t.fchmodSync=n(t.fchmodSync),t.lchmodSync=n(t.lchmodSync),t.stat=c(t.stat),t.fstat=c(t.fstat),t.lstat=c(t.lstat),t.statSync=u(t.statSync),t.fstatSync=u(t.fstatSync),t.lstatSync=u(t.lstatSync),t.chmod&&!t.lchmod&&(t.lchmod=function(t,e,n){n&&process.nextTick(n)},t.lchmodSync=function(){});t.chown&&!t.lchown&&(t.lchown=function(t,e,n,r){r&&process.nextTick(r)},t.lchownSync=function(){});"win32"===s&&(t.rename="function"!=typeof t.rename?t.rename:function(e){function n(n,r,i){var o=Date.now(),s=0;e(n,r,(function c(u){if(u&&("EACCES"===u.code||"EPERM"===u.code||"EBUSY"===u.code)&&Date.now()-o<6e4)return setTimeout((function(){t.stat(r,(function(t,o){t&&"ENOENT"===t.code?e(n,r,c):i(u)}))}),s),void(s<100&&(s+=10));i&&i(u)}))}return Object.setPrototypeOf&&Object.setPrototypeOf(n,e),n}(t.rename));function e(e){return e?function(n,r,i){return e.call(t,n,r,(function(t){a(t)&&(t=null),i&&i.apply(this,arguments)}))}:e}function n(e){return e?function(n,r){try{return e.call(t,n,r)}catch(t){if(!a(t))throw t}}:e}function i(e){return e?function(n,r,i,o){return e.call(t,n,r,i,(function(t){a(t)&&(t=null),o&&o.apply(this,arguments)}))}:e}function o(e){return e?function(n,r,i){try{return e.call(t,n,r,i)}catch(t){if(!a(t))throw t}}:e}function c(e){return e?function(n,r,i){function o(t,e){e&&(e.uid<0&&(e.uid+=4294967296),e.gid<0&&(e.gid+=4294967296)),i&&i.apply(this,arguments)}return"function"==typeof r&&(i=r,r=null),r?e.call(t,n,r,o):e.call(t,n,o)}:e}function u(e){return e?function(n,r){var i=r?e.call(t,n,r):e.call(t,n);return i&&(i.uid<0&&(i.uid+=4294967296),i.gid<0&&(i.gid+=4294967296)),i}:e}function a(t){return!t||("ENOSYS"===t.code||!(process.getuid&&0===process.getuid()||"EINVAL"!==t.code&&"EPERM"!==t.code))}t.read="function"!=typeof t.read?t.read:function(e){function n(n,r,i,o,s,c){var u;if(c&&"function"==typeof c){var a=0;u=function(f,l,y){if(f&&"EAGAIN"===f.code&&a<10)return a++,e.call(t,n,r,i,o,s,u);c.apply(this,arguments)}}return e.call(t,n,r,i,o,s,u)}return Object.setPrototypeOf&&Object.setPrototypeOf(n,e),n}(t.read),t.readSync="function"!=typeof t.readSync?t.readSync:(f=t.readSync,function(e,n,r,i,o){for(var s=0;;)try{return f.call(t,e,n,r,i,o)}catch(t){if("EAGAIN"===t.code&&s<10){s++;continue}throw t}});var f}},{constants:void 0}],32:[function(t,e,n){let r;try{r=t("graceful-fs")}catch(e){r=t("fs")}const i=t("universalify"),{stringify:o,stripBom:s}=t("./utils");const c={readFile:i.fromPromise((async function(t,e={}){"string"==typeof e&&(e={encoding:e});const n=e.fs||r,o=!("throws"in e)||e.throws;let c,u=await i.fromCallback(n.readFile)(t,e);u=s(u);try{c=JSON.parse(u,e?e.reviver:null)}catch(e){if(o)throw e.message=`${t}: ${e.message}`,e;return null}return c})),readFileSync:function(t,e={}){"string"==typeof e&&(e={encoding:e});const n=e.fs||r,i=!("throws"in e)||e.throws;try{let r=n.readFileSync(t,e);return r=s(r),JSON.parse(r,e.reviver)}catch(e){if(i)throw e.message=`${t}: ${e.message}`,e;return null}},writeFile:i.fromPromise((async function(t,e,n={}){const s=n.fs||r,c=o(e,n);await i.fromCallback(s.writeFile)(t,c,n)})),writeFileSync:function(t,e,n={}){const i=n.fs||r,s=o(e,n);return i.writeFileSync(t,s,n)}};e.exports=c},{"./utils":33,fs:void 0,"graceful-fs":29,universalify:34}],33:[function(t,e,n){e.exports={stringify:function(t,{EOL:e="\n",finalEOL:n=!0,replacer:r=null,spaces:i}={}){const o=n?e:"";return JSON.stringify(t,r,i).replace(/\n/g,e)+o},stripBom:function(t){return Buffer.isBuffer(t)&&(t=t.toString("utf8")),t.replace(/^\uFEFF/,"")}}},{}],34:[function(t,e,n){"use strict";n.fromCallback=function(t){return Object.defineProperty((function(...e){if("function"!=typeof e[e.length-1])return new Promise(((n,r)=>{t.call(this,...e,((t,e)=>null!=t?r(t):n(e)))}));t.apply(this,e)}),"name",{value:t.name})},n.fromPromise=function(t){return Object.defineProperty((function(...e){const n=e[e.length-1];if("function"!=typeof n)return t.apply(this,e);t.apply(this,e.slice(0,-1)).then((t=>n(null,t)),n)}),"name",{value:t.name})}},{}]},{},[12])(12)}));