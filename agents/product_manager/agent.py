from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
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

        # prompt = ChatPromptTemplate.from_messages(
        #     [
        #         ("system", PRODUCT_MANAGER_PROMPT),
        #         ("user", "Based on the following user input, write clear technical specifications for the database design:\n\n{user_input}"),
        #     ]
        # )

        # chain = prompt | self.llm
        # spec = chain.invoke({"user_input": state["user_input"]})
        # formatted_spec = f"Project Name: {spec.project_name}\n\nEntities:\n"

        # for entity in spec.entities:
        #     formatted_spec += f"- Table {entity.name}: {entity.description}\n  Fields: {', '.join(entity.fields)}\n"

        # formatted_spec += f"\nRelationships: {', '.join(spec.relationships)}"

        # return {"specifications": formatted_spec}

        prompt = f"""
        Original user input: {user_req}
        {context_str}
        """

        response = self.llm.invoke([
            ("system", PRODUCT_MANAGER_PROMPT),
            ("user", prompt)
        ]        )
        return {"pm_response": response}