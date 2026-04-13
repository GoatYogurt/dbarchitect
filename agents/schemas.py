from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class Entity(BaseModel):
    name: str = Field(description="Tên bảng (ví dụ: users, order_items)")
    description: str = Field(description="Mô tả mục đích của bảng này")
    fields: List[str] = Field(description="Danh sách các trường dự kiến (ví dụ: id, email, created_at)")


class SystemSpec(BaseModel):
    project_name: str
    entities: List[Entity]
    relationships: List[str] = Field(description="Mô tả quan hệ, ví dụ: users có nhiều posts")


class QuestionComponent(BaseModel):
    question_text: str = Field(description="The clarifying question text that the PM agent would ask the user")
    type: Literal["multi_choice", "single_choice", "text"] = Field(description="The type of question to ask the user")
    options: Optional[List[str]] = Field(default=None, description="If the question is multiple choice or single choice, provide the options for the user to select from")


class PMResponse(BaseModel):
    is_clear: bool = Field(description="PM evaluates if the specifications are clear and actionable")
    questions: Optional[List[QuestionComponent]] = Field(default=[], description="PM lists any questions or clarifications needed to improve the specifications")
    spec: Optional[SystemSpec] = Field(default=None, description="PM provides the technical specifications based on the user input")