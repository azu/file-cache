# @file-cache/core

## Installation

```
npm install @file-cache/core
```

## Usage

```js
import { createCache } from '@file-cache/core';

const cache = await createCache({
    key: "test",
    mode: "metadata"
});
const filePath = path.resolve(__dirname, "./fixtures/f1.txt");
const result = await cache.getAndUpdateCache(filePath);
assert.deepStrictEqual(result, {
    changed: true,
    error: undefined
});
// write the updates to cache file
await cache.reconcile();
// re-get the file status
const result2 = await cache.getAndUpdateCache(filePath);
assert.deepStrictEqual(result2, {
    changed: false,
    error: undefined
});
```

## Tests

```
npm test
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
