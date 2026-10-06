# Architecture

`src/domain/`: pure typed financial functions, centavo validation, fee models, inverse price calculation. No DOM or Chrome APIs. All monetary fields are bounded to ₱1m; quantity 1–1000. Products in one order must be identical. Fee math uses BigInt for rational percentage rounding; results are bounded safe integers.

`src/marketplaces/`: MarketplaceAdapter interface and ShopeePhilippinesAdapter. The adapter recognizes only exact HTTPS `shopee.ph` product routes. Its default fee configuration returns null until the user chooses a category. Standard Marketplace presets are isolated in category-rates.ts; Mall/category overrides require review. A future adapter may provide verified typed configuration; the domain/UI stay unchanged.

`src/extension/content.ts`: isolated content script, watches only relevant visible heading/price elements. Mutation debounce and a two-second SPA check handle updates. No hidden metadata or arbitrary body currency scanning. Conservative fail-closed extraction trades coverage for financial trust.

`background.ts`: opens the native side panel. Validates sender ID, exact product URL, numeric price, bounded name and message type. Keeps per-tab snapshots in session storage. Navigation/tab closure invalidates snapshots. Trusted extension contexts alone can access storage. No externally connectable listener or web-accessible resources.

`src/ui/`: semantic native DOM controls, textContent for untrusted data, deliberate calculate action, progressive disclosure, local profile storage and stale-result invalidation. Product/category changes require fee review. Profile whitelist excludes URL, product name, price and product cost. Fee confirmation expires at 30 days or a configuration version change. No import or arbitrary remote configuration.

`public/`: HTML/CSS, MV3 manifest, packaged privacy page and generated icons. `scripts/`: deterministic bundle, local-only test server, ZIP integrity check. No runtime dependencies. esbuild bundles all executable code.

Future extension points: new MarketplaceAdapter; a verified configuration provider returning FeeConfiguration; separate program FeeRule entries for independent caps. No payment, authentication, service or other marketplace is implemented.
