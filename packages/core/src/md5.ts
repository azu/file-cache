import crypto from "crypto";

export const md5 = (buffer: Buffer): string => {
    return crypto.createHash("md5").update(buffer).digest("hex");
};
