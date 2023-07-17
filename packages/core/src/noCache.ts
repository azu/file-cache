import { CacheInterface } from "./CacheInterface.js";

export const createNoCache = (): CacheInterface => {
    return {
        async clear(): Promise<void> {
            return;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async delete(_filePath: string): Promise<boolean> {
            return true;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
