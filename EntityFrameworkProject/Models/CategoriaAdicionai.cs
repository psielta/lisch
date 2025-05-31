using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

/// <summary>
/// Tipos de adicionais disponíveis em cada categoria do cardápio
/// </summary>
[Table("categoria_adicionais")]
public partial class CategoriaAdicionai
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    /// <summary>
    /// Identificador sequencial para facilitar CRUD
    /// </summary>
    [Column("seq_id")]
    public long SeqId { get; set; }

    [Column("id_categoria")]
    public Guid IdCategoria { get; set; }

    [Column("codigo_tipo")]
    [StringLength(100)]
    public string? CodigoTipo { get; set; }

    [Column("nome")]
    [StringLength(100)]
    public string Nome { get; set; } = null!;

    /// <summary>
    /// U = Único (obrigatório escolher 1) | M = Múltiplo | Q = Quantidade múltipla
    /// </summary>
    [Column("selecao")]
    [MaxLength(1)]
    public char Selecao { get; set; }

    [Column("minimo")]
    public int? Minimo { get; set; }

    [Column("limite")]
    public int? Limite { get; set; }

    /// <summary>
    /// 1 = ativo | 0 = inativo
    /// </summary>
    [Column("status")]
    public short Status { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    [InverseProperty("IdCategoriaAdicionalNavigation")]
    public virtual ICollection<CategoriaAdicionalOpco> CategoriaAdicionalOpcos { get; set; } = new List<CategoriaAdicionalOpco>();

    [ForeignKey("IdCategoria")]
    [InverseProperty("CategoriaAdicionais")]
    public virtual Categoria IdCategoriaNavigation { get; set; } = null!;
}
