"""
Generate NAPLAN information documents for parents.
The nap.edu.au pages are JS-rendered SPAs, so we hand-author verified content
and download the PDF brochure.
Outputs to backend/data/curriculum/naplan/.
"""

import json
import os

import requests

BROCHURE_URL = "https://www.nap.edu.au/docs/default-source/default-document-library/naplan-information-brochure-for-parents-and-carers.pdf"


def build_naplan_overview() -> dict:
    sections = [
        {
            "id": "naplan-overview-what-is",
            "content": (
                "NAPLAN stands for the National Assessment Program — Literacy and Numeracy. "
                "It is Australia's national standardised assessment for all students in Years 3, 5, 7, and 9. "
                "NAPLAN tests four areas: reading, writing, conventions of language (spelling, grammar, and "
                "punctuation), and numeracy. NAPLAN is not a pass or fail test. It is designed to show how "
                "your child is progressing in literacy and numeracy compared to national standards. "
                "Every student in Australia in those year levels takes the same test, making it the only "
                "nationally consistent measure of student achievement."
            ),
        },
        {
            "id": "naplan-overview-when",
            "content": (
                "NAPLAN tests are held every year in March (Term 1). Students in Years 3, 5, 7, and 9 "
                "sit the tests over several days. Since 2022, NAPLAN has moved fully online (NAPLAN Online), "
                "which means students complete the tests on a computer or tablet at school. The online format "
                "is adaptive — it adjusts the difficulty of questions based on the student's responses, "
                "giving a more accurate picture of their ability. Writing is the only component that may still "
                "be handwritten in some schools."
            ),
        },
        {
            "id": "naplan-overview-purpose",
            "content": (
                "The purpose of NAPLAN is to provide information to parents, teachers, and schools about "
                "how students are performing in literacy and numeracy. It helps identify whether students "
                "are meeting important educational benchmarks. NAPLAN results are one piece of information "
                "alongside your child's school reports, classwork, and teacher assessments. Schools use "
                "NAPLAN data to identify areas where students may need additional support. It is not used "
                "to rank individual students, and parents should not feel stressed about the results."
            ),
        },
        {
            "id": "naplan-overview-what-tested",
            "content": (
                "NAPLAN tests four domains. Reading: understanding written texts including stories, articles, "
                "and informational texts. Students answer questions about main ideas, vocabulary, and inferences. "
                "Writing: students write a response to a prompt (persuasive or narrative depending on the year). "
                "Conventions of Language: spelling, grammar, and punctuation — tested through multiple choice "
                "and short answer questions. Numeracy: number and algebra, measurement and geometry, and "
                "statistics and probability — covers the mathematics skills expected at each year level."
            ),
        },
    ]
    return {
        "documents": [
            {
                **s,
                "metadata": {
                    "source": "hand_authored",
                    "content_type": "naplan",
                    "subject": "NAPLAN",
                    "year_level": None,
                    "strand": "NAPLAN Overview",
                    "substrand": None,
                    "source_url": "https://www.nap.edu.au/naplan",
                },
            }
            for s in sections
        ]
    }


def build_naplan_for_parents() -> dict:
    sections = [
        {
            "id": "naplan-parents-preparation",
            "content": (
                "How to prepare your child for NAPLAN: The best preparation for NAPLAN is regular "
                "school attendance and engagement with learning throughout the year. You do not need "
                "to buy special study materials or hire a tutor for NAPLAN. Excessive test preparation "
                "can increase anxiety without improving results. If your child feels nervous, reassure "
                "them that NAPLAN is not a pass or fail test and that it is just one way of showing "
                "what they have learned. Make sure they get a good night's sleep and eat breakfast "
                "on test days."
            ),
        },
        {
            "id": "naplan-parents-special-needs",
            "content": (
                "Students with disability or additional learning needs may be eligible for adjustments "
                "during NAPLAN. These include extra time, rest breaks, a scribe, assistive technology, "
                "or a separate room. If your child has a diagnosed condition or receives learning support, "
                "talk to the school about what adjustments are available. Students who have been in "
                "Australia for less than one year and are from a non-English speaking background may "
                "be exempted from NAPLAN, but participation is encouraged where possible. Parents can "
                "also choose to withdraw their child from NAPLAN by contacting the school."
            ),
        },
        {
            "id": "naplan-parents-after-test",
            "content": (
                "After NAPLAN: Results are usually sent home to parents between June and September. "
                "Each student receives an Individual Student Report (ISR) showing their results across "
                "the four domains. The report shows your child's result on a scale and their proficiency "
                "level. If you have questions about your child's results, contact their teacher. The "
                "teacher can explain what the results mean in the context of your child's overall learning "
                "and what areas might need more attention. Remember, NAPLAN is just one snapshot — your "
                "child's classroom performance is equally important."
            ),
        },
    ]
    return {
        "documents": [
            {
                **s,
                "metadata": {
                    "source": "hand_authored",
                    "content_type": "naplan",
                    "subject": "NAPLAN",
                    "year_level": None,
                    "strand": "NAPLAN For Parents",
                    "substrand": None,
                    "source_url": "https://www.nap.edu.au/naplan/for-parents-carers",
                },
            }
            for s in sections
        ]
    }


def build_naplan_results_guide() -> dict:
    sections = [
        {
            "id": "naplan-results-proficiency-levels",
            "content": (
                "Understanding NAPLAN proficiency levels: From 2023, NAPLAN results use four proficiency "
                "levels. 'Exceeding' means your child has exceeded expectations for their year level — "
                "they are performing above what is expected. 'Strong' means your child has a strong level "
                "of achievement and is meeting the challenging proficiency standard. 'Developing' means "
                "your child's result indicates their skills are developing but they have not yet met the "
                "proficiency standard — they may benefit from targeted support. 'Needs additional support' "
                "means your child is likely to need focused intervention and extra help in this area."
            ),
        },
        {
            "id": "naplan-results-reading-report",
            "content": (
                "How to read your child's NAPLAN Individual Student Report (ISR): The report shows a "
                "separate result for each domain (reading, writing, conventions of language, and numeracy). "
                "Each result is shown as a dot on a scale, with shaded bands showing the proficiency levels. "
                "Your child's result is compared to the national average and the middle 60% of students. "
                "If your child sat NAPLAN before (in a previous assessment year), the report may also show "
                "their growth over time — this is one of the most useful parts of the report as it shows "
                "whether they are progressing, regardless of their absolute level."
            ),
        },
        {
            "id": "naplan-results-what-to-do",
            "content": (
                "What to do with NAPLAN results: If your child is in the 'Strong' or 'Exceeding' band, "
                "they are performing well — continue supporting their learning as you have been. If they "
                "are in the 'Developing' band, talk to their teacher about specific areas where they can "
                "improve and how you can help at home. If they are in the 'Needs additional support' band, "
                "request a meeting with the teacher and learning support team to discuss an action plan. "
                "Schools are required to provide additional support for students who need it. Do not panic — "
                "many students improve significantly with targeted help."
            ),
        },
        {
            "id": "naplan-results-year-level-expectations",
            "content": (
                "What NAPLAN tests at each year level: Year 3 (age 8) — basic reading comprehension, simple "
                "narrative or persuasive writing, spelling of common words, basic addition/subtraction/multiplication. "
                "Year 5 (age 10) — more complex texts, structured writing, grammar rules, fractions, measurement. "
                "Year 7 (age 12) — analysing texts, persuasive writing with evidence, algebraic thinking, "
                "data interpretation. Year 9 (age 14) — critical analysis of texts, sophisticated writing, "
                "advanced grammar, equations, probability and statistics. Each test is calibrated to the "
                "expected standard for that year level."
            ),
        },
    ]
    return {
        "documents": [
            {
                **s,
                "metadata": {
                    "source": "hand_authored",
                    "content_type": "naplan",
                    "subject": "NAPLAN",
                    "year_level": None,
                    "strand": "NAPLAN Results Guide",
                    "substrand": None,
                    "source_url": "https://www.nap.edu.au/naplan/results-and-reports",
                },
            }
            for s in sections
        ]
    }


def download_brochure(output_dir: str) -> bool:
    try:
        resp = requests.get(
            BROCHURE_URL,
            headers={"User-Agent": "BridgeEd-Hackathon/1.0"},
            timeout=30,
        )
        resp.raise_for_status()
        pdf_path = os.path.join(output_dir, "naplan_brochure.pdf")
        with open(pdf_path, "wb") as f:
            f.write(resp.content)
        print(f"  Downloaded NAPLAN brochure ({len(resp.content) // 1024} KB)")
        return True
    except Exception as e:
        print(f"  Failed to download brochure: {e}")
        return False


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "..", "data", "curriculum", "naplan")
    os.makedirs(output_dir, exist_ok=True)

    builders = {
        "naplan_overview": ("What is NAPLAN?", build_naplan_overview),
        "naplan_for_parents": ("NAPLAN for Parents", build_naplan_for_parents),
        "naplan_results_guide": ("Understanding NAPLAN Results", build_naplan_results_guide),
    }

    total = 0
    for key, (title, builder) in builders.items():
        data = builder()
        count = len(data["documents"])
        output_path = os.path.join(output_dir, f"{key}.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  Written {key}.json — {count} sections")
        total += count

    download_brochure(output_dir)

    print(f"  Total NAPLAN documents: {total}")
    return total


if __name__ == "__main__":
    main()
