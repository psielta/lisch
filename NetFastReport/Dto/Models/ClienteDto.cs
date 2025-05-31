using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NetFastReport.Dto.Models
{
    public class ClienteDto
    {
        public Guid Id { get; set; }

        public Guid TenantId { get; set; }

        public char TipoPessoa { get; set; }

        public string NomeRazaoSocial { get; set; } = null!;

        public string? NomeFantasia { get; set; }

        public string? Cpf { get; set; }

        public string? Cnpj { get; set; }

        public string? Rg { get; set; }

        public string? Ie { get; set; }

        public string? Im { get; set; }

        public DateOnly? DataNascimento { get; set; }

        public string? Email { get; set; }

        public string? Telefone { get; set; }

        public string? Celular { get; set; }

        public string? Cep { get; set; }

        public string? Logradouro { get; set; }

        public string? Numero { get; set; }

        public string? Complemento { get; set; }

        public string? Bairro { get; set; }

        public string? Cidade { get; set; }

        public string? Uf { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}
