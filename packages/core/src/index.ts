import path from "node:path";
import { createFileCache } from "./createFileCache.js";
import { md5 } from "./md5.js";
import fs from "node:fs/promises";

export type CreateCacheOptions = {
    mode: "content" | "metadata";
    key: string;
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
        async try(cb: () => Promise<void>) {
            await cb();
            await this.reconcile();
        },
        async getAndUpdateCache(filePath: string | URL) {
            const descriptor = await cache.getFileDescriptor(filePath);
            return {
                error: descriptor.error,
                changed: descriptor.changed
            } as const;
        },
        async delete(filePath: string) {
            return cache.delete(filePath);
        },
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
