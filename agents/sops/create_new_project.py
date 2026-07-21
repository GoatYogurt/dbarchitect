from langgraph.graph import StateGraph, END
from product_manager.agent import ProductManagerAgent
from architect.agent import ArchitectAgent
from state import AgentState
import requests

class CreateNewProjectSOP:
    """SOP for creating a new project: PM → Architect → Save to Backend. 
    This SOP just copy current main.py workflow but adds a new step to save the generated DBML to the Java backend."""
    
    def __init__(self):
        self.pm_agent = ProductManagerAgent()
        self.architect_agent = ArchitectAgent()
        self.java_backend_url = "http://localhost:8080" # TODO: make this configurable
    
    def should_continue_after_pm(self, state: AgentState):
        """Check if PM clarifications are clear"""
        decision = state["pm_response"].is_clear
        if decision is True:
            print("--- DECISION: PROCEED TO ARCHITECT ---")
            print(f"Specifications: {state['pm_response'].spec}")
            return "architect"
        else:
            print("--- DECISION: NEED CLARIFICATION ---")
            return "end"
    
    def should_continue_after_architect(self, state: AgentState):
        """Check if DBML validation passed"""
        if state.get("error_message") and state.get("iteration", 0) < 3:
            print(f"--- VALIDATION FAILED: RETRYING ({state['iteration']}/3) ---")
            return "retry"
        
        if state.get("iteration", 0) >= 3:
            print("--- MAX RETRIES REACHED ---")
            return "end"

        print("--- VALIDATION SUCCESS ---")
        return "save_project" # instead of end, save the project
    
    def save_project_to_backend(self, state: AgentState):
        """Save the generated DBML code to Java backend"""
        print("Saving project to backend...")
        
        try:
            # Prepare payload for backend
            payload = {
                "projectName": state.get("project_name", "Untitled Project"),
                "rawDbmlCode": state.get("dbml_code", ""),
            }
            
            # Call Java backend endpoint
            response = requests.post(
                f"{self.java_backend_url}/projects",
                json=payload,
                timeout=30
            )

            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                project_id = data.get("projectId")
                print(f"Project saved successfully with ID: {project_id}")
                return {
                    "project_id": str(project_id),
                    "error_message": None
                }
            else:
                error_msg = f"Backend returned {response.status_code}: {response.text}"
                print(f"Save failed: {error_msg}")
                return {
                    "error_message": error_msg
                }
        except Exception as e:
            error_msg = f"Failed to save project: {str(e)}"
            print(error_msg)
            return {
                "error_message": error_msg
            }
    
    def build_workflow(self):
        """Build the LangGraph workflow"""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("product_manager", self.pm_agent.run)
        workflow.add_node("architect", self.architect_agent.run)
        workflow.add_node("save_project", self.save_project_to_backend)
        
        # Set entry point
        workflow.set_entry_point("product_manager")
        
        # Add conditional edges
        workflow.add_conditional_edges(
            "product_manager",
            self.should_continue_after_pm,
            {
                "architect": "architect",
                "end": END
            }
        )
        
        workflow.add_conditional_edges(
            "architect",
            self.should_continue_after_architect,
            {
                "retry": "architect",
                "save_project": "save_project",
                "end": END
            }
        )
        
        # After save, go to end
        workflow.add_edge("save_project", END)
        
        return workflow.compile()


def create_project_workflow():
    """Factory function to create and return the compiled workflow"""
    sop = CreateNewProjectSOP()

    # save image of the graph for visualization
    try:
        graph_image = sop.build_workflow().get_graph(xray=True).draw_mermaid_png()
        with open("create_new_project_sop.png", "wb") as f:
            f.write(graph_image)
        print("Graph image saved as create_new_project_sop.png")
    except Exception as e:
        print(f"Could not generate graph image: {e}")

    return sop.build_workflow()