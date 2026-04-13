from architect.prompt import ARCHITECT_PROMPT
from state import AgentState
from langchain_groq import ChatGroq

class ArchitectAgent:
    def __init__(self):
        self.llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, max_retries=2)


    def run(self, state: AgentState):
        print("Architect Agent is processing the specifications from Product Manager...")
        pm_spec = state.get("pm_response").spec if state.get("pm_response") else ""
        
        prompt = f"""
        Based on this JSON specification from the Product Manager, generate a DBML schema:
        {pm_spec.model_dump_json() if pm_spec else "No specifications provided."}
        """

        response = self.llm.invoke([
            ("system", ARCHITECT_PROMPT),
            ("user", prompt)
        ])

        return {"dbml_code": response}