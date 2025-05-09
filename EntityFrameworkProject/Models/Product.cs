using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Table("products")]
[Index("TenantId", Name = "products_tenant_id_idx")]
public partial class Product
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("seller_id")]
    public Guid SellerId { get; set; }

    [Column("product_name")]
    public string ProductName { get; set; } = null!;

    [Column("description")]
    public string Description { get; set; } = null!;

    [Column("baseprice")]
    public double Baseprice { get; set; }

    [Column("auction_end")]
    public DateTime AuctionEnd { get; set; }

    [Column("is_sold")]
    public bool IsSold { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [Column("tenant_id")]
    public Guid TenantId { get; set; }

    [ForeignKey("SellerId")]
    [InverseProperty("Products")]
    public virtual User Seller { get; set; } = null!;

    [ForeignKey("TenantId")]
    [InverseProperty("Products")]
    public virtual Tenant Tenant { get; set; } = null!;
}
