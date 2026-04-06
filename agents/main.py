from langgraph.graph import StateGraph, END
from product_manager.agent import ProductManagerAgent
from state import AgentState

def route_after_pm(state: AgentState):
    print(state)
    decision = state["pm_response"].is_clear
    if decision == True:
        print("Product Manager has provided clear specifications. Proceeding to Architect Agent...")
        return "end"
    else:
        print("Product Manager has identified unclear requirements. Returning to Product Manager Agent for clarification...")
        return "end"

pm_agent = ProductManagerAgent()
workflow = StateGraph(AgentState)
workflow.add_node("product_manager", pm_agent.run)
workflow.set_entry_point("product_manager")

workflow.add_conditional_edges(
    "product_manager",
    route_after_pm,
    {
        "end": END
    }
)

app = workflow.compile()


graph_image = app.get_graph(xray=True).draw_mermaid_png()
with open("agent_graph.png", "wb") as f:
    f.write(graph_image)