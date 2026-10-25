"""Generate Repyntra Peak Signal brand assets locally (requires Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageChops

ROOT = Path(__file__).resolve().parents[3]
OUTPUT = ROOT / "artifacts" / "branding" / "repyntra"
RES = ROOT / "kmp" / "androidApp" / "src" / "main" / "res"
OUTPUT.mkdir(parents=True, exist_ok=True)
SIZE, SS = 432, 3
NAVY = (7, 20, 36)
INK = (14, 27, 48)
P_TOP, P_BOTTOM = (151, 43, 255), (75, 83, 245)
C_LEFT, C_RIGHT = (32, 135, 254), (0, 229, 219)
P_LINE = [(76, 287), (144, 201), (177, 235), (252, 112), (309, 204)]
C_LINE = [(209, 286), (257, 231), (297, 286), (368, 199)]
WIDTH = 29

def line_mask(points):
    pts = [(x * SS, y * SS) for x, y in points]
    mask = Image.new("L", (SIZE * SS, SIZE * SS), 0)
    dr = ImageDraw.Draw(mask)
    dr.line(pts, fill=255, width=WIDTH * SS, joint="curve")
    for x, y in pts:
        rad = (WIDTH * SS) // 2
        dr.ellipse((x-rad, y-rad, x+rad, y+rad), fill=255)
    return mask.resize((SIZE, SIZE), Image.Resampling.LANCZOS)

MASK_P = line_mask(P_LINE)
MASK_C = line_mask(C_LINE)

def blend(a,b,t):
    return tuple(int(x*(1-t)+y*t) for x,y in zip(a,b))

def layer(mask, first, second, axis):
    im = Image.new("RGBA", (SIZE, SIZE), (0,0,0,0))
    dr = ImageDraw.Draw(im)
    for v in range(SIZE):
        color = blend(first,second,v/(SIZE-1))+(255,)
        if axis == "x": dr.line((v,0,v,SIZE), fill=color)
        else: dr.line((0,v,SIZE,v), fill=color)
    im.putalpha(mask)
    return im

def symbol(mode="color"):
    if mode == "color":
        img = Image.new("RGBA", (SIZE,SIZE),(0,0,0,0))
        img.alpha_composite(layer(MASK_P,P_TOP,P_BOTTOM,"y"))
        img.alpha_composite(layer(MASK_C,C_LEFT,C_RIGHT,"x"))
        return img
    p = (255,255,255) if mode=="white" else INK
    mask = ImageChops.lighter(MASK_P, MASK_C)
    flat = Image.new("RGBA",(SIZE,SIZE),p+(255,))
    flat.putalpha(mask)
    return flat

def adaptive_symbol(mode="color"):
    # Android masks adaptive icons more aggressively, especially on splash.
    # Keep every stroked endpoint inside the icon-safe area.
    inner_size = int(SIZE * 0.78)
    inner = symbol(mode).resize((inner_size, inner_size), Image.Resampling.LANCZOS)
    output = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    output.alpha_composite(inner, ((SIZE-inner_size)//2, (SIZE-inner_size)//2))
    return output

def badge(bg, symbol_mode="color", size=1024):
    icon=Image.new("RGBA",(SIZE,SIZE),bg+(255,))
    icon.alpha_composite(symbol(symbol_mode))
    return icon.resize((size,size), Image.Resampling.LANCZOS)

def make_svg(mode):
    dark = mode in ("color-dark", "white-dark")
    bg = NAVY if dark else (255,255,255)
    back = '#%02x%02x%02x' % bg
    if mode=="white-dark":
        stroke_p=stroke_c="#ffffff"
        grad=""
    elif mode=="mono-light":
        stroke_p=stroke_c="#0e1b30"
        grad=""
    else:
        stroke_p="url(#purple)"
        stroke_c="url(#cyan)"
        grad='<defs><linearGradient id="purple" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#972bff"/><stop offset="1" stop-color="#4b53f5"/></linearGradient><linearGradient id="cyan" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#2087fe"/><stop offset="1" stop-color="#00e5db"/></linearGradient></defs>'
    pts=lambda p:' '.join('%s,%s' % (x,y) for x,y in p)
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 432 432">{grad}<rect width="432" height="432" rx="88" fill="{back}"/><polyline points="{pts(P_LINE)}" fill="none" stroke="{stroke_p}" stroke-width="29" stroke-linejoin="round" stroke-linecap="round"/><polyline points="{pts(C_LINE)}" fill="none" stroke="{stroke_c}" stroke-width="29" stroke-linejoin="round" stroke-linecap="round"/></svg>'
    (OUTPUT/f"repyntra-{mode}.svg").write_text(svg,encoding="utf-8")

for mode,bg,symbol_mode in [
    ("color-dark",NAVY,"color"),
    ("white-dark",NAVY,"white"),
    ("color-light",(255,255,255),"color"),
    ("mono-light",(255,255,255),"ink"),
]:
    make_svg(mode)
    badge(bg,symbol_mode).save(OUTPUT/f"repyntra-{mode}.png")
adaptive_symbol().save(OUTPUT/"repyntra-foreground-transparent.png")
adaptive_symbol("white").save(OUTPUT/"repyntra-monochrome-white.png")

def draw_wordmark(dark):
    canvas=Image.new("RGBA",(639,186),(0,0,0,0))
    sign=symbol().resize((166,166), Image.Resampling.LANCZOS)
    canvas.alpha_composite(sign,(-9,10))
    text="Repyntra"
    fontfile=Path("C:/Windows/Fonts/segoeuib.ttf")
    if not fontfile.exists(): fontfile=Path("C:/Windows/Fonts/arialbd.ttf")
    px=112
    while px>30:
        font=ImageFont.truetype(str(fontfile),px)
        bound=ImageDraw.Draw(canvas).textbbox((0,0),text,font=font)
        if bound[2]-bound[0]<=454:break
        px-=1
    bbox=ImageDraw.Draw(canvas).textbbox((0,0),text,font=font)
    x=171
    y=(186-(bbox[3]-bbox[1]))//2-bbox[1]
    draw=ImageDraw.Draw(canvas)
    first="Rep"
    second="yntra"
    primary = (244,249,255,255) if dark else INK+(255,)
    draw.text((x,y), first,font=font,fill=primary)
    offset=draw.textlength(first,font=font)
    mask=Image.new("L",(639,186),0)
    md=ImageDraw.Draw(mask)
    md.text((int(x+offset),y),second,font=font,fill=255)
    gradient=Image.new("RGBA",(639,186),(0,0,0,0))
    gd=ImageDraw.Draw(gradient)
    for col in range(639):
        t=max(0,min(1,(col-(x+offset))/max(1,454-offset)))
        gd.line((col,0,col,186),fill=blend((135,47,247),(0,155,228),t)+(255,))
    gradient.putalpha(mask)
    canvas.alpha_composite(gradient)
    return canvas
for variant in ("dark","light"):
    draw_wordmark(variant=="dark").save(OUTPUT/f"wordmark-{variant}.png")

# Native KMP: image-only resource modifications; keep application ID and data paths unchanged.
drawable=RES/"drawable-nodpi"
drawable.mkdir(parents=True,exist_ok=True)
Image.new("RGBA",(432,432), NAVY+(255,)).save(drawable/"gainslab_icon_background.png")
adaptive_symbol().save(drawable/"gainslab_icon_foreground.png")
adaptive_symbol("white").save(drawable/"gainslab_icon_monochrome.png")
adaptive_symbol().save(drawable/"ic_launcher_foreground.png")
adaptive_symbol("white").save(drawable/"ic_launcher_monochrome.png")
draw_wordmark(True).save(drawable/"repyntra_wordmark_dark.png")
draw_wordmark(False).save(drawable/"repyntra_wordmark_light.png")
for density,s in [("mdpi",48),("hdpi",72),("xhdpi",96),("xxhdpi",144),("xxxhdpi",192)]:
    mip=RES/f"mipmap-{density}"
    badge(NAVY,size=s).save(mip/"ic_launcher.png")
    badge(NAVY,size=s).save(mip/"ic_launcher_round.png")
mip=RES/"mipmap-nodpi"
badge(NAVY).save(mip/"ic_launcher.png")
badge(NAVY).save(mip/"ic_launcher_round.png")
print("Generated 4 SVG variants, 4 1024px badges, 2 transparent symbols, 2 wordmarks, and KMP Android launcher/notification resources.")
