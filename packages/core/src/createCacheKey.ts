import { md5 } from "./md5.js";
export type CreateCacheKeyGenerator = () => string;
export const createCacheKey = (generators: CreateCacheKeyGenerator[]) => {
    if (generators.length === 0) {
        throw new Error("generators must be provided");
    }
    let key = "";
    for (const generator of generators) {
        const generatedKey = generator();
        if (generatedKey === "") {
            throw new Error("generator must return a non-empty string");
        }
        key += `__${generatedKey}`;
    }
    return md5(key);
};
