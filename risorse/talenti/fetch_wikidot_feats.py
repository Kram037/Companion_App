"""Recupera le descrizioni "not OGL" dei talenti da dnd5e.wikidot.com.

Le voci marcate `not_ogl: true` nel PDF aidedd hanno solo un summary
abbreviato perche' restrizioni di copyright. Wikidot D&D 5e contiene
spesso la descrizione integrale.

Lo script:
1. Carica `talenti.json` (output di parse_feats.py).
2. Per ogni talento `not_ogl`, costruisce l'URL `feat:<slug>`.
3. Scarica la pagina HTML e ne estrae descrizione + prerequisito.
4. Salva il risultato in `wikidot_descriptions.json` (mappa name_en -> dict).
5. parse_feats.py usera' questo file come ulteriore fonte (con priorita'
   inferiore al feat_translations.json manuale).
"""

import json
import re
import time
import urllib.request
import urllib.error
from html import unescape
from pathlib import Path

HERE = Path(__file__).resolve().parent
TALENTI_JSON = HERE / "talenti.json"
OUT_FILE = HERE / "wikidot_descriptions.json"

USER_AGENT = "Mozilla/5.0 (compatible; CompanionApp/1.0; +personal D&D companion)"
BASE_URL = "https://dnd5e.wikidot.com/feat:{slug}"

# Alias slug per nomi che divergono tra il PDF aidedd e wikidot.
SLUG_ALIASES = {
    "Dwarf Fortitude": "dwarven-resilience",
    "Fade away":       "fade-away",
}


def slugify_for_wikidot(name_en: str) -> str:
    if name_en in SLUG_ALIASES:
        return SLUG_ALIASES[name_en]
    s = name_en.lower()
    # Wikidot usa minuscole separate da '-' (no apostrofi/punteggiatura).
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def _clean_inline(html_chunk: str) -> str:
    """Rimuove tag inline (em, strong, span, a) preservando il testo."""
    # Rimuovi script/style anche se annidati.
    html_chunk = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html_chunk, flags=re.S | re.I)
    # Tag inline: rimuovi le tag, lascia il testo.
    html_chunk = re.sub(r"</?(em|strong|i|b|span|a|sup|sub)[^>]*>", "", html_chunk, flags=re.I)
    # Bisava: rimuovi tutti i restanti tag.
    html_chunk = re.sub(r"<[^>]+>", "", html_chunk)
    return unescape(html_chunk).strip()


def strip_html(html: str) -> str:
    """Estrae testo leggibile dal blocco <div id="page-content">.

    Strategia: troviamo `page-content`, tagliamo dopo il primo bordo
    "ad" / "action-area" / "floating-video" e processiamo solo <p> e <li>.
    """
    m = re.search(r'<div[^>]*id="page-content"[^>]*>', html, re.I)
    if not m:
        return ""
    start = m.end()
    # Tagliamo prima del primo widget di wikidot/pubblicita'.
    rest = html[start:]
    cuts = [
        rest.find("<!-- floating video"),
        rest.find('id="action-area"'),
        rest.find("page-info-break"),
        rest.find("page-options-container"),
    ]
    cuts = [c for c in cuts if c != -1]
    end = min(cuts) if cuts else len(rest)
    body = rest[:end]

    # Estrai tutti i blocchi <p>...</p> e <li>...</li> in ordine di apparizione.
    out_lines = []
    for match in re.finditer(r"<(p|li)[^>]*>(.*?)</\1>", body, flags=re.S | re.I):
        tag = match.group(1).lower()
        text = _clean_inline(match.group(2))
        if not text:
            continue
        if tag == "li":
            out_lines.append("- " + text)
        else:
            out_lines.append(text)
    return "\n".join(out_lines)


def parse_wikidot_text(text: str) -> dict:
    """Da testo grezzo wikidot estrae source, prerequisite, description."""
    lines = text.splitlines()
    source = None
    prereq = None
    desc_lines = []

    skip_phrases = (
        "click here to edit",
        "click here to toggle",
        "append content without",
        "check out how this page",
        "if you want to discuss",
        "view and manage file",
        "a few useful tools",
        "see pages that link",
        "change the name",
        "view wiki source",
        "view/set parent page",
        "notify administrators",
        "something does not work",
        "general wikidot",
        "wikidot.com terms",
        "wikidot.com privacy",
    )

    for line in lines:
        low = line.lower().strip()
        if low.startswith("source:"):
            source = line.split(":", 1)[1].strip()
            continue
        if low.startswith("prerequisite"):
            prereq = re.sub(r"^prerequisite[s]?[:\-\s]*", "", line, flags=re.I).strip()
            continue
        if any(low.startswith(s) for s in skip_phrases):
            break  # da qui in poi e' UI footer di wikidot
        # Salta intestazioni di pagina ("Foo - DND 5th Edition" e nome talento).
        if "dnd 5th edition" in low or "dnd 5e" in low:
            continue
        desc_lines.append(line)

    # Prima riga utile = di solito il nome del talento (titolo): scarta se duplicato.
    if desc_lines and len(desc_lines[0]) < 60 and "." not in desc_lines[0]:
        desc_lines = desc_lines[1:]

    description = "\n".join(desc_lines).strip()
    # Compattare righe consecutive senza bullet in un paragrafo.
    return {
        "source": source,
        "prerequisites": prereq,
        "description": description,
    }


def fetch_one(slug: str, retries: int = 2) -> str | None:
    url = BASE_URL.format(slug=slug)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            print(f"  [HTTP {e.code}] {url}")
        except Exception as e:
            print(f"  [ERR] {url}: {e}")
        if attempt < retries:
            time.sleep(1.5)
    return None


def main():
    if not TALENTI_JSON.exists():
        raise SystemExit(
            f"File mancante: {TALENTI_JSON}. Esegui prima parse_feats.py."
        )
    feats = json.loads(TALENTI_JSON.read_text(encoding="utf-8"))
    not_ogl = [f for f in feats.values() if f.get("not_ogl")]

    print(f"Voci not_ogl da fetchare: {len(not_ogl)}\n")

    # Carica risultati esistenti per evitare di rifare fetch (idempotente).
    existing = {}
    if OUT_FILE.exists():
        existing = json.loads(OUT_FILE.read_text(encoding="utf-8"))

    results = dict(existing)
    for f in not_ogl:
        en = f["name_en"]
        if en in results and results[en].get("description"):
            print(f"  [skip] {en} (gia' in cache)")
            continue
        slug = slugify_for_wikidot(en)
        print(f"  [fetch] {en:<40} -> {slug}")
        html = fetch_one(slug)
        if not html:
            print(f"          -> 404 / fallita")
            results[en] = {"slug": slug, "found": False}
            continue
        text = strip_html(html)
        parsed = parse_wikidot_text(text)
        if not parsed["description"]:
            print(f"          -> nessun testo utile estratto")
            results[en] = {"slug": slug, "found": False}
        else:
            results[en] = {
                "slug": slug,
                "found": True,
                "source": parsed["source"],
                "prerequisites_en": parsed["prerequisites"],
                "description_en": parsed["description"],
            }
            preview = parsed["description"][:80].replace("\n", " ")
            print(f"          OK ({len(parsed['description'])} chars): {preview}...")
        # Cortesia verso il server.
        time.sleep(0.6)

    OUT_FILE.write_text(
        json.dumps(results, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    found = sum(1 for v in results.values() if v.get("found"))
    print(f"\nFetched OK: {found}/{len(results)}")
    print(f"Scritto: {OUT_FILE}")


if __name__ == "__main__":
    main()
