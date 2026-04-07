"""
Extract Australian Curriculum achievement standards from ACARA's SPARQL endpoint.
Outputs one JSON file per subject into backend/data/curriculum/achievement_standards/.

Handles two hierarchy types:
  - Flat: Document → Year Level → Achievement Standard
  - Nested: Document → Subject → Year Level → Achievement Standard
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

FLAT_SUBJECTS = {
    "mathematics": "4e0d84fb-9095-4db6-a031-9e4600a2533d",
    "english": "7f6bd186-fcdf-4e46-a727-9e4600a2a39b",
    "science": "593bf494-a404-4057-8cb2-9e4600a2dba8",
    "health_pe": "eb31ae07-c467-403c-a1f7-7ceeac050b85",
}

NESTED_SUBJECTS = {
    "the_arts": "0c03a300-197c-4cb4-85dd-a0471eb206db",
    "technologies": "9b56e53f-9758-457e-80aa-e47eaf4eee63",
    "hass": "e43cff2d-01be-456a-8b60-33d7f7f0ced8",
    "languages": "5460b64c-2581-404d-a8c6-6aa2fff88275",
}

SUBJECT_DISPLAY_NAMES = {
    "mathematics": "Mathematics",
    "english": "English",
    "science": "Science",
    "hass": "Humanities and Social Sciences",
    "health_pe": "Health and Physical Education",
    "the_arts": "The Arts",
    "technologies": "Technologies",
    "languages": "Languages",
}

FLAT_QUERY = """
PREFIX gem: <http://purl.org/gem/qualifiers/>
PREFIX asn: <http://purl.org/ASN/schema/core/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?year_name ?achievement_desc WHERE {{
  <{base_uri}/{uuid}> gem:hasChild ?year .
  ?year <http://vocabulary.curriculum.edu.au/nominalYearLevel> ?year_name .
  ?year gem:hasChild ?achievement .
  ?achievement asn:statementLabel ?label .
  FILTER(str(?label) = "Achievement standard")
  ?achievement dct:description ?achievement_desc .
}}
"""

NESTED_QUERY = """
PREFIX gem: <http://purl.org/gem/qualifiers/>
PREFIX asn: <http://purl.org/ASN/schema/core/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?subject_title ?year_name ?achievement_desc WHERE {{
  <{base_uri}/{uuid}> gem:hasChild ?subject .
  ?subject dct:title ?subject_title .
  ?subject gem:hasChild ?year .
  ?year <http://vocabulary.curriculum.edu.au/nominalYearLevel> ?year_name .
  ?year gem:hasChild ?achievement .
  ?achievement asn:statementLabel ?label .
  FILTER(str(?label) = "Achievement standard")
  ?achievement dct:description ?achievement_desc .
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


def extract_flat(subject_key: str, uuid: str) -> list[dict]:
    display_name = SUBJECT_DISPLAY_NAMES[subject_key]
    query = FLAT_QUERY.format(base_uri=BASE_URI, uuid=uuid)
    resp = requests.get(SPARQL_ENDPOINT, params={"q": query}, timeout=60)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)

    documents = []
    seen = set()

    for result in root.findall(".//s:result", NS):
        year = get_binding(result, "year_name")
        desc = get_binding(result, "achievement_desc")
        if not year or not desc:
            continue
        if (year, desc) in seen:
            continue
        seen.add((year, desc))

        content = f"By the end of {year} in {display_name}, students are expected to: {desc}"
        doc_id = f"{subject_key}-{year.lower().replace(' ', '_')}-achievement"

        documents.append({
            "id": doc_id,
            "content": re.sub(r"\s+", " ", content).strip(),
            "metadata": {
                "source": "acara_sparql",
                "content_type": "achievement_standard",
                "subject": display_name,
                "year_level": year,
                "strand": None,
                "substrand": None,
                "source_url": f"{BASE_URI}/{uuid}",
            },
        })

    return documents


def extract_nested(subject_key: str, uuid: str) -> list[dict]:
    display_name = SUBJECT_DISPLAY_NAMES[subject_key]
    query = NESTED_QUERY.format(base_uri=BASE_URI, uuid=uuid)
    resp = requests.get(SPARQL_ENDPOINT, params={"q": query}, timeout=120)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)

    documents = []
    seen = set()

    for result in root.findall(".//s:result", NS):
        sub_subject = get_binding(result, "subject_title")
        year = get_binding(result, "year_name")
        desc = get_binding(result, "achievement_desc")
        if not year or not desc:
            continue
        if (sub_subject, year, desc) in seen:
            continue
        seen.add((sub_subject, year, desc))

        subject_label = f"{display_name} — {sub_subject}" if sub_subject else display_name
        content = f"By the end of {year} in {subject_label}, students are expected to: {desc}"
        doc_id = f"{subject_key}-{(sub_subject or '').lower().replace(' ', '_')[:20]}-{year.lower().replace(' ', '_')}-achievement"

        documents.append({
            "id": doc_id,
            "content": re.sub(r"\s+", " ", content).strip(),
            "metadata": {
                "source": "acara_sparql",
                "content_type": "achievement_standard",
                "subject": subject_label,
                "year_level": year,
                "strand": None,
                "substrand": None,
                "source_url": f"{BASE_URI}/{uuid}",
            },
        })

    return documents


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "..", "data", "curriculum", "achievement_standards")
    os.makedirs(output_dir, exist_ok=True)

    all_subjects = list(FLAT_SUBJECTS.items()) + list(NESTED_SUBJECTS.items())
    total = 0

    for i, (subject_key, uuid) in enumerate(all_subjects, 1):
        display = SUBJECT_DISPLAY_NAMES[subject_key]
        print(f"  [{i}/{len(all_subjects)}] Extracting {display} achievement standards...", end=" ", flush=True)

        try:
            if subject_key in FLAT_SUBJECTS:
                documents = extract_flat(subject_key, uuid)
            else:
                documents = extract_nested(subject_key, uuid)

            output_path = os.path.join(output_dir, f"{subject_key}.json")
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump({"documents": documents}, f, indent=2, ensure_ascii=False)

            print(f"{len(documents)} documents")
            total += len(documents)
        except Exception as e:
            print(f"FAILED: {e}")

        if i < len(all_subjects):
            time.sleep(1)

    print(f"  Total achievement standards: {total}")
    return total


if __name__ == "__main__":
    main()
