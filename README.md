# @file-cache

Transform Cache for JavaScript.

## When to update the cache

- When the source code changes.
- When the dependencies change.
- When the configuration changes.
- When the cache is cleared.

## Cache Mechanism

- When A cache key is updated, all file cache should be updated
- Cache file structure

```
|- .<cache-dorectory>
  |- <hash-of-cache-key>
```

```markdown
{
  "file-path": <result>
}
```

## Usage

```js
import { creatCache, createCacheKey } from "@file-cache/core";
import { cacheKeyPackageJson, cacheKeyDependency } from "@file-cache/npm"

const config = {
    /*...*/
}
const cache = createCache({
    mode: "content",
    cacheDirectory: ".cache/my-tool", // node_modules/.cache/myTool by default 
    // create key for cache
    key: createCacheKey([
        // use dependency(version) as cache key
        cacheKeyDependencies(["prettier"]),
        // use custom key
        () => {
            return JSON.stringify(config);
        }
    ])
});

const result = await cache.get("file.js");
if (result) {
    return result
}
const transformed = await transform("file.js");
await cache.set("file.js", transformed);
```
