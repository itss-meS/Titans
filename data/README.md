# Fake demo data — CS101 Section A

Copy the `backend` and `tools` folders from here into `du01-gap-detector\` (merge with existing folders).

```powershell
cd du01-gap-detector\backend
.\load-fake-data.ps1
```

This wipes the SQLite database and loads the data below. Then run `..\start-all.ps1`.

| File | Contents |
|---|---|
| `backend\fake_data\classes.json` | 1 class |
| `backend\fake_data\students.json` | 30 students (`stu_1` to `stu_30`) |
| `backend\fake_data\questions.json` | 28 questions, 7 concepts, 4 per concept |
| `backend\fake_data\responses.json` | about 785 responses over 3 assessments |
| `backend\fake_data\responses.csv` | same responses as CSV for the bulk-import demo |
| `tools\generate_fake_data.py` | regenerates everything (`python tools\generate_fake_data.py`) |

Concepts: Variables, Loops, Functions, Stack Frames, Recursion, Memoization, Dynamic Programming.

Assessments: 18 Aug 2026 (q1-q12), 8 Sep 2026 (q13-q20), 29 Sep 2026 (q21-q28). A few students retry wrong questions 4 to 9 days later.

The data matches the contract: `questions.json` is valid `POST /api/questions` input, and `responses.json` is valid `POST /api/responses` input (the extra `submitted_at` field is ignored by the API and used by the loader).
