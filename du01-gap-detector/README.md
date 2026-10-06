# DU-01 AI-Powered Learning Gap Detector - AI Service

Deterministic pure-Python service (FastAPI) that finds the concept behind a student's mistakes.

## Pipeline
| Stage | File |
|---|---|
| Pattern analyzer (per-response scoring, per-concept aggregation) | `ai/logic/gap_detector.py` |
| Knowledge graph (prerequisites) | `ai/logic/graph.py` |
| Gap detection model (Beta-Binomial mastery, prerequisite propagation) | `ai/logic/gap_detector.py` |
| Confidence scorer / severity | `ai/logic/calibration.py` |
| Recommendation engine | `ai/logic/recommender.py` |
| Practice question generator | `ai/logic/question_gen.py` |

## Endpoints (127.0.0.1:8001)
- `GET /health`
- `POST /detect-gaps`
- `POST /recommend`
- `POST /generate-practice`

## Run (Windows, PowerShell)
```powershell
cd du01-gap-detector\ai
.\setup-ai.ps1
.\test-ai.ps1
.\start-ai.ps1
```
Interactive docs: http://127.0.0.1:8001/docs
