# @file-cache/core

A cache for file metadata or file content.

## Installation

```
npm install @file-cache/core
```

## Usage

```js
import { createCache } from '@file-cache/core';
// use metadata starategy to detect changes
const cache = await createCache({
    keys: [
        () => "test",
        () => "custom"
    ],
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

### Options

```ts
export type CreateCacheOptions = {
    /**
     * - content: Using the hash value of file content
     *   - Slow but accurate
     * - metadata: Using the metadata of file
     *   - Fast but not accurate
     *   - It can not used in CI env
     */
    mode: "content" | "metadata";
    /**
     * The key generators for cache file
     */
    keys: CreateCacheKeyGenerator[];
    /**
     * Custom cache directory.
     * Default: node_modules/.cache/<pkg-name>
     */
    cacheDirectory?: string;
};
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
