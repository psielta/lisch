using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Table("sessions")]
[Index("Expiry", Name = "sessions_expiry_idx")]
public partial class Session
{
    [Key]
    [Column("token")]
    public string Token { get; set; } = null!;

    [Column("data")]
    public byte[] Data { get; set; } = null!;

    [Column("expiry")]
    public DateTime Expiry { get; set; }
}
