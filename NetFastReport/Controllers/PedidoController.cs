using AutoMapper;
using EntityFrameworkProject.Models;
using FastReport.Export.PdfSimple;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetFastReport.Dto.Models;

namespace NetFastReport.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PedidoController : Controller
    {
        private readonly LischContext _context;
        private readonly IMapper _mapper;

        public PedidoController(LischContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }
        [HttpGet("CreateReport")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> CreateReport()
        {
            var projectRootPath = Environment.CurrentDirectory;
            var reportFilePath = System.IO.Path.Combine(projectRootPath, "wwwroot", "PedidoReport.frx");
            if (!System.IO.Directory.Exists(System.IO.Path.Combine(projectRootPath, "wwwroot")))
            {
                System.IO.Directory.CreateDirectory(System.IO.Path.Combine(projectRootPath, "wwwroot"));
            }
            var freport = new FastReport.Report();

            List<Pedido> pedidos = await _context.Pedidos
                .Include(p => p.PedidoItens)
                    .ThenInclude(pi => pi.PedidoItemAdicionais)
                .Include(x => x.IdClienteNavigation)
                .Include(x => x.Tenant)
                .Include(x => x.IdStatusNavigation)
                .Include(x => x.PedidoPagamentos)
                    .Take(10)
                .ToListAsync();

            var pedido_dto = _mapper.Map<List<PedidoDto>>(pedidos);
            var pedido_iten_dto = _mapper.Map<List<PedidoItenDto>>(pedidos.SelectMany(p => p.PedidoItens).ToList());
            var pedido_item_adicional_dto = _mapper.Map<List<PedidoItemAdicionaiDto>>(pedidos.SelectMany(p => p.PedidoItens).SelectMany(pi => pi.PedidoItemAdicionais).ToList());
            var cliente_dto = _mapper.Map<List<ClienteDto>>(pedidos.Select(p => p.IdClienteNavigation).ToList());
            var tenant_dto = _mapper.Map<List<TenantDto>>(pedidos.Select(p => p.Tenant).Distinct().ToList());
            var pedido_status_dto = _mapper.Map<List<PedidoStatusDto>>(pedidos.Select(p => p.IdStatusNavigation).Distinct().ToList());
            var pedido_pagamento_dto = _mapper.Map<List<PedidoPagamentoDto>>(pedidos.SelectMany(p => p.PedidoPagamentos).ToList());

            //freport.Dictionary.RegisterBusinessObject(dto, "pedidos", 10, true);
            freport.Dictionary.RegisterBusinessObject(pedido_dto, "Pedidos", 10, true);
            freport.Dictionary.RegisterBusinessObject(pedido_iten_dto, "PedidoItens", 10, true);
            freport.Dictionary.RegisterBusinessObject(pedido_item_adicional_dto, "PedidoItemAdicionais", 10, true);
            freport.Dictionary.RegisterBusinessObject(cliente_dto, "Clientes", 10, true);
            freport.Dictionary.RegisterBusinessObject(tenant_dto, "Tenants", 10, true);
            freport.Dictionary.RegisterBusinessObject(pedido_status_dto, "PedidoStatus", 10, true);
            freport.Dictionary.RegisterBusinessObject(pedido_pagamento_dto, "PedidoPagamentos", 10, true);

            freport.Report.Save(reportFilePath);

            return Ok($" Relatorio gerado : {reportFilePath}");
        }

        [HttpGet("GetReportPedidoById/{id}")]
        [ProducesResponseType(typeof(FileContentResult), 200)]
        public async Task<IActionResult> GetReportPedidoById([FromRoute] string id)
        {
            var projectRootPath = Environment.CurrentDirectory;
            var reportFilePath = System.IO.Path.Combine(projectRootPath, "wwwroot", "PedidoReport.frx");
            if (!System.IO.Directory.Exists(System.IO.Path.Combine(projectRootPath, "wwwroot")))
            {
                System.IO.Directory.CreateDirectory(System.IO.Path.Combine(projectRootPath, "wwwroot"));
            }
            var report = new FastReport.Report();
            report.Load(reportFilePath);
            Pedido? pedido = await _context.Pedidos
                .Include(p => p.PedidoItens.Where(pi => pi.DeletedAt == null))
                    .ThenInclude(x => x.IdProdutoNavigation)
                .Include(p => p.PedidoItens.Where(pi => pi.DeletedAt == null))
                    .ThenInclude(x => x.IdProduto2Navigation)
                .Include(p => p.PedidoItens)
                    .ThenInclude(pi => pi.PedidoItemAdicionais.Where(pia => pia.DeletedAt == null)).ThenInclude(x => x.IdAdicionalOpcaoNavigation)
                .Include(p => p.PedidoItens)
                    .ThenInclude(x => x.IdCategoriaOpcaoNavigation)
                .Include(x => x.IdClienteNavigation)
                .Include(x => x.Tenant)
                .Include(x => x.IdStatusNavigation)
                .Include(x => x.PedidoPagamentos)
                .FirstOrDefaultAsync(p => p.Id.ToString() == id);
            if (pedido == null)
            {
                return NotFound($"Pedido com ID {id} não encontrado.");
            }
            var pedido_dto = _mapper.Map<List<PedidoDto>>(new List<Pedido>() { pedido });
            var pedido_iten_dto = _mapper.Map<List<PedidoItenDto>>(pedido.PedidoItens.ToList());
            var pedido_item_adicional_dto = _mapper.Map<List<PedidoItemAdicionaiDto>>(pedido.PedidoItens.SelectMany(pi => pi.PedidoItemAdicionais).ToList());
            var cliente_dto = _mapper.Map<List<ClienteDto>>(new List<Cliente>() { pedido.IdClienteNavigation });
            var tenant_dto = _mapper.Map<List<TenantDto>>(new List<Tenant>() { pedido.Tenant });
            var pedido_status_dto = _mapper.Map<List<PedidoStatusDto>>(new List<PedidoStatus>() { pedido.IdStatusNavigation });
            var pedido_pagamento_dto = _mapper.Map<List<PedidoPagamentoDto>>(pedido.PedidoPagamentos.ToList());
            report.Dictionary.RegisterBusinessObject(pedido_dto, "Pedidos", 10, true);
            report.Dictionary.RegisterBusinessObject(pedido_iten_dto, "PedidoItens", 10, true);
            report.Dictionary.RegisterBusinessObject(pedido_item_adicional_dto, "PedidoItemAdicionais", 10, true);
            report.Dictionary.RegisterBusinessObject(cliente_dto, "Clientes", 10, true);
            report.Dictionary.RegisterBusinessObject(tenant_dto, "Tenants", 10, true);
            report.Dictionary.RegisterBusinessObject(pedido_status_dto, "PedidoStatus", 10, true);
            report.Dictionary.RegisterBusinessObject(pedido_pagamento_dto, "PedidoPagamentos", 10, true);

            report.Prepare();

            using var pdfExport = new PDFSimpleExport();
            using var ms = new MemoryStream();
            pdfExport.Export(report, ms);
            ms.Flush();
            ms.Position = 0;

            return File(ms.ToArray(), "application/pdf", $"relatorio-produto-nao-faturados.pdf");
        }
    }
}
