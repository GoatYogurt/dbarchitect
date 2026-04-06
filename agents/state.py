from typing import Optional, TypedDict, List
from schemas import PMResponse

class AgentState(TypedDict):
    user_input: str        # initial user input
    dbml_code: str         # architect will write this based on specifications
    errors: List[str]      # errors found by validate_dbml function
    iteration: int         # number of code fix iterations
    pm_response: Optional[PMResponse]      # response from PM agent, including is_clear and questions if any