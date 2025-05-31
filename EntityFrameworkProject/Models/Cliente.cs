using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Table("clientes")]
[Index("TenantId", "Cnpj", Name = "clientes_cnpj_unq", IsUnique = true)]
[Index("TenantId", "Cpf", Name = "clientes_cpf_unq", IsUnique = true)]
[Index("Cidade", "Uf", Name = "idx_clientes_cidade_uf")]
[Index("TenantId", Name = "idx_clientes_tenant")]
public partial class Cliente
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("tenant_id")]
    public Guid TenantId { get; set; }

    [Column("tipo_pessoa")]
    [MaxLength(1)]
    public char TipoPessoa { get; set; }

    [Column("nome_razao_social")]
    public string NomeRazaoSocial { get; set; } = null!;

    [Column("nome_fantasia")]
    public string? NomeFantasia { get; set; }

    [Column("cpf")]
    [StringLength(11)]
    public string? Cpf { get; set; }

    [Column("cnpj")]
    [StringLength(14)]
    public string? Cnpj { get; set; }

    [Column("rg")]
    [StringLength(20)]
    public string? Rg { get; set; }

    [Column("ie")]
    [StringLength(20)]
    public string? Ie { get; set; }

    [Column("im")]
    [StringLength(20)]
    public string? Im { get; set; }

    [Column("data_nascimento")]
    public DateOnly? DataNascimento { get; set; }

    [Column("email")]
    public string? Email { get; set; }

    [Column("telefone")]
    [StringLength(30)]
    public string? Telefone { get; set; }

    [Column("celular")]
    [StringLength(30)]
    public string? Celular { get; set; }

    [Column("cep")]
    [StringLength(8)]
    public string? Cep { get; set; }

    [Column("logradouro")]
    public string? Logradouro { get; set; }

    [Column("numero")]
    [StringLength(10)]
    public string? Numero { get; set; }

    [Column("complemento")]
    public string? Complemento { get; set; }

    [Column("bairro")]
    public string? Bairro { get; set; }

    [Column("cidade")]
    public string? Cidade { get; set; }

    [Column("uf")]
    [StringLength(2)]
    public string? Uf { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [InverseProperty("IdClienteNavigation")]
    public virtual ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();

    [ForeignKey("TenantId")]
    [InverseProperty("Clientes")]
    public virtual Tenant Tenant { get; set; } = null!;

    [InverseProperty("IdClientePadraoNavigation")]
    public virtual ICollection<Tenant> Tenants { get; set; } = new List<Tenant>();
}
