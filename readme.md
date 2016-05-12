# hyperdrive-prefix

prefix a hyperdrive archive with a path

# example

``` js
var hyperdrive = require('hyperdrive')
var memdb = require('memdb')
var collect = require('collect-stream')
var prefix = require('../')

var drive = hyperdrive(memdb())
var archive = drive.createArchive()

var dir1 = prefix('dir1', archive)
dir1.createFileWriteStream('hello.txt').end('BEEP BOOP\n')
dir1.createFileWriteStream('whatever.txt').end('hey\n')

var dir2 = prefix('dir2', archive)
dir2.createFileWriteStream('hello.txt').end('EHLO WORLD\n')

archive.finalize(function () {
  collect(dir1.list(), function (err, files) {
    show('DIR1/', files)
  })
  collect(dir2.list(), function (err, files) {
    show('DIR2/', files)
  })
  collect(archive.list(), function (err, files) {
    show('LIST', files)
  })
  function show (msg, files) {
    console.log(msg)
    files.forEach(function (file) { console.log('  ' + file.name) })
  }
})
```

prints:

```
LIST
  dir1/hello.txt
  dir1/whatever.txt
  dir2/hello.txt
DIR1/
  hello.txt
  whatever.txt
DIR2/
  hello.txt
```

# api

```
var prefix = require('hyperdrive-prefix')
```

## var subarchive = prefix(str)
## var subarchive = prefix(str, archive)

Create a `subarchive` of `archive` where paths are transparently prefixed with a
string `str` for writing and the prefix is transparently removed when listing
files.

The `subarchive` has many of the same methods as `archive` except for
`subarchive.finalize()` which you should perform on the `archive` instance
directly.

* `subarchive.append(entry, cb)`
* `subarchive.get(index, cb)`
* `subarchive.download(index, cb)`
* `subarchive.list()`
* `subarchive.createFileReadStream(entry)`
* `subarchive.createFileWriteStream(entry)`

`archive` is optional. You can set it later with
`subarchive.setArchive(archive)`.

## subarchive.setArchive(archive)

Set the underlying `archive` if one wasn't set up initially.

# install

```
npm install hyperdrive-prefix
```

# license

BSD
