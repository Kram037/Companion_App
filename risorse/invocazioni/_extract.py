"""Estrattore di testo dal PDF Liste D&D 5 Invocations."""
from pypdf import PdfReader
from pathlib import Path
import sys

PDF = Path(__file__).parent / "invocazioni.pdf"
OUT = Path(__file__).parent / "_extracted.txt"

reader = PdfReader(str(PDF))
print(f"Pages: {len(reader.pages)}")

with OUT.open("w", encoding="utf-8") as f:
    for i, p in enumerate(reader.pages):
        f.write(f"\n===== PAGE {i + 1} =====\n")
        f.write(p.extract_text() or "")
        f.write("\n")

print(f"Scritto: {OUT}")
