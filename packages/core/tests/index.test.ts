import path from "path";
import { createCache, createCacheKey, resetCache } from "../src/index.js";
import * as fs from "fs";
import assert from "node:assert";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesDir = path.resolve(__dirname, "./fixtures");
const fixtureFiles = [
    {
        name: "f1.txt",
        content: "some content 1"
    },
    {
        name: "f2.txt",
        content: "some content 2"
    },
    {
        name: "f3.txt",
        content: "some content 3"
    },
    {
        name: "f4.txt",
        content: "some content 4"
    }
];

const write = (filePath: string, content: string) => {
    fs.writeFileSync(filePath, content, "utf-8");
};
const del = (filePath: string) => {
    fs.unlinkSync(filePath);
};
const delCacheAndFiles = function () {
    fs.rmSync(fixturesDir, {
        force: true,
        recursive: true
    });
};

const createFixtureFiles = function () {
    fs.mkdirSync(fixturesDir, {
        recursive: true
    });
    fixtureFiles.forEach(function (f) {
        fs.writeFileSync(path.resolve(fixturesDir, f.name), f.content, "utf-8");
    });
};

describe("file-entry-cache", function () {
    beforeEach(function () {
        delCacheAndFiles();
        createFixtureFiles();
    });

    afterEach(async function () {
        delCacheAndFiles();
        await resetCache({
            name: "test",
            key: "test",
            mode: "metadata"
        });
    });

    describe("hasFileChanged", function () {
        it("should determine if a file has changed since last time reconcile was called", async function () {
            const cache = await createCache({
                name: "test",
                key: "test",
                mode: "metadata"
            });
            const file = path.resolve(__dirname, "./fixtures/f4.txt");

            // not called yet reconcile so all the files passed will be returned as changed
            // provided that the file actually exists
            assert.strictEqual((await cache.getAndUpdateCache(file)).changed, true);

            // since reconcile has not being called this should be true
            assert.strictEqual((await cache.getAndUpdateCache(file)).changed, true);

            await cache.reconcile();

            // since reconcile was called then this should be false
            assert.strictEqual((await cache.getAndUpdateCache(file)).changed, false);

            // attempt to do a modification
            write(file, "some other content");

            assert.strictEqual((await cache.getAndUpdateCache(file)).changed, true);

            await cache.reconcile();

            assert.strictEqual((await cache.getAndUpdateCache(file)).changed, false);
        });

        it("should consider file unchanged even with different mtime when mode:metadata", async function () {
            const file = path.resolve(__dirname, "./fixtures/f4.txt");
            const cache = await createCache({
                name: "test",
                key: "test",
                mode: "metadata"
            });
            await cache.getAndUpdateCache(file);
            await cache.reconcile();
            delCacheAndFiles();
            createFixtureFiles();
            assert.strictEqual((await cache.getAndUpdateCache(file)).changed, true);
        });
        it("should consider file unchanged  even with different mtime when mode:content", async function () {
            const file = path.resolve(__dirname, "./fixtures/f4.txt");
            const cache = await createCache({
                name: "test",
                key: "test",
                mode: "content"
            });
            await cache.getAndUpdateCache(file);
            await cache.reconcile();
            delCacheAndFiles();
            createFixtureFiles();
            assert.strictEqual((await cache.getAndUpdateCache(file)).changed, false);
        });
    });
    it("should change after reset cache", async function () {
        const cache = await createCache({
            name: "test",
            key: "test",
            mode: "metadata"
        });
        const file = path.resolve(__dirname, "./fixtures/f4.txt");
        assert.strictEqual((await cache.getAndUpdateCache(file)).changed, true);
        await cache.clear();
        await cache.reconcile();
        assert.strictEqual((await cache.getAndUpdateCache(file)).changed, true);
    });
    it("should not fail if calling reconcile without changes", async function () {
        const cache = await createCache({
            name: "test",
            key: "test",
            mode: "metadata"
        });
        return assert.doesNotReject(async function () {
            await cache.reconcile();
        });
    });

    describe("getFileDescriptor", function () {
        it("should tell when file known to the cache is not found anymore ", async function () {
            const file = path.resolve(__dirname, "./fixtures/", fixtureFiles[0].name);
            const cache = await createCache({
                name: "test",
                key: "test",
                mode: "metadata"
            });
            await cache.getAndUpdateCache(file);
            await cache.reconcile();
            del(file);
            assert.ok((await cache.getAndUpdateCache(file)).error instanceof Error);
        });
    });
});
