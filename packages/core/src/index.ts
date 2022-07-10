import path from "node:path";
import * as fs from "node:fs/promises";
import { md5 } from "./md5.js";

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

type CacheContent = {
    hash: string;
};
type CacheMetaData = {
    size: number;
    mtime: number;
};
type CacheValue = CacheContent | CacheMetaData;
const readFileCache = async (cacheFilePath: string) => {
    try {
        const json = JSON.parse(await fs.readFile(cacheFilePath, "utf-8"));
        return new Map<string, CacheValue>(Object.entries(json));
    } catch {
        return new Map<string, CacheValue>();
    }
};

const createFileCache = async (cacheFilePath: string, mode: "content" | "metadata") => {
    let cacheMap = await readFileCache(cacheFilePath + mode);
    const entryMap = new Map<string, CacheValue>(cacheMap);
    const getAndUpdateCacheContent = async (filePath: string) => {
        try {
            const hash = md5(await fs.readFile(filePath));
            const cacheValue = cacheMap.get(filePath) as CacheContent | undefined;
            if (cacheValue && cacheValue.hash === hash) {
                return {
                    changed: false
                };
            }
            entryMap.set(filePath, { hash });
            return {
                changed: true
            };
        } catch (error) {
            return {
                changed: false,
                error
            };
        }
    };
    const getAndUpdateCacheMetadata = async (filePath: string) => {
        const cacheValue = cacheMap.get(filePath) as CacheMetaData | undefined;
        try {
            const stat = await fs.stat(filePath);
            const metadata = {
                mtime: stat.mtime.getTime(),
                size: stat.size
            };
            if (cacheValue && cacheValue.mtime === metadata.mtime && cacheValue.size === stat.size) {
                return {
                    changed: false
                };
            }
            entryMap.set(filePath, metadata);
            return {
                changed: true
            };
        } catch (error) {
            return {
                changed: false,
                error
            };
        }
    };
    return {
        async getFileDescriptor(filePath: string) {
            if (mode === "content") {
                return getAndUpdateCacheContent(filePath);
            } else if (mode === "metadata") {
                return getAndUpdateCacheMetadata(filePath);
            }
            throw new Error("Invalid mode" + mode);
        },
        delete(filePath: string) {
            entryMap.delete(filePath);
        },
        clear() {
            entryMap.clear();
        },
        async reconcile() {
            try {
                await fs.writeFile(cacheFilePath, JSON.stringify(Object.fromEntries(entryMap)), "utf-8");
                // reflect the changes in the cacheMap
                cacheMap = new Map(entryMap);
                return true;
            } catch {
                return false;
            }
        }
    };
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
