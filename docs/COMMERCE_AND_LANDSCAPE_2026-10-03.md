# Commerce UI and landscape improvements — 2026-10-03

## Wagon packing

The packing panel now uses the game's paper, timber and painted cargo art, with a capacity meter and remaining-space count above the list. Cargo is shown in two columns on wide desktops and one on narrower desktops. Meal, seed, powder and household goods reuse existing sprite assets; there is no new raster art. Each card separates item name, per-item space, loaded space, description and controls. Controls cannot add cargo beyond the displayed capacity; the server still validates every change. Quantity changes preserve list scroll and keyboard focus. Livestock/land choices are an expandable section, leaving room for the cargo list. Done remains outside that scroll area.

The vehicle illustration follows wagon/cart/ox-pack means. The pre-start packing deadline and the consequences of leaving supplies behind remain visible. Packing is still the existing starting-load operation; this does not create a new in-world cargo/inventory system.

## Town shopping and trading

The errand dialog has search, a shop selector and All/Buy/Sell/Services filters. Unavailable unselected offers are removed from the primary list. If a selected offer becomes unavailable, its reason remains visible and the server's refusal prevents dispatch. Each + explicitly states its lot contents, avoiding confusion between purchases and individual units. Quantities can also be typed directly and committed with Enter or by leaving the field. A separate shopping list retains selections when browsing other shops or filters and lets the player remove a line directly. It states the payment choice and keeps the authoritative after-trip resources and transport quote.

Search/filter changes never alter the order. Sales still occur before purchases under the server's existing rules. Shop prices, inventory, load limits, exclusive wagon/horse use and availability remain server decisions. Enter on quantity buttons now activates that button; it no longer dispatches an errand unexpectedly. Escape cancels and returns focus to the initiating control. The dialog retains focus and list scroll during quotes. The nearby-family trade form receives matching paper controls.

## Streets

All town street renderers now use `drawStreets` in `public/landscape-art.js`. Town streets follow exact polyline vertices, preserving surveyed/sketched corners. Regional roads and rivers retain their curved interpolation. Shared material layers render across the whole local network, so an intersecting road does not lay a border stripe across the junction. Ruts stop at shared junctions, and unbuilt survey lines remain faint.

Fine, interpretive building placements that stood in carriageways move into adjacent lots. Gonzales's two shop paths now avoid shop anchors; Béxar's north-frontage houses move off the north lane; Anahuac's disconnected path fragments receive a faint interpretive connector. Exact coordinates and reconstruction limits are in `TOWN_STREET_REPAIRS_2026-10-03.md`. IDs, keeper associations, surveyed street lines and named dimensions are preserved. These are scenery changes, not new historically surveyed coordinates or a new route simulation.

## Flood water

High water uses a darker, desaturated silty-water palette distinct from both road dirt and the ordinary blue river. The exaggerated saturated-ground band is narrower and fainter. Overbank water has a continuous irregular shoreline attached to the existing curved channel, avoiding isolated circular blobs or an additional uniform track. Pale curved ripples and driftwood remain visible.

Current shimmer is prepared from the visible watercourses only when cached ground changes, then drawn independently of that cache. It is limited to 160 marks in total, 32 per course, with no ground rebuild per animation frame. Reduced motion disables current movement. Water level, ford closures, weather history, world visibility and flood simulation are unchanged. This is stylized water presentation, not fluid dynamics or topographic inundation modeling.

## Validation and continuation

All 94 focused tests pass across commerce, wagon loads, shop rules, errands, trading, weather, water alignment, town layouts and street clearance. Every non-water building ground anchor in the generic town layouts is checked against built street carriageways. Existing river-clearance and keeper-placement checks pass.

Browser checks cover desktop bounds at 1440×950, 1366×768 and 1024×768; cargo capacity/disclosure; searching; keyboard quantities; filtered selections; removal; Escape; and no page errors. The existing Host town proof visits all 14 generic town layouts successfully. A separate contact sheet reviews those plus Gonzales and Béxar, and verifies that town paths use exact vertices without Bézier overshoot. Flood proof compares ordinary/high/overbank water and confirms current frames change pixels.

Reproduce with `node scripts/commerce-ui-proof.mjs`, `node scripts/street-visual-proof.mjs`, `node scripts/flood-visual-proof.mjs` and `node scripts/towns-browser-proof.mjs`. Set `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` to the local Playwright/Chrome paths when necessary. Evidence is in `docs/evidence/commerce-*`, `town-streets.*`, `towns-browser.json` and `flood-visual.*`.

Claude can extend cargo visuals to tools, add explicit shop illustrations, and refine flood debris/shoreline materials without changing the server contracts. Keep selected purchases intact across all filters, preserve native keyboard actions, and keep current motion outside the cached ground. Desktop is the supported target; these checks make no phone or physical classroom/LAN claim.
