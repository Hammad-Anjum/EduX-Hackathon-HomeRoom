"""
HomeRoom Data Extraction Pipeline
Runs all extraction scripts to populate backend/data/curriculum/
for RAG ingestion into ChromaDB.

Usage:
    python backend/scripts/run_all.py
"""

import sys
import time

from extract_acara_curriculum import main as extract_curriculum
from extract_acara_achievement import main as extract_achievement
from fetch_naplan_info import main as fetch_naplan
from fetch_education_explainers import main as generate_explainers


def main():
    print("=" * 60)
    print("HomeRoom — Data Extraction Pipeline")
    print("=" * 60)

    grand_total = 0
    start = time.time()

    # Step 1: ACARA Content Descriptions
    print("\n[1/4] Extracting ACARA content descriptions...")
    try:
        count = extract_curriculum()
        grand_total += count
    except Exception as e:
        print(f"  ERROR: {e}")

    # Step 2: ACARA Achievement Standards
    print("\n[2/4] Extracting ACARA achievement standards...")
    try:
        count = extract_achievement()
        grand_total += count
    except Exception as e:
        print(f"  ERROR: {e}")

    # Step 3: NAPLAN Info
    print("\n[3/4] Fetching NAPLAN information...")
    try:
        count = fetch_naplan()
        grand_total += count
    except Exception as e:
        print(f"  ERROR: {e}")

    # Step 4: Education Explainers
    print("\n[4/4] Generating education explainers...")
    try:
        count = generate_explainers()
        grand_total += count
    except Exception as e:
        print(f"  ERROR: {e}")

    elapsed = time.time() - start
    print("\n" + "=" * 60)
    print(f"Done! {grand_total} total documents extracted in {elapsed:.1f}s")
    print("Output: backend/data/curriculum/")
    print("=" * 60)


if __name__ == "__main__":
    main()
