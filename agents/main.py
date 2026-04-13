from langgraph.graph import StateGraph, END
from product_manager.agent import ProductManagerAgent
from architect.agent import ArchitectAgent
from state import AgentState

def should_continue(state: AgentState):
    print("Current state: " + str(state))
    decision = state["pm_response"].is_clear
    if decision == True:
        print("Product Manager has provided clear specifications. Proceeding to Architect Agent...")
        return "architect"
    else:
        print("Product Manager has identified unclear requirements. Returning to Product Manager Agent for clarification...")
        return "end"

pm_agent = ProductManagerAgent()
architect_agent = ArchitectAgent()

workflow = StateGraph(AgentState)
workflow.add_node("product_manager", pm_agent.run)
workflow.add_node("architect", architect_agent.run)
workflow.set_entry_point("product_manager")

workflow.add_conditional_edges(
    "product_manager",
    should_continue,
    {
        "architect": "architect",
        "end": END
    }
)

app = workflow.compile()


graph_image = app.get_graph(xray=True).draw_mermaid_png()
with open("agent_graph.png", "wb") as f:
    f.write(graph_image)