import fs from "node:fs/promises";
import { md5 } from "./md5.js";

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

export const createFileCache = async (cacheFilePath: string, mode: "content" | "metadata") => {
    // When mode is changed, create another cache
    const cacheFileFullPath = cacheFilePath + "-" + mode;
    // file <-> Map
    let fileCacheMap = await readFileCache(cacheFileFullPath);
    // Processing Map
    const entryMap = new Map<string, CacheValue>(fileCacheMap);
    const getAndUpdateCacheContent = async (filePath: string | URL) => {
        try {
            const hash = md5(await fs.readFile(filePath));
            const normalizedFilePath = filePath.toString();
            const cacheValue = fileCacheMap.get(normalizedFilePath) as CacheContent | undefined;
            if (cacheValue && cacheValue.hash === hash) {
                return {
                    changed: false
                };
            }
            entryMap.set(normalizedFilePath, { hash });
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
    const getAndUpdateCacheMetadata = async (filePath: string | URL) => {
        const normalizedFilePath = filePath.toString();
        const cacheValue = fileCacheMap.get(normalizedFilePath) as CacheMetaData | undefined;
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
            entryMap.set(normalizedFilePath, metadata);
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
        async getFileDescriptor(filePath: string | URL) {
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
                await fs.writeFile(cacheFileFullPath, JSON.stringify(Object.fromEntries(entryMap)), "utf-8");
                // reflect the changes in the cacheMap
                fileCacheMap = new Map(entryMap);
                return true;
            } catch (error) {
                console.error("reconcile is failed", error);
                return false;
            }
        }
    };
};
