const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 1. Watch the local SDK folder
config.watchFolders = [
    path.resolve(__dirname, '../../SDK')
];

// 2. Ensure we only have one copy of react/react-native to avoid "duplicate module" errors
config.resolver.nodeModulesPaths = [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '../../SDK/node_modules'),
];

// 3. Force the bundler to resolve imports from the example app first
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
