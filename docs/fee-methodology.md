# Fee methodology and evidence ledger

Research date: **7 October 2026 (Asia/Manila)**. Configuration: `ph-2026-10-07.2`. Verification is **partial**: standard Marketplace rate references are source-backed; Mall rates, detailed settlement rounding, account eligibility and some program exceptions remain assumptions.

## Primary evidence

[Shopee PH terms §23](https://help.shopee.ph/portal/4/article/77272), accessed 2026-10-07:

| Rule | Implemented reference | Conditions / uncertainty |
|---|---|---|
| Standard transaction | 2.24%; nearest peso | VAT included; purchase monies before platform rebates; installment variation requires override. Buyer-paid shipping is entered separately. |
| Processing | ₱5/order | Effective 2025-09-03; first 50 successful monthly orders waived, selected explicitly. |
| Commission | Marketplace category presets, 8.50–10.50% | Official linked table effective 2025-06-01; Mall and overrides require manual rates. |
| Growth | 1% or 1.5%, by category | Official category table visually verified; effective 2026-05-11; confirm eligibility. |
| Platform shipping | 5.6% Marketplace / 4.48% Mall; ₱100/item cap | Official page checked; applicability depends on supported logistics. |
| MDV / Live Xtra | 4% / 3.36%, respective ₱200 / ₱100 item caps | The stated 1% Live discount is modeled as a 1-point reduction to 2.36% with MDV (reviewed assumption); spike-day MDV 5% cap treatment remains assumption. |
| Non-customized pre-order | 2% | Effective 2026-01-01; fee basis/rounding needs settlement confirmation. |

The [official Seller Fees article](https://seller.shopee.ph/edu/article/21077) was read in a JavaScript-capable browser. Its linked [Marketplace commission table](https://docs.google.com/document/d/1zZGKQl9FfykrLhKxLjI8ucAnXBhrzYYp16YcVub5yVw/edit) was exported as Markdown and visually checked to resolve merged cells. The table is titled effective June 1, 2025 and remains linked by Shopee at the research date; recheck for account notices/new schedules before use. Marketplace presets and growth mapping are isolated in category-rates.ts. Category is selected by the seller, not inferred from listing title. Spare-parts category lacks an explicit growth row and is excluded from presets. Mall commission is manual.

Reference grouping: cameras/mobile devices 8.50%; other mobile/computers 9%; audio/gaming/appliances/food/mom-and-baby 9.50%; beauty/health/pets/vehicles/accessories/bags/shoes/watches 10%; books/hobbies/home/sports/stationery/travel and clothing/baby fashion 10.50%. Growth is 1% or 1.5% according to the separately checked official category image. The explicit data rows and tests are authoritative for implemented mappings.

Defaults for named optional programs are off. They mean the user confirmed nonparticipation through fee review, not that every seller is unenrolled. MDV and Live are evaluated independently with separate caps. An eligible new-seller selection sets commission/growth/processing to zero for the scenario; it does not discover the account's age or assert exemption. Platform shipping still applies unless overridden. Additional custom program charges are entered separately. Seller discounts reduce settlement; platform-funded vouchers do not. Income tax/creditable withholding remain excluded.

Secondary cross-checks, not configuration authorities: [BigSeller, 2026-09-22](https://www.bigseller.com/blog/articleDetails/shopee-seller-fees-taxes-philippines-2026.4957.htm) and [Siite, 2026-09-22](https://siite.ph/articles/what-each-selling-platform-keeps/). Their simplified arithmetic differs in precision and omission of exceptions. They are not used to silently populate rates.

## Exact engine conventions

All monetary inputs are integer centavos; percentage inputs are integer basis points (2.24% = 224). Input prices and costs accept at most two decimals. PHP currency is used throughout. Half values round upward for nonnegative fee amounts. No floating-point percentage subtraction drives fee amounts.

One modeled order contains q identical items at per-item price P, with product cost C per item. Packaging K, ads A, extra seller voucher D, seller shipping S, fixed affiliate F, miscellaneous M and buyer shipping B are per order. **Do not enter D if it is already included in P.**

- Gross product revenue R = Pq.
- Net product settlement T = R − D. Reject D > R.
- Settlement fee basis = round T to nearest peso.
- Buyer transaction basis = T + B. Buyer shipping is not product revenue or a seller expense; it only changes the transaction base.
- Fee f = percentage of its selected base plus fixed amount, rounded using its rule, clamped to minimum and cap. For per-item rules divide base equally by q, clamp/round each, multiply by q. Fixed amounts and clamps share that rule's scope.
- Affiliate = round(T × affiliate basis points / 10000) + F, in centavos.
- Profit = R − Cq − sum(fees) − K − A − D − S − affiliate − M.
- Profit margin = profit / R × 100. At R = 0 it is not applicable. Denominator deliberately uses **gross product revenue before extra seller vouchers**.
- Invested cost = Cq + K + A + S + F + M. ROI = profit / invested cost × 100, or not applicable at zero invested cost. Marketplace fees, seller vouchers and percentage affiliate are excluded from this explicitly labeled denominator.
- Maximum total ad budget/order = max(0, profit with A = 0). This is a total ad allowance, not extra budget beyond existing ads.
- Break-even ROAS = R / maximum ad budget. No positive budget means not attainable.
- Status: profit ≤ 0 → POSSIBLE LOSS; positive profit below selected gross-revenue margin → LOW MARGIN; otherwise PROFITABLE. Zero profit has no safety margin and receives a caution state.
- Promotion: reduce P by the selected percent, round to centavos, recalculate all fees. Keep D and other costs fixed. Reject a promotion if it makes D exceed revenue.

### Inverse prices and rounding

Percentage charges scale with price; naive cost subtraction is never used. Inverse prices use a conservative continuous upper envelope of fees: include up to half a peso of base rounding, half a fee rounding unit per scoped fee, and half a centavo of affiliate rounding, then apply caps/minima. Binary search integer centavos for an upper-envelope profit meeting the selected margin, within the ₱1m price bound. The envelope has nondecreasing profit slope as caps engage; once sufficient, higher prices remain sufficient. Results are **approximate conservative minimum/target prices**, not exact global centavo minima in a discontinuous fee schedule. The small allowance may recommend a higher price than strictly necessary. Actual recalculation must meet the target; randomized boundary tests check that invariant.

Commission/growth fee rounding to centavos and shipping/program base rounding remain explicit user-reviewed assumptions until settlements confirm them. Named MDV/Live programs use independent item caps. The additional custom program field works only for charges sharing a base and cap; do not merge separate caps. Spike-day cap applicability, pre-order basis, logistics exceptions and Mall commission require explicit scenario review. This blocks claims of complete settlement/program coverage.

### Taxes and excluded cases

VAT-inclusive fees are not increased by another 12%. The engine does not estimate income tax, tax credits, creditable withholding, input-VAT recovery, return/cancellation adjustments, multi-product baskets, cross-border accounts, finance charges, labor or overhead unless entered as costs. **Profit is not net payout.** Tax credit treatment must not be disguised as a permanent profit expense. No tax advice or tax-compliance claim is made.

## Update procedure

1. Retrieve current primary schedule and record an archived evidence reference.
2. Confirm category, seller type, effective dates, exemptions, basis, rounding and each cap.
3. Add/update isolated FeeRules and increment configuration version.
4. Record changes in this ledger and CHANGELOG.
5. Add exact boundary/settlement test vectors for each changed rule.
6. Run unit, browser, accessibility and security checks.
7. Update the verification date only for rules actually verified.
8. Complete release gates and issue a packaged extension release. Never download executable fee code.
