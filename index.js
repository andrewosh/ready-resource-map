const BufferMap = require('tiny-buffer-map')

module.exports = class ReadyResourceMap {
  constructor () {
    this.m = new BufferMap()
    this._refs = new BufferMap()
  }

  _onClose (id) {
    this.m.delete(id)
    this._refs.delete(id)
  }

  // Async API

  async open (id, cons) {
    let existing = this.m.get(id)
    while (existing && existing.closing) {
      try {
        await existing.closing
      } catch {
        continue
      }
      existing = this.m.get(id)
    }

    const count = this._refs.get(id) || 0
    this._refs.set(id, count + 1)

    if (existing) {
      if (!existing.opened) await existing.ready()
      return existing
    }

    const res = cons()
    this.m.set(id, res)

    try {
      await res.ready()
    } catch (err) {
      this._onClose(id)
      throw err
    }

    res.once('close', () => this._onClose(id))
    return res
  }

  async close (id) {
    const count = this._refs.get(id) || 0
    if (count > 1) {
      this._refs.set(id, count - 1)
      return null
    } else if (count === 1) {
      try {
        await this.m.get(id).close()
      } catch (err) {
        this._onClose(id)
        throw err
      }
    }
    return null
  }

  // Sync API

  has (id) {
    return this.m.has(id)
  }

  get (id) {
    return this.m.get(id)
  }

  [Symbol.iterator] () {
    return this.m[Symbol.iterator]()
  }

  * keys () {
    for (const key of this.m.keys()) {
      yield key
    }
  }

  * values () {
    for (const value of this.m.values()) {
      yield value
    }
  }
}
