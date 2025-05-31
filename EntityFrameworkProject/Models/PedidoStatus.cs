using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Table("pedido_status")]
public partial class PedidoStatus
{
    [Key]
    [Column("id")]
    public short Id { get; set; }

    [Column("descricao")]
    [StringLength(100)]
    public string Descricao { get; set; } = null!;

    [InverseProperty("IdStatusNavigation")]
    public virtual ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
}
