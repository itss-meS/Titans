def recommend(gaps):
    ordered = sorted(gaps, key=lambda g: g["mastery"])[:5]
    items = []
    for gap in ordered:
        concept = gap["concept"]
        severity = gap["severity"]
        prereqs = gap.get("prerequisite_gaps") or []
        if prereqs:
            first = prereqs[0]
            items.append(
                {
                    "type": "scaffolded",
                    "title": "Bridge: {} to {}".format(first, concept),
                    "description": "Strengthen {} before tackling {}.".format(first, concept),
                    "target_concept": first,
                    "estimated_time_min": 20,
                }
            )
        if severity in ("critical", "high"):
            items.append(
                {
                    "type": "study",
                    "title": "Deep Dive: {}".format(concept),
                    "description": "Review the core ideas of {} with worked examples.".format(concept),
                    "target_concept": concept,
                    "estimated_time_min": 15,
                }
            )
        items.append(
            {
                "type": "practice",
                "title": "Targeted Practice: {}".format(concept),
                "description": "Short practice set on {} with instant feedback.".format(concept),
                "target_concept": concept,
                "estimated_time_min": 20,
            }
        )
        if severity == "critical" and gap["confidence"] >= 0.8:
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
