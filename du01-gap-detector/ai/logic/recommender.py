def recommend(gaps, strengths=None):
    if not gaps:
        recs = []
        if strengths:
            for idx, concept in enumerate(strengths[:3], start=1):
                recs.append({
                    "priority": idx,
                    "type": "stretch",
                    "title": f"Advanced Challenge: {concept}",
                    "description": f"Mastery achieved in {concept}. Try advanced problem-solving challenges.",
                    "target_concept": concept,
                    "estimated_time_min": 25
                })
        return recs

    severity_weight = {"critical": 1, "high": 2, "medium": 3, "low": 4}
    ordered = sorted(gaps, key=lambda g: (severity_weight.get(g.get("severity"), 5), g.get("mastery", 1.0)))[:5]
    
    items = []
    for gap in ordered:
        concept = gap.get("concept", "")
        severity = gap.get("severity", "medium")
        prereqs = gap.get("prerequisite_gaps") or []
        evidence = gap.get("evidence") or []
        
        if prereqs:
            first = prereqs[0]
            items.append({
                "type": "scaffolded",
                "title": f"Bridge: {first} to {concept}",
                "description": f"Strengthen foundation concept {first} before tackling {concept}.",
                "target_concept": first,
                "estimated_time_min": 20
            })
            
        if severity in ("critical", "high"):
            err_detail = f" (Review evidence: {', '.join(evidence[:2])})" if evidence else ""
            items.append({
                "type": "study",
                "title": f"Deep Dive: {concept}",
                "description": f"Review core concepts of {concept} with step-by-step worked examples.{err_detail}",
                "target_concept": concept,
                "estimated_time_min": 15
            })
            
        items.append({
            "type": "practice",
            "title": f"Targeted Practice: {concept}",
            "description": f"Short targeted practice set on {concept} with instant feedback.",
            "target_concept": concept,
            "estimated_time_min": 20
        })
        
        if severity == "critical" and gap.get("confidence", 0.0) >= 0.8:
            items.append({
                "type": "peer_tutoring",
                "title": f"Peer Tutoring: {concept}",
                "description": f"Work through {concept} with a classmate who has mastered it.",
                "target_concept": concept,
                "estimated_time_min": 30
            })

    seen = set()
    unique = []
    for item in items:
        if item["title"] not in seen:
            seen.add(item["title"])
            unique.append(item)

    result = []
    for idx, item in enumerate(unique[:7], start=1):
        result.append({
            "priority": idx,
            "type": item["type"],
            "title": item["title"],
            "description": item["description"],
            "target_concept": item["target_concept"],
            "estimated_time_min": item["estimated_time_min"]
        })
    return result
