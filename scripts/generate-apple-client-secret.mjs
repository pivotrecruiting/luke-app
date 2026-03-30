import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";

const secretsDirectoryPath = path.resolve("./private/apple-sign-in");
const privateKeyFilename = process.env.APPLE_PRIVATE_KEY_FILENAME;
const teamId = process.env.APPLE_TEAM_ID;
const clientId = process.env.APPLE_CLIENT_ID;
const keyId = process.env.APPLE_KEY_ID;

if (!privateKeyFilename || !teamId || !clientId || !keyId) {
  throw new Error(
    "Missing required env vars: APPLE_PRIVATE_KEY_FILENAME, APPLE_TEAM_ID, APPLE_CLIENT_ID, APPLE_KEY_ID",
  );
}

const privateKeyPath = path.join(secretsDirectoryPath, privateKeyFilename);
const outputPath = path.join(secretsDirectoryPath, "apple-client-secret.txt");

const privateKey = fs.readFileSync(privateKeyPath);

const token = jwt.sign({}, privateKey, {
  algorithm: "ES256",
  expiresIn: "180d",
  audience: "https://appleid.apple.com",
  issuer: teamId,
  subject: clientId,
  header: {
    alg: "ES256",
    kid: keyId,
  },
});

fs.mkdirSync(secretsDirectoryPath, { recursive: true });
fs.writeFileSync(outputPath, token, "utf8");

console.log("Apple client secret created:");
console.log(outputPath);
