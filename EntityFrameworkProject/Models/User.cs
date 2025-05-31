using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Table("users")]
[Index("Email", Name = "users_email_key", IsUnique = true)]
[Index("TenantId", Name = "users_tenant_id_idx")]
[Index("UserName", Name = "users_user_name_key", IsUnique = true)]
public partial class User
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("user_name")]
    [StringLength(50)]
    public string UserName { get; set; } = null!;

    [Column("email")]
    public string Email { get; set; } = null!;

    [Column("password_hash")]
    public byte[] PasswordHash { get; set; } = null!;

    [Column("bio")]
    public string Bio { get; set; } = null!;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [Column("tenant_id")]
    public Guid TenantId { get; set; }

    [Column("admin")]
    public int Admin { get; set; }

    [Column("permission_users")]
    public int PermissionUsers { get; set; }

    [Column("permission_categoria")]
    public int? PermissionCategoria { get; set; }

    [Column("permission_produto")]
    public int? PermissionProduto { get; set; }

    [Column("permission_adicional")]
    public int? PermissionAdicional { get; set; }

    [Column("permission_cliente")]
    public int? PermissionCliente { get; set; }

    [InverseProperty("Seller")]
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    [ForeignKey("TenantId")]
    [InverseProperty("Users")]
    public virtual Tenant Tenant { get; set; } = null!;
}
