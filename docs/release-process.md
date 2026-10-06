# Release procedure

0. A maintainer reviews docs/qa-report.md and completes release-gate.json with actual evidence. Never change gates to true just to make CI pass.
1. Update fee evidence/configuration if applicable; increment version in package.json and public/manifest.json consistently. Update CHANGELOG.
2. Run a frozen dependency install, lint, typecheck, unit/coverage tests, build, browser/accessibility tests and audit. Review unpatched development advisories explicitly; production bundle must contain no unexpected code.
3. Perform native Chrome and manual user/accessibility QA; record versions and results.
4. Build and inspect production ZIP. It includes only packaged extension files, not tests or parser fixture helper. Generate SHA-256 hash.
5. Tag vX.Y.Z. GitHub release workflow runs evidence gates and CI before creating a release ZIP/hash via gh. It never submits to Chrome automatically. Configure a public repository first.
6. Verify public privacy/support URLs and store disclosures; submit manually. Record Chrome review result, update installation URL only after approval.

Free infrastructure target: local compute, public GitHub repository and Actions within account limits. No server/database required. Store developer registration may have a one-time charge. Optional website hosting must be commercially permitted under terms verified when chosen; no hosting provider is assumed.
