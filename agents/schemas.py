from pydantic import BaseModel, Field
from typing import List

class Entity(BaseModel):
    name: str = Field(description="Tên bảng (ví dụ: users, order_items)")
    description: str = Field(description="Mô tả mục đích của bảng này")
    fields: List[str] = Field(description="Danh sách các trường dự kiến (ví dụ: id, email, created_at)")

class SystemSpec(BaseModel):
    project_name: str
    entities: List[Entity]
    relationships: List[str] = Field(description="Mô tả quan hệ, ví dụ: users có nhiều posts")