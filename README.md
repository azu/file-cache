# @file-cache

A cache library for file metadata or file content.

It is useful for process that work a given series of files and that only need to repeat the job on the changed ones
since the previous run of the process.

## When to update the cache

- When the source code changes.
- When the source code metadata changes.
- When the dependencies change.
- When the configuration changes.

`@file-cache` package help you to implement `--cache` for your tools.

## Installation

```
npm install @file-cache/core @file-cache/npm
```

## Usage

Do heavy tasks for only changed files.

```js
import { createCache } from "@file-cache/core";
import { createNpmPackageKey } from "@file-cache/npm"

const prettierConfig = {/* ... */ };
const cache = await createCache({
    // Use hash value of the content for detecting changes 
    mode: "content", // or "metadata"
    // create key for cache
    keys: [
        // use dependency(version) as cache key
        () => createNpmPackageKey(["prettier"]),
        // use custom key
        () => {
            return JSON.stringify(prettierConfig);
        }
    ],
    noCache: process.env.NO_CACHE_YOUR_TOOL === "true" // disable cache by the flag
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

## Advanced Usage

If your tool has a plugin system, you can use `@file-cache/package-lock` for caching plugin's dependencies.

```
npm install @file-cache/core @file-cache/npm @file-cache/package-lock
```

```js
import { createCache } from "@file-cache/core";
import { createNpmPackageKey } from "@file-cache/npm"
import { createPackageLockKey } from "@file-cache/package-lock"

const yourConfig = {/* ... */ };
const cache = await createCache({
    // Use hash value of the content for detecting changes 
    mode: "content", // or "metadata"
    // create key for cache
    keys: [
        // use your tool version as cache key
        () => createNpmPackageKey(["your-tool"]),
        // use dependency as cache key
        () => createPackageLockKey(process.cwd()), // search process.cwd()/package-lock.json
        // use custom key
        () => {
            return JSON.stringify(yourConfig);
        }
    ],
    noCache: process.env.NO_CACHE_YOUR_TOOL === "true" // disable cache by the flag
});
```

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

## Users

- [azu/create-validator-ts: Create JSON Schema validator from TypeScript.](https://github.com/azu/create-validator-ts)

## Release flow

    npm run versionup:* && npm run release && git add . && git commit -m "update lock" && git push --tags

## Related

- [royriojas/file-entry-cache](https://github.com/royriojas/file-entry-cache)
    - Inspired by this project

## License

MIT
