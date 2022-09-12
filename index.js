const mutex = require('mutexify/promise')

module.exports = class ReadyResourceMap {
  constructor () {
    this.m = new Map()
    this._lock = mutex()
  }

  async open (id, cons) {
    const release = await this._lock()
    try {
      const e = this.m.get(id)
      if (e) return e
      const o = await cons()
      await o.ready()
      this.m.set(id, o)
      return o
    } finally {
      release()
    }
  }

  async close (id) {
    const release = await this._lock()
    try {
      const e = this.m.get(id)
      await e.close()
      this.m.delete(id)
    } finally {
      release()
    }
  }

  async get (id) {
    const release = await this._lock()
    try {
      return this.m.get(id)
    } finally {
      release()
    }
  }
}
