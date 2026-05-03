from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from sops.create_new_project import create_project_workflow
from state import AgentState

router = APIRouter()
workflow = create_project_workflow()

class CreateProjectRequest(BaseModel):
    user_input: str
    project_name: str

class CreateProjectResponse(BaseModel):
    project_id: Optional[str]
    dbml_code: str
    is_clear: bool
    questions: Optional[list] = None
    error: Optional[str] = None

@router.post("/create-project", response_model=CreateProjectResponse)
async def create_project(request: CreateProjectRequest):
    """Run the create_new_project SOP"""
    try:
        # Initialize state
        initial_state: AgentState = {
            "user_input": request.user_input,
            "project_name": request.project_name,
            "errors": [],
            "iteration": 0,
            "pm_response": None,
            "answers": [],
            "dbml_code": "",
            "project_id": None
        }
        
        # Run workflow
        result = workflow.invoke(initial_state)
        
        return CreateProjectResponse(
            project_id=result.get("project_id"),
            dbml_code=result.get("dbml_code", ""),
            is_clear=result["pm_response"].is_clear if result.get("pm_response") else False,
            questions=result["pm_response"].questions if result.get("pm_response") else None,
            error=result.get("error_message")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))