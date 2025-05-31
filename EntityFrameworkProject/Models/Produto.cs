using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

/// <summary>
/// Armazena os produtos do cardápio, vinculados a uma categoria.
/// </summary>
[Table("produtos")]
[Index("SeqId", Name = "produtos_seq_id_key", IsUnique = true)]
public partial class Produto
{
    /// <summary>
    /// Identificador único UUID do produto.
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    /// <summary>
    /// Identificador sequencial único do produto (para facilitar CRUD e referência legada se necessário).
    /// </summary>
    [Column("seq_id")]
    public long SeqId { get; set; }

    /// <summary>
    /// Referência à categoria à qual o produto pertence (FK para public.categorias.id).
    /// </summary>
    [Column("id_categoria")]
    public Guid IdCategoria { get; set; }

    /// <summary>
    /// Nome do produto exibido no cardápio.
    /// </summary>
    [Column("nome")]
    [StringLength(255)]
    public string Nome { get; set; } = null!;

    /// <summary>
    /// Descrição detalhada do produto.
    /// </summary>
    [Column("descricao")]
    public string? Descricao { get; set; }

    /// <summary>
    /// Código externo do produto, utilizado para identificação em integrações ou sistemas legados.
    /// </summary>
    [Column("codigo_externo")]
    [StringLength(100)]
    public string? CodigoExterno { get; set; }

    /// <summary>
    /// SKU (Stock Keeping Unit) do produto, para controle de inventário se aplicável.
    /// </summary>
    [Column("sku")]
    [StringLength(100)]
    public string? Sku { get; set; }

    /// <summary>
    /// Indica se o cliente pode adicionar observações a este produto no pedido (TRUE/FALSE).
    /// </summary>
    [Column("permite_observacao")]
    public bool? PermiteObservacao { get; set; }

    /// <summary>
    /// Define a ordem de exibição deste produto dentro de sua categoria no cardápio.
    /// </summary>
    [Column("ordem")]
    public int? Ordem { get; set; }

    /// <summary>
    /// URL da imagem principal associada ao produto.
    /// </summary>
    [Column("imagem_url")]
    [StringLength(2048)]
    public string? ImagemUrl { get; set; }

    /// <summary>
    /// Status do produto (1 = ativo, 0 = inativo).
    /// </summary>
    [Column("status")]
    public short Status { get; set; }

    /// <summary>
    /// Timestamp da criação do registro do produto.
    /// </summary>
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Timestamp da última atualização do registro do produto.
    /// </summary>
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Timestamp da exclusão lógica do produto (soft delete).
    /// </summary>
    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    [ForeignKey("IdCategoria")]
    [InverseProperty("Produtos")]
    public virtual Categoria IdCategoriaNavigation { get; set; } = null!;

    [InverseProperty("IdProduto2Navigation")]
    public virtual ICollection<PedidoIten> PedidoItenIdProduto2Navigations { get; set; } = new List<PedidoIten>();

    [InverseProperty("IdProdutoNavigation")]
    public virtual ICollection<PedidoIten> PedidoItenIdProdutoNavigations { get; set; } = new List<PedidoIten>();

    [InverseProperty("IdProdutoNavigation")]
    public virtual ICollection<ProdutoPreco> ProdutoPrecos { get; set; } = new List<ProdutoPreco>();
}
