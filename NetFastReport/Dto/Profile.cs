using AutoMapper;
using EntityFrameworkProject.Models;
using NetFastReport.Dto.Models;

namespace NetFastReport.Dto
{
    public class MyProfile : Profile
    {
        public MyProfile()
        {
            CreateMap<Pedido, PedidoDto>().ReverseMap();
            CreateMap<PedidoItenDto, PedidoIten>().ReverseMap()
                .ForMember(dest => dest.NomeProduto, opt => opt.MapFrom((src, dest, destMember, context) =>
                {
                    if (src.IdProdutoNavigation == null)
                    {
                        return string.Empty;
                    }
                    return src.IdProdutoNavigation.Nome ?? string.Empty;
                }))
                .ForMember(dest => dest.NomeOpcao, opt => opt.MapFrom((src, dest, destMember, context) =>
                {
                    if (src.IdCategoriaOpcaoNavigation == null)
                    {
                        return string.Empty;
                    }
                    return src.IdCategoriaOpcaoNavigation.Nome ?? string.Empty;
                }));
            CreateMap<PedidoItemAdicionaiDto, PedidoItemAdicionai>().ReverseMap()
                .ForMember(dest => dest.Nome, opt => opt.MapFrom((src, dest, destMember, context) =>
                {
                    if (src.IdAdicionalOpcaoNavigation == null)
                    {
                        return string.Empty;
                    }
                    return src.IdAdicionalOpcaoNavigation.Nome ?? string.Empty;
                }));
            CreateMap<PedidoPagamento, PedidoPagamentoDto>().ReverseMap();
            CreateMap<PedidoStatus, PedidoStatusDto>().ReverseMap();
            CreateMap<Tenant, TenantDto>().ReverseMap();
            CreateMap<Cliente, ClienteDto>().ReverseMap();
        }
    }
}
