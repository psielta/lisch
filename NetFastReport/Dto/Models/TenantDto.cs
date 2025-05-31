using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NetFastReport.Dto.Models
{
    public class TenantDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public string Plan { get; set; } = null!;

        public string Status { get; set; } = null!;

        public DateTime CreatedAt { get; set; }

        public Guid? IdClientePadrao { get; set; }

        public byte[]? Photo { get; set; }

        public string? Telefone { get; set; }

        public string? Endereco { get; set; }

        public string? Bairro { get; set; }

        public string? Cidade { get; set; }
    }
}
