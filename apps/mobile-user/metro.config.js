const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..', '..');
const config = getDefaultConfig(projectRoot);

config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), workspaceRoot])
);

config.resolver = config.resolver ?? {};

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  react: path.resolve(projectRoot, 'node_modules', 'react'),
  'react-native': path.resolve(projectRoot, 'node_modules', 'react-native'),
};

// Metro watches files to support fast refresh. In this monorepo it can end up scanning
// Docker bind-mount directories (e.g. Postgres data) that are root-owned and unreadable.
// Block them so the watcher doesn't crash with EACCES.
const repoRoot = workspaceRoot;
const blockedDirs = [
  path.join(repoRoot, 'apps', 'backend', 'docker', 'postgres_data'),
  path.join(repoRoot, 'apps', 'backend', 'docker', 'kafka_data'),
];

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const blocked = blockedDirs.map(escapeRegExp).join('|');

config.resolver.blockList = new RegExp(`(?:${blocked})(?:[\\/].*)?$`);

module.exports = withNativeWind(config, { input: './global.css' });
