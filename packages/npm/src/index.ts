import * as fs from "fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export const createNpmPackage = (dependencyNames: string[]): string => {
    let result = "";
    for (const dependencyName of dependencyNames) {
        try {
            const pkg = JSON.parse(fs.readFileSync(require.resolve(`${dependencyName}/package.json`), "utf-8"));
            result += `__${pkg.version}`;
        } catch (error: any) {
            error.message = `${dependencyNames} is not installed: ` + error.message;
            throw error;
        }
    }
    return result;
};
