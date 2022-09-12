# ready-resource-map

Manage collections of ready-resources keyed by IDs, ensuring that the same resource is never concurrently opened more than once.

## Usage
```js
const ReadyResourceMap = require('ready-resource-map')

const m = new ReadyResourceMap()

// r1 === r2
const [r1, r2] = await Promise.all([
  m.open('my-id', create),
  m.open('my-id', create)
])

m.close('my-id')
// Will wait for the above close to resolve before overwriting 'my-id'
const r3 = await m.open('my-id', create)

function create () {
  // MyResource extends ReadyResource
  return new MyResource()
}
```

## License
MIT
