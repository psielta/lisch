using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Keyless]
public partial class PedidoItensView
{
    [Column("id")]
    public Guid? Id { get; set; }

    [Column("seq_id")]
    public long? SeqId { get; set; }

    [Column("id_pedido")]
    public Guid? IdPedido { get; set; }

    [Column("id_produto")]
    public Guid? IdProduto { get; set; }

    [Column("id_produto_2")]
    public Guid? IdProduto2 { get; set; }

    [Column("id_categoria")]
    public Guid? IdCategoria { get; set; }

    [Column("id_categoria_opcao")]
    public Guid? IdCategoriaOpcao { get; set; }

    [Column("observacao")]
    public string? Observacao { get; set; }

    [Column("valor_unitario")]
    [Precision(10, 2)]
    public decimal? ValorUnitario { get; set; }

    [Column("quantidade")]
    public int? Quantidade { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }
}
