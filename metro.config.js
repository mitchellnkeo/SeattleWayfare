// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configure resolver to exclude react-native-maps on web
if (config.resolver && config.resolver.resolveRequest) {
  const defaultResolver = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Exclude react-native-maps on web platform - return empty module stub
    if (platform === 'web' && moduleName === 'react-native-maps') {
      const emptyModulePath = path.resolve(__dirname, 'src/utils/empty-module.js');
      console.log(`[Metro] Resolving react-native-maps on web -> using empty module: ${emptyModulePath}`);
      return {
        type: 'sourceFile',
        filePath: emptyModulePath,
      };
    }
    // Use default resolution for other modules
    if (typeof defaultResolver === 'function') {
      return defaultResolver(context, moduleName, platform);
    }
    // Fallback if defaultResolver is not a function
    return context.resolveRequest(context, moduleName, platform);
  };
} else {
  // If resolver doesn't exist, create it
  config.resolver = config.resolver || {};
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Exclude react-native-maps on web platform
    if (platform === 'web' && moduleName === 'react-native-maps') {
      const emptyModulePath = path.resolve(__dirname, 'src/utils/empty-module.js');
      console.log(`[Metro] Resolving react-native-maps on web -> using empty module: ${emptyModulePath}`);
      return {
        type: 'sourceFile',
        filePath: emptyModulePath,
      };
    }
    // Use default resolution
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
