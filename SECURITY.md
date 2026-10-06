# Security policy

Supported version: current pre-release only, with no production support promise yet.

Report suspected vulnerabilities privately using GitHub private vulnerability reporting once the public repository is configured. The maintainer must enable that feature and add a fallback security email before publication. Do not publish credentials, seller financial data or exploit details in public issues.

Scope: malicious page input, message trust boundaries, XSS, incorrect known fee formulas, excessive site access, dependency integrity, privacy leaks and unauthorized financial actions. No secrets or server infrastructure exist. Financial-rule defects are treated as release-blocking when reproducible.

Review notes: UI uses textContent, no eval/remote execution/unsafe HTML insertion in runtime; extension CSP blocks network requests; no externally-connectable messages; product snapshots are bounded and verified against sender tab URL; local storage restricted to trusted contexts; data controls are user-operated. Dependency audits include dev tools; no dev dependencies ship in the ZIP.

See docs/qa-report.md for actual audit results and unresolved limitations. Audit output is time-sensitive; repeat before release. Do not claim perfect security from a static review.
