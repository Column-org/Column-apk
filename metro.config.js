const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add .mjs to supporting source extensions
config.resolver.sourceExts.push("mjs");

const resolveRequestWithPackageExports = (context, moduleName, platform) => {
  // Package exports in `jose` are incorrect, so we need to force the browser version
  if (moduleName === "jose") {
    const ctx = {
      ...context,
      unstable_conditionNames: ["browser"],
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  // Help @aptos-labs and @noble packages by adding react-native condition if it doesn't find a match
  if (moduleName.startsWith("@aptos-labs/") || moduleName.startsWith("@noble/")) {
    // Specifically fix noble/hashes/crypto.js which is often imported incorrectly by libs
    const normalizedName = moduleName === "@noble/hashes/crypto.js" ? "@noble/hashes/crypto" : moduleName;

    const ctx = {
      ...context,
      unstable_conditionNames: ["react-native", "browser", "import", "default"],
    };
    try {
      return ctx.resolveRequest(ctx, normalizedName, platform);
    } catch (e) {
      // Fallback to default if custom resolution fails
      return context.resolveRequest(context, moduleName, platform);
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.resolveRequest = resolveRequestWithPackageExports;

module.exports = config;