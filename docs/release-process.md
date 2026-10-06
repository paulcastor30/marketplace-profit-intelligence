# Release procedure

## Automatic testing builds

The **Checks** workflow runs on pushes and pull requests. Maintainers can also select **Actions → Checks → Run workflow** and choose a branch. After lint, type checking, financial tests, browser/accessibility tests, coverage, packaging and production dependency audit pass, the run saves an `extension-testing-COMMIT` artifact for 30 days.

Download it from the run's **Artifacts** section while signed in to GitHub. It contains the extension ZIP, corresponding GPL source ZIP and `SHA256SUMS`. Extract the outer artifact download, then extract the extension ZIP and load the folder containing `manifest.json` in Chrome. The source ZIP and GitHub's repository ZIP are for development, not direct installation. Checksums use filenames relative to the extracted artifact directory; on macOS run `shasum -a 256 -c SHA256SUMS` there.

These builds are for testing and do not change release readiness or publish to Chrome. No additional repository secret is needed.

Successful pushes to `main`, and manual **Run workflow** builds of `main`, also publish a GitHub **prerelease** containing the same verified packages. Find these under the repository's **Releases** section; those assets remain available beyond the Actions artifact retention period. Each receives a unique `testing-vVERSION-build.RUN.ATTEMPT` tag tied to the tested commit. Pull requests, other branches and tag pushes do not publish testing prereleases. Testing releases are marked prerelease and are not marked as the latest stable release. They do not run or satisfy the full-release readiness gate.

## Versioned GitHub releases

The existing release workflow runs when a tag such as `v0.1.0` is pushed. It verifies `release-gate.json`, runs the full checks, and requires the tag, package version and manifest version to match. It then creates a full GitHub release with both ZIPs and checksums using GitHub's built-in token. The current pending gates intentionally block full releases.

Once readiness is documented and the steps below are complete, push the matching version tag:

```sh
git tag v0.1.0
git push origin v0.1.0
```

For later versions, update the package and manifest version first and use that new version in both commands. Do not move or reuse a published release tag. GitHub release assets provide downloads beyond the testing artifact retention period.

## Maintainer checklist

0. A maintainer reviews docs/qa-report.md and completes release-gate.json with actual evidence. Never change gates to true just to make CI pass.
1. Update fee evidence/configuration if applicable; increment version in package.json and public/manifest.json consistently. Update CHANGELOG.
2. Run a frozen dependency install, lint, typecheck, unit/coverage tests, build, browser/accessibility tests and audit. Review unpatched development advisories explicitly; production bundle must contain no unexpected code.
3. Perform native Chrome and manual user/accessibility QA; record versions and results.
4. Build and inspect production ZIP. It includes only packaged extension files, not tests or parser fixture helper. Generate SHA-256 hash.
5. Tag vX.Y.Z. GitHub release workflow runs evidence gates and CI before creating a release ZIP/hash via gh. It never submits to Chrome automatically. Configure a public repository first.
6. Verify public privacy/support URLs and store disclosures; submit manually. Record Chrome review result, update installation URL only after approval.

Free infrastructure target: local compute, public GitHub repository and Actions within account limits. No server/database required. Store developer registration may have a one-time charge. Optional website hosting must be commercially permitted under terms verified when chosen; no hosting provider is assumed.
