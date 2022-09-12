module.exports = class ReadyResourceMap {
  constructor () {
    this.m = new Map()
    this._closing = new Map()
    this._opening = new Map()
    this._refs = new Map()
  }

  async _openResource (id, cons) {
    const o = await cons()
    await o.ready()
    this.m.set(id, o)
    this._opening.delete(id)
    return o
  }

  async _closeResource (id) {
    const o = this.m.get(id)
    await o.close()
    this.m.delete(id)
    this._closing.delete(id)
  }

  async open (id, cons) {
    while (this._closing.has(id)) {
      await this._closing.get(id)
    }
    const count = this._refs.get(id) || 0
    this._refs.set(id, count + 1)
    if (count > 0) {
      if (this._opening.has(id)) return this._opening.get(id)
      return this.m.get(id)
    }

    const opening = this._openResource(id, cons)
    this._opening.set(id, opening)
    return opening
  }

  async close (id) {
    const count = this._refs.get(id) || 0
    if (count === 0) return
    this._refs.set(id, count - 1)
    if (count > 1) return

    const closing = this._closeResource(id)
    this._closing.set(id, closing)
    return closing
  }
}
