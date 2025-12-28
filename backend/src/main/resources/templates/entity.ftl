package ${packageName}.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
<#list (imports)![] as import>
import ${import};
</#list>

@Entity
@Data
@Table(name = "${tableName}")
public class ${className} {
    <#if hasIncrement>
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private ${idType} id;
    </#if>

    <#list fields as field>
    <#if !field.isId>
    @Column(name = "${field.columnName}")
    private ${field.javaType} ${field.fieldName};
    </#if>
    </#list>

    <#-- QUAN HỆ MANY-TO-ONE (Chứa FK) -->
    <#list manyToOneRels as rel>
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "${rel.joinColumn}")
    private ${rel.targetClass} ${rel.fieldName};

    </#list>
    <#-- QUAN HỆ ONE-TO-MANY (Danh sách con) -->
    <#list oneToManyRels as rel>
    @OneToMany(mappedBy = "${rel.mappedBy}", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<${rel.targetClass}> ${rel.fieldName};
    </#list>
}