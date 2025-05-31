using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NetFastReport.Dto.Models
{
    public class PedidoItemAdicionaiDto
    {
        public Guid Id { get; set; }

        public long SeqId { get; set; }

        public Guid IdPedidoItem { get; set; }

        public Guid IdAdicionalOpcao { get; set; }

        public decimal Valor { get; set; }

        public int Quantidade { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }

        #region Navigation Properties
        public string Nome { get; set; } = null!;

        #endregion
    }
}
