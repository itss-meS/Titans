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
}


def generate(gaps, count=5):
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
