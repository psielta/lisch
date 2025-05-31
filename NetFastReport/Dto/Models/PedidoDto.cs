using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NetFastReport.Dto.Models
{
    public class PedidoDto
    {
        public Guid Id { get; set; }

        public long SeqId { get; set; }

        public Guid TenantId { get; set; }

        public Guid IdCliente { get; set; }

        public string CodigoPedido { get; set; } = null!;

        public DateTime DataPedido { get; set; }

        public short Gmt { get; set; }

        public short PedidoPronto { get; set; }

        public DateTime? DataPedidoPronto { get; set; }

        public string? Cupom { get; set; }

        public string TipoEntrega { get; set; } = null!;

        public int? Prazo { get; set; }

        public int? PrazoMin { get; set; }

        public int? PrazoMax { get; set; }

        public string? CategoriaPagamento { get; set; }

        public string? FormaPagamento { get; set; }

        public decimal ValorTotal { get; set; }

        public string? Observacao { get; set; }

        public decimal TaxaEntrega { get; set; }

        public string? NomeTaxaEntrega { get; set; }

        public short IdStatus { get; set; }

        public decimal? Lat { get; set; }

        public decimal? Lng { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }

        public decimal ValorPago { get; set; }

        public bool? Quitado { get; set; }

        public decimal? TrocoPara { get; set; }

        public decimal Desconto { get; set; }

        public decimal Acrescimo { get; set; }

        public bool Finalizado { get; set; }
    }
}
