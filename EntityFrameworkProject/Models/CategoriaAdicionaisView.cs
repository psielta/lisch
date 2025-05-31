using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Keyless]
public partial class CategoriaAdicionaisView
{
    [Column("id")]
    public Guid? Id { get; set; }

    [Column("seq_id")]
    public long? SeqId { get; set; }

    [Column("id_categoria")]
    public Guid? IdCategoria { get; set; }

    [Column("codigo_tipo")]
    [StringLength(100)]
    public string? CodigoTipo { get; set; }

    [Column("nome")]
    [StringLength(100)]
    public string? Nome { get; set; }

    [Column("selecao")]
    [MaxLength(1)]
    public char? Selecao { get; set; }

    [Column("minimo")]
    public int? Minimo { get; set; }

    [Column("limite")]
    public int? Limite { get; set; }

    [Column("status")]
    public short? Status { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }
}
