"""Draw the project's native tab icons using simple geometry."""
from pathlib import Path
from PIL import Image, ImageDraw

target = Path(__file__).resolve().parents[1] / "miniprogram" / "assets"
target.mkdir(parents=True, exist_ok=True)
for active, color in [(False, "#8a938a"), (True, "#235347")]:
    for name in ["home", "gardens", "orders", "forecast"]:
        im = Image.new("RGBA", (96, 96))
        d = ImageDraw.Draw(im)
        if name == "home":
            for x in [17, 53]:
                for y in [17, 53]:
                    d.rounded_rectangle((x, y, x + 25, y + 25), radius=5, outline=color, width=4)
        elif name == "gardens":
            d.line([(14, 70), (35, 38), (52, 57), (68, 28), (84, 70)], fill=color, width=4, joint="curve")
            d.line([(16, 83), (82, 83)], fill=color, width=4)
            d.ellipse((17, 16, 30, 29), outline=color, width=3)
        elif name == "orders":
            d.rounded_rectangle((23, 18, 76, 85), radius=5, outline=color, width=4)
            d.rounded_rectangle((36, 11, 63, 26), radius=3, fill="#f5f6ef", outline=color, width=4)
            for y, x2 in [(42, 64), (57, 64), (72, 51)]:
                d.line([(35, y), (x2, y)], fill=color, width=4)
        else:
            d.line([(17, 15), (17, 81), (84, 81)], fill=color, width=4)
            d.line([(29, 63), (47, 42), (63, 50), (84, 20)], fill=color, width=4, joint="curve")
            for x, y in [(29, 63), (47, 42), (63, 50), (84, 20)]:
                d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=color)
        im.resize((72, 72), Image.Resampling.LANCZOS).save(target / f"{name}{'-active' if active else ''}.png")
print("Generated 8 native tab icons")
