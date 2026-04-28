from product_manager.prompt import PRODUCT_MANAGER_PROMPT
from state import AgentState
from schemas import PMResponse
from langchain_groq import ChatGroq
class ProductManagerAgent:
    def __init__(self):
        self.llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, max_retries=2).with_structured_output(PMResponse)

    
    def run(self, state: AgentState):
        print("Product Manager Agent is processing the user input...")
        user_req = state.get("user_input", "")
        past_answers = state.get("answers", [])

        context_str = ""
        if past_answers:
            context_str += "\nAdditional user answers:\n"
            for ans in past_answers:
                context_str += f'Question: {ans["question_text"]}\nAnswer: {ans["answer"]}\n'

        prompt = f"""
        Original user input: {user_req}
        {context_str}
        """

        response = self.llm.invoke([
            ("system", PRODUCT_MANAGER_PROMPT),
            ("user", prompt)
        ])
        return {"pm_response": response}