const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Metro watches files to support fast refresh. In this monorepo it can end up scanning
// Docker bind-mount directories (e.g. Postgres data) that are root-owned and unreadable.
// Block them so the watcher doesn't crash with EACCES.
const repoRoot = path.resolve(__dirname, '..', '..');
const blockedDirs = [
  path.join(repoRoot, 'apps', 'backend', 'docker', 'postgres_data'),
  path.join(repoRoot, 'apps', 'backend', 'docker', 'kafka_data'),
];

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const blocked = blockedDirs.map(escapeRegExp).join('|');

config.resolver = config.resolver ?? {};
config.resolver.blockList = new RegExp(`(?:${blocked})(?:[\\/].*)?$`);

module.exports = withNativeWind(config, { input: './global.css' });
