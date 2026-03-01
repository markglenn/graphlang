const USAGE = `
GraphLang CLI

Usage:
  graphlang check   — Type-check all .graph files in the project
  graphlang build   — Build the project for production
  graphlang dev     — Start the development server with watch mode
  graphlang seed    — Run seed scripts to populate the database

Options:
  --help, -h   Show this help message
`.trim();

const [, , command, ...args] = process.argv;

if (!command || command === '--help' || command === '-h') {
  console.log(USAGE);
  process.exit(0);
}

switch (command) {
  case 'check':
    console.error('check: not implemented');
    process.exit(1);
    break;
  case 'build':
    console.error('build: not implemented');
    process.exit(1);
    break;
  case 'dev':
    console.error('dev: not implemented');
    process.exit(1);
    break;
  case 'seed':
    console.error('seed: not implemented');
    process.exit(1);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.log(USAGE);
    process.exit(1);
}
