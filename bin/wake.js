#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const cwd = process.cwd();

function exitWithError(message) {
  console.error(message);
  process.exit(1);
}

function parseJsonFile(filePath, fileLabel) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    exitWithError(`Error: invalid ${fileLabel}.`);
  }
}

function getToken() {
  const settingsPath = path.join(cwd, 'Configs', 'settings.json');

  if (!fs.existsSync(settingsPath)) {
    exitWithError('Error: Configs/settings.json not found. Run this command from a Wake project root.');
  }

  const settings = parseJsonFile(settingsPath, 'Configs/settings.json');
  const token = settings.access_token;

  if (!token) {
    exitWithError('Error: access_token not found in settings.json.');
  }

  return token;
}

function getInputFiles() {
  const cssDir = path.join(cwd, 'Assets', 'CSS');

  if (!fs.existsSync(cssDir)) {
    exitWithError('Error: Assets/CSS directory not found.');
  }

  const inputFiles = fs.readdirSync(cssDir, { withFileTypes: true })
    .filter(
      entry => entry.isFile() && entry.name.startsWith('input') && entry.name.endsWith('.css')
    )
    .map(entry => entry.name);

  if (inputFiles.length === 0) {
    exitWithError('Error: no input*.css files found in Assets/CSS.');
  }

  return inputFiles;
}

function spawnCommand(command, args) {
  spawn(command, args, {
    stdio: 'inherit',
    cwd,
    shell: true,
  });
}

function hasLocalTailwindBinary() {
  const localBinNames = process.platform === 'win32'
    ? ['tailwindcss.cmd', 'tailwindcss']
    : ['tailwindcss'];

  return localBinNames.some(binName =>
    fs.existsSync(path.join(cwd, 'node_modules', '.bin', binName))
  );
}

function getTailwindCommand() {
  if (hasLocalTailwindBinary()) {
    return {
      command: 'npm',
      argsPrefix: ['exec', 'tailwindcss', '--'],
      sourceLabel: 'local npm',
    };
  }

  return {
    command: 'tailwindcss',
    argsPrefix: [],
    sourceLabel: 'global PATH',
  };
}

function runStorefront(passthroughArgs) {
  const token = getToken();

  console.log(`Token loaded: ${token.slice(0, 10)}...`);
  console.log('Starting fbits.storefront...');

  spawnCommand('fbits.storefront', ['--token', token, ...passthroughArgs]);
}

function runTailwind(minify, passthroughArgs) {
  const inputFiles = getInputFiles();
  const tailwind = getTailwindCommand();

  console.log(`CSS files found: ${inputFiles.join(', ')}\n`);
  console.log(`Minification: ${minify ? 'enabled' : 'disabled'}.`);


  for (const inputFile of inputFiles) {
    const outputFile = inputFile.replace(/^input/, 'output');
    const inputPath = `./Assets/CSS/${inputFile}`;
    const outputPath = `./Assets/CSS/${outputFile}`;

    const minifyFlag = minify ? ['--minify'] : [];

    console.log(`Starting Tailwind: ${inputFile} -> ${outputFile}`);
    spawnCommand(tailwind.command, [
      ...tailwind.argsPrefix,
      '-i',
      inputPath,
      '-o',
      outputPath,
      '--watch',
      ...minifyFlag,
      ...passthroughArgs,
    ]);
  }
}

function printHelp() {
  console.log('wake-runner — starts the Wake development environment');
  console.log('');
  console.log('Usage:');
  console.log('  wake                           Start fbits.storefront + all Tailwind watchers');
  console.log('  wake storefront                Start fbits.storefront only');
  console.log('  wake tailwind                  Start Tailwind watchers only');
  console.log('  wake-storefront                Alias for "wake storefront"');
  console.log('  wake-tailwind                  Alias for "wake tailwind"');
  console.log('');
  console.log('wake-runner flags:');
  console.log('  --help, -h       Show this help message');
  console.log('  --no-minify      Disable CSS minification (enabled by default)');
  console.log('');
  console.log('Passthrough — any other flag is forwarded directly to the underlying CLI:');
  console.log('  wake storefront [flags]   → fbits.storefront --token <token> [flags]');
  console.log('  wake tailwind [flags]     → tailwindcss -i ... -o ... --watch --minify [flags]');
  console.log('  wake [flags]              → fbits.storefront only (use "wake tailwind" for tailwindcss flags)');
  console.log('');
  console.log('Examples:');
  console.log('  wake                                       Start everything with default settings');
  console.log('  wake --no-minify                           Start all, Tailwind without minification');
  console.log('  wake --port 3000                           Start all, storefront on port 3000');
  console.log('  wake storefront --port 3000                Start storefront on port 3000');
  console.log('  wake storefront --port 3000 --save         Start storefront on port 3000 and save token');
  console.log('  wake tailwind --no-minify                  Start Tailwind without minification');
  console.log('  wake tailwind --content "./src/**/*.html"  Start Tailwind with custom content path');
  console.log('');
  console.log('Repository: https://github.com/SimksS/wake-runner');
}

function printUsage() {
  console.log('Invalid usage. Run "wake --help" to see all available commands.');
}

function parseArgs() {
  const WAKE_OWN_FLAGS = new Set(['no-minify', 'help']);
  const SHORT_FLAG_MAP = { h: 'help' };
  const MODES = new Set(['all', 'storefront', 'tailwind']);
  const args = process.argv.slice(2);
  const positional = [];
  const wakeFlags = {};
  const passthroughArgs = [];

  // A mode name is never taken as a flag value, so `wake --save storefront` still runs storefront.
  const isFlagValue = nextArg =>
    nextArg !== undefined
    && !nextArg.startsWith('-')
    && !(positional.length === 0 && MODES.has(nextArg));

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (WAKE_OWN_FLAGS.has(key)) {
        wakeFlags[key] = true;
        i++;
      } else {
        passthroughArgs.push(arg);
        const nextArg = args[i + 1];
        if (isFlagValue(nextArg)) {
          passthroughArgs.push(nextArg);
          i += 2;
        } else {
          i++;
        }
      }
    } else if (arg.startsWith('-') && arg.length >= 2) {
      const shortKey = arg.slice(1);
      const mappedKey = SHORT_FLAG_MAP[shortKey];
      if (mappedKey && WAKE_OWN_FLAGS.has(mappedKey)) {
        wakeFlags[mappedKey] = true;
        i++;
      } else {
        passthroughArgs.push(arg);
        const nextArg = args[i + 1];
        if (isFlagValue(nextArg)) {
          passthroughArgs.push(nextArg);
          i += 2;
        } else {
          i++;
        }
      }
    } else {
      positional.push(arg);
      i++;
    }
  }

  const mode = positional[0] || 'all';
  const minify = !wakeFlags['no-minify'];
  const help = !!wakeFlags['help'];

  return { mode, minify, passthroughArgs, help };
}

function runCli(mode, minify, passthroughArgs) {
  switch (mode) {
    case 'all':
      getInputFiles(); // validate CSS before starting storefront, so a failure never leaves it running
      runStorefront(passthroughArgs);
      runTailwind(minify, []);
      break;
    case 'storefront':
      runStorefront(passthroughArgs);
      break;
    case 'tailwind':
      runTailwind(minify, passthroughArgs);
      break;
    default:
      printUsage();
      process.exit(1);
  }
}

function isCliEntrypoint() {
  const mainFilename = require.main && require.main.filename;

  if (!mainFilename) {
    return false;
  }

  const allowedEntrypoints = [
    __filename,
    path.join(__dirname, 'wake-storefront.js'),
    path.join(__dirname, 'wake-tailwind.js'),
  ];

  return allowedEntrypoints.some(entrypoint =>
    path.resolve(mainFilename) === path.resolve(entrypoint)
  );
}

if (isCliEntrypoint()) {
  const { mode, minify, passthroughArgs, help } = parseArgs();

  if (help) {
    printHelp();
    process.exit(0);
  }

  runCli(mode, minify, passthroughArgs);
}

module.exports = {
  runCli,
};
