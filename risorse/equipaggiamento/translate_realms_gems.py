import json
import time
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "risorse" / "equipaggiamento" / "realms_gems.json"
CACHE = ROOT / "risorse" / "equipaggiamento" / "realms_gems_translations.json"
USER_AGENT = "CompanionAppDataBot/1.0"


def load_json(path, fallback):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return fallback


def save_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def translate(text, cache):
    text = (text or "").strip()
    if not text:
        return ""
    if text in cache:
        return cache[text]
    url = "https://translate.googleapis.com/translate_a/single?" + urllib.parse.urlencode({
        "client": "gtx",
        "sl": "en",
        "tl": "it",
        "dt": "t",
        "q": text,
    })
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))
    translated = "".join(part[0] for part in payload[0] if part and part[0]).strip()
    translated = cleanup(translated)
    cache[text] = translated
    time.sleep(0.08)
    return translated


def cleanup(text):
    return (
        text.replace("gp", "mo")
        .replace("pezzi d'oro", "mo")
        .replace("Pietre preziose", "Gemme")
        .replace("pietre preziose", "gemme")
        .strip()
    )


def main():
    gems = load_json(DATA, [])
    cache = load_json(CACHE, {})
    fields = ("descrizione", "potere", "tipo", "reperibilita")
    total = 0
    for index, gem in enumerate(gems, 1):
        for field in fields:
            value = gem.get(field, "")
            if value:
                gem[field] = translate(value, cache)
                total += 1
        if index % 20 == 0:
            save_json(DATA, gems)
            save_json(CACHE, cache)
            print(f"{index}/{len(gems)} translated_fields={total} cache={len(cache)}")
    save_json(DATA, gems)
    save_json(CACHE, cache)
    print(f"translated_fields={total} gems={len(gems)} cache={len(cache)}")


if __name__ == "__main__":
    main()
