"""
Generate hand-authored explainer JSON files for common parent questions
about the Australian education system.
Outputs to backend/data/curriculum/explainers/.
"""

import json
import os


def build_education_system() -> dict:
    """How the Australian education system works."""
    sections = [
        {
            "id": "explainer-education-system-overview",
            "content": (
                "The Australian education system has three main stages: primary school "
                "(Foundation/Prep to Year 6), secondary school (Year 7 to Year 12), and "
                "tertiary education (university or TAFE). Education is compulsory from age 6 "
                "to age 17 in most states. The school year runs from late January to mid-December, "
                "split into 4 terms of about 10 weeks each, with 2-week breaks between terms and "
                "a 6-week summer break over December-January."
            ),
        },
        {
            "id": "explainer-education-system-primary",
            "content": (
                "Primary school in Australia covers Foundation Year (also called Prep or "
                "Kindergarten depending on your state) through to Year 6. Children start "
                "Foundation/Prep at age 5. In primary school, children study English, "
                "Mathematics, Science, Humanities and Social Sciences (HASS), The Arts, "
                "Health and Physical Education, Technologies, and Languages. All schools "
                "follow the Australian Curriculum set by ACARA (Australian Curriculum, "
                "Assessment and Reporting Authority). Students are assessed by their "
                "teachers throughout the year and receive semester reports."
            ),
        },
        {
            "id": "explainer-education-system-secondary",
            "content": (
                "Secondary school covers Year 7 to Year 12. Years 7-10 are junior secondary "
                "where students study a mix of compulsory subjects and electives. Years 11-12 "
                "are senior secondary where students choose their subjects and work toward "
                "their state certificate (e.g., HSC in NSW, VCE in Victoria, QCE in Queensland). "
                "At the end of Year 12, students receive an ATAR (Australian Tertiary Admission "
                "Rank) — a number from 0 to 99.95 that ranks them against other students "
                "nationally. The ATAR is used for university admission."
            ),
        },
        {
            "id": "explainer-education-system-state-names",
            "content": (
                "Different states use different names for the first year of school. "
                "In NSW and ACT, it is called Kindergarten. In Victoria, Tasmania, and "
                "Queensland, it is called Prep or Foundation. In South Australia, Western "
                "Australia, and Northern Territory, it is called Reception or Pre-Primary. "
                "Regardless of the name, the curriculum content is the same nationally — "
                "the Australian Curriculum applies everywhere."
            ),
        },
        {
            "id": "explainer-education-system-school-types",
            "content": (
                "There are three types of schools in Australia: government (public) schools "
                "which are free, Catholic schools, and independent (private) schools. "
                "All three types follow the Australian Curriculum. Government schools are "
                "funded by the state and federal government. Catholic and independent schools "
                "charge fees but also receive government funding. You can compare schools "
                "on the My School website (myschool.edu.au) which shows each school's "
                "NAPLAN results, funding, and student demographics."
            ),
        },
        {
            "id": "explainer-education-system-naplan-overview",
            "content": (
                "NAPLAN (National Assessment Program — Literacy and Numeracy) is a national "
                "standardised test taken by students in Years 3, 5, 7, and 9. It tests "
                "reading, writing, conventions of language (spelling, grammar, punctuation), "
                "and numeracy. NAPLAN is not a pass or fail test — it shows how your child "
                "is progressing compared to national standards. Results are sent home as an "
                "Individual Student Report showing your child's proficiency level: "
                "Exceeding, Strong, Developing, or Needs additional support."
            ),
        },
        {
            "id": "explainer-education-system-pathways",
            "content": (
                "After Year 12, students have several pathways. University requires an ATAR "
                "and offers bachelor's degrees (typically 3-4 years). TAFE (Technical and "
                "Further Education) offers vocational certificates and diplomas — many TAFE "
                "courses can be used as a pathway into university. Apprenticeships and "
                "traineeships combine paid work with training. Students can also start "
                "school-based apprenticeships during Years 11-12. HECS-HELP is a government "
                "loan that lets university students defer their tuition fees until they are "
                "earning above a threshold (around $54,000 per year)."
            ),
        },
    ]

    return {
        "documents": [
            {
                **section,
                "metadata": {
                    "source": "hand_authored",
                    "content_type": "explainer",
                    "subject": "Education System",
                    "year_level": None,
                    "strand": "Education System Overview",
                    "substrand": None,
                    "source_url": None,
                },
            }
            for section in sections
        ]
    }


def build_report_cards() -> dict:
    """What report card grades mean."""
    sections = [
        {
            "id": "explainer-reports-grading-scale",
            "content": (
                "Australian schools use an A to E grading scale on student reports. "
                "Grade A means your child is performing well above the standard expected "
                "for their year level — they demonstrate excellent understanding. "
                "Grade B means above the expected standard — a strong performance. "
                "Grade C means at the expected standard — your child is meeting the "
                "year level expectations, which is a good result. Grade D means below "
                "the expected standard — your child may need some extra support. "
                "Grade E means well below the standard — your child needs significant "
                "additional support in this area."
            ),
        },
        {
            "id": "explainer-reports-how-to-read",
            "content": (
                "School reports are issued twice a year, at the end of Term 2 (mid-year) "
                "and Term 4 (end of year). Each report shows grades for every subject, "
                "plus comments from the teacher about your child's progress, strengths, "
                "and areas for improvement. Many reports also include an effort rating "
                "(such as Excellent, Good, Satisfactory, Needs Improvement) which is "
                "separate from the achievement grade. A child might get a B for achievement "
                "but Excellent for effort — meaning they are working hard and progressing well."
            ),
        },
        {
            "id": "explainer-reports-what-c-means",
            "content": (
                "Many parents worry when their child receives a C grade, but C actually means "
                "your child is meeting the expected standard for their year level. This is the "
                "benchmark — it means they are where they should be. Think of it as 'on track'. "
                "The majority of students receive C grades. An A or B means they are ahead of "
                "expectations, while D or E means they may need extra help. If you are concerned "
                "about your child's grades, the best step is to book a parent-teacher interview "
                "to discuss specific areas where you can help at home."
            ),
        },
        {
            "id": "explainer-reports-parent-teacher",
            "content": (
                "Parent-teacher interviews are offered at least once per year (usually twice). "
                "These are short meetings (10-15 minutes) where you discuss your child's progress "
                "with their teacher. Good questions to ask include: What are my child's strengths? "
                "What areas need improvement? How can I support their learning at home? "
                "Is my child meeting year level expectations? How do they interact with other "
                "students? You do not need to wait for a scheduled interview — you can contact "
                "the school at any time if you have concerns."
            ),
        },
    ]

    return {
        "documents": [
            {
                **section,
                "metadata": {
                    "source": "hand_authored",
                    "content_type": "explainer",
                    "subject": "Report Cards",
                    "year_level": None,
                    "strand": "Understanding School Reports",
                    "substrand": None,
                    "source_url": None,
                },
            }
            for section in sections
        ]
    }


def build_supporting_learning() -> dict:
    """How to support learning at home."""
    sections = [
        {
            "id": "explainer-support-foundation-year2",
            "content": (
                "Supporting learning at home for Foundation to Year 2 (ages 5-7): "
                "Read with your child every day for at least 15 minutes — let them choose "
                "books they enjoy. Practice counting objects around the house (fruit, toys, "
                "steps). Play board games and card games that involve numbers and taking turns. "
                "Talk about shapes you see in everyday life (circles, squares, triangles). "
                "Encourage your child to write shopping lists, birthday cards, or short stories. "
                "Ask about their day at school — 'What was the best thing that happened today?' "
                "works better than 'What did you learn?'"
            ),
        },
        {
            "id": "explainer-support-year3-year4",
            "content": (
                "Supporting learning at home for Year 3 to Year 4 (ages 8-9): "
                "Continue daily reading — by this age, children can read independently but "
                "still benefit from reading together and discussing the story. Practice times "
                "tables — aim to know them fluently by end of Year 4. Involve your child in "
                "cooking (measuring ingredients teaches fractions and units). Help with "
                "homework but let them try first before offering assistance. Encourage them "
                "to explain their thinking — 'How did you work that out?' builds deeper "
                "understanding. Year 3 is the first NAPLAN year — keep it low pressure."
            ),
        },
        {
            "id": "explainer-support-year5-year6",
            "content": (
                "Supporting learning at home for Year 5 to Year 6 (ages 10-11): "
                "Encourage independent reading of chapter books, non-fiction, and news articles. "
                "Help develop research skills — if they have a question, look it up together. "
                "Discuss current events at dinner to build critical thinking and general knowledge. "
                "Support project work by helping them plan and manage their time, not by doing "
                "the work for them. Encourage writing — a diary, stories, or book reviews. "
                "This is when study habits start forming — a quiet homework space and routine help."
            ),
        },
        {
            "id": "explainer-support-year7-year8",
            "content": (
                "Supporting learning at home for Year 7 to Year 8 (ages 12-13): "
                "The transition to secondary school is a big change. Help your child get "
                "organised — a planner or digital calendar for assignments and due dates. "
                "Show interest in their subjects but give them more independence. Help set up "
                "good study routines: consistent time, quiet space, phone away. Encourage them "
                "to ask teachers for help when they don't understand something. Stay connected "
                "with the school — check the school app or website for updates. NAPLAN happens "
                "again in Year 7."
            ),
        },
        {
            "id": "explainer-support-year9-year10",
            "content": (
                "Supporting learning at home for Year 9 to Year 10 (ages 14-15): "
                "Year 9 is the last NAPLAN year. Year 10 is when students start making subject "
                "choices for senior school (Years 11-12). Help your child research which subjects "
                "align with their interests and potential career paths. Encourage them to talk "
                "to the school's career counsellor. Support balanced wellbeing — sleep, exercise, "
                "and social time are just as important as study. If they are struggling in a "
                "subject, tutoring or extra help from the teacher can make a big difference "
                "before senior school begins."
            ),
        },
        {
            "id": "explainer-support-eald-families",
            "content": (
                "For families where English is an additional language or dialect (EAL/D): "
                "Reading and talking with your child in your home language supports their "
                "learning — bilingualism is a strength, not a barrier. Many schools have "
                "bilingual staff or can arrange interpreters for parent-teacher meetings. "
                "Ask the school about EAL/D support programs — most schools provide additional "
                "English language help. You can access translated school information through "
                "your state education department. Libraries offer free multilingual resources "
                "and programs. Your child's school can help connect you with community support "
                "services if needed."
            ),
        },
    ]

    return {
        "documents": [
            {
                **section,
                "metadata": {
                    "source": "hand_authored",
                    "content_type": "explainer",
                    "subject": "Supporting Learning at Home",
                    "year_level": None,
                    "strand": "Home Learning Support",
                    "substrand": None,
                    "source_url": None,
                },
            }
            for section in sections
        ]
    }


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "..", "data", "curriculum", "explainers")
    os.makedirs(output_dir, exist_ok=True)

    explainers = {
        "education_system": build_education_system,
        "report_cards": build_report_cards,
        "supporting_learning": build_supporting_learning,
    }

    total = 0
    for name, builder in explainers.items():
        data = builder()
        count = len(data["documents"])
        output_path = os.path.join(output_dir, f"{name}.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  Written {name}.json — {count} sections")
        total += count

    print(f"  Total explainer documents: {total}")
    return total


if __name__ == "__main__":
    main()
