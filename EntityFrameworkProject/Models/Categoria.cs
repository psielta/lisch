using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

/// <summary>
/// Armazena as categorias de produtos do cardápio de um tenant
/// </summary>
[Table("categorias")]
[Index("SeqId", Name = "categorias_seq_id_key", IsUnique = true)]
public partial class Categoria
{
    /// <summary>
    /// Identificador único UUID da categoria
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    /// <summary>
    /// Identificador sequencial para facilitar CRUD
    /// </summary>
    [Column("seq_id")]
    public long SeqId { get; set; }

    /// <summary>
    /// ID do tenant ao qual a categoria pertence
    /// </summary>
    [Column("id_tenant")]
    public Guid IdTenant { get; set; }

    /// <summary>
    /// Referência ao tipo de culinária da categoria
    /// </summary>
    [Column("id_culinaria")]
    public int IdCulinaria { get; set; }

    /// <summary>
    /// Nome da categoria exibido no cardápio
    /// </summary>
    [Column("nome")]
    [StringLength(100)]
    public string Nome { get; set; } = null!;

    /// <summary>
    /// Descrição da categoria
    /// </summary>
    [Column("descricao")]
    public string? Descricao { get; set; }

    /// <summary>
    /// Horário de início da disponibilidade da categoria
    /// </summary>
    [Column("inicio", TypeName = "timestamp without time zone")]
    public DateTime Inicio { get; set; }

    /// <summary>
    /// Horário de fim da disponibilidade da categoria
    /// </summary>
    [Column("fim", TypeName = "timestamp without time zone")]
    public DateTime Fim { get; set; }

    /// <summary>
    /// Status da categoria (1=ativo, 0=inativo)
    /// </summary>
    [Column("ativo")]
    public short Ativo { get; set; }

    /// <summary>
    /// Opção para meio a meio (M=Valor médio, V=Maior valor, vazio=Não permitido)
    /// </summary>
    [Column("opcao_meia")]
    [StringLength(1)]
    public string? OpcaoMeia { get; set; }

    /// <summary>
    /// Ordem de exibição da categoria no cardápio
    /// </summary>
    [Column("ordem")]
    public int? Ordem { get; set; }

    [Column("disponivel_domingo")]
    public short DisponivelDomingo { get; set; }

    [Column("disponivel_segunda")]
    public short DisponivelSegunda { get; set; }

    [Column("disponivel_terca")]
    public short DisponivelTerca { get; set; }

    [Column("disponivel_quarta")]
    public short DisponivelQuarta { get; set; }

    [Column("disponivel_quinta")]
    public short DisponivelQuinta { get; set; }

    [Column("disponivel_sexta")]
    public short DisponivelSexta { get; set; }

    [Column("disponivel_sabado")]
    public short DisponivelSabado { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Data e hora de exclusão lógica (soft delete)
    /// </summary>
    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    [InverseProperty("IdCategoriaNavigation")]
    public virtual ICollection<CategoriaAdicionai> CategoriaAdicionais { get; set; } = new List<CategoriaAdicionai>();

    [InverseProperty("IdCategoriaNavigation")]
    public virtual ICollection<CategoriaOpco> CategoriaOpcos { get; set; } = new List<CategoriaOpco>();

    [ForeignKey("IdCulinaria")]
    [InverseProperty("Categoria")]
    public virtual Culinaria IdCulinariaNavigation { get; set; } = null!;

    [ForeignKey("IdTenant")]
    [InverseProperty("Categoria")]
    public virtual Tenant IdTenantNavigation { get; set; } = null!;

    [InverseProperty("IdCategoriaNavigation")]
    public virtual ICollection<PedidoIten> PedidoItens { get; set; } = new List<PedidoIten>();

    [InverseProperty("IdCategoriaNavigation")]
    public virtual ICollection<Produto> Produtos { get; set; } = new List<Produto>();
}
