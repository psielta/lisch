using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Table("pedido_itens")]
public partial class PedidoIten
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("seq_id")]
    public long SeqId { get; set; }

    [Column("id_pedido")]
    public Guid IdPedido { get; set; }

    [Column("id_produto")]
    public Guid IdProduto { get; set; }

    [Column("id_produto_2")]
    public Guid? IdProduto2 { get; set; }

    [Column("id_categoria")]
    public Guid IdCategoria { get; set; }

    [Column("id_categoria_opcao")]
    public Guid? IdCategoriaOpcao { get; set; }

    [Column("observacao")]
    public string? Observacao { get; set; }

    [Column("valor_unitario")]
    [Precision(10, 2)]
    public decimal ValorUnitario { get; set; }

    [Column("quantidade")]
    public int Quantidade { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    [ForeignKey("IdCategoria")]
    [InverseProperty("PedidoItens")]
    public virtual Categoria IdCategoriaNavigation { get; set; } = null!;

    [ForeignKey("IdCategoriaOpcao")]
    [InverseProperty("PedidoItens")]
    public virtual CategoriaOpco? IdCategoriaOpcaoNavigation { get; set; }

    [ForeignKey("IdPedido")]
    [InverseProperty("PedidoItens")]
    public virtual Pedido IdPedidoNavigation { get; set; } = null!;

    [ForeignKey("IdProduto2")]
    [InverseProperty("PedidoItenIdProduto2Navigations")]
    public virtual Produto? IdProduto2Navigation { get; set; }

    [ForeignKey("IdProduto")]
    [InverseProperty("PedidoItenIdProdutoNavigations")]
    public virtual Produto IdProdutoNavigation { get; set; } = null!;

    [InverseProperty("IdPedidoItemNavigation")]
    public virtual ICollection<PedidoItemAdicionai> PedidoItemAdicionais { get; set; } = new List<PedidoItemAdicionai>();
}
