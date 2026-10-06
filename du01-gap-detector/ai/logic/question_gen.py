from logic.llm import chat_json, is_configured


TEMPLATES = {
    "Variables": [
        (
            "mcq",
            "What is the value of y after x = 4 and y = x * 2?",
            ["4", "8", "2", "x * 2"],
            "8",
            "y is assigned the result of 4 times 2, which is 8.",
        ),
        (
            "mcq",
            "Which of these is a string value in Python?",
            ["42", "3.14", "\"hello\"", "True"],
            "\"hello\"",
            "Text inside quotes is a string.",
        ),
    ],
    "Loops": [
        (
            "mcq",
            "What does for i in range(3): print(i) print?",
            ["0 1 2", "1 2 3", "0 1 2 3", "Error"],
            "0 1 2",
            "range(3) produces 0, 1 and 2.",
        ),
        (
            "mcq",
            "How many times does the body of for i in range(5) run?",
            ["4", "5", "6", "0"],
            "5",
            "range(5) yields five values, so the body runs five times.",
        ),
    ],
    "Functions": [
        (
            "mcq",
            "What does a function return if it has no return statement?",
            ["0", "None", "Empty string", "Error"],
            "None",
            "Python returns None when no return statement runs.",
        ),
        (
            "mcq",
            "Which keyword defines a function in Python?",
            ["func", "define", "def", "lambda"],
            "def",
            "The def keyword starts a function definition.",
        ),
    ],
    "Recursion": [
        (
            "mcq",
            "What stops a recursive function from calling itself forever?",
            ["A base case", "A loop", "A global variable", "A print statement"],
            "A base case",
            "A base case returns without another recursive call.",
        ),
        (
            "code",
            "Write recursive sum(arr, i) returning the sum of arr from index i.",
            [],
            "def sum(arr, i):\n    if i >= len(arr): return 0\n    return arr[i] + sum(arr, i + 1)",
            "The base case ends the recursion and the recursive step adds the next element.",
        ),
    ],
    "Dynamic Programming": [
        (
            "mcq",
            "What does memoization store?",
            ["Results of subproblems", "User passwords", "Function names", "Loop counters"],
            "Results of subproblems",
            "Memoization caches subproblem results so they are not recomputed.",
        ),
        (
            "mcq",
            "Why is naive recursive Fibonacci slow?",
            [
                "It recomputes the same subproblems",
                "It uses too little memory",
                "It has no base case",
                "It uses loops",
            ],
            "It recomputes the same subproblems",
            "The same values are calculated many times without caching.",
        ),
    ],
    "Memoization": [
        (
            "mcq",
            "What is the main purpose of memoization?",
            ["Reuse computed results", "Sort input values", "Validate syntax", "Print output"],
            "Reuse computed results",
            "Memoization stores results so repeated subproblems can be answered quickly.",
        ),
    ],
    "Stack Frames": [
        (
            "mcq",
            "What does a stack frame hold during a function call?",
            ["Local call state", "All program files", "Only comments", "The operating system"],
            "Local call state",
            "A stack frame stores the local state needed for one active function call.",
        ),
    ],
}


def _template_generate(gaps, count=5):
    limit = max(0, min(count, 5))
    ordered = sorted(gaps, key=lambda g: g["mastery"])
    chosen = [g for g in ordered if g["concept"] in TEMPLATES][:3]
    output = []
    if limit == 0:
        return output
    for index in range(2):
        for gap in chosen:
            if len(output) >= limit:
                return output
            concept = gap["concept"]
            templates = TEMPLATES[concept]
            if index >= len(templates):
                continue
            qtype, stem, options, answer, explanation = templates[index]
            slug = concept.lower().replace(" ", "-")
            output.append(
                {
                    "id": "gen-{}-{}".format(slug, index),
                    "stem": stem,
                    "type": qtype,
                    "options": list(options),
                    "correct_answer": answer,
                    "explanation": explanation,
                    "target_concept": concept,
                }
            )
    return output


def _llm_practice(gaps, count):
    ordered = sorted(gaps, key=lambda g: g["mastery"])[:3]
    concepts = [g["concept"] for g in ordered]
    if not concepts:
        return []
    data = chat_json(
        "You write practice questions for students. Return only strict JSON with a questions array. "
        "Each item has: stem (string), type (mcq or short_answer), options (array of exactly 4 distinct strings for mcq, empty array for short_answer), "
        "correct_answer (string, must equal one option for mcq), explanation (string), target_concept (one of the given concepts).",
        {
            "count": count,
            "concepts": concepts,
            "gaps": [
                {
                    "concept": g["concept"],
                    "severity": g.get("severity"),
                    "mastery": g.get("mastery"),
                    "evidence": (g.get("evidence") or [])[:5],
                }
                for g in ordered
            ],
        },
        temperature=0.4,
    )
    items = data.get("questions")
    if not isinstance(items, list):
        raise RuntimeError("AI service unavailable")
    output = []
    for item in items:
        if not isinstance(item, dict):
            continue
        stem = item.get("stem")
        qtype = item.get("type")
        options = item.get("options")
        correct = item.get("correct_answer")
        explanation = item.get("explanation")
        concept = item.get("target_concept")
        if not isinstance(stem, str) or not stem.strip():
            continue
        if qtype not in ("mcq", "short_answer"):
            continue
        if concept not in concepts:
            continue
        if not isinstance(correct, str) or not correct.strip():
            continue
        if not isinstance(explanation, str) or not explanation.strip():
            continue
        if qtype == "mcq":
            if not isinstance(options, list) or len(options) != 4 or len(set(options)) != 4 or correct not in options:
                continue
        else:
            options = []
        output.append(
            {
                "id": "gen-ai-{}".format(len(output)),
                "stem": stem.strip(),
                "type": qtype,
                "options": options,
                "correct_answer": correct,
                "explanation": explanation.strip(),
                "target_concept": concept,
            }
        )
        if len(output) >= count:
            break
    return output


def generate(gaps, count=5):
    limit = max(0, min(count, 5))
    if limit == 0:
        return []
    if is_configured():
        try:
            output = _llm_practice(gaps, limit)
            if output:
                return output
        except RuntimeError:
            pass
    return _template_generate(gaps, limit)


def generate_questions(subject, concept, count=5, difficulty=3):
    prompt = {
        "subject": subject,
        "concept": concept,
        "count": count,
        "difficulty": difficulty,
        "requirements": {
            "types": ["mcq", "short_answer"],
            "topics": [concept],
            "rubric": {},
            "id_prefix": "gen_",
        },
    }
    raw = chat_json(
        "Return only strict JSON with a questions array. Do not include markdown.",
        prompt,
    )
    items = raw.get("questions")
    if not isinstance(items, list):
        raise RuntimeError("AI service unavailable")
    valid = []
    ids = set()
    for item in items:
        if not isinstance(item, dict):
            continue
        qid = item.get("id")
        stem = item.get("stem")
        qtype = item.get("type")
        options = item.get("options")
        correct = item.get("correct_answer")
        if not isinstance(qid, str) or not qid.startswith("gen_") or qid in ids:
            continue
        if not isinstance(stem, str) or not stem.strip():
            continue
        if qtype not in {"mcq", "short_answer"}:
            continue
        if item.get("topics") != [concept] or item.get("difficulty") != difficulty or item.get("rubric") != {}:
            continue
        if qtype == "mcq":
            if not isinstance(options, list) or len(options) != 4 or len(set(options)) != 4 or correct not in options:
                continue
        elif not isinstance(correct, str) or not correct.strip() or len(correct.strip()) > 200 or options != []:
            continue
        ids.add(qid)
        valid.append(
            {
                "id": qid,
                "stem": stem.strip(),
                "type": qtype,
                "options": options,
                "correct_answer": correct,
                "topics": [concept],
                "difficulty": difficulty,
                "rubric": {},
            }
        )
    return valid[:count]