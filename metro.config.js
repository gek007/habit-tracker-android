const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude Expo devtools temp directories from file watching (Windows compatibility)
config.resolver.blockList = [
  /node_modules\/@expo\/\.devtools.*/,
];

module.exports = config;
