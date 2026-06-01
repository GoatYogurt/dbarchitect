package ${packageName}.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
<#list (imports)![] as import>
import ${import};
</#list>
<#if idType?? && idType == "UUID">
import java.util.UUID;
</#if>

@Entity
@Data
@Table(name = "${tableName}")
public class ${className} {

<#--check if idType exist then render the id field-->
<#if idType??>
    @Id
    <#if hasIncrement!false>
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    </#if>
    private ${idType} id;
</#if>

<#list fields as field>
<#-- only render if this is not id field-->
    <#if !field.isId>
    @Column(name = "${field.columnName}"<#if field.unique>, unique = true</#if><#if !field.nullable>, nullable = false</#if>)
    private ${field.javaType} ${field.fieldName};
    </#if>
</#list>

<#-- many to one relationship list -->
<#list manyToOneRels![] as rel>
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "${rel.joinColumn}")
    @ToString.Exclude
    private ${rel.targetClass} ${rel.fieldName};

</#list>

<#-- one to many relationship list -->
<#list oneToManyRels![] as rel>
    @OneToMany(mappedBy = "${rel.mappedBy}", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<${rel.targetClass}> ${rel.fieldName};

</#list>

<#-- Chỉ tạo getter/setter thủ công nếu không dùng Lombok hoặc cần ép kiểu -->
<#if idType??>
    public void setId(${idType} id) {
        this.id = id;
    }

    public ${idType} getId() {
        return this.id;
    }
</#if>
}