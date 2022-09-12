const test = require('brittle')
const ReadyResource = require('ready-resource')

const ResourceMap = require('..')

class OpenErrorResource extends ReadyResource {
  async _open () {
    throw new Error('Open Error')
  }
}
class CloseErrorResource extends ReadyResource {
  async _close () {
    throw new Error('Close Error')
  }
}

test('simple open and close', async t => {
  const m = new ResourceMap()
  const r1 = await m.open('a', create)
  const r2 = await m.open('b', create)
  await m.close('a')
  t.is(r1.closed, true)
  t.is(r2.closed, false)
  t.is(m.m.size, 1)
})

test('closing non-existing resource', async t => {
  const m = new ResourceMap()
  await m.close('bad-id')
  t.is(m.m.size, 0)
})

test('open twice after fully opened', async t => {
  const m = new ResourceMap()
  const r1 = await m.open('a', create)
  const r2 = await m.open('a', create)
  t.ok(r1 === r2)
})

test('concurrently opening a resource twice', async t => {
  const m = new ResourceMap()
  const [r1, r2] = await Promise.all([
    m.open('a', create),
    m.open('a', create)
  ])
  t.ok(r1 === r2)
})

test('concurrently closing a resource three times', async t => {
  const m = new ResourceMap()
  const [r1, r2] = await Promise.all([
    m.open('a', create),
    m.open('a', create)
  ])
  await Promise.all([
    m.close('a'),
    m.close('a'),
    m.close('a')
  ])
  t.ok(r1.closed)
  t.ok(r2.closed)
  t.is(m.m.size, 0)
  t.is(m._refs.size, 0)
  t.is(m._opening.size, 0)
  t.is(m._closing.size, 0)
})

test('open then concurrent close/open', async t => {
  const m = new ResourceMap()
  const r1 = await m.open('a', create)
  await Promise.all([
    m.close('a'),
    m.open('a', create)
  ])
  t.is(m.m.size, 1)
  t.ok(m.m.get('a') !== r1)
})

test('open/close errors garbage collect', async t => {
  const m = new ResourceMap()
  await t.exception(() => m.open('a', () => new OpenErrorResource()))
  await m.open('b', () => new CloseErrorResource())
  t.is(m.m.size, 1)
  await t.exception(() => m.close('b'))
  t.is(m.m.size, 0)
  t.is(m._refs.size, 0)
  t.is(m._opening.size, 0)
  t.is(m._closing.size, 0)
})

function create () {
  return new ReadyResource()
}
