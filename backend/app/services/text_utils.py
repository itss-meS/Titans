def normalize(value) -> str:
    return " ".join(str(value).split()).lower()


def answers_match(given, expected) -> bool:
    return normalize(given) == normalize(expected)
