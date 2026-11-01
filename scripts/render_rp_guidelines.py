import pymupdf
import os

out_dir = 'public/assets/templates/rp'
os.makedirs(out_dir, exist_ok=True)

docs = [
    ('C:/Dev/rp-templates-extracted/MPT_Intro_to_Templates.pdf', 'intro'),
    ('C:/Dev/rp-templates-extracted/MPT_Physique_Training_Template_How-To.pdf', 'howto'),
    ('C:/Dev/rp-templates-extracted/MPT_Physique_Training_Template_FAQ_1.pdf', 'faq')
]

rendered_files = []
page_counter = 1

for pdf_path, prefix in docs:
    doc = pymupdf.open(pdf_path)
    print(f"Processing {pdf_path}: {len(doc)} pages")
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=150)
        filename = f"rp_guide_{page_counter:02d}.png"
        filepath = os.path.join(out_dir, filename)
        pix.save(filepath)
        rendered_files.append(filename)
        page_counter += 1

print(f"Rendered {len(rendered_files)} guideline images in {out_dir}:")
for f in rendered_files:
    sz = os.path.getsize(os.path.join(out_dir, f))
    print(f"  {f} ({sz // 1024} KB)")
