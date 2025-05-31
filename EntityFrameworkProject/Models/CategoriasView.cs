using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Keyless]
public partial class CategoriasView
{
    [Column("id")]
    public Guid? Id { get; set; }

    [Column("seq_id")]
    public long? SeqId { get; set; }

    [Column("id_tenant")]
    public Guid? IdTenant { get; set; }

    [Column("id_culinaria")]
    public int? IdCulinaria { get; set; }

    [Column("nome")]
    [StringLength(100)]
    public string? Nome { get; set; }

    [Column("descricao")]
    public string? Descricao { get; set; }

    [Column("inicio", TypeName = "timestamp without time zone")]
    public DateTime? Inicio { get; set; }

    [Column("fim", TypeName = "timestamp without time zone")]
    public DateTime? Fim { get; set; }

    [Column("ativo")]
    public short? Ativo { get; set; }

    [Column("opcao_meia")]
    [StringLength(1)]
    public string? OpcaoMeia { get; set; }

    [Column("ordem")]
    public int? Ordem { get; set; }

    [Column("disponivel_domingo")]
    public short? DisponivelDomingo { get; set; }

    [Column("disponivel_segunda")]
    public short? DisponivelSegunda { get; set; }

    [Column("disponivel_terca")]
    public short? DisponivelTerca { get; set; }

    [Column("disponivel_quarta")]
    public short? DisponivelQuarta { get; set; }

    [Column("disponivel_quinta")]
    public short? DisponivelQuinta { get; set; }

    [Column("disponivel_sexta")]
    public short? DisponivelSexta { get; set; }

    [Column("disponivel_sabado")]
    public short? DisponivelSabado { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }
}
