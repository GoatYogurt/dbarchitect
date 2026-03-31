from typing import TypedDict, List, Annotated

class AgentState(TypedDict):
    user_input: str        # initial user input
    specifications: str    # pm will write this based on user input
    dbml_code: str         # architect will write this based on specifications
    errors: List[str]      # errors found by validate_dbml function
    iteration: int         # number of code fix iterations