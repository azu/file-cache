import path from "node:path";
import { createFileCache } from "./createFileCache.js";
import { md5 } from "./md5.js";
import fs from "node:fs/promises";

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
     * The key of cache file
     */
    key: string;
    /**
     * Custom cache directory.
     * Default: node_modules/.cache/<pkg-name>
     */
    cacheDirectory?: string;
};
/**
 * Delete cache file
 * Note: It does not clear in-memory cache in the cache.
 * @param options
 */
export const deleteCacheFile = async (options: CreateCacheOptions) => {
    const { packageDirectory } = await import("pkg-dir");
    const pkgDir = await packageDirectory();
    const pkgName = await getPackageName(pkgDir);
    const cacheDir = options.cacheDirectory
        ? options.cacheDirectory
        : path.join(pkgDir, "node_modules/.cache", pkgName);
    const cacheFile = path.join(cacheDir, options.key);
    try {
        await fs.unlink(cacheFile);
        return true;
    } catch {
        return false;
    }
};

const getPackageName = async (pkgPath: string) => {
    const pkgFile = path.join(pkgPath, "package.json");
    try {
        const pkg = await fs.readFile(pkgFile, "utf8");
        const pkgJson = JSON.parse(pkg);
        return pkgJson.name;
    } catch {
        return "file-cache";
    }
};

/**
 * Create cache instance
 * @param options
 */
export const createCache = async (options: CreateCacheOptions) => {
    const { packageDirectory } = await import("pkg-dir");
    const pkgDir = await packageDirectory();
    const pkgName = await getPackageName(pkgDir);
    const cacheDir = options.cacheDirectory
        ? options.cacheDirectory
        : path.join(pkgDir, "node_modules/.cache", pkgName);
    await fs.mkdir(cacheDir, { recursive: true });
    const cacheFile = path.join(cacheDir, options.key);
    const cache = await createFileCache(cacheFile, options.mode);
    return {
        /**
         * Experimental method
         * @param cb
         */
        async try(cb: () => Promise<void>) {
            await cb();
            await this.reconcile();
        },
        /**
         * Get cache status and update the cache value
         * You need to confirm the status via call `reconcile()` after that
         * @param filePath
         */
        async getAndUpdateCache(filePath: string | URL) {
            const descriptor = await cache.getFileDescriptor(filePath);
            return {
                error: descriptor.error,
                changed: descriptor.changed
            } as const;
        },
        /**
         * Delete cache value for the key
         * @param filePath
         */
        async delete(filePath: string) {
            return cache.delete(filePath);
        },
        /**
         * Clear cache values
         */
        async clear() {
            return cache.clear();
        },
        /**
         * Confirm the changes
         */
        async reconcile() {
            return cache.reconcile();
        }
    };
};
export type CreateCacheKeyGenerator = () => string;
export const createCacheKey = (generators: CreateCacheKeyGenerator[]) => {
    if (generators.length === 0) {
        throw new Error("generators must be provided");
    }
    let key = "";
    for (const generator of generators) {
        const generatedKey = generator();
        if (generatedKey === "") {
            throw new Error("generator must return a non-empty string");
        }
        key += `__${generatedKey}`;
    }
    return md5(key);
};
