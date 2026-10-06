from app.db import read_json
from app.services.ai_client import call_ai_detect_gaps, call_ai_recommend

CONCEPTS = [
    "Variables",
    "Loops",
    "Functions",
    "Stack Frames",
    "Recursion",
    "Memoization",
    "Dynamic Programming"
]

def analyze_student(student_id: str):
    responses_all = read_json("responses.json")
    questions_all = read_json("questions.json")
    
    student_responses = [r for r in responses_all if str(r.get("student_id")) == str(student_id)]
    
    ai_result = call_ai_detect_gaps(student_id, student_responses, questions_all)
    if ai_result and "mastery_by_concept" in ai_result:
        gaps = ai_result.get("gaps", [])
        recs = call_ai_recommend(gaps) if gaps else []
        return {
            "student_id": student_id,
            "mastery_by_concept": ai_result.get("mastery_by_concept", []),
            "gaps": gaps,
            "strengths": ai_result.get("strengths", []),
            "overall_mastery": ai_result.get("overall_mastery", 0.0),
            "recommendations": recs or [],
            "status": ai_result.get("status", "ok"),
            "message": ai_result.get("message", "")
        }

    q_map = {q["id"]: q for q in questions_all}
    topic_scores = {c: {"total": 0.0, "count": 0} for c in CONCEPTS}
    
    for r in student_responses:
        q = q_map.get(r.get("question_id"))
        if not q:
            continue
        ans = str(r.get("answer", "")).strip().lower()
        corr = str(q.get("correct_answer", "")).strip().lower()
        hints = r.get("hints_used", 0) or 0
        score = (1.0 if ans == corr else 0.0) * max(0.5, 1.0 - 0.1 * hints)
        
        for t in q.get("topics", []):
            if t in topic_scores:
                topic_scores[t]["total"] += score
                topic_scores[t]["count"] += 1
                
    mastery_list = []
    gaps = []
    strengths = []
    
    for c in CONCEPTS:
        info = topic_scores[c]
        if info["count"] == 0:
            mastery = 0.5
            sev = "none"
        else:
            mastery = round(info["total"] / info["count"], 2)
            if mastery < 0.35:
                sev = "critical"
            elif mastery < 0.55:
                sev = "high"
            elif mastery < 0.75:
                sev = "medium"
            else:
                sev = "low"
                
        mastery_list.append({"concept": c, "mastery": mastery, "severity": sev})
        
        if sev in ("critical", "high", "medium"):
            gaps.append({
                "concept": c,
                "severity": sev,
                "confidence": 0.8,
                "mastery": mastery,
                "evidence": [],
                "trend": "stable",
                "prerequisite_gaps": []
            })
        elif sev == "low":
            strengths.append(c)
            
    recs = []
    for g in sorted(gaps, key=lambda x: x["mastery"]):
        recs.append({
            "priority": len(recs) + 1,
            "type": "practice",
            "title": f"Targeted Practice: {g['concept']}",
            "description": f"Focus practice on {g['concept']} to build concept mastery.",
            "target_concept": g["concept"],
            "estimated_time_min": 15
        })
        
    overall = round(sum(m["mastery"] for m in mastery_list) / len(mastery_list), 2)
    
    return {
        "student_id": student_id,
        "mastery_by_concept": mastery_list,
        "gaps": gaps,
        "strengths": strengths,
        "overall_mastery": overall,
        "recommendations": recs,
        "status": "ok",
        "message": ""
    }
