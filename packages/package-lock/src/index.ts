import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const LOCK_FILE_NAMES_ORDERED_BY_SEARCH = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb"];

export const createPackageLockCacheKey = (rootDir: string = process.cwd()) => {
    // Find the first lock file that exists
    const lockFileName = LOCK_FILE_NAMES_ORDERED_BY_SEARCH.find((lockFileName) => {
        return fs.existsSync(path.join(rootDir, lockFileName));
    });
    if (!lockFileName) {
        return "no-lock-file";
    }
    // create sha1 hash of lock file contents
    const lockFileContents = fs.readFileSync(path.join(rootDir, lockFileName), "utf8");
    const hash = crypto.createHash("sha1");
    hash.update(lockFileContents);
    const sha1 = hash.digest("hex");
    return `${lockFileName}-${sha1}`;
};
