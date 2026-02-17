/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("node:path")
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config")
const { getDefaultConfig } = require("expo/metro-config")

// Find the workspace root.
const projectRoot = __dirname
const workspaceRoot = path.resolve(__dirname, "../..")

const config = getDefaultConfig(projectRoot)

config.watchFolders = [
  path.resolve(workspaceRoot, "packages/shared"),
  path.resolve(workspaceRoot)
]

// Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
// Since Expo requires React 19.0.0, while Next.js requires 19.1.0, it is necessary to set this flag to true.
// Otherwise, will raise an `Invalid hook call` error.
config.resolver = config.resolver || {}
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
]
config.resolver.disableHierarchicalLookup = true

module.exports = wrapWithReanimatedMetroConfig(config)
