"""Estrae il testo dal PDF dei veleni e lo scrive in veleni.txt."""
import pypdf
import pathlib

HERE = pathlib.Path(__file__).parent
SRC  = HERE / 'veleni.pdf'
DEST = HERE / 'veleni.txt'

reader = pypdf.PdfReader(str(SRC))
parts = []
for i, page in enumerate(reader.pages):
    parts.append(page.extract_text() or '')
    parts.append(f"\n-- {i+1} of {len(reader.pages)} --\n")

DEST.write_text('\n'.join(parts), encoding='utf-8')
print(f"[extract] estratto {len(reader.pages)} pagine -> {DEST}")
