from sqlalchemy import func, select

from app.db import (
    Base,
    ClassRoom,
    Question,
    Response,
    SessionLocal,
    Student,
    engine,
)

CODE_ANSWER = "def sum(arr, i):\n    if i >= len(arr): return 0\n    return arr[i] + sum(arr, i + 1)"
WRONG = "wrong"

STUDENTS = [
    ("stu_1", "Aarav"),
    ("stu_2", "Diya"),
    ("stu_3", "Kabir"),
]

QUESTIONS = [
    ("q1", "mcq", "Variables", "What is the type of x in x = 5?", ["int", "str", "float", "bool"], "int", 1),
    ("q2", "mcq", "Variables", "What does print(2 + 3) display?", ["23", "5", "2 + 3", "Error"], "5", 1),
    ("q3", "mcq", "Loops", "What does for i in range(3): print(i) print?", ["0 1 2", "1 2 3", "0 1 2 3", "Error"], "0 1 2", 2),
    ("q4", "mcq", "Loops", "How many times does the body of while False: run?", ["0", "1", "2", "Infinite"], "0", 2),
    ("q5", "mcq", "Functions", "What does a function return if it has no return statement?", ["0", "None", "Empty string", "Error"], "None", 2),
    ("q6", "mcq", "Functions", "Which keyword defines a function in Python?", ["func", "define", "def", "lambda"], "def", 2),
    ("q7", "mcq", "Recursion", "What stops a recursive function from calling itself forever?", ["A base case", "A loop", "A global variable", "A print statement"], "A base case", 3),
    ("q8", "mcq", "Recursion", "With f(n) = 1 if n <= 1 else n * f(n-1), what is f(3)?", ["3", "6", "9", "1"], "6", 3),
    ("q9", "code", "Recursion", "Write recursive sum(arr, i) returning the sum of arr from index i.", [], CODE_ANSWER, 4),
    ("q10", "mcq", "Dynamic Programming", "Which technique stores results of subproblems to avoid recomputation?", ["Memoization", "Sorting", "Hashing", "Recursion only"], "Memoization", 4),
]

PATTERNS = {
    "stu_1": ["OK", "OK", "OK", "OK", "OK", "OK", "OK", "OK", "def sum(arr, i): return sum(arr[i:])", WRONG],
    "stu_2": ["OK", "OK", "OK", "OK", "OK", "OK", WRONG, WRONG, "", WRONG],
    "stu_3": ["OK", "OK", WRONG, WRONG, WRONG, WRONG, WRONG, WRONG, "", WRONG],
}


def seed(db) -> None:
    db.merge(ClassRoom(id=1, name="CS101"))
    for student_id, name in STUDENTS:
        db.merge(Student(id=student_id, name=name, class_id=1))
    correct_by_id = {}
    for qid, qtype, topic, stem, options, correct, difficulty in QUESTIONS:
        correct_by_id[qid] = correct
        db.merge(
            Question(
                id=qid,
                stem=stem,
                type=qtype,
                correct_answer=correct,
                options=options,
                topics=[topic],
                difficulty=difficulty,
                rubric={},
            )
        )
    db.flush()
    for student_id, pattern in PATTERNS.items():
        for (qid, *_), cell in zip(QUESTIONS, pattern):
            answer = correct_by_id[qid] if cell == "OK" else cell
            db.add(
                Response(
                    student_id=student_id,
                    question_id=qid,
                    answer=answer,
                    time_spent=40,
                    hints_used=0,
                )
            )
    db.commit()


def reset_and_seed() -> None:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
        classes = db.scalar(select(func.count()).select_from(ClassRoom))
        students = db.scalar(select(func.count()).select_from(Student))
        questions = db.scalar(select(func.count()).select_from(Question))
        responses = db.scalar(select(func.count()).select_from(Response))
    print(f"Seeded {classes} class, {students} students, {questions} questions, {responses} responses")


if __name__ == "__main__":
    reset_and_seed()
