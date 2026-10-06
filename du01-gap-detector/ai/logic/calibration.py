def confidence_from_evidence(n_ev):
    return min(0.95, 0.4 + n_ev * 0.08)


def severity_from_mastery(mastery):
    if mastery < 0.35:
        return "critical"
    if mastery < 0.55:
        return "high"
    if mastery < 0.75:
        return "medium"
    return "low"


def beta_mean(alpha, beta):
    total = alpha + beta
    if total > 0:
        return alpha / total
    return 0.5
