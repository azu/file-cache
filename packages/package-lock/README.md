# @file-cache/package-lock

Create cache key that is based on lock file like `package-lock.json`.

## Supported Lock Files

- `package-lock.json`
- `yarn.lock`
- `pnpm-lock.yaml`
- `bun.lockb`

## Installation

    npm install @file-cache/package-lock

## Usage

```js
import { createPackageLockCacheKey } from '@file-cache/npm';
createPackageLockCacheKey(); // "package-lock.json-<hash>" 
```

## Tests

    npm test

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
