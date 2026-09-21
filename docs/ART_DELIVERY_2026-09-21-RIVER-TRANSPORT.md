# River transport delivery — 2026-09-21

This delivery replaces the generic round-log ferry visual with historically distinct 1830s plank-ferry art and begins the named **Yellow Stone** set.

## Delivered

- `ferry-flatboat`: empty square-ended sawn-plank cable flatboat with low sides and apron ramps.
- `ferry-flatboat-laden`: the same boat carrying a covered wagon, ox team and ferryman working the cable.
- `ferry-post`: braced bank post with the ferry rope made fast.
- `steamboat-moored-1` and `-2`: Yellow Stone with still paddle and two authored smoke states.
- `steamboat-moored-3`: bow gangplank extended.
- `steamboat-moored-4`: cotton bales on the main deck.

The art carries no painted water or shore, so the same transparent sprites can sit on every authoritative river geometry. It carries no text or flag. East-facing boats may be mirrored for west-facing crossings.

## Historical silhouette

The ferry follows the project request's 1829–1830s flatboat description rather than the legacy emergency log raft. Yellow Stone is kept as a small early Western sidewheeler: long low hull, one visible side wheel amidships, twin sheet-iron chimneys, modest cabin and pilothouse, without a later tall Texas deck, stern wheel or ornamental gingerbread.

## Animation contract

- `steamboat-moored` alternates the two smoke states; the paddle wheel remains still.
- `steamboat-gangplank` and `steamboat-cotton-moored` are stable state poses.
- `ferry-flatboat-idle` and `ferry-flatboat-laden-idle` expose restrained renderer rock without claiming that the client moves a ferry.
- The server remains authoritative for which boat is present, loading state, crossing progress and travel time.

The under-way `steamboat-steam` and army-crowded `steamboat-laden` four-frame paddle loops remain open. They should not be inferred from these still-paddle frames.

## Files

- `public/assets/frontier-v1/atlases/ferry-flatboat.png`
- `public/assets/frontier-v1/atlases/steamboat-moored.png`
- `scripts/art-deliveries/river-transport.mjs`

Both PNGs are unchanged built-in ImageGen outputs. The module records prompts, source paths, review status and provenance for central registration.
