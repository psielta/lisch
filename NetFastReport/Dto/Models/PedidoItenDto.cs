using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;

namespace NetFastReport.Dto.Models
{
    public class PedidoItenDto
    {
        public Guid Id { get; set; }

        public long SeqId { get; set; }

        public Guid IdPedido { get; set; }

        public Guid IdProduto { get; set; }

        public Guid? IdProduto2 { get; set; }

        public Guid IdCategoria { get; set; }

        public Guid? IdCategoriaOpcao { get; set; }

        public string? Observacao { get; set; }

        public decimal ValorUnitario { get; set; }

        public int Quantidade { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }

        #region Navigation Properties
        public string NomeProduto { get; set; } = null!;
        public string NomeOpcao { get; set; } = null!;

        #endregion
    }
}
