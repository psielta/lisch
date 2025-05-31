using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Table("pedido_item_adicionais")]
public partial class PedidoItemAdicionai
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("seq_id")]
    public long SeqId { get; set; }

    [Column("id_pedido_item")]
    public Guid IdPedidoItem { get; set; }

    [Column("id_adicional_opcao")]
    public Guid IdAdicionalOpcao { get; set; }

    [Column("valor")]
    [Precision(10, 2)]
    public decimal Valor { get; set; }

    [Column("quantidade")]
    public int Quantidade { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    [ForeignKey("IdAdicionalOpcao")]
    [InverseProperty("PedidoItemAdicionais")]
    public virtual CategoriaAdicionalOpco IdAdicionalOpcaoNavigation { get; set; } = null!;

    [ForeignKey("IdPedidoItem")]
    [InverseProperty("PedidoItemAdicionais")]
    public virtual PedidoIten IdPedidoItemNavigation { get; set; } = null!;
}
