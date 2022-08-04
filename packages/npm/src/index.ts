import * as fs from "fs";
import resolve from "resolve";
import "textlint";
export const createNpmPackageKey = (dependencyNames: string[]): string => {
    let result = "";
    for (const dependencyName of dependencyNames) {
        try {
            const pkg = JSON.parse(fs.readFileSync(resolve.sync(`${dependencyName}/package.json`), "utf-8"));
            result += `__${pkg.version}`;
        } catch (error: any) {
            error.message = `${dependencyNames} is not installed: ` + error.message;
            throw error;
        }
    }
    return result;
};
