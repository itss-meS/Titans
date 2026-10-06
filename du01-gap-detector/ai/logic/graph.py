PREREQS = {
    "Recursion": ["Functions", "Stack Frames"],
    "Dynamic Programming": ["Recursion", "Memoization"],
    "Graphs": ["Trees", "Queues"],
    "Variables": [],
    "Loops": [],
    "Functions": [],
}


def prerequisites_of(concept):
    return PREREQS.get(concept, [])
