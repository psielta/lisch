using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

/// <summary>
/// Armazena as variações de preço para cada produto, baseadas nas opções de categoria.
/// </summary>
[Table("produto_precos")]
[Index("SeqId", Name = "produto_precos_seq_id_key", IsUnique = true)]
public partial class ProdutoPreco
{
    /// <summary>
    /// Identificador único UUID para a entrada de preço.
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    /// <summary>
    /// Identificador sequencial único para a entrada de preço (para facilitar CRUD e referência legada se necessário).
    /// </summary>
    [Column("seq_id")]
    public long SeqId { get; set; }

    /// <summary>
    /// Referência ao produto ao qual este preço pertence (FK para public.produtos.id).
    /// </summary>
    [Column("id_produto")]
    public Guid IdProduto { get; set; }

    /// <summary>
    /// Referência à opção da categoria que define esta variação de preço (FK para public.categoria_opcoes.id). Ex: &quot;Pequeno&quot;, &quot;Médio&quot;.
    /// </summary>
    [Column("id_categoria_opcao")]
    public Guid IdCategoriaOpcao { get; set; }

    /// <summary>
    /// Código externo para esta variação de preço específica (ex: &quot;PEQUENO_COPO_ACAI&quot;). Mapeia para o campo &quot;codigo&quot; dentro do array &quot;opcoes&quot; no JSON do produto.
    /// </summary>
    [Column("codigo_externo_opcao_preco")]
    [StringLength(100)]
    public string? CodigoExternoOpcaoPreco { get; set; }

    /// <summary>
    /// O preço regular desta opção do produto.
    /// </summary>
    [Column("preco_base")]
    [Precision(10, 2)]
    public decimal PrecoBase { get; set; }

    /// <summary>
    /// O preço promocional desta opção do produto, se aplicável. Corresponde a &quot;valor2&quot; ou &quot;valorAtual&quot; no JSON.
    /// </summary>
    [Column("preco_promocional")]
    [Precision(10, 2)]
    public decimal? PrecoPromocional { get; set; }

    /// <summary>
    /// Status desta opção de preço (1 = disponível, 0 = indisponível). Corresponde ao campo &quot;status&quot; dentro do array &quot;opcoes&quot; no JSON do produto.
    /// </summary>
    [Column("disponivel")]
    public short Disponivel { get; set; }

    /// <summary>
    /// Timestamp da criação do registro de preço.
    /// </summary>
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Timestamp da última atualização do registro de preço.
    /// </summary>
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Timestamp da exclusão lógica do preço (soft delete).
    /// </summary>
    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    [ForeignKey("IdCategoriaOpcao")]
    [InverseProperty("ProdutoPrecos")]
    public virtual CategoriaOpco IdCategoriaOpcaoNavigation { get; set; } = null!;

    [ForeignKey("IdProduto")]
    [InverseProperty("ProdutoPrecos")]
    public virtual Produto IdProdutoNavigation { get; set; } = null!;
}
