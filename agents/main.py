from langgraph.graph import StateGraph, END
from product_manager.agent import ProductManagerAgent
from architect.agent import ArchitectAgent
from state import AgentState

# 1. Điều hướng sau khi PM làm việc
def should_continue_after_pm(state: AgentState):
    decision = state["pm_response"].is_clear
    if decision is True:
        print("--- DECISION: PROCEED TO ARCHITECT ---")
        return "architect"
    else:
        print("--- DECISION: NEED CLARIFICATION ---")
        return "end"

def should_continue_after_architect(state: AgentState):
    if state.get("error_message") and state.get("iteration", 0) < 3:
        print(f"--- VALIDATION FAILED: RETRYING ({state['iteration']}/3) ---")
        return "retry"
    
    print("--- VALIDATION SUCCESS OR MAX RETRIES REACHED ---")
    return "end"

# Khởi tạo Agents
pm_agent = ProductManagerAgent()
architect_agent = ArchitectAgent()

workflow = StateGraph(AgentState)

# Thêm Nodes
workflow.add_node("product_manager", pm_agent.run)
workflow.add_node("architect", architect_agent.run)

# Thiết lập luồng
workflow.set_entry_point("product_manager")

workflow.add_conditional_edges(
    "product_manager",
    should_continue_after_pm,
    {
        "architect": "architect",
        "end": END
    }
)

workflow.add_conditional_edges(
    "architect",
    should_continue_after_architect,
    {
        "retry": "architect",
        "end": END
    }
)

app = workflow.compile()

try:
    graph_image = app.get_graph(xray=True).draw_mermaid_png()
    with open("agent_graph.png", "wb") as f:
        f.write(graph_image)
    print("Graph image saved as agent_graph.png")
except Exception as e:
    print(f"Could not generate graph image: {e}")