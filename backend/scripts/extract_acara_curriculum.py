"""
Extract Australian Curriculum content descriptions from ACARA's SPARQL endpoint.
Outputs one JSON file per subject into backend/data/curriculum/content_descriptions/.

Handles multiple hierarchy types in the ACARA RDF store:
  - Flat: Document → Year → Strand → Substrand → CD (Maths, English, Science, HPE)
  - Nested-direct: Document → Subject → Year → CD (The Arts)
  - Nested-strand: Document → Subject → Year → Strand → CD (Technologies, HASS)
  - Nested-deep: Document → Subject → Year → Strand → Substrand → CD (Languages)
"""

import json
import os
import re
import time
import xml.etree.ElementTree as ET
from html import unescape

import requests

SPARQL_ENDPOINT = "https://rdf.australiancurriculum.edu.au/api/sparql"
BASE_URI = "http://rdf.australiancurriculum.edu.au/elements/2018/05"
NS = {"s": "http://www.w3.org/2005/sparql-results#"}

SUBJECTS = {
    "mathematics":  ("4e0d84fb-9095-4db6-a031-9e4600a2533d", "flat"),
    "english":      ("7f6bd186-fcdf-4e46-a727-9e4600a2a39b", "flat"),
    "science":      ("593bf494-a404-4057-8cb2-9e4600a2dba8", "flat"),
    "health_pe":    ("eb31ae07-c467-403c-a1f7-7ceeac050b85", "flat"),
    "the_arts":     ("0c03a300-197c-4cb4-85dd-a0471eb206db", "nested_direct"),
    "technologies": ("9b56e53f-9758-457e-80aa-e47eaf4eee63", "nested_strand"),
    "hass":         ("e43cff2d-01be-456a-8b60-33d7f7f0ced8", "nested_strand"),
    "languages":    ("5460b64c-2581-404d-a8c6-6aa2fff88275", "nested_deep"),
}

DISPLAY_NAMES = {
    "mathematics": "Mathematics",
    "english": "English",
    "science": "Science",
    "hass": "Humanities and Social Sciences",
    "health_pe": "Health and Physical Education",
    "the_arts": "The Arts",
    "technologies": "Technologies",
    "languages": "Languages",
}

# Document → Year → Strand → Substrand → CD
Q_FLAT = """
PREFIX gem: <http://purl.org/gem/qualifiers/>
PREFIX asn: <http://purl.org/ASN/schema/core/>
PREFIX dct: <http://purl.org/dc/terms/>
SELECT ?year_name ?strand_title ?substrand_title ?cd_desc WHERE {{
  <{uri}> gem:hasChild ?year .
  ?year <http://vocabulary.curriculum.edu.au/nominalYearLevel> ?year_name .
  ?year gem:hasChild ?strand .
  ?strand dct:title ?strand_title .
  OPTIONAL {{
    ?strand gem:hasChild ?sub .
    ?sub dct:title ?substrand_title .
    OPTIONAL {{
      ?sub gem:hasChild ?cd .
      ?cd asn:statementLabel ?l . FILTER(str(?l) = "Content description")
      ?cd dct:description ?cd_desc
    }}
  }}
}}
"""

# Document → Subject → Year → CD (The Arts: CDs are direct children of year level)
Q_NESTED_DIRECT = """
PREFIX gem: <http://purl.org/gem/qualifiers/>
PREFIX asn: <http://purl.org/ASN/schema/core/>
PREFIX dct: <http://purl.org/dc/terms/>
SELECT ?subject_title ?year_name ?cd_desc WHERE {{
  <{uri}> gem:hasChild ?subject .
  ?subject dct:title ?subject_title .
  ?subject gem:hasChild ?year .
  ?year <http://vocabulary.curriculum.edu.au/nominalYearLevel> ?year_name .
  ?year gem:hasChild ?cd .
  ?cd asn:statementLabel ?l . FILTER(str(?l) = "Content description")
  ?cd dct:description ?cd_desc .
}}
"""

# Document → Subject → Year → Strand → CD (Technologies, HASS)
Q_NESTED_STRAND = """
PREFIX gem: <http://purl.org/gem/qualifiers/>
PREFIX asn: <http://purl.org/ASN/schema/core/>
PREFIX dct: <http://purl.org/dc/terms/>
SELECT ?subject_title ?year_name ?strand_title ?cd_desc WHERE {{
  <{uri}> gem:hasChild ?subject .
  ?subject dct:title ?subject_title .
  ?subject gem:hasChild ?year .
  ?year <http://vocabulary.curriculum.edu.au/nominalYearLevel> ?year_name .
  ?year gem:hasChild ?strand .
  ?strand dct:title ?strand_title .
  ?strand gem:hasChild ?cd .
  ?cd asn:statementLabel ?l . FILTER(str(?l) = "Content description")
  ?cd dct:description ?cd_desc .
}}
"""

# Document → Subject → Year → Strand → Substrand → CD (Languages)
Q_NESTED_DEEP = """
PREFIX gem: <http://purl.org/gem/qualifiers/>
PREFIX asn: <http://purl.org/ASN/schema/core/>
PREFIX dct: <http://purl.org/dc/terms/>
SELECT ?subject_title ?year_name ?strand_title ?cd_desc WHERE {{
  <{uri}> gem:hasChild ?subject .
  ?subject dct:title ?subject_title .
  ?subject gem:hasChild ?year .
  ?year <http://vocabulary.curriculum.edu.au/nominalYearLevel> ?year_name .
  ?year gem:hasChild ?strand .
  ?strand gem:hasChild ?sub .
  ?sub gem:hasChild ?cd .
  ?cd asn:statementLabel ?l . FILTER(str(?l) = "Content description")
  ?cd dct:description ?cd_desc .
}}
"""


def strip_html(text: str) -> str:
    text = unescape(text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def get_binding(result_elem, name: str) -> str | None:
    binding = result_elem.find(f"s:binding[@name='{name}']/s:literal", NS)
    if binding is not None and binding.text:
        return strip_html(binding.text)
    return None


def query_sparql(query: str) -> ET.Element:
    resp = requests.get(SPARQL_ENDPOINT, params={"q": query}, timeout=120)
    resp.raise_for_status()
    return ET.fromstring(resp.content)


def make_doc(doc_id, content, subject, year, strand, substrand, uuid):
    return {
        "id": doc_id,
        "content": re.sub(r"\s+", " ", content).strip(),
        "metadata": {
            "source": "acara_sparql",
            "content_type": "content_description",
            "subject": subject,
            "year_level": year,
            "strand": strand,
            "substrand": substrand,
            "source_url": f"{BASE_URI}/{uuid}",
        },
    }


def extract_flat(key: str, uuid: str) -> list[dict]:
    display = DISPLAY_NAMES[key]
    uri = f"{BASE_URI}/{uuid}"
    root = query_sparql(Q_FLAT.format(uri=uri))

    docs, seen = [], set()
    for r in root.findall(".//s:result", NS):
        year = get_binding(r, "year_name")
        strand = get_binding(r, "strand_title")
        sub = get_binding(r, "substrand_title")
        desc = get_binding(r, "cd_desc")
        if not year or not desc:
            continue
        if (year, strand, desc) in seen:
            continue
        seen.add((year, strand, desc))

        loc = f"under {strand}" if strand else ""
        if sub:
            loc += f" ({sub})"
        content = f"In {year} {display}, {loc}, students learn to: {desc}"
        docs.append(make_doc(f"{key}-{year.lower().replace(' ','_')}-cd{len(docs):03d}",
                             content, display, year, strand, sub, uuid))
    return docs


def extract_nested(key: str, uuid: str, query_template: str) -> list[dict]:
    display = DISPLAY_NAMES[key]
    uri = f"{BASE_URI}/{uuid}"
    root = query_sparql(query_template.format(uri=uri))

    docs, seen = [], set()
    for r in root.findall(".//s:result", NS):
        sub_subj = get_binding(r, "subject_title")
        year = get_binding(r, "year_name")
        strand = get_binding(r, "strand_title")  # may be None for direct query
        desc = get_binding(r, "cd_desc")
        if not year or not desc:
            continue
        dedup = (sub_subj, year, desc)
        if dedup in seen:
            continue
        seen.add(dedup)

        label = f"{display} — {sub_subj}" if sub_subj else display
        loc = f"under {strand}, " if strand else ""
        content = f"In {year} {label}, {loc}students learn to: {desc}"
        slug = (sub_subj or "").lower().replace(" ", "_")[:20]
        docs.append(make_doc(f"{key}-{slug}-{year.lower().replace(' ','_')}-cd{len(docs):03d}",
                             content, label, year, strand, None, uuid))
    return docs


QUERY_MAP = {
    "flat": Q_FLAT,
    "nested_direct": Q_NESTED_DIRECT,
    "nested_strand": Q_NESTED_STRAND,
    "nested_deep": Q_NESTED_DEEP,
}


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "..", "data", "curriculum", "content_descriptions")
    os.makedirs(output_dir, exist_ok=True)

    total = 0
    items = list(SUBJECTS.items())
    for i, (key, (uuid, qtype)) in enumerate(items, 1):
        display = DISPLAY_NAMES[key]
        print(f"  [{i}/{len(items)}] Extracting {display} content descriptions...", end=" ", flush=True)

        try:
            if qtype == "flat":
                documents = extract_flat(key, uuid)
            else:
                documents = extract_nested(key, uuid, QUERY_MAP[qtype])

            with open(os.path.join(output_dir, f"{key}.json"), "w", encoding="utf-8") as f:
                json.dump({"documents": documents}, f, indent=2, ensure_ascii=False)

            print(f"{len(documents)} documents")
            total += len(documents)
        except Exception as e:
            print(f"FAILED: {e}")

        if i < len(items):
            time.sleep(1)

    print(f"  Total content descriptions: {total}")
    return total


if __name__ == "__main__":
    main()
