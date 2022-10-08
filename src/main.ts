import * as core from '@actions/core';
import fs from 'fs';
import path from 'path';

interface ManifestInfo {
  version: number
  compat_version: number
}

interface ManifestBranch {
  name: string
  version: string
  updated_at: string
  github_url: string
  booth_url: string
}

interface Manifest {
  info: ManifestInfo
  default_branch: string
  branches: ManifestBranch[]
}

async function run(): Promise<void> {
  try {
    const fullVersion: string = core.getInput('full-version');
    const manifestFilePath: string = core.getInput('manifest-file-path');
    let updatedAtTime: string = core.getInput('updated-at-time');
    let releaseGithubUrl: string = core.getInput('release-github-url');
    const releaseBoothUrl: string = core.getInput('release-booth-url');

    if (fullVersion === "" || manifestFilePath === "" || releaseBoothUrl === "") {
      core.setFailed("Full version, manifest file path or release booth url is empty.");
      return;
    }

    // generate if needed

    if (updatedAtTime === "") {
      updatedAtTime = new Date().toISOString();
      core.info("Generated updated at ISO time: " + updatedAtTime);
    }

    if (releaseGithubUrl === "") {
      releaseGithubUrl = `https://github.com/${process.env.GITHUB_REPOSITORY}/releases/tag/${fullVersion}`;
      core.info("Generated GitHub Release URL: " + releaseGithubUrl);
    }

    // print debug logs

    let wsPath = <string>process.env.GITHUB_WORKSPACE;
    
    core.info("Workspace path: " + wsPath);
    core.info("Full version: " + fullVersion);
    core.info("Manifest File Path: " + manifestFilePath);
    core.info("Updated at ISO time: " + updatedAtTime);
    core.info("GitHub Release URL: " + releaseGithubUrl);
    core.info("Booth Release URL: " + releaseBoothUrl);

    const manifestFullFilePath = path.join(wsPath, manifestFilePath);
    let manifestJsonStr = fs.readFileSync(manifestFullFilePath).toString('utf8');;
    let manifestJson: Manifest = JSON.parse(manifestJsonStr);

    // parse version string

    let hyphenIndex = fullVersion.indexOf('-');

    if (hyphenIndex == -1) {
      core.setFailed("Version does not contain a hyphen");
      return;
    }

    if (hyphenIndex == fullVersion.length - 1) {
      core.setFailed("Hyphen is the end of the version string");
      return;
    }

    let versionStr = fullVersion.substring(0, hyphenIndex);
    let updateBranch = fullVersion.substring(hyphenIndex + 1);

    core.info("Parsed short version: " + versionStr);
    core.info("Parsed update branch: " + updateBranch);

    // search for update branch in manifest

    let found = false;

    for (let branch of manifestJson.branches) {
      if (updateBranch === branch.name) {
        found = true;
        branch.github_url = releaseGithubUrl;
        branch.booth_url = releaseBoothUrl;
        branch.updated_at = updatedAtTime;
        branch.version = fullVersion;
        break;
      }
    }

    // create a new entry if not found

    if (!found) {
      let manifest: ManifestBranch = {
        name: updateBranch,
        version: fullVersion,
        updated_at: updatedAtTime,
        github_url: releaseGithubUrl,
        booth_url: releaseBoothUrl
      };
      manifestJson.branches.push(manifest);
    }

    // write to file

    const newJsonStr = JSON.stringify(manifestJson, null, 4);

    core.info("Writing new manifest JSON:");
    core.info(newJsonStr);

    fs.writeFileSync(manifestFullFilePath, newJsonStr);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
