import execa from 'execa';
import ora from 'ora';
import chalk from 'chalk';

const INIT_STR = 'Starting compilation in watch mode...';
const END_STR = /* Found N errors. */ 'Watching for file changes.';
const RESTART_STR = 'File change detected.';
const SUCCESS = 'Found 0 errors.';
const MAX_CHUNKS = 5;
const IGNORE = ['\u001bc'];

let hiddenErrors = 0;
let printedChunks = 0;
let spinner;

export async function tsc() {
  const subprocess = execa('tsc', ['--build', '--watch']);

  subprocess.stdout.on('data', (chunk) => {
    let str = chunk.toString();

    if (IGNORE.includes(str)) {
      return;
    }

    if (hasStartingText(str)) {
      setup(str);

      return;
    }

    if (hasEndingText(str)) {
      end(str);

      return;
    }

    if (printedChunks >= MAX_CHUNKS) {
      handleOverflow(str);

      return;
    }

    if (spinner) {
      handleError(str);
    }
  });
}

function hasStartingText(str) {
  return str.includes(INIT_STR) || str.includes(RESTART_STR);
}

function hasEndingText(str) {
  return str.includes(END_STR) || str.includes(SUCCESS);
}

function setup(str) {
  hiddenErrors = 0;
  printedChunks = 0;

  if (spinner) {
    spinner.stop();
  }

  spinner = ora();
  spinner.info(str.trim());
  spinner.start('Checking type correctness');
}

function end(endingChunk) {
  hiddenErrors = 0;
  printedChunks = 0;

  /**
   * It's possible we can have errors
   * grouped with the last chunk of output
   *
   * sincing the ending line is only just a line, split that out
   * and send the pre-text to handleError
   */
  if (hasHeader(endingChunk)) {
    let [ending, ...rest] = endingChunk.split('\n').reverse();

    handleError(rest.reverse().join('\n'));

    spinner.warn(ending.trim());

    return;
  }

  spinner.warn(endingChunk.trim());
}

function handleOverflow(str) {
  hiddenErrors += countErrors(str);

  spinner.text = `${hiddenErrors} errors are hidden...`;
}

function handleError(str) {
  let errors = str.split('\n');

  for (let error of errors) {
    if (!error) continue;

    if (hasHeader(error)) {
      spinner.fail(recolorizeError(error));
    } else {
      spinner.stopAndPersist({
        prefixText: '',
        text: error + '\n',
      });
    }
  }

  spinner.start();
  printedChunks++;
}

function countErrors(str) {
  return str.match(/\): error /g).length;
}

const PARSE_HEADER_REGEX = /(.+)\((.+)\): error (TS\d+):(.+)/;

function hasHeader(line) {
  return line.match(PARSE_HEADER_REGEX);
}

function recolorizeError(error) {
  let [_original, filePath, location, code, message] = error.match(PARSE_HEADER_REGEX);

  return (
    `${chalk.cyanBright(filePath)}:${chalk.yellow(location)} - ` +
    `${chalk.redBright('error')} ${chalk.gray(code)}:` +
    `${message}`
  );
}
