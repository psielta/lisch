using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

/// <summary>
/// Armazena as opções disponíveis para cada categoria (ex: tamanhos)
/// </summary>
[Table("categoria_opcoes")]
[Index("SeqId", Name = "categoria_opcoes_seq_id_key", IsUnique = true)]
public partial class CategoriaOpco
{
    /// <summary>
    /// Identificador único UUID da opção
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
    /// ID da categoria a qual esta opção pertence
    /// </summary>
    [Column("id_categoria")]
    public Guid IdCategoria { get; set; }

    /// <summary>
    /// Nome da opção (ex: Pequeno, Médio, Grande)
    /// </summary>
    [Column("nome")]
    [StringLength(100)]
    public string Nome { get; set; } = null!;

    /// <summary>
    /// Status da opção (1=ativo, 0=inativo)
    /// </summary>
    [Column("status")]
    public short Status { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Data e hora de exclusão lógica (soft delete)
    /// </summary>
    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    [ForeignKey("IdCategoria")]
    [InverseProperty("CategoriaOpcos")]
    public virtual Categoria IdCategoriaNavigation { get; set; } = null!;

    [InverseProperty("IdCategoriaOpcaoNavigation")]
    public virtual ICollection<PedidoIten> PedidoItens { get; set; } = new List<PedidoIten>();

    [InverseProperty("IdCategoriaOpcaoNavigation")]
    public virtual ICollection<ProdutoPreco> ProdutoPrecos { get; set; } = new List<ProdutoPreco>();
}
