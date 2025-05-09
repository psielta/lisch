using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

[Keyless]
[Table("schema_version")]
public partial class SchemaVersion
{
    [Column("version")]
    public int Version { get; set; }
}
