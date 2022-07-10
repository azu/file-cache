import path from "node:path";
import { createFileCache } from "./createFileCache.js";

export type CreateCacheOptions = {
    mode: "content" | "metadata";
    name: string;
    key: string;
};
export const resetCache = async (options: CreateCacheOptions) => {
    const { packageDirectory } = await import("pkg-dir");
    const pkgDir = await packageDirectory();
    const cacheDir = path.join(pkgDir, "node_modules/.cache", options.name);
    const cacheFile = path.join(cacheDir, options.key);
    const cache = await createFileCache(cacheFile, options.mode);
    await cache.clear();
};

export const createCache = async (options: CreateCacheOptions) => {
    const { packageDirectory } = await import("pkg-dir");
    const pkgDir = await packageDirectory();
    const cacheDir = path.join(pkgDir, "node_modules/.cache", options.name);
    const cacheFile = path.join(cacheDir, options.key);
    const cache = await createFileCache(cacheFile, options.mode);
    return {
        async try(cb: () => Promise<void>) {
            await cb();
            await this.reconcile();
        },
        async getAndUpdateCache(filePath: string) {
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
    return key;
};
