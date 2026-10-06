from fastapi import FastAPI

app = FastAPI(title="DU-01 Backend Service")

@app.get("/")
def read_root():
    return {"status": "backend operational"}
