import html
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path


API = "https://forgottenrealms.fandom.com/api.php"
OUT = Path(__file__).with_name("realms_metals.json")
USER_AGENT = "CompanionAppDataBot/1.0"


def api_get(params):
    url = f"{API}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def slugify(value):
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return f"realms-metal-{slug or 'metal'}"


def category_members():
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": "Category:Metals",
        "cmtype": "page",
        "cmlimit": "500",
        "format": "json",
    }
    members = []
    while True:
        data = api_get(params)
        members.extend(data.get("query", {}).get("categorymembers", []))
        cont = data.get("continue", {}).get("cmcontinue")
        if not cont:
            break
        params["cmcontinue"] = cont
    return sorted({member["title"] for member in members})


def page_wikitext(title):
    data = api_get({
        "action": "parse",
        "page": title,
        "prop": "wikitext",
        "format": "json",
    })
    return data.get("parse", {}).get("wikitext", {}).get("*", "")


def strip_templates(text):
    previous = None
    while previous != text:
        previous = text
        text = re.sub(r"\{\{[^{}]*\}\}", " ", text, flags=re.S)
    return text


def clean_inline(text):
    text = html.unescape(text or "")
    text = re.sub(r"<ref\b[^>/]*/>", " ", text, flags=re.I)
    text = re.sub(r"<ref\b[^>]*>.*?</ref>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
    text = strip_templates(text)
    text = re.sub(r"\[\[File:[^\]]+\]\]", " ", text, flags=re.I)
    text = re.sub(r"\[\[Image:[^\]]+\]\]", " ", text, flags=re.I)
    text = re.sub(r"\[\[[^|\]]+\|([^\]]+)\]\]", r"\1", text)
    text = re.sub(r"\[\[([^\]]+)\]\]", r"\1", text)
    text = re.sub(r"\[https?://[^\s\]]+\s+([^\]]+)\]", r"\1", text)
    text = re.sub(r"\[https?://[^\]]+\]", " ", text)
    text = re.sub(r"'{2,}", "", text)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def section_text(wikitext, wanted):
    lines = wikitext.splitlines()
    capture = False
    level = 0
    out = []
    for line in lines:
        match = re.match(r"^(=+)\s*(.+?)\s*\1\s*$", line.strip())
        if match:
            current_level = len(match.group(1))
            title = clean_inline(match.group(2)).strip().lower()
            title = re.sub(r"\s*\[[^\]]*\]\s*", "", title).strip()
            if capture and current_level <= level:
                break
            if title == wanted.lower():
                capture = True
                level = current_level
                continue
        if capture:
            out.append(line)
    return "\n".join(out)


def compact_summary(text, limit=720):
    text = re.sub(r"\s+", " ", text or "").strip()
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(".", 1)[0]
    if len(cut) < 160:
        cut = text[:limit].rsplit(" ", 1)[0]
    return f"{cut.strip()}."


def clean_section(text):
    lines = []
    for line in text.splitlines():
        raw = line.strip()
        if not raw or raw.startswith(("{|", "|}", "|-", "!", "|", "[[Category:")):
            continue
        if raw.startswith("*"):
            raw = raw.lstrip("*").strip()
        lines.append(raw)
    return compact_summary(clean_inline("\n".join(lines)))


def item_template_params(wikitext):
    params = {}
    in_template = False
    depth = 0
    for line in wikitext.splitlines():
        stripped = line.strip()
        if re.match(r"^\{\{(?:Item|Substance)\b", stripped, flags=re.I):
            in_template = True
            depth = stripped.count("{{") - stripped.count("}}")
            continue
        if not in_template:
            continue
        depth += stripped.count("{{") - stripped.count("}}")
        if depth <= 0:
            break
        if not stripped.startswith("|"):
            continue
        match = re.match(r"^\|\s*([A-Za-z0-9_]+)\s*=\s*(.*)$", stripped)
        if match:
            key, value = match.groups()
            params[key.lower()] = clean_inline(value)
    return params


def is_valid_money_label(value):
    value = clean_inline(value)
    if not value or value.startswith("|"):
        return False
    if value.lower() in {"none", "n/a", "unknown", "varies", "variable", "-", "—"}:
        return False
    return bool(re.search(r"\d", value) or re.search(r"\b(?:gp|sp|cp|pp|gold|silver|copper|platinum)\b", value, re.I))


def normalize_money(value):
    value = clean_inline(value)
    value = value.replace("â€“", "-").replace("â€”", "-").replace("–", "-").replace("—", "-")
    value = re.sub(r"\bgold pieces\b", "gp", value, flags=re.I)
    value = re.sub(r"\bgold piece\b", "gp", value, flags=re.I)
    value = re.sub(r"\bgp\b", "mo", value, flags=re.I)
    value = re.sub(r"\bsp\b", "ma", value, flags=re.I)
    value = re.sub(r"\bcp\b", "mr", value, flags=re.I)
    value = re.sub(r"\bpp\b", "mp", value, flags=re.I)
    value = re.sub(r"(\d),(\d{3})", r"\1.\2", value)
    value = re.sub(r"(\d)(?=(\d{3})+(?!\d))", r"\1.", value)
    value = value.replace(" - ", "-").replace(" to ", "-").replace(" -", "-").replace("- ", "-")
    return value


def extract_money_labels(text):
    labels = []
    patterns = [
        r"([+]?\s*\d[\d.,]*(?:\s*[-]\s*\d[\d.,]*)?\s*(?:gp|sp|cp|pp)\b(?:\s*/\s*(?:lb|pound|item|weapon|armor|suit|ingot))?)",
        r"(worth\s+(?:about\s+)?\d[\d.,]*(?:\s*[-]\s*\d[\d.,]*)?\s+times\s+the\s+same\s+mass\s+of\s+gold)",
        r"(\d[\d.,]*(?:\s*[-]\s*\d[\d.,]*)?\s+times\s+the\s+same\s+mass\s+of\s+gold)",
    ]
    for pattern in patterns:
        for match in re.findall(pattern, text or "", flags=re.I):
            label = normalize_money(match)
            if label and label not in labels:
                labels.append(label)
    return labels


def template_value(params):
    for key in ("value5e", "value4e", "value3e", "value2e", "value1e", "value", "cost", "price"):
        value = params.get(key, "")
        if is_valid_money_label(value):
            return normalize_money(value)
    return ""


def section_money(wikitext, section):
    return extract_money_labels(clean_section(section_text(wikitext, section)))


def numeric_cost(value):
    numbers = re.findall(r"(\d[\d.,]*)\s*mo\b", value or "", flags=re.I)
    if not numbers:
        numbers = re.findall(r"\d[\d.,]*", value or "")
    if not numbers:
        return None
    return max(int(number.replace(".", "").replace(",", "")) for number in numbers)


def page_to_metal(title):
    wikitext = page_wikitext(title)
    params = item_template_params(wikitext)
    description = clean_section(section_text(wikitext, "Description"))
    powers = clean_section(section_text(wikitext, "Powers"))
    usage = clean_section(section_text(wikitext, "Usage"))
    value = clean_section(section_text(wikitext, "Value"))
    creation = clean_section(section_text(wikitext, "Creation"))
    cost_section = clean_section(section_text(wikitext, "Cost"))
    cost_labels = []
    template_cost = template_value(params)
    if template_cost:
        cost_labels.append(template_cost)
    for section in ("Cost", "Usage", "Value", "2nd Edition Statistics", "3rd Edition Statistics", "4th Edition Statistics", "5th Edition Statistics"):
        for label in section_money(wikitext, section):
            if label not in cost_labels:
                cost_labels.append(label)
    cost = "; ".join(cost_labels) or "Costo variabile"
    return {
        "id": slugify(title),
        "nome": title,
        "costo": cost,
        "costo_mo": numeric_cost(cost),
        "tipo": params.get("type", ""),
        "componenti": params.get("components", ""),
        "colore": params.get("color", ""),
        "proprieta": params.get("properties", ""),
        "reperibilita": params.get("location", ""),
        "tipo_metallo": "metallo",
        "fonte": "Forgotten Realms Wiki",
        "fonte_url": f"https://forgottenrealms.fandom.com/wiki/{urllib.parse.quote(title.replace(' ', '_'))}",
        "descrizione": description,
        "poteri": powers,
        "uso": usage,
        "valore": value,
        "costi_testo": cost_section,
        "creazione": creation,
    }


def main():
    titles = category_members()
    metals = []
    for index, title in enumerate(titles, 1):
        try:
            metals.append(page_to_metal(title))
        except Exception as exc:
            print(f"[warn] {title}: {exc}")
        if index % 20 == 0:
            print(f"{index}/{len(titles)}")
        time.sleep(0.05)
    OUT.write_text(json.dumps(metals, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {OUT} ({len(metals)} metals from {len(titles)} category pages)")


if __name__ == "__main__":
    main()
