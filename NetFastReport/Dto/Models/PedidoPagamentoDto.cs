using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NetFastReport.Dto.Models
{
    public class PedidoPagamentoDto
    {
        public Guid Id { get; set; }

        public long SeqId { get; set; }

        public Guid IdPedido { get; set; }

        public Guid? IdContaReceber { get; set; }

        public string? CategoriaPagamento { get; set; }

        public string FormaPagamento { get; set; } = null!;

        public decimal ValorPago { get; set; }

        public decimal? Troco { get; set; }

        public Guid? AutorizadoPor { get; set; }

        public string? Observacao { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }
    }
}
