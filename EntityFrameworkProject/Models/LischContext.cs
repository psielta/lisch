using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace EntityFrameworkProject.Models;

public partial class LischContext : DbContext
{
    public LischContext()
    {
    }

    public LischContext(DbContextOptions<LischContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Categoria> Categorias { get; set; }

    public virtual DbSet<CategoriaAdicionai> CategoriaAdicionais { get; set; }

    public virtual DbSet<CategoriaAdicionaisView> CategoriaAdicionaisViews { get; set; }

    public virtual DbSet<CategoriaAdicionalOpco> CategoriaAdicionalOpcoes { get; set; }

    public virtual DbSet<CategoriaAdicionalOpcoesView> CategoriaAdicionalOpcoesViews { get; set; }

    public virtual DbSet<CategoriaOpco> CategoriaOpcoes { get; set; }

    public virtual DbSet<CategoriaOpcoesView> CategoriaOpcoesViews { get; set; }

    public virtual DbSet<CategoriasView> CategoriasViews { get; set; }

    public virtual DbSet<Cliente> Clientes { get; set; }

    public virtual DbSet<ContasReceber> ContasRecebers { get; set; }

    public virtual DbSet<Culinaria> Culinarias { get; set; }

    public virtual DbSet<Pedido> Pedidos { get; set; }

    public virtual DbSet<PedidoItemAdicionai> PedidoItemAdicionais { get; set; }

    public virtual DbSet<PedidoItemAdicionaisView> PedidoItemAdicionaisViews { get; set; }

    public virtual DbSet<PedidoIten> PedidoItens { get; set; }

    public virtual DbSet<PedidoItensView> PedidoItensViews { get; set; }

    public virtual DbSet<PedidoPagamento> PedidoPagamentos { get; set; }

    public virtual DbSet<PedidoStatus> PedidoStatuses { get; set; }

    public virtual DbSet<PedidosView> PedidosViews { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<Produto> Produtos { get; set; }

    public virtual DbSet<ProdutoPreco> ProdutoPrecos { get; set; }

    public virtual DbSet<SchemaVersion> SchemaVersions { get; set; }

    public virtual DbSet<Session> Sessions { get; set; }

    public virtual DbSet<Tenant> Tenants { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseNpgsql("Host=127.0.0.1;Port=5435;Database=lisch;Username=ADM;Password=2104");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasPostgresExtension("pg_catalog", "adminpack")
            .HasPostgresExtension("pgcrypto")
            .HasPostgresExtension("unaccent");

        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("categorias_pkey");

            entity.ToTable("categorias", tb => tb.HasComment("Armazena as categorias de produtos do cardápio de um tenant"));

            entity.HasIndex(e => e.Ativo, "idx_categorias_ativo").HasFilter("(deleted_at IS NULL)");

            entity.HasIndex(e => e.IdCulinaria, "idx_categorias_culinaria").HasFilter("(deleted_at IS NULL)");

            entity.HasIndex(e => e.DeletedAt, "idx_categorias_deleted_at").HasFilter("(deleted_at IS NOT NULL)");

            entity.HasIndex(e => e.IdTenant, "idx_categorias_tenant").HasFilter("(deleted_at IS NULL)");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasComment("Identificador único UUID da categoria");
            entity.Property(e => e.Ativo)
                .HasDefaultValue((short)1)
                .HasComment("Status da categoria (1=ativo, 0=inativo)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(e => e.DeletedAt).HasComment("Data e hora de exclusão lógica (soft delete)");
            entity.Property(e => e.Descricao).HasComment("Descrição da categoria");
            entity.Property(e => e.DisponivelDomingo).HasDefaultValue((short)1);
            entity.Property(e => e.DisponivelQuarta).HasDefaultValue((short)1);
            entity.Property(e => e.DisponivelQuinta).HasDefaultValue((short)1);
            entity.Property(e => e.DisponivelSabado).HasDefaultValue((short)1);
            entity.Property(e => e.DisponivelSegunda).HasDefaultValue((short)1);
            entity.Property(e => e.DisponivelSexta).HasDefaultValue((short)1);
            entity.Property(e => e.DisponivelTerca).HasDefaultValue((short)1);
            entity.Property(e => e.Fim).HasComment("Horário de fim da disponibilidade da categoria");
            entity.Property(e => e.IdCulinaria).HasComment("Referência ao tipo de culinária da categoria");
            entity.Property(e => e.IdTenant).HasComment("ID do tenant ao qual a categoria pertence");
            entity.Property(e => e.Inicio).HasComment("Horário de início da disponibilidade da categoria");
            entity.Property(e => e.Nome).HasComment("Nome da categoria exibido no cardápio");
            entity.Property(e => e.OpcaoMeia)
                .HasDefaultValueSql("''::character varying")
                .HasComment("Opção para meio a meio (M=Valor médio, V=Maior valor, vazio=Não permitido)");
            entity.Property(e => e.Ordem).HasComment("Ordem de exibição da categoria no cardápio");
            entity.Property(e => e.SeqId)
                .ValueGeneratedOnAdd()
                .HasComment("Identificador sequencial para facilitar CRUD");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(d => d.IdCulinariaNavigation).WithMany(p => p.Categoria)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_categorias_culinarias");

            entity.HasOne(d => d.IdTenantNavigation).WithMany(p => p.Categoria)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_categorias_tenant");
        });

        modelBuilder.Entity<CategoriaAdicionai>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("categoria_adicionais_pkey");

            entity.ToTable("categoria_adicionais", tb => tb.HasComment("Tipos de adicionais disponíveis em cada categoria do cardápio"));

            entity.HasIndex(e => new { e.IdCategoria, e.CodigoTipo }, "idx_cat_adicionais_codigo")
                .IsUnique()
                .HasFilter("(deleted_at IS NULL)");

            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(e => e.Selecao).HasComment("U = Único (obrigatório escolher 1) | M = Múltiplo | Q = Quantidade múltipla");
            entity.Property(e => e.SeqId).HasComment("Identificador sequencial para facilitar CRUD");
            entity.Property(e => e.Status).HasComment("1 = ativo | 0 = inativo");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(d => d.IdCategoriaNavigation).WithMany(p => p.CategoriaAdicionais)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("categoria_adicionais_id_categoria_fkey");
        });

        modelBuilder.Entity<CategoriaAdicionaisView>(entity =>
        {
            entity.ToView("categoria_adicionais_view");
        });

        modelBuilder.Entity<CategoriaAdicionalOpco>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("categoria_adicional_opcoes_pkey");

            entity.ToTable("categoria_adicional_opcoes", tb => tb.HasComment("Cada linha representa uma opção (ex.: “Cheddar”, “Bacon”) de um tipo de adicional"));

            entity.HasIndex(e => new { e.IdCategoriaAdicional, e.Status }, "idx_cat_add_opcoes_add_status").HasFilter("(deleted_at IS NULL)");

            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(e => e.SeqId).HasComment("Identificador sequencial para facilitar CRUD");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(d => d.IdCategoriaAdicionalNavigation).WithMany(p => p.CategoriaAdicionalOpcos)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("categoria_adicional_opcoes_id_categoria_adicional_fkey");
        });

        modelBuilder.Entity<CategoriaAdicionalOpcoesView>(entity =>
        {
            entity.ToView("categoria_adicional_opcoes_view");
        });

        modelBuilder.Entity<CategoriaOpco>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("categoria_opcoes_pkey");

            entity.ToTable("categoria_opcoes", tb => tb.HasComment("Armazena as opções disponíveis para cada categoria (ex: tamanhos)"));

            entity.HasIndex(e => e.IdCategoria, "idx_categoria_opcoes_categoria").HasFilter("(deleted_at IS NULL)");

            entity.HasIndex(e => e.DeletedAt, "idx_categoria_opcoes_deleted_at").HasFilter("(deleted_at IS NOT NULL)");

            entity.HasIndex(e => e.Status, "idx_categoria_opcoes_status").HasFilter("(deleted_at IS NULL)");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasComment("Identificador único UUID da opção");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(e => e.DeletedAt).HasComment("Data e hora de exclusão lógica (soft delete)");
            entity.Property(e => e.IdCategoria).HasComment("ID da categoria a qual esta opção pertence");
            entity.Property(e => e.Nome).HasComment("Nome da opção (ex: Pequeno, Médio, Grande)");
            entity.Property(e => e.SeqId)
                .ValueGeneratedOnAdd()
                .HasComment("Identificador sequencial para facilitar CRUD");
            entity.Property(e => e.Status)
                .HasDefaultValue((short)1)
                .HasComment("Status da opção (1=ativo, 0=inativo)");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(d => d.IdCategoriaNavigation).WithMany(p => p.CategoriaOpcos)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_categoria_opcoes_categorias");
        });

        modelBuilder.Entity<CategoriaOpcoesView>(entity =>
        {
            entity.ToView("categoria_opcoes_view");
        });

        modelBuilder.Entity<CategoriasView>(entity =>
        {
            entity.ToView("categorias_view");
        });

        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("clientes_pkey");

            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(e => e.Uf).IsFixedLength();
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(d => d.Tenant).WithMany(p => p.Clientes).HasConstraintName("clientes_tenant_fk");
        });

        modelBuilder.Entity<ContasReceber>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("contas_receber_pkey");

            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(e => e.Quitado).HasComputedColumnSql("(valor_pago >= valor_devido)", true);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()");
            entity.Property(e => e.ValorPago).HasDefaultValueSql("0");

            entity.HasOne(d => d.IdPedidoNavigation).WithMany(p => p.ContasRecebers).HasConstraintName("contas_receber_id_pedido_fkey");
        });

        modelBuilder.Entity<Culinaria>(entity =>
        {
            entity.HasKey(e => e.IdCulinaria).HasName("culinarias_pkey");

            entity.Property(e => e.IdCulinaria).ValueGeneratedNever();
            entity.Property(e => e.MeioMeio).HasDefaultValue((short)0);
        });

        modelBuilder.Entity<Pedido>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pedidos_pkey");

            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(e => e.Finalizado).HasDefaultValue(false);
            entity.Property(e => e.PedidoPronto).HasDefaultValue((short)0);
            entity.Property(e => e.Quitado).HasDefaultValue(false);
            entity.Property(e => e.SeqId).ValueGeneratedOnAdd();
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(d => d.IdClienteNavigation).WithMany(p => p.Pedidos)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_pedidos_clientes");

            entity.HasOne(d => d.IdStatusNavigation).WithMany(p => p.Pedidos)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_pedidos_status");

            entity.HasOne(d => d.Tenant).WithMany(p => p.Pedidos)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_pedidos_tenant");
        });

        modelBuilder.Entity<PedidoItemAdicionai>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pedido_item_adicionais_pkey");

            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(e => e.SeqId).ValueGeneratedOnAdd();
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(d => d.IdAdicionalOpcaoNavigation).WithMany(p => p.PedidoItemAdicionais)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_pia_adicional_opcao");

            entity.HasOne(d => d.IdPedidoItemNavigation).WithMany(p => p.PedidoItemAdicionais).HasConstraintName("fk_pia_pedido_item");
        });

        modelBuilder.Entity<PedidoItemAdicionaisView>(entity =>
        {
            entity.ToView("pedido_item_adicionais_view");
        });

        modelBuilder.Entity<PedidoIten>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pedido_itens_pkey");

            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(e => e.SeqId).ValueGeneratedOnAdd();
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(d => d.IdCategoriaNavigation).WithMany(p => p.PedidoItens)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_pi_categoria");

            entity.HasOne(d => d.IdCategoriaOpcaoNavigation).WithMany(p => p.PedidoItens).HasConstraintName("fk_pi_categoria_opcao");

            entity.HasOne(d => d.IdPedidoNavigation).WithMany(p => p.PedidoItens).HasConstraintName("fk_pi_pedido");

            entity.HasOne(d => d.IdProdutoNavigation).WithMany(p => p.PedidoItenIdProdutoNavigations)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_pi_produto");

            entity.HasOne(d => d.IdProduto2Navigation).WithMany(p => p.PedidoItenIdProduto2Navigations).HasConstraintName("fk_pi_produto_2");
        });

        modelBuilder.Entity<PedidoItensView>(entity =>
        {
            entity.ToView("pedido_itens_view");
        });

        modelBuilder.Entity<PedidoPagamento>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pedido_pagamentos_pkey");

            entity.HasIndex(e => e.IdPedido, "idx_pagamentos_pedido").HasFilter("(deleted_at IS NULL)");

            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(e => e.SeqId).ValueGeneratedOnAdd();
            entity.Property(e => e.Troco).HasDefaultValueSql("0");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(d => d.IdContaReceberNavigation).WithMany(p => p.PedidoPagamentos)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_pp_conta");

            entity.HasOne(d => d.IdPedidoNavigation).WithMany(p => p.PedidoPagamentos).HasConstraintName("pedido_pagamentos_id_pedido_fkey");
        });

        modelBuilder.Entity<PedidoStatus>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pedido_status_pkey");

            entity.Property(e => e.Id).ValueGeneratedNever();
        });

        modelBuilder.Entity<PedidosView>(entity =>
        {
            entity.ToView("pedidos_view");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("products_pkey");

            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(e => e.IsSold).HasDefaultValue(false);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(d => d.Seller).WithMany(p => p.Products)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("products_seller_id_fkey");

            entity.HasOne(d => d.Tenant).WithMany(p => p.Products)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("products_tenant_id_fkey");
        });

        modelBuilder.Entity<Produto>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("produtos_pkey");

            entity.ToTable("produtos", tb => tb.HasComment("Armazena os produtos do cardápio, vinculados a uma categoria."));

            entity.HasIndex(e => e.CodigoExterno, "idx_produtos_codigo_externo").HasFilter("(deleted_at IS NULL)");

            entity.HasIndex(e => e.DeletedAt, "idx_produtos_deleted_at").HasFilter("(deleted_at IS NOT NULL)");

            entity.HasIndex(e => e.IdCategoria, "idx_produtos_id_categoria").HasFilter("(deleted_at IS NULL)");

            entity.HasIndex(e => e.Status, "idx_produtos_status").HasFilter("(deleted_at IS NULL)");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasComment("Identificador único UUID do produto.");
            entity.Property(e => e.CodigoExterno).HasComment("Código externo do produto, utilizado para identificação em integrações ou sistemas legados.");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasComment("Timestamp da criação do registro do produto.");
            entity.Property(e => e.DeletedAt).HasComment("Timestamp da exclusão lógica do produto (soft delete).");
            entity.Property(e => e.Descricao).HasComment("Descrição detalhada do produto.");
            entity.Property(e => e.IdCategoria).HasComment("Referência à categoria à qual o produto pertence (FK para public.categorias.id).");
            entity.Property(e => e.ImagemUrl).HasComment("URL da imagem principal associada ao produto.");
            entity.Property(e => e.Nome).HasComment("Nome do produto exibido no cardápio.");
            entity.Property(e => e.Ordem).HasComment("Define a ordem de exibição deste produto dentro de sua categoria no cardápio.");
            entity.Property(e => e.PermiteObservacao)
                .HasDefaultValue(true)
                .HasComment("Indica se o cliente pode adicionar observações a este produto no pedido (TRUE/FALSE).");
            entity.Property(e => e.SeqId)
                .ValueGeneratedOnAdd()
                .HasComment("Identificador sequencial único do produto (para facilitar CRUD e referência legada se necessário).");
            entity.Property(e => e.Sku).HasComment("SKU (Stock Keeping Unit) do produto, para controle de inventário se aplicável.");
            entity.Property(e => e.Status)
                .HasDefaultValue((short)1)
                .HasComment("Status do produto (1 = ativo, 0 = inativo).");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasComment("Timestamp da última atualização do registro do produto.");

            entity.HasOne(d => d.IdCategoriaNavigation).WithMany(p => p.Produtos)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_produtos_categorias");
        });

        modelBuilder.Entity<ProdutoPreco>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("produto_precos_pkey");

            entity.ToTable("produto_precos", tb => tb.HasComment("Armazena as variações de preço para cada produto, baseadas nas opções de categoria."));

            entity.HasIndex(e => e.CodigoExternoOpcaoPreco, "idx_produto_precos_codigo_externo_opcao_preco").HasFilter("(deleted_at IS NULL)");

            entity.HasIndex(e => e.DeletedAt, "idx_produto_precos_deleted_at").HasFilter("(deleted_at IS NOT NULL)");

            entity.HasIndex(e => e.Disponivel, "idx_produto_precos_disponivel").HasFilter("(deleted_at IS NULL)");

            entity.HasIndex(e => e.IdCategoriaOpcao, "idx_produto_precos_id_categoria_opcao").HasFilter("(deleted_at IS NULL)");

            entity.HasIndex(e => e.IdProduto, "idx_produto_precos_id_produto").HasFilter("(deleted_at IS NULL)");

            entity.HasIndex(e => new { e.IdProduto, e.IdCategoriaOpcao }, "uidx_produto_precos_produto_opcao_ativo")
                .IsUnique()
                .HasFilter("(deleted_at IS NULL)");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasComment("Identificador único UUID para a entrada de preço.");
            entity.Property(e => e.CodigoExternoOpcaoPreco).HasComment("Código externo para esta variação de preço específica (ex: \"PEQUENO_COPO_ACAI\"). Mapeia para o campo \"codigo\" dentro do array \"opcoes\" no JSON do produto.");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasComment("Timestamp da criação do registro de preço.");
            entity.Property(e => e.DeletedAt).HasComment("Timestamp da exclusão lógica do preço (soft delete).");
            entity.Property(e => e.Disponivel)
                .HasDefaultValue((short)1)
                .HasComment("Status desta opção de preço (1 = disponível, 0 = indisponível). Corresponde ao campo \"status\" dentro do array \"opcoes\" no JSON do produto.");
            entity.Property(e => e.IdCategoriaOpcao).HasComment("Referência à opção da categoria que define esta variação de preço (FK para public.categoria_opcoes.id). Ex: \"Pequeno\", \"Médio\".");
            entity.Property(e => e.IdProduto).HasComment("Referência ao produto ao qual este preço pertence (FK para public.produtos.id).");
            entity.Property(e => e.PrecoBase).HasComment("O preço regular desta opção do produto.");
            entity.Property(e => e.PrecoPromocional).HasComment("O preço promocional desta opção do produto, se aplicável. Corresponde a \"valor2\" ou \"valorAtual\" no JSON.");
            entity.Property(e => e.SeqId)
                .ValueGeneratedOnAdd()
                .HasComment("Identificador sequencial único para a entrada de preço (para facilitar CRUD e referência legada se necessário).");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasComment("Timestamp da última atualização do registro de preço.");

            entity.HasOne(d => d.IdCategoriaOpcaoNavigation).WithMany(p => p.ProdutoPrecos)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_produto_precos_categoria_opcao");

            entity.HasOne(d => d.IdProdutoNavigation).WithMany(p => p.ProdutoPrecos).HasConstraintName("fk_produto_precos_produto");
        });

        modelBuilder.Entity<Session>(entity =>
        {
            entity.HasKey(e => e.Token).HasName("sessions_pkey");
        });

        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("tenants_pkey");

            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");

            entity.HasOne(d => d.IdClientePadraoNavigation).WithMany(p => p.Tenants).HasConstraintName("tenants_fk");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("users_pkey");

            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(e => e.PermissionAdicional).HasDefaultValue(0);
            entity.Property(e => e.PermissionCategoria).HasDefaultValue(0);
            entity.Property(e => e.PermissionCliente).HasDefaultValue(0);
            entity.Property(e => e.PermissionProduto).HasDefaultValue(0);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(d => d.Tenant).WithMany(p => p.Users)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("users_tenant_id_fkey");
        });
        modelBuilder.HasSequence("pedido_item_adicionais_seq_id_seq");
        modelBuilder.HasSequence("pedido_itens_seq_id_seq");
        modelBuilder.HasSequence("pedidos_seq_id_seq");

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
