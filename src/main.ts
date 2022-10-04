import * as core from '@actions/core';
import fs from 'fs';
import path from 'path';

async function run(): Promise<void> {
  try {
    const versionTextFilePath: string = core.getInput('version-text-file-path');
    const packageJsonFilePath: string = core.getInput('package-json-file-path');

    if (versionTextFilePath === "" || packageJsonFilePath === "") {
      core.setFailed("Version text file path or package JSON file path is empty.");
      return;
    }

    let versionTextStr = <string><unknown>fs.readFileSync(path.join(__dirname, versionTextFilePath));
    let packageJsonStr = <string><unknown>fs.readFileSync(path.join(__dirname, packageJsonFilePath));

    let packageJson = JSON.parse(packageJsonStr);

    if (versionTextStr !== packageJson['version']) {
      core.setFailed('Version text does not match with package JSON version string.');
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
