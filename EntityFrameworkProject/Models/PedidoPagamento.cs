using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Table("pedido_pagamentos")]
[Index("SeqId", Name = "uidx_pagamentos_seq", IsUnique = true)]
public partial class PedidoPagamento
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("seq_id")]
    public long SeqId { get; set; }

    [Column("id_pedido")]
    public Guid IdPedido { get; set; }

    [Column("id_conta_receber")]
    public Guid? IdContaReceber { get; set; }

    [Column("categoria_pagamento")]
    [StringLength(50)]
    public string? CategoriaPagamento { get; set; }

    [Column("forma_pagamento")]
    [StringLength(100)]
    public string FormaPagamento { get; set; } = null!;

    [Column("valor_pago")]
    [Precision(10, 2)]
    public decimal ValorPago { get; set; }

    [Column("troco")]
    [Precision(10, 2)]
    public decimal? Troco { get; set; }

    [Column("autorizado_por")]
    public Guid? AutorizadoPor { get; set; }

    [Column("observacao")]
    public string? Observacao { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    [ForeignKey("IdContaReceber")]
    [InverseProperty("PedidoPagamentos")]
    public virtual ContasReceber? IdContaReceberNavigation { get; set; }

    [ForeignKey("IdPedido")]
    [InverseProperty("PedidoPagamentos")]
    public virtual Pedido IdPedidoNavigation { get; set; } = null!;
}
