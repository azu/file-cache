import * as assert from "node:assert";
import { createPackageLockKey } from "../src/index.js";
import path from "node:path";
import * as fs from "fs";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const fixturesDir = path.join(__dirname, "snapshots");
describe("Snapshot testing", () => {
    fs.readdirSync(fixturesDir).map((caseName) => {
        const normalizedTestName = caseName.replace(/-/g, " ");
        it(`Test ${normalizedTestName}`, async function () {
            const fixtureDir = path.join(fixturesDir, caseName);
            const actual = createPackageLockKey(fixtureDir);
            const expectedFilePath = path.join(fixtureDir, "output.txt");
            // Usage: update snapshots
            // UPDATE_SNAPSHOT=1 npm test
            if (!fs.existsSync(expectedFilePath) || process.env.UPDATE_SNAPSHOT) {
                fs.writeFileSync(expectedFilePath, actual);
                this.skip(); // skip when updating snapshots
                return;
            }
            // compare input and output
            const expectedContent = fs.readFileSync(expectedFilePath, "utf-8");
            assert.deepStrictEqual(actual, expectedContent);
        });
    });
});
