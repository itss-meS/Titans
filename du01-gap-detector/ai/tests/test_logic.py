from fastapi.testclient import TestClient

from logic.gap_detector import detect_gaps
from logic.question_gen import generate
from logic.recommender import recommend
from main import app

SUM_CODE = "def sum(arr, i):\n    if i >= len(arr): return 0\n    return arr[i] + sum(arr, i + 1)"

QUESTIONS = [
    {"id": "q1", "stem": "Type of 5?", "type": "mcq", "correct_answer": "int", "options": ["int", "str"], "topics": ["Variables"], "difficulty": 1},
    {"id": "q2", "stem": "x = 2 + 3, x?", "type": "mcq", "correct_answer": "5", "options": ["5", "23"], "topics": ["Variables"], "difficulty": 1},
    {"id": "q3", "stem": "range(3) prints?", "type": "mcq", "correct_answer": "0 1 2", "options": ["0 1 2", "1 2 3"], "topics": ["Loops"], "difficulty": 2},
    {"id": "q4", "stem": "First value of range(4)?", "type": "mcq", "correct_answer": "0", "options": ["0", "1"], "topics": ["Loops"], "difficulty": 2},
    {"id": "q5", "stem": "Return without return?", "type": "mcq", "correct_answer": "None", "options": ["None", "0"], "topics": ["Functions"], "difficulty": 2},
    {"id": "q6", "stem": "Keyword for functions?", "type": "mcq", "correct_answer": "def", "options": ["def", "func"], "topics": ["Functions"], "difficulty": 1},
    {"id": "q7", "stem": "What stops recursion?", "type": "mcq", "correct_answer": "A base case", "options": ["A base case", "A loop"], "topics": ["Recursion"], "difficulty": 3},
    {"id": "q8", "stem": "factorial(3)?", "type": "mcq", "correct_answer": "6", "options": ["6", "3"], "topics": ["Recursion"], "difficulty": 3},
    {"id": "q9", "stem": "Write recursive sum", "type": "code", "correct_answer": SUM_CODE, "options": [], "topics": ["Recursion"], "difficulty": 4},
    {"id": "q10", "stem": "Technique caching subproblems?", "type": "mcq", "correct_answer": "Memoization", "options": ["Memoization", "Sorting"], "topics": ["Dynamic Programming"], "difficulty": 4},
]

CORRECT = {q["id"]: q["correct_answer"] for q in QUESTIONS}


def build(answers):
    return [{"question_id": qid, "answer": ans, "time_spent": 60, "hints_used": 0} for qid, ans in answers.items()]


def answers_for(overrides, correct_ids):
    result = {}
    for qid in CORRECT:
        if qid in overrides:
            result[qid] = overrides[qid]
        elif qid in correct_ids:
            result[qid] = CORRECT[qid]
    return result


STU_1 = build(
    answers_for(
        {"q9": "def sum(arr, i): return sum(arr[i:])", "q10": "wrong"},
        ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"],
    )
)
STU_2 = build(
    answers_for(
        {"q7": "wrong", "q8": "wrong", "q9": "", "q10": "wrong"},
        ["q1", "q2", "q3", "q4", "q5", "q6"],
    )
)
STU_3 = build(
    answers_for(
        {
            "q3": "wrong",
            "q4": "wrong",
            "q5": "wrong",
            "q6": "wrong",
            "q7": "wrong",
            "q8": "wrong",
            "q9": "",
            "q10": "wrong",
        },
        ["q1", "q2"],
    )
)


def by_concept(result):
    return {m["concept"]: m for m in result["mastery_by_concept"]}


def gap_of(result, concept):
    for g in result["gaps"]:
        if g["concept"] == concept:
            return g
    return None


def test_stu_1():
    r = detect_gaps("stu_1", STU_1, QUESTIONS)
    m = by_concept(r)
    assert m["Variables"]["mastery"] == 0.75
    assert m["Loops"]["mastery"] == 0.75
    assert m["Functions"]["mastery"] == 0.75
    assert r["strengths"] == ["Functions", "Loops", "Variables"]
    rec = gap_of(r, "Recursion")
    assert rec["mastery"] == 0.70
    assert rec["confidence"] == 0.88
    assert rec["severity"] == "medium"
    dp = gap_of(r, "Dynamic Programming")
    assert dp["mastery"] == 0.33
    assert dp["confidence"] == 0.56
    assert dp["severity"] == "critical"
    assert r["overall_mastery"] == 0.66
    assert [g["concept"] for g in r["gaps"]] == ["Dynamic Programming", "Recursion"]


def test_stu_2():
    r = detect_gaps("stu_2", STU_2, QUESTIONS)
    rec = gap_of(r, "Recursion")
    assert rec["mastery"] == 0.20
    assert rec["confidence"] == 0.88
    assert rec["severity"] == "critical"
    dp = gap_of(r, "Dynamic Programming")
    assert dp["mastery"] == 0.23
    assert dp["confidence"] == 0.60
    assert dp["severity"] == "critical"
    assert dp["prerequisite_gaps"] == ["Recursion"]
    assert r["overall_mastery"] == 0.54


def test_stu_3():
    r = detect_gaps("stu_3", STU_3, QUESTIONS)
    loops = gap_of(r, "Loops")
    assert loops["mastery"] == 0.25
    assert loops["confidence"] == 0.72
    assert loops["severity"] == "critical"
    funcs = gap_of(r, "Functions")
    assert funcs["mastery"] == 0.25
    assert funcs["confidence"] == 0.72
    assert funcs["severity"] == "critical"
    rec = gap_of(r, "Recursion")
    assert rec["mastery"] == 0.14
    assert rec["confidence"] == 0.88
    assert rec["severity"] == "critical"
    assert rec["prerequisite_gaps"] == ["Functions"]
    dp = gap_of(r, "Dynamic Programming")
    assert dp["mastery"] == 0.23
    assert dp["confidence"] == 0.60
    assert dp["severity"] == "critical"
    assert dp["prerequisite_gaps"] == ["Recursion"]
    assert r["overall_mastery"] == 0.32
    assert r["status"] == "ok"
    assert rec["evidence"] == ["q7: incorrect", "q8: incorrect", "q9: incorrect"]


def test_no_data():
    r = detect_gaps("x", [], QUESTIONS)
    assert r["status"] == "no_data"
    assert r["gaps"] == []
    assert r["overall_mastery"] == 0.0
    unknown = detect_gaps("x", [{"question_id": "zzz", "answer": "a"}], QUESTIONS)
    assert unknown["status"] == "no_data"


def test_determinism():
    a = detect_gaps("stu_3", STU_3, QUESTIONS)
    b = detect_gaps("stu_3", STU_3, QUESTIONS)
    assert a == b


def test_recommend():
    r = detect_gaps("stu_3", STU_3, QUESTIONS)
    recs = recommend(r["gaps"])
    assert 0 < len(recs) <= 7
    assert [x["priority"] for x in recs] == list(range(1, len(recs) + 1))
    titles = [x["title"] for x in recs]
    assert len(titles) == len(set(titles))
    assert recs[0]["title"] == "Bridge: Functions to Recursion"
    assert recs[0]["estimated_time_min"] == 20


def test_generate():
    r = detect_gaps("stu_3", STU_3, QUESTIONS)
    five = generate(r["gaps"], count=5)
    assert len(five) == 5
    ids = [q["id"] for q in five]
    assert len(ids) == len(set(ids))
    assert len(generate(r["gaps"], count=2)) == 2
    assert generate([]) == []
    assert generate(r["gaps"], count=0) == []


def test_endpoints():
    client = TestClient(app)
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
    payload = {"student_id": "stu_3", "responses": STU_3, "questions": QUESTIONS}
    det = client.post("/detect-gaps", json=payload)
    assert det.status_code == 200
    body = det.json()
    assert body["overall_mastery"] == 0.32
    rec = client.post("/recommend", json={"gaps": body["gaps"]})
    assert rec.status_code == 200
    assert len(rec.json()) <= 7
    gen = client.post("/generate-practice", json={"gaps": body["gaps"], "count": 5})
    assert gen.status_code == 200
    assert len(gen.json()) == 5


if __name__ == "__main__":
    test_stu_1()
    test_stu_2()
    test_stu_3()
    test_no_data()
    test_determinism()
    test_recommend()
    test_generate()
    test_endpoints()
    print("All tests passed")
