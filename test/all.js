const test = require('brittle')
const ReadyResource = require('ready-resource')

const ResourceMap = require('..')

test('simple open and close', async t => {
  const m = new ResourceMap()
  const r1 = await m.open('a', create)
  const r2 = await m.open('b', create)
  await m.close('a')
  t.is(r1.closed, true)
  t.is(r2.closed, false)
  t.is(m.m.size, 1)
})

test('concurrently opening a resource twice', async t => {
  const m = new ResourceMap()
  const [r1, r2] = await Promise.all([
    m.open('a', create),
    m.open('a', create)
  ])
  t.ok(r1 === r2)
})

test('open then concurrent close/open', async t => {
  const m = new ResourceMap()
  const r1 = await m.open('a', create)
  await Promise.all([
    m.close('a'),
    m.open('a', create)
  ])
  t.is(m.m.size, 1)
  t.ok(await m.get('a') !== r1)
})

function create () {
  return new ReadyResource()
}
