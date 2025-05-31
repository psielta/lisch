using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Table("pedidos")]
[Index("CodigoPedido", Name = "pedidos_codigo_pedido_key", IsUnique = true)]
public partial class Pedido
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("seq_id")]
    public long SeqId { get; set; }

    [Column("tenant_id")]
    public Guid TenantId { get; set; }

    [Column("id_cliente")]
    public Guid IdCliente { get; set; }

    [Column("codigo_pedido")]
    [StringLength(20)]
    public string CodigoPedido { get; set; } = null!;

    [Column("data_pedido")]
    public DateTime DataPedido { get; set; }

    [Column("gmt")]
    public short Gmt { get; set; }

    [Column("pedido_pronto")]
    public short PedidoPronto { get; set; }

    [Column("data_pedido_pronto")]
    public DateTime? DataPedidoPronto { get; set; }

    [Column("cupom")]
    [StringLength(100)]
    public string? Cupom { get; set; }

    [Column("tipo_entrega")]
    [StringLength(20)]
    public string TipoEntrega { get; set; } = null!;

    [Column("prazo")]
    public int? Prazo { get; set; }

    [Column("prazo_min")]
    public int? PrazoMin { get; set; }

    [Column("prazo_max")]
    public int? PrazoMax { get; set; }

    [Column("categoria_pagamento")]
    [StringLength(50)]
    public string? CategoriaPagamento { get; set; }

    [Column("forma_pagamento")]
    [StringLength(100)]
    public string? FormaPagamento { get; set; }

    [Column("valor_total")]
    [Precision(10, 2)]
    public decimal ValorTotal { get; set; }

    [Column("observacao")]
    public string? Observacao { get; set; }

    [Column("taxa_entrega")]
    [Precision(10, 2)]
    public decimal TaxaEntrega { get; set; }

    [Column("nome_taxa_entrega")]
    [StringLength(100)]
    public string? NomeTaxaEntrega { get; set; }

    [Column("id_status")]
    public short IdStatus { get; set; }

    [Column("lat")]
    [Precision(9, 6)]
    public decimal? Lat { get; set; }

    [Column("lng")]
    [Precision(9, 6)]
    public decimal? Lng { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    [Column("valor_pago")]
    [Precision(10, 2)]
    public decimal ValorPago { get; set; }

    [Column("quitado")]
    public bool? Quitado { get; set; }

    [Column("troco_para")]
    [Precision(10, 2)]
    public decimal? TrocoPara { get; set; }

    [Column("desconto")]
    [Precision(10, 2)]
    public decimal Desconto { get; set; }

    [Column("acrescimo")]
    [Precision(10, 2)]
    public decimal Acrescimo { get; set; }

    [Column("finalizado")]
    public bool Finalizado { get; set; }

    [InverseProperty("IdPedidoNavigation")]
    public virtual ICollection<ContasReceber> ContasRecebers { get; set; } = new List<ContasReceber>();

    [ForeignKey("IdCliente")]
    [InverseProperty("Pedidos")]
    public virtual Cliente IdClienteNavigation { get; set; } = null!;

    [ForeignKey("IdStatus")]
    [InverseProperty("Pedidos")]
    public virtual PedidoStatus IdStatusNavigation { get; set; } = null!;

    [InverseProperty("IdPedidoNavigation")]
    public virtual ICollection<PedidoIten> PedidoItens { get; set; } = new List<PedidoIten>();

    [InverseProperty("IdPedidoNavigation")]
    public virtual ICollection<PedidoPagamento> PedidoPagamentos { get; set; } = new List<PedidoPagamento>();

    [ForeignKey("TenantId")]
    [InverseProperty("Pedidos")]
    public virtual Tenant Tenant { get; set; } = null!;
}
