# @file-cache

A cache for file metadata or file content.

It is useful for process that work o a given series of files and that only need to repeat the job on the changed ones
since the previous run of the process.

## When to update the cache

- When the source code changes.
- When the source code metadata changes.
- When the dependencies change.
- When the configuration changes.

## Installation

```
npm install @file-cache/core @file-cache/npm
```

## Usage

Do heavy tasks for changed files.

```js
import { createCache, createCacheKey } from "@file-cache/core";
import { createNpmPackageKey } from "@file-cache/npm"

const prettierConfig = {/* ... */ };
const cache = awaitcreateCache({
    // Use hash value of the content for detecting changes 
    mode: "content", // or "metadata"
    // create key for cache
    key: createCacheKey([
        // use dependency(version) as cache key
        () => createNpmPackageKey(["prettier"]),
        // use custom key
        () => {
            return JSON.stringify(prettierConfig);
        }
    ])
});

const targetFiles = ["a.js", "b.js", "c.js"];
const doHeavyTask = (filePath) => {
    // do heavy task
}
for (const targetFile of targetFiles) {
    const result = await cache.getAndUpdateCache(targetFile);
    if (result.error) {
        throw result.error
    }
    if (!result.changed) {
        continue; // no need to update
    }
    doHeavyTask(targetFile);
}
// write cache state to file for persistence
await cache.reconcile();
```

**Examples:**

- https://github.com/azu/file-cache-demo

**Options:**

See [package/core](packages/core) documentation.

## Cache Mechanism

Cache file directory:

:memo: You can change the directory by `cacheDirectory` option.

```
|- node_modules
  |- .cache
    |- <pkg-name>
      |- <hash-of-cache-key>-<mode>
```

Cache file structure:

```markdown
{
"file-path": <result>
}
```

This library does not clean up previous cache files.
When the `<hash-of-cache-key>` is changed, the previous cache file will not be deleted automatically.

## Release flow

   npm run version:* && npm run release

## Related

- [royriojas/file-entry-cache](https://github.com/royriojas/file-entry-cache)
    - Inspired by this project

## License

MIT
