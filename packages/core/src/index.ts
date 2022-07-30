import path from "node:path";
import { createFileCache } from "./createFileCache.js";
import fs from "node:fs/promises";
import { createCacheKey, CreateCacheKeyGenerator } from "./createCacheKey.js";
import { createNoCache } from "./noCache.js";

export type { CreateCacheKeyGenerator } from "./createCacheKey.js";
export type CreateCacheOptions = {
    /**
     * - content: Using the hash value of file content
     *   - Slow but accurate
     * - metadata: Using the metadata of file
     *   - Fast but not accurate
     *   - It can not be used in CI env
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

    /**
     * If true, the cache will not be used.
     * Default: false
     *
     * - getAndUpdateCache(): return { changed: true }
     * - delete(): nope. return true.
     * - clear(): nope. return true.
     * - reconcile(): nope. return true.
     */
    noCache?: boolean;
};
export type DeleteCacheOptions = Omit<CreateCacheOptions, "noCache">;
/**
 * Delete cache file
 * Note: It does not clear in-memory cache in the cache.
 * @param options
 */
export const deleteCacheFile = async (options: DeleteCacheOptions) => {
    const { packageDirectory } = await import("pkg-dir");
    const pkgDir = await packageDirectory();
    const pkgName = await getPackageName(pkgDir);
    const cacheDir = options.cacheDirectory
        ? options.cacheDirectory
        : path.join(pkgDir, "node_modules/.cache", pkgName);
    const cacheFile = path.join(cacheDir, createCacheKey(options.keys));
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
    if (options.noCache) {
        return createNoCache(); // disable cache. It is noop implemention.
    }
    const { packageDirectory } = await import("pkg-dir");
    const pkgDir = await packageDirectory();
    const pkgName = await getPackageName(pkgDir);
    const cacheDir = options.cacheDirectory
        ? options.cacheDirectory
        : path.join(pkgDir, "node_modules/.cache", pkgName);
    await fs.mkdir(cacheDir, { recursive: true });
    const cacheFile = path.join(cacheDir, createCacheKey(options.keys));
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
        async delete(filePath: string): Promise<boolean> {
            return cache.delete(filePath);
        },
        /**
         * Clear cache values
         */
        async clear(): Promise<void> {
            cache.clear();
        },
        /**
         * Confirm the changes
         */
        async reconcile(): Promise<boolean> {
            return cache.reconcile();
        }
    };
};
