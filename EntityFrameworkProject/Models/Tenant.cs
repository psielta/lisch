using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Table("tenants")]
public partial class Tenant
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("plan")]
    public string Plan { get; set; } = null!;

    [Column("status")]
    public string Status { get; set; } = null!;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("id_cliente_padrao")]
    public Guid? IdClientePadrao { get; set; }

    [Column("photo")]
    public byte[]? Photo { get; set; }

    [Column("telefone")]
    [StringLength(20)]
    public string? Telefone { get; set; }

    [Column("endereco")]
    [StringLength(256)]
    public string? Endereco { get; set; }

    [Column("bairro")]
    [StringLength(256)]
    public string? Bairro { get; set; }

    [Column("cidade")]
    [StringLength(256)]
    public string? Cidade { get; set; }

    [InverseProperty("IdTenantNavigation")]
    public virtual ICollection<Categoria> Categoria { get; set; } = new List<Categoria>();

    [InverseProperty("Tenant")]
    public virtual ICollection<Cliente> Clientes { get; set; } = new List<Cliente>();

    [ForeignKey("IdClientePadrao")]
    [InverseProperty("Tenants")]
    public virtual Cliente? IdClientePadraoNavigation { get; set; }

    [InverseProperty("Tenant")]
    public virtual ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();

    [InverseProperty("Tenant")]
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    [InverseProperty("Tenant")]
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
