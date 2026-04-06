from fastapi import FastAPI
from pydantic import BaseModel
from main import app as agent_graph

from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

class UserRequest(BaseModel):
    user_input: str

@app.post("/generate-db-spec")
async def run_agent(request: UserRequest):
    inital_state = {
        "user_input": request.user_input,
        "specifications": "",
        "dbml_code": "",
        "errors": [],
        "iteration": 0,
        "pm_response": None
    }

    result = await agent_graph.ainvoke(inital_state)

    return {
        "status": "success",
        "data": {
            "is_clear": result.get("pm_response").is_clear if result.get("pm_response") else None,
            "questions": result.get("pm_response").questions if result.get("pm_response") else None,
            "specifications": result.get("pm_response").spec if result.get("pm_response") else None,
            "dbml_code": result.get("dbml_code"),
            "final_state": "completed"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)