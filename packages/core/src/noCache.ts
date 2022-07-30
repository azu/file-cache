import { CacheInterface } from "./CacheInterface.js";

export const createNoCache = (): CacheInterface => {
    return {
        async clear(): Promise<void> {
            return;
        },
        async delete(_filePath: string): Promise<boolean> {
            return true;
        },
        async getAndUpdateCache(_filePath: string | URL): Promise<{ error?: Error; changed: boolean }> {
            return { changed: true };
        },
        async reconcile(): Promise<boolean> {
            return true;
        },
        async try(cb: () => Promise<void>): Promise<void> {
            return cb();
        }
    };
};
