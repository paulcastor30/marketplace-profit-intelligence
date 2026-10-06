# Permission review

| Permission / site access | Purpose and implementation | Narrower alternative |
|---|---|---|
| `sidePanel` | Accessible persistent calculator; manifest side_panel and background setPanelBehavior | Popup is narrower UI but loses persistent context and space. |
| `storage` | Explicitly saved cost defaults; temporary per-tab product snapshots; storage.ts/background.ts | In-memory-only would lose defaults or worker state. No sync API is used. |
| Content-script match `https://shopee.ph/*` | Automatic visible product detection with product-route guard in parser/content.ts | activeTab + scripting would require each-page invocation. Automatic detection requested in scope justifies this exact single-host match. |

No `<all_urls>`, cookies, history, tabs permission, activeTab, scripting, downloads, webRequest or remote host access. `chrome.tabs` events/query are used only for unprivileged tab IDs and cache invalidation; privileged tab fields are not read by the panel. No required host_permissions entry beyond the declared content-script site access.

Content script starts on exact Shopee host but extracts only recognized product routes. Main frame only. It does not read checkout, account, seller credentials or private messages. Restricted-domain product read is disclosed in listing/privacy. Storage access is restricted to trusted extension contexts; product messages are sanitized by the service worker.

Sources: [Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel), [Chrome Web Store policies](https://developer.chrome.com/docs/webstore/program-policies/policies), accessed 2026-10-07. These support permission design; they do not constitute Chrome approval.
