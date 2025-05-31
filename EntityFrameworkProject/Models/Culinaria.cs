using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Table("culinarias")]
public partial class Culinaria
{
    [Key]
    [Column("id_culinaria")]
    public int IdCulinaria { get; set; }

    [Column("nome")]
    [StringLength(100)]
    public string Nome { get; set; } = null!;

    [Column("meio_meio")]
    public short MeioMeio { get; set; }

    [InverseProperty("IdCulinariaNavigation")]
    public virtual ICollection<Categoria> Categoria { get; set; } = new List<Categoria>();
}
