# QA and launch-readiness report

Assessment date: 7 October 2026. Version: 0.1.0 pre-release. **Not approved for public release or Chrome Web Store submission.** Scores below are engineering judgment informed by the stated evidence, not measured user satisfaction, certification or marketplace settlement accuracy.

## Verified results

- Lint and strict TypeScript checks pass.
- Vitest: **69 tests pass**, including 250 deterministic generated inverse-price cases within one regression test.
- Domain engine: **100% line/statement/function coverage** and 97.89% meaningful branch coverage. Overall coverage is lower because DOM extraction is exercised in browser tests rather than Vitest. Fee configuration lines are fully covered; standard/category/program rules, caps, waivers, discounts, quantity and rounding have explicit vectors.
- Playwright: **8 tests pass** on Chromium 141, macOS arm64, Playwright 1.56.1. One test loads the real MV3 extension; others test the bundled UI and visible DOM fixtures. These are synthetic listings, not live Shopee settlement proof.
- axe-core: **0 violations** on first-use and fully expanded calculated states for tested WCAG A/AA tags. This does not establish complete WCAG conformance.
- Keyboard-only automated basic workflow passes; focus reaches results. Narrow 190px reflow with larger text, reduced motion and forced colors passes. Actual native side-panel zoom and VoiceOver remain untested.
- Loaded extension: worker/content extraction, per-tab session snapshots, local profile persistence, export, delete cancellation/confirmation and unsupported-page invalidation pass. Saved profiles exclude product cost, price, name and URL.
- Dependency audit after updating tools: **0 known vulnerabilities**, dev and production, at the assessment date; see dependency-audit.json. All dependencies are development-only; packaged runtime uses bundled local code.
- Production build and manifest review ZIP generated. ZIP includes packaged HTML/CSS/JS, original icons, manifest and GPL license; no source maps, test helper, remote scripts or secrets.
- Store screenshots are actual bundled UI opened in a browser tab at 1280×800 for legibility, with an illustrative ₱1,000 camera product / ₱500 product cost and standard seller fees. They are not screenshots of a published store listing or proof of live detection. Promotional tile is original HTML-rendered artwork, 440×280.

## Scores

| Dimension | Score /100 | Evidence limit |
|---|---:|---|
| Launch readiness | **68** | Human/publication/settlement gates remain. |
| Technical quality | 88 | Clean domain separation and passing tests; live compatibility pending. |
| Financial reliability | 80 | Source-backed Marketplace reference rates; account/rounding exceptions remain. |
| Security/privacy | 94 | Narrow site access, no network/telemetry, message validation, clean audit. |
| Beginner usability | 72 | Fee reference category reduces entry; no real-user timings yet. |
| Accessibility | 80 | Automated evidence only; manual assistive technology still required. |
| Keyboard usability | 88 | Automated workflow passes; native panel/full manual trial pending. |
| Screen-reader usability | 55 | Semantic structure/live announcements; VoiceOver not tested. |
| Low-vision usability | 82 | Narrow reflow/text tests pass; actual zoom/user trial pending. |
| Error prevention | 91 | No uncertain silent fallback; review gate, input validation and invalidation. |
| Advanced-user efficiency | 86 | Breakdown, promotions, independent program caps, ROI/ROAS and goals. |
| Chrome policy compliance | 80 | Conservative implementation/draft disclosures; no Chrome approval. |
| Open-source readiness | 88 | GPL repository, docs, CI and release gate; canonical remote configured, private contact pending. |
| Commercial validation readiness | 50 | Working prototype; market/user validation and accounts unprepared. |

The requested ≥90 launch score is **not met**. No numeric score overrides a mandatory human accessibility or usability release gate.

## Blocking issues before submission

1. Compare actual seller settlements against commission/growth, shipping/program fee rounding and bases; resolve ambiguous spike-day cap/pre-order handling, installment conditions, category-specific exceptions and Mall schedules. Presets are reference rates linked by Shopee at research time, not guaranteed account rates.
2. Validate extraction against live Shopee product variants, discounts, delayed rendering, SPA navigation and failures. Current selectors are conservative and may request manual input frequently. No live compatibility claim.
3. Test actual Chrome native side-panel keyboard navigation, 200% zoom and VoiceOver with recorded tester/version/results. All critical accessibility defects are release blockers even if axe passes.
4. Conduct representative real-user installation/calculation/comprehension trials. No evidence yet for ≤30 seconds, ≤5 seconds, ≥95% completion or <1% critical errors.
5. Finalize branding/trademark/store/domain review; verify the configured public repository and prepare private security/conduct contacts, public privacy-policy URL and Chrome developer account.
6. Configure and run CI on that repository, fill release-gate.json only with evidence, then obtain Chrome review. A local passing run is not evidence of hosted CI approval.

## Nonblocking later improvements

- Filipino localization and NVDA/Windows verification.
- Multiple named local profiles and safe import.
- Editable arbitrary separate program fee rows and richer scenario comparisons.
- Exact centavo minimum-price solver where rounding discontinuities matter.
- Optional configured Ko-fi/Sponsors links; no donation account is needed for core use.

Canonical GitHub repository: https://github.com/paulcastor30/marketplace-profit-intelligence. Website hosting, Chrome Store distribution, private conduct/security contacts and funding accounts remain unprepared. No account details or usage/testimonials are invented.
