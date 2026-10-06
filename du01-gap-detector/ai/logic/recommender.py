from logic.llm import chat_json, is_configured


def _base_recommend(gaps):
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    ordered = sorted(
        gaps,
        key=lambda g: (
            severity_order.get(g.get("severity"), 4),
            g.get("mastery", 1.0),
            g.get("concept", ""),
        ),
    )
    selected = []
    selected_concepts = set()
    for gap in ordered:
        concept = gap.get("concept")
        if not concept or concept in selected_concepts:
            continue
        selected.append(gap)
        selected_concepts.add(concept)
        if len(selected) == 5:
            break

    items = []
    for gap in selected:
        concept = gap["concept"]
        severity = gap.get("severity", "medium")
        prereqs = gap.get("prerequisite_gaps") or []
        evidence = gap.get("evidence") or []
        trend = gap.get("trend") or "stable"
        evidence_text = evidence[0] if evidence else "recent responses"
        if severity == "low":
            items.append(
                {
                    "type": "stretch",
                    "title": "Stretch Practice: {}".format(concept),
                    "description": "Extend your strength in {} with a challenge based on {}.".format(concept, evidence_text),
                    "target_concept": concept,
                    "estimated_time_min": 20,
                }
            )
            continue
        if prereqs:
            first = prereqs[0]
            items.append(
                {
                    "type": "scaffolded",
                    "title": "Bridge: {} to {}".format(first, concept),
                    "description": "Strengthen {} before tackling {}. Your {} evidence shows {}.".format(first, concept, concept, evidence_text),
                    "target_concept": first,
                    "estimated_time_min": 20,
                }
            )
        if severity in ("critical", "high"):
            items.append(
                {
                    "type": "study",
                    "title": "Deep Dive: {}".format(concept),
                    "description": "Review the core ideas of {} with worked examples. Your trend is {} and your evidence shows {}.".format(concept, trend, evidence_text),
                    "target_concept": concept,
                    "estimated_time_min": 15,
                }
            )
        items.append(
            {
                "type": "practice",
                "title": "Targeted Practice: {}".format(concept),
                "description": "Short practice set on {} with instant feedback. Focus on {}.".format(concept, evidence_text),
                "target_concept": concept,
                "estimated_time_min": 20,
            }
        )
        if severity == "critical" and gap.get("confidence", 0.0) >= 0.8:
            items.append(
                {
                    "type": "peer_tutoring",
                    "title": "Peer Tutoring: {}".format(concept),
                    "description": "Work through {} with a classmate who has mastered it.".format(concept),
                    "target_concept": concept,
                    "estimated_time_min": 30,
                }
            )

    seen = set()
    unique = []
    for item in items:
        if item["title"] in seen:
            continue
        seen.add(item["title"])
        unique.append(item)

    unique = unique[:7]
    for index, item in enumerate(unique, start=1):
        item["priority"] = index
    return [
        {
            "priority": item["priority"],
            "type": item["type"],
            "title": item["title"],
            "description": item["description"],
            "target_concept": item["target_concept"],
            "estimated_time_min": item["estimated_time_min"],
        }
        for item in unique
    ]


def _personalize(items, gaps):
    data = chat_json(
        "You are a supportive tutor. Rewrite each recommendation description in one or two encouraging, specific sentences "
        "using the student's gap evidence. Return only strict JSON: {\"descriptions\": [strings]} with exactly one string per item, in the same order.",
        {
            "items": [
                {"title": i["title"], "type": i["type"], "target_concept": i["target_concept"], "description": i["description"]}
                for i in items
            ],
            "gaps": [
                {
                    "concept": g.get("concept"),
                    "severity": g.get("severity"),
                    "mastery": g.get("mastery"),
                    "trend": g.get("trend"),
                    "evidence": (g.get("evidence") or [])[:5],
                    "prerequisite_gaps": g.get("prerequisite_gaps") or [],
                }
                for g in gaps
            ],
        },
        temperature=0.4,
    )
    descriptions = data.get("descriptions")
    if not isinstance(descriptions, list) or len(descriptions) != len(items):
        raise RuntimeError("AI service unavailable")
    if not all(isinstance(d, str) and d.strip() for d in descriptions):
        raise RuntimeError("AI service unavailable")
    return [dict(item, description=text.strip()) for item, text in zip(items, descriptions)]


def recommend(gaps):
    items = _base_recommend(gaps)
    if items and is_configured():
        try:
            return _personalize(items, gaps)
        except RuntimeError:
            pass
    return items