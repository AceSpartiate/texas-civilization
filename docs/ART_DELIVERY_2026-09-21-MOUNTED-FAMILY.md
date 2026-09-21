# Mounted family delivery — 2026-09-21

Six transparent 4×4 atlases provide the complete requested mounted cast: `rust`, `teal`, `elder`, `blue`, `rust-woman`, `indigo`, `ochre`, and `blue-girl`. Each identity has four authored walk frames facing east, south, and north; east mirrors west. The horse is the established chestnut courier horse with black mane and tail and a small white forehead mark.

All riders use an astride seat for practical frontier travel. Women and the adolescent girl retain period skirts arranged modestly over the saddle and legs. Riders have complete legs, boots, stirrups, and reins rather than the previous waist-cutoff composite.

The delivery module is `scripts/art-deliveries/mounted-family.mjs`. Runtime clips follow `<variant>-ride-e`, `-s`, and `-n`; frames add `-1` through `-4`. Integration should return those clips from `seatedClip` and let `carriedWithRider` suppress the separately drawn horse.

The built-in image generator produced every source. East sheets received a built-in 78% spacing correction because the otherwise accepted tails and noses sat too close to cell boundaries. No local raster rewrite was used.
