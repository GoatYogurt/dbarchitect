from typing import Optional, TypedDict, List, Annotated
from schemas import PMResponse
import operator

class AgentState(TypedDict):
    user_input: str        # initial user input
    errors: List[str]      # errors found by validate_dbml function
    iteration: int         # number of code fix iterations
    pm_response: Optional[PMResponse]      # response from PM agent, including is_clear and questions if any
    answers: Annotated[List[dict], operator.add] # list of answers to PM questions, each answer is a dict with question and user response
    dbml_code: str         # the architect agent will write this based on specifications