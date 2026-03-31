from langgraph.graph import StateGraph
from product_manager.agent import ProductManagerAgent
from state import AgentState

pm_agent = ProductManagerAgent()
workflow = StateGraph(AgentState)
workflow.add_node("product_manager", pm_agent.run)
workflow.set_entry_point("product_manager")

app = workflow.compile()