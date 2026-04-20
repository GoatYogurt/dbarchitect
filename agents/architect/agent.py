from architect.prompt import ARCHITECT_PROMPT
from state import AgentState
from langchain_groq import ChatGroq
from pydbml import PyDBML
from pydbml.exceptions import ValidationError



def validate_dbml(dbml_code: str):
    try:
        clean_code = dbml_code.replace("```dbml", "").replace("```", "").strip()
        
        PyDBML(clean_code)
        return True, None
    except ValidationError as e:
        return False, str(e)
    except Exception as e:
        return False, f"Unexpected error: {str(e)}"

        
class ArchitectAgent:
    def __init__(self):
        self.llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, max_retries=2)


    def run(self, state: AgentState):
        print(f"Architect is working (Iteration: {state.get('iteration', 0)})...")
        
        pm_spec = state["pm_response"].spec
        error_feedback = state.get("error_message", "")
        
        user_content = f"Target Specification: {pm_spec.model_dump_json()}"
        if error_feedback:
            user_content += f"\n\nERROR FROM PREVIOUS ATTEMPT: {error_feedback}\nPlease fix the syntax and return the corrected DBML code."

        # Gọi LLM
        response = self.llm.invoke([
            ("system", ARCHITECT_PROMPT),
            ("user", user_content)
        ])
        
        dbml_code = response.content
        
        # Thực hiện Validate ngay tại Node hoặc dùng Conditional Edge
        is_valid, error_msg = validate_dbml(dbml_code)
        
        if is_valid:
            return {
                "dbml_code": dbml_code,
                "error_message": None, # Xóa lỗi cũ nếu có
                "iteration": state.get("iteration", 0) + 1
            }
        else:
            print(f"Validation failed: {error_msg}")
            return {
                "error_message": error_msg,
                "iteration": state.get("iteration", 0) + 1
            }