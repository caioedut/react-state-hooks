import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { args, pmex } from 'pmex';

/**
 * Releases the package.
 *
 *   bun run publish:stable --bump=major                       2.0.0 on the `latest` tag
 *   bun run publish:stable --bump=prerelease --preid=beta     2.0.0-beta.0 on the `next` tag
 *   bun run publish:stable --dry-run                          tests, build and the list of files that would be published
 *   bun run publish:stable --no-version                       publish the version already in package.json (retry after a failure)
 *
 * Options: `--bump` (default `patch`), `--preid`, `--tag` (npm dist-tag), `--dry-run` and `--no-version`.
 */

const BUMPS = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'];

const options = args();
const bump = String(options.bump ?? 'patch');
const preid = options.preid ? String(options.preid) : undefined;
const dryRun = Boolean(options['dry-run']);
const noVersion = Boolean(options['no-version']);

if (!BUMPS.includes(bump)) {
  throw new Error(`Invalid --bump "${bump}". Use one of: ${BUMPS.join(', ')}.`);
}

function output(command: string) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

// Fail fast, before spending time on tests and build: `npm version` refuses a dirty working tree anyway
if (!noVersion && !dryRun && output('git status --porcelain') !== '') {
  throw new Error('The working tree is not clean. Commit or stash your changes before releasing.');
}

pmex('test');

pmex('build');

if (!noVersion && !dryRun) {
  // Creates the version commit and the git tag, locally
  pmex(`npm version ${bump}${preid ? ` --preid=${preid}` : ''}`);
}

const { name, version } = JSON.parse(readFileSync('package.json', 'utf8')) as { name: string; version: string };

// A prerelease (for example 2.0.0-beta.0) must never become what `npm install` gets by default
const distTag = options.tag ? String(options.tag) : version.includes('-') ? 'next' : 'latest';

console.log(`\nPublishing ${name}@${version} with the "${distTag}" tag${dryRun ? ' (dry run)' : ''}\n`);

try {
  // `npm publish --dry-run` still asks the registry, which rejects a version that already exists,
  // so a dry run lists what would be published with `npm pack` instead
  pmex(dryRun ? 'npm pack --dry-run' : `npm publish --tag ${distTag}`, { stdio: 'inherit' });
} catch (error) {
  if (!noVersion && !dryRun) {
    console.error(
      `\nThe publish failed, so nothing was pushed. The version ${version} is only committed and tagged locally.\n` +
        'Fix the problem and run `bun run publish:stable --no-version` to retry the publish,\n' +
        'then `git push --follow-tags`. To undo the bump instead: `git tag -d v' +
        `${version}\` and \`git reset --hard HEAD~1\`.\n`,
    );
  }

  throw error;
}

// The tag only goes to the remote after the package was published
if (!noVersion && !dryRun) {
  execSync('git push --follow-tags', { stdio: 'inherit' });
}

if (noVersion && !dryRun) {
  console.log('\nPublished. Remember to push the version commit and its tag: `git push --follow-tags`.\n');
}
