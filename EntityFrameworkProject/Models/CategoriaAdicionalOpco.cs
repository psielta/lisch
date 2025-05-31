using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

/// <summary>
/// Cada linha representa uma opção (ex.: “Cheddar”, “Bacon”) de um tipo de adicional
/// </summary>
[Table("categoria_adicional_opcoes")]
public partial class CategoriaAdicionalOpco
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    /// <summary>
    /// Identificador sequencial para facilitar CRUD
    /// </summary>
    [Column("seq_id")]
    public long SeqId { get; set; }

    [Column("id_categoria_adicional")]
    public Guid IdCategoriaAdicional { get; set; }

    [Column("codigo")]
    [StringLength(100)]
    public string? Codigo { get; set; }

    [Column("nome")]
    [StringLength(100)]
    public string Nome { get; set; } = null!;

    [Column("valor")]
    [Precision(10, 2)]
    public decimal Valor { get; set; }

    [Column("status")]
    public short Status { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    [ForeignKey("IdCategoriaAdicional")]
    [InverseProperty("CategoriaAdicionalOpcos")]
    public virtual CategoriaAdicionai IdCategoriaAdicionalNavigation { get; set; } = null!;

    [InverseProperty("IdAdicionalOpcaoNavigation")]
    public virtual ICollection<PedidoItemAdicionai> PedidoItemAdicionais { get; set; } = new List<PedidoItemAdicionai>();
}
