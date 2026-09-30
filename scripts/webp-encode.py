# Encode PNG pictures as WebP, for scripts/build-webp.mjs (which decides what and how; this only encodes).
#
# Reads a JSON list of jobs on stdin: [{"src": "<png>", "dst": "<webp>", "lossless": true|false, "quality": 90}], writes
# each WebP, and prints one JSON line per job: {"dst", "bytes", "ms", "exact"}. A lossless job is decoded again and
# compared with its PNG pixel for pixel, every channel, every pixel (transparent ones too): "exact" is false if a single
# value differs, and scripts/build-webp.mjs then refuses the result. Pillow with WebP support is the only dependency
# (docs/PERFORMANCE_LOAD.md measured the q90 and lossless sizes with it).
import json
import os
import sys
import time
from concurrent.futures import ProcessPoolExecutor

from PIL import Image, features


def encode(job):
    started = time.perf_counter()
    source = Image.open(job["src"])
    source.load()
    # Sheets are RGBA; anything else (a palette PNG, a landscape without alpha) is widened to the mode WebP keeps.
    mode = "RGBA" if source.mode in ("RGBA", "LA", "P", "PA") or "transparency" in source.info else "RGB"
    picture = source.convert(mode) if source.mode != mode else source
    temporary = job["dst"] + ".part"
    if job["lossless"]:
        # exact: keep the colour under fully transparent pixels too, so the decoded sheet is the PNG, byte for byte.
        picture.save(temporary, "WEBP", lossless=True, quality=100, method=5, exact=True)
    else:
        picture.save(temporary, "WEBP", quality=job.get("quality", 90), method=5, alpha_quality=100)
    exact = None
    if job["lossless"]:
        with Image.open(temporary) as back:
            back.load()
            exact = back.convert(mode).tobytes() == picture.tobytes()
    os.replace(temporary, job["dst"])
    return {"dst": job["dst"], "bytes": os.path.getsize(job["dst"]), "ms": round((time.perf_counter() - started) * 1000), "exact": exact}


def main():
    if not features.check("webp"):
        print(json.dumps({"error": "this Pillow was built without WebP"}), flush=True)
        sys.exit(2)
    jobs = json.load(sys.stdin)
    workers = int(os.environ.get("WEBP_JOBS") or max(1, (os.cpu_count() or 2) - 1))
    with ProcessPoolExecutor(max_workers=workers) as pool:
        for result in pool.map(encode, jobs):
            print(json.dumps(result), flush=True)


if __name__ == "__main__":
    main()
