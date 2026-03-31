from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from product_manager.prompt import PRODUCT_MANAGER_PROMPT
from state import AgentState
from schemas import SystemSpec

class ProductManagerAgent:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2).with_structured_output(SystemSpec)

    
    def run(self, state: AgentState):
        print("Product Manager Agent is processing the user input...")

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", PRODUCT_MANAGER_PROMPT),
                ("user", "Based on the following user input, write clear technical specifications for the database design:\n\n{user_input}"),
            ]
        )

        chain = prompt | self.llm
        spec = chain.invoke({"user_input": state["user_input"]})
        formatted_spec = f"Project Name: {spec.project_name}\n\nEntities:\n"

        for entity in spec.entities:
            formatted_spec += f"- Table {entity.name}: {entity.description}\n  Fields: {', '.join(entity.fields)}\n"

        formatted_spec += f"\nRelationships: {', '.join(spec.relationships)}"

        return {"specifications": formatted_spec}