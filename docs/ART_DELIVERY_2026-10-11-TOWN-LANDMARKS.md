# Researched town landmarks — complete September 16 group

The final three landmarks close items 8–10 of the ten-item town-building request. Items 1–7 remain supplied by town-buildings-researched.mjs. This delivery adds seven authored frames in four sheets, one smoke clip, and replaces the corresponding scenery placeholders.

| Sheet | Sprite / clip | Contract |
| --- | --- | --- |
| town-fort-velasco.png | town-fort-velasco-1835 | Circular broken double stockade, packed sand, central gun mound. Cannon deliberately separate. |
| town-harrisburg-steam-mill.png | town-harrisburg-steam-mill-1835 | Long plank mill, boiler house and stack, log deck, saw carriage and sawn timber. No baked smoke. |
| town-nacogdoches-stone-house.png | town-nacogdoches-stone-house-1835 | Two-storey ironstone house, gallery, exterior stair, two chimneys and shingle roof. |
| town-mill-smoke.png | town-mill-smoke-1 through -4; clip town-mill-smoke | Four distinct authored phases, 350 ms each, 1.4-second repeating loop; separate plume with fixed base. |

## Historical evidence and limits

Read the existing velasco.md, harrisburg.md and nacogdoches.md in town-research before adding historical scenes. Their measured and inferred geometry distinctions still apply.

- [Fort Velasco archaeology project](https://www.fortvelasco.org/mexico-battle-velasco) describes the double timber-and-sand fort. The local research supplies the ninety-foot circular footprint and derelict October 1835 condition. This illustration reconstructs the stockade, rather than depicting a surviving measured elevation. A broken entrance and irregular posts are authored details.
- [Harris County Historical Commission](https://historicalcommission.harriscountytx.gov/Local-History/Topics-of-General-Interest/harrisburg) records a steam sawmill in the early 1830s and its destruction in 1836. The plank shed, boiler enclosure, machinery arrangement and stack form are plausible period interpretations, not recovered building plans. Do not mistake this for the later railroad-era mills.
- [Old Stone Fort history](https://www.tshaonline.org/handbook/entries/old-stone-fort) supplies the original Stone House's 70-by-23-foot dimensions, two storeys, native ironstone, walnut openings and later lean-to. The gallery/stair/roof interpretation follows the later original-building photograph recorded in local research; its precise October 1835 appearance is uncertain. This is a house/courthouse, not a battlemented fort, and does not copy the 1936 museum replica.

## Integration for Claude

sim/town-layouts.mjs retains the existing landmark coordinates. Velasco replaces the repeated palisade ring with one complete stockade sprite and retains vel-fort-gun separately. drawWidthFeet:90 makes the stockade match the original footprint rather than the standard exaggerated building height. The separate cannon has a twelve-foot visual width (presentation choice, not a surveyed gun dimension). Its simulation identity and location are unchanged. The new fort anchor centres its footprint; it sorts just before the gun.

Harrisburg's single sprite includes its boiler enclosure and log deck, replacing three separate stand-ins; hbg-mill stays the stable primary ID. The two subsidiary scenery IDs hbg-mill-boiler and hbg-mill-logs are retired. Nacogdoches preserves nac-stone-house and its existing position. The mill and house retain the town renderer's existing height exaggeration. These are scenery exteriors: no new interior geometry, collision, ownership, saw operation or destruction simulation is implied.

public/town-art.js exports drawTownMillSmoke(ctx,x,y,height,{timeMs,operating}). Its default is OFF. townDrawables enables it only when labels['hbg-mill'].operating === true. Claude should supply that flag from authoritative mill activity, and suppress it after shutdown/destruction; existing callers do not yet provide that state. The authored loop is available and proven, but is not falsely advertised as a running industrial simulation. Buildings stay static; movable guns and smoke remain independent.

## Objective validation

- Strict atlas build: every new frame retains 100% of its visible object, zero overlap pixels trimmed. Three building sheets have zero-alpha corners. Smoke has at most 1/255 alpha residue at two extreme corners, invisible in the reviewed production composition; no raster cleanup or lowered builder threshold.
- tests/town-landmarks-art.test.mjs checks complete crops, stable placement, separate cannon, measured fort width, removal of duplicate mill props and the registered four-phase loop.
- Existing town tests cover all layout sprite references, waterways, keeper positions and frame arithmetic. Full art-library and asset HTTP tests cover inventory and serving.
- scripts/town-landmarks-art-proof.mjs renders all three through production townDrawables, shows the separate gun, verifies four different smoke images, and proves inactive smoke draws no pixels. Screenshot and machine-readable result: evidence/town-landmarks-art.png and .json.
- All fourteen unit/inventory/serving tests pass. npm run test:towns passes fifteen checks across all fourteen towns through the actual Host view.
- The Host proof initially exposed an existing missing public route for wading-art.js, preventing startup. The explicit static route is now registered and byte-for-byte serving is regression-tested; the rerun passes with no page errors.

Source PNGs were copied unchanged from built-in imagegen. Exact prompts, references, selected generated paths and the cannon-removal edit are in scripts/art-deliveries/town-landmarks-2026-10-11.mjs and the generated art-prompts/art-provenance records. No deployment performed.
