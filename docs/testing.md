# Testing

Run `pnpm check` (lint, typecheck, unit tests, build, Playwright). Run `pnpm test:coverage` for coverage and `pnpm audit` for supply-chain review. Browser assets are separate from production ZIPs. The test server binds loopback only.

Financial vectors cover ordinary/low/high prices, zero cost/ad revenue, quantity, price/voucher bases, independent fees, minimum/cap/fixed/per-item charges, standard transaction peso rounding, centavo percentage rounding, combined programs, ROI definition, affiliate charges, promotion errors, target states, invalid/missing/extreme numbers, inverse price and impossible targets. A deterministic 250-case inverse-price regression verifies conservative estimates meet their targets.

Browser tests cover beginner interaction, result focus/announcements, review gate, invalid values, resetting defaults, promotions, independent calculation details, keyboard sequence, narrow reflow, large text, reduced motion, forced colors, automatic extraction updates/ranges/hidden/conflicting values. A loaded-extension test checks actual service worker, exact host content script, session snapshot, local saved defaults, export and deletion. Fixture tests establish behavior; they do not claim live Shopee compatibility.

For live Shopee QA: test a simple listing, selected variant, price range, flash sale, voucher-indicative price, sale/regular price together, delayed content, navigation, unsupported account/checkout pages and extraction failure. Verify no stale price or result can be reused silently. Record dates, public product URLs and screenshots with no private account data. No real/live Shopee page has been used for financial evidence in this workflow.

Manual native panel, actual zoom, VoiceOver and real-user trials remain required. Record actual test outcomes in qa-report.md and attach receipts to the release gate. Never relabel fixture or axe results as human tests or Chrome approval.
