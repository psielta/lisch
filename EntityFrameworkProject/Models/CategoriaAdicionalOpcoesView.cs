using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Keyless]
public partial class CategoriaAdicionalOpcoesView
{
    [Column("id")]
    public Guid? Id { get; set; }

    [Column("seq_id")]
    public long? SeqId { get; set; }

    [Column("id_categoria_adicional")]
    public Guid? IdCategoriaAdicional { get; set; }

    [Column("codigo")]
    [StringLength(100)]
    public string? Codigo { get; set; }

    [Column("nome")]
    [StringLength(100)]
    public string? Nome { get; set; }

    [Column("valor")]
    [Precision(10, 2)]
    public decimal? Valor { get; set; }

    [Column("status")]
    public short? Status { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }
}
