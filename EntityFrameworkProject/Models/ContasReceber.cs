using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Table("contas_receber")]
[Index("IdPedido", "Parcela", Name = "uidx_cr_parcela", IsUnique = true)]
public partial class ContasReceber
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("id_pedido")]
    public Guid IdPedido { get; set; }

    [Column("parcela")]
    public short Parcela { get; set; }

    [Column("vencimento")]
    public DateOnly Vencimento { get; set; }

    [Column("valor_devido")]
    [Precision(10, 2)]
    public decimal ValorDevido { get; set; }

    [Column("valor_pago")]
    [Precision(10, 2)]
    public decimal? ValorPago { get; set; }

    [Column("quitado")]
    public bool? Quitado { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [ForeignKey("IdPedido")]
    [InverseProperty("ContasRecebers")]
    public virtual Pedido IdPedidoNavigation { get; set; } = null!;

    [InverseProperty("IdContaReceberNavigation")]
    public virtual ICollection<PedidoPagamento> PedidoPagamentos { get; set; } = new List<PedidoPagamento>();
}
