var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var through = require('through2')
var quotemeta = require('quotemeta')
var duplexify = require('duplexify')
var path = require('path')
var once = require('once')
var collect = require('collect-stream')

inherits(Wrap, EventEmitter)
module.exports = Wrap

function Wrap (prefix, archive) {
  var self = this
  if (!(self instanceof Wrap)) return new Wrap(prefix, archive)
  EventEmitter.call(self)
  self._prefix = prefix.replace(/\/+$/, '')
  self._re = RegExp('^' + quotemeta(self._prefix) + '/')

  if (archive) setArchive(archive)
  else self.once('_archive', setArchive)

  function setArchive (archive) {
    self._archive = archive
    self.key = archive.key + '/' + self._prefix
  }
}

Wrap.prototype.setArchive = function (archive) {
  this._archive = archive
  this.emit('_archive', archive)
}

Wrap.prototype._getArchive = function (fn) {
  if (this._archive) fn(this._archive)
  else this.once('_archive', fn)
}

Wrap.prototype._add = function (entry) {
  if (typeof entry === 'string') {
    entry = path.normalize(this._prefix + '/' + entry)
  } else if (entry.name) {
    entry.name = path.normalize(this._prefix + '/' + entry.name)
  }
  return entry
}

Wrap.prototype._remove = function (entry) {
  if (typeof entry === 'string') {
    entry = path.normalize(entry.replace(this._re, ''))
  } else if (entry.name) {
    entry.name = path.normalize(entry.name).replace(this._re, '')
  }
  return entry
}

Wrap.prototype.append = function (entry, cb) {
  var self = this
  this._getArchive(function (archive) {
    archive.append(self._add(entry), cb)
  })
}

Wrap.prototype.get = function (index, cb) {
  this._getArchive(function (archive) {
    archive.get(index, cb)
  })
}

Wrap.prototype.download = function (index, cb) {
  this._getArchive(function (archive) {
    archive.download(index, cb)
  })
}

Wrap.prototype.list = function (opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  var self = this
  var d = duplexify.obj()
  if (cb) {
    cb = once(cb)
    collect(d, cb)
  }
  var prefix = self._prefix
  var stream = through.obj(write)
  d.setReadable(stream)
  self._getArchive(function (archive) {
    var r = archive.list()
    r.on('error', d.emit.bind(d, 'error'))
    r.pipe(stream)
  })
  return d

  function write (entry, enc, next) {
    if (entry.name.split('/')[0] === prefix) {
      this.push(self._remove(entry))
    }
    next()
  }
}

Wrap.prototype.createFileReadStream = function (entry) {
  var self = this
  var d = duplexify()
  self._getArchive(function (archive) {
    d.setReadable(archive.createFileReadStream(self._add(entry)))
  })
  return d
}

Wrap.prototype.createFileWriteStream = function (entry) {
  var self = this
  var d = duplexify()
  self._getArchive(function (archive) {
    d.setWritable(archive.createFileWriteStream(self._add(entry)))
  })
  return d
}

function noop () {}
