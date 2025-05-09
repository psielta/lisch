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

    [InverseProperty("Tenant")]
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    [InverseProperty("Tenant")]
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
