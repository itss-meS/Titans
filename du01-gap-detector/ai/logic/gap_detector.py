from logic.calibration import beta_mean, confidence_from_evidence, severity_from_mastery
from logic.graph import prerequisites_of


def _norm(value):
    return " ".join(str(value).split()).lower()


def score_response(question, response):
    answer = response.get("answer")
    correct = question.get("correct_answer")
    qtype = question.get("type")
    if qtype == "code":
        if _norm(answer) == _norm(correct):
            result = 1.0
        elif str(answer).strip():
            result = 0.5
        else:
            result = 0.0
    else:
        result = 1.0 if _norm(answer) == _norm(correct) else 0.0
    hints = response.get("hints_used", 0) or 0
    return result * max(0.5, 1 - 0.1 * hints)


def _no_data():
    return {
        "gaps": [],
        "strengths": [],
        "mastery_by_concept": [],
        "overall_mastery": 0.0,
        "status": "no_data",
        "message": "No responses yet. Submit an assessment to see learning gaps.",
    }


def detect_gaps(student_id, responses, questions):
    if not responses:
        return _no_data()

    q_map = {q["id"]: q for q in questions}
    state = {}
    matched = 0

    for response in responses:
        question = q_map.get(response.get("question_id"))
        if question is None:
            continue
        matched += 1
        score = score_response(question, response)
        if score >= 0.99:
            label = "correct"
        elif score > 0:
            label = "partial"
        else:
            label = "incorrect"
        for topic in question.get("topics", []):
            entry = state.setdefault(topic, {"alpha": 2.0, "beta": 2.0, "items": []})
            entry["alpha"] += 2 * score
            entry["beta"] += 2 * (1 - score)
            entry["items"].append("{}: {}".format(question["id"], label))

    if matched == 0:
        return _no_data()

    raw = {c: beta_mean(s["alpha"], s["beta"]) for c, s in state.items()}

    final = {}
    for concept, s in state.items():
        mastery = raw[concept]
        n_ev = s["alpha"] + s["beta"] - 4
        confidence = confidence_from_evidence(n_ev)
        prereq_gaps = []
        for prereq in prerequisites_of(concept):
            if prereq in raw and raw[prereq] < 0.6:
                mastery *= 0.7
                confidence = max(confidence, 0.6)
                prereq_gaps.append(prereq)
        final[concept] = {
            "mastery": mastery,
            "confidence": confidence,
            "prereq_gaps": prereq_gaps,
            "severity": severity_from_mastery(mastery),
            "items": s["items"],
        }

    mastery_by_concept = []
    gaps = []
    strengths = []
    for concept in sorted(final):
        f = final[concept]
        mastery_by_concept.append(
            {
                "concept": concept,
                "mastery": round(f["mastery"], 2),
                "severity": f["severity"],
            }
        )
        if f["severity"] == "low":
            strengths.append(concept)
        else:
            gaps.append(
                {
                    "concept": concept,
                    "severity": f["severity"],
                    "confidence": round(f["confidence"], 2),
                    "mastery": round(f["mastery"], 2),
                    "evidence": list(f["items"]),
                    "trend": "stable",
                    "prerequisite_gaps": list(f["prereq_gaps"]),
                }
            )

    gaps.sort(key=lambda g: (g["mastery"], g["concept"]))
    overall = round(sum(f["mastery"] for f in final.values()) / len(final), 2)

    if not gaps:
        status = "ok"
        message = "No significant gaps detected."
    elif all(g["confidence"] < 0.5 for g in gaps):
        status = "low_confidence"
        message = "Need more data to be confident about these gaps."
    else:
        status = "ok"
        message = ""

    return {
        "gaps": gaps,
        "strengths": strengths,
        "mastery_by_concept": mastery_by_concept,
        "overall_mastery": overall,
        "status": status,
        "message": message,
    }
