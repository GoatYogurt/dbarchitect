from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from pydantic import BaseModel
from main import app as agent_graph
from typing import List, Optional, Union
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

class UserAnswer(BaseModel):
    question_text: str
    answer: Union[str, List[str]]  # answer can be a string or a list of strings depending on the question type


class UserRequest(BaseModel):
    user_input: str
    answers: Optional[List[UserAnswer]] = []  # list of answers to PM questions, optional for the initial request


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/chat")
async def run_agent(request: UserRequest):
    inital_state = {
        "user_input": request.user_input,
        "specifications": "",
        "dbml_code": "",
        "errors": [],
        "iteration": 0,
        "pm_response": None,
        "answers": [answer.model_dump() for answer in request.answers]  # convert UserAnswer models to dicts
    }

    result = await agent_graph.ainvoke(inital_state)

    return {
        "status": "success",
        "data": {
            "is_clear": result.get("pm_response").is_clear if result.get("pm_response") else None,
            "questions": result.get("pm_response").questions if result.get("pm_response") else None,
            "specifications": result.get("pm_response").spec if result.get("pm_response") else None,
            "dbml_code": result.get("dbml_code")
            # "final_state": "completed"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)