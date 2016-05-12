var test = require('tape')
var hyperdrive = require('hyperdrive')
var memdb = require('memdb')
var collect = require('collect-stream')
var concat = require('concat-stream')
var prefix = require('../')

test('open', function (t) {
  t.plan(9)
  var drive = hyperdrive(memdb())
  var archive = drive.createArchive()

  var dir1 = prefix('dir1', archive)
  dir1.createFileWriteStream('hello.txt').end('BEEP BOOP\n')
  dir1.createFileWriteStream('whatever.txt').end('hey\n')

  var dir2 = prefix('dir2', archive)
  dir2.createFileWriteStream('hello.txt').end('EHLO WORLD\n')
  archive.finalize(function () {
    collect(dir1.list(), function (err, files) {
      t.error(err)
      t.deepEqual(
        files.map(fname).sort(),
        ['hello.txt','whatever.txt'].sort(),
        'dir1 files'
      )
    })
    collect(dir2.list(), function (err, files) {
      t.error(err)
      t.deepEqual(files.map(fname), ['hello.txt'], 'dir2 files')
    })
    collect(archive.list(), function (err, files) {
      t.error(err)
      t.deepEqual(
        files.map(fname).sort(),
        ['dir1/hello.txt','dir1/whatever.txt','dir2/hello.txt'].sort(),
        'all files'
      )
    })

    dir1.createFileReadStream('hello.txt').pipe(concat(function (buf) {
      t.equal(buf.toString(), 'BEEP BOOP\n')
    }))
    dir1.createFileReadStream('whatever.txt').pipe(concat(function (buf) {
      t.equal(buf.toString(), 'hey\n')
    }))
    dir2.createFileReadStream('hello.txt').pipe(concat(function (buf) {
      t.equal(buf.toString(), 'EHLO WORLD\n')
    }))
  })
})

function fname (entry) { return entry.name }
