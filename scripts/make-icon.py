from pathlib import Path
from shutil import copyfile

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\22347\Pictures\OIP-C.jpg")
ASSETS = ROOT / "build" / "assets"
TARGET_JPG = ASSETS / "app-icon-source.jpg"
TARGET_ICO = ASSETS / "app-icon.ico"

ASSETS.mkdir(parents=True, exist_ok=True)
copyfile(SOURCE, TARGET_JPG)

with Image.open(SOURCE) as image:
    image = ImageOps.exif_transpose(image).convert("RGBA")
    image.thumbnail((256, 256), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (256, 256), (255, 255, 255, 0))
    left = (256 - image.width) // 2
    top = (256 - image.height) // 2
    canvas.alpha_composite(image, (left, top))
    canvas.save(TARGET_ICO, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
