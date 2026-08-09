/** Fast, offline checks for release metadata. This does not inspect secrets. */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
const pngSize = (relativePath) => {
  const buffer = fs.readFileSync(path.join(root, relativePath));
  if (buffer.toString("ascii", 1, 4) !== "PNG") throw new Error(`${relativePath} is not a PNG file.`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
};
const packageJson = readJson("package.json");
const twa = readJson("twa-manifest.json");
const webManifest = readJson("manifest.json");
const assetLinks = readJson(".well-known/assetlinks.json");
const gradle = fs.readFileSync(path.join(root, "app/build.gradle"), "utf8");
const gradlePackage = gradle.match(/applicationId\s+"([^"]+)"/)?.[1];
const gradleVersionCode = Number(gradle.match(/versionCode\s+(\d+)/)?.[1]);
const gradleVersionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
if (packageJson.version !== twa.appVersionName) fail("package.json version must match twa-manifest.json appVersionName.");
if (!twa.packageId || twa.packageId !== gradlePackage) fail("twa-manifest.json packageId must match app/build.gradle applicationId.");
if (twa.appVersionCode !== gradleVersionCode || twa.appVersionName !== gradleVersionName) fail("TWA version code/name must match app/build.gradle before a local release build.");
if (!twa.host || !twa.startUrl || !webManifest.start_url) fail("TWA host/start URL and web manifest start URL are required.");
if (!Array.isArray(twa.fingerprints) || twa.fingerprints.length === 0) fail("At least one Android signing fingerprint is required in twa-manifest.json.");
const matchingStatement = assetLinks.find((statement) => statement.target?.namespace === "android_app" && statement.target?.package_name === twa.packageId && statement.relation?.includes("delegate_permission/common.handle_all_urls"));
if (!matchingStatement) fail("assetlinks.json must delegate URL handling to this Android package.");
else for (const fingerprint of twa.fingerprints.map((entry) => entry.value)) if (!(matchingStatement.target.sha256_cert_fingerprints || []).includes(fingerprint)) fail(`assetlinks.json is missing the TWA signing fingerprint ${fingerprint}.`);
for (const relativePath of [
  "index.html",
  "privacy.html",
  "delete-account.html",
  "sw.js",
  "js/config.js",
  "js/build-info.js",
  "app/src/main/AndroidManifest.xml",
  "supabase/functions/delete-account/index.ts",
  "play_store_feature_graphic-v2.png",
  "store_icon.png"
]) if (!fs.existsSync(path.join(root, relativePath))) fail(`Required release file is missing: ${relativePath}.`);
if (fs.existsSync(path.join(root, "play_store_feature_graphic-v2.png"))) {
  const featureGraphic = pngSize("play_store_feature_graphic-v2.png");
  if (featureGraphic.width !== 1024 || featureGraphic.height !== 500) fail("Play feature graphic must be exactly 1024x500.");
}
if (fs.existsSync(path.join(root, "store_icon.png"))) {
  const storeIcon = pngSize("store_icon.png");
  if (storeIcon.width !== 512 || storeIcon.height !== 512) fail("Play Store icon must be exactly 512x512.");
}
const clientConfig = fs.readFileSync(path.join(root, "js/config.js"), "utf8");
if (/service[_-]?role|sb_secret_/i.test(clientConfig)) fail("Public client configuration must not contain privileged Supabase keys.");
const deletionPage = fs.readFileSync(path.join(root, "delete-account.html"), "utf8");
if (!deletionPage.includes('functions.invoke("delete-account"')) fail("Deletion page must invoke the authenticated delete-account function.");
const deletionFunction = fs.readFileSync(path.join(root, "supabase/functions/delete-account/index.ts"), "utf8");
if (!deletionFunction.includes("auth.getUser(token)")) fail("Deletion function must authenticate the bearer token server-side.");
if (!deletionFunction.includes("auth.admin.deleteUser")) fail("Deletion function must delete the Supabase Auth user with an admin client.");
if (!deletionFunction.includes('from("voc_feedback")')) fail("Deletion function must explicitly remove feedback rows that do not cascade.");
if (process.exitCode) process.exit(process.exitCode);
console.log("Release preflight passed: versions, TWA identity, App Links, deletion flow, and Play assets are aligned.");