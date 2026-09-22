# Launcher art outside the game atlas

## `icon-delete-save`

- Runtime file: `launcher/art/icon-delete-save.png`
- Embedded resource: `TexasRevolution.Launcher.art.icon-delete-save.png`
- Generated source: `C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-ec4baab6-28b4-4e65-b6ab-f6c24b6b8c0a.png`
- Tool: built-in `image_gen.imagegen`
- Mode: generate
- Reference: `public/assets/frontier-v1/atlases/icons-family-actions-1.png`
- Post-processing: none; the generated PNG is embedded unchanged. The launcher scales and tints it at draw time.

Prompt:

> Use case: UI-icon. Create one square production icon for the Windows launcher of an 1835–1836 Texas frontier game. Subject: an unmistakable delete-save emblem represented as a small frontier stave refuse pail with its fitted wooden lid tipped open, simple handle visible, no water. Strong compact silhouette readable at 16×16 and 32×32 pixels. Render as a clean near-white monochrome mask with smooth anti-aliased edges and only a few essential interior cut lines, designed to be color-tinted in code to near-black, white, or warning red. Genuine transparent RGBA background with generous empty margin. Centered, front three-quarter view, no drop shadow. No modern trash can, wheelie bin, recycling symbol, text, letters, X mark, scenery, brown backdrop, black backdrop, checkerboard, border, glow, gradient, watermark, extra objects, or cropping.

The Play Solo dialog uses the image when the resource is available. It tints the same source to the row color and warning red on hover. The former line-drawn bin remains only as a packaging fallback if the embedded image cannot load.
