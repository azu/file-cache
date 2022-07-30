export type CacheInterface = {
    /**
     * Experimental method
     * @param cb
     */
    try(cb: () => Promise<void>): Promise<void>;
    /**
     * Get cache status and update the cache value
     * You need to confirm the status via call `reconcile()` after that
     * @param filePath
     */
    getAndUpdateCache(filePath: string | URL): Promise<{ error?: Error; changed: boolean }>;
    /**
     * Delete cache value for the key
     * @param filePath
     */
    delete(filePath: string): Promise<boolean>;
    /**
     * Clear cache values
     */
    clear(): Promise<void>;
    /**
     * Confirm the changes
     */
    reconcile(): Promise<boolean>;
};
