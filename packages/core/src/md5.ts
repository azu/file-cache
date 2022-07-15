import crypto, { BinaryLike } from "crypto";

export const md5 = (buffer: BinaryLike): string => {
    return crypto.createHash("md5").update(buffer).digest("hex");
};
