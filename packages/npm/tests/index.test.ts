import * as assert from "node:assert";
import { createNpmPackage } from "../src/index.js";

describe("createNpmPackage", function () {
    it("should return package version", () => {
        const result = createNpmPackage(["version-1.0.0"]);
        assert.strictEqual(result, "__1.0.0");
    });
});
