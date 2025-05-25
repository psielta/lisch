import { User, Tenant } from "@/context/auth-context";
import { apiServer } from "@/lib/api-server";
import {
  ProdutoListResponse,
  ProdutoResponse,
} from "@/rxjs/produto/produto.model";
import { redirect } from "next/navigation";
import React from "react";
import Vendas from "../vendas";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { CategoriaAdicionalListResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import { PedidoClienteDTO, PedidoResponse } from "@/rxjs/pedido/pedido.model";
import { PedidoEditarDTO } from "@/dto/pedido-editar-dto";
import { mergePedidoData, logMergeStats } from "@/utils/merge-utils";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await apiServer<User>("/users/me");

  if (user.admin !== 1 && (user.permission_vendas ?? 0) !== 1) {
    redirect("/sem-permissao");
  }

  const tenant = await apiServer<Tenant>("/users/tenant/" + user.tenant_id);
  let defaultCliente: PedidoClienteDTO | null | undefined = null;
  if (tenant?.id_cliente_padrao) {
    defaultCliente = await apiServer<PedidoClienteDTO>(
      "/clientes/" + tenant.id_cliente_padrao
    );
  }

  let page: ProdutoListResponse | null | undefined = null;
  let categorias: ICoreCategoria[] | null | undefined = null;
  let adicionais: CategoriaAdicionalListResponse | null | undefined = null;
  let pedidoEditarDTO: PedidoEditarDTO | null | undefined = null;

  try {
    // Carregar dados ativos (não soft-deleted)
    page = await apiServer<ProdutoListResponse | null | undefined>(
      "/produtos?limit=2147483647"
    );
    categorias = await apiServer<ICoreCategoria[] | null | undefined>(
      "/categorias"
    );
    adicionais = await apiServer<
      CategoriaAdicionalListResponse | null | undefined
    >("/categoria-adicionais/tenant/" + user.tenant_id + "?limit=2147483647");

    // Carregar dados do pedido (incluindo soft-deleted)
    pedidoEditarDTO = await apiServer<PedidoEditarDTO | null | undefined>(
      "/pedidos/" + id + "/dados-edicao"
    );
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }

  // Preparar dados iniciais (ativos)
  const dadosAtivos = {
    produtos: page?.produtos ?? [],
    categorias: categorias ?? [],
    adicionais: adicionais?.adicionais ?? [],
  };

  // Se temos dados do pedido, fazer merge inteligente
  let dadosFinais = dadosAtivos;

  if (pedidoEditarDTO) {
    const dadosPedido = {
      produtos: pedidoEditarDTO.produtos ?? [],
      categorias: pedidoEditarDTO.categorias ?? [],
      adicionais: pedidoEditarDTO.adicionais ?? [],
    };

    // Log para debug (opcional - remover em produção)
    if (process.env.NODE_ENV === "development") {
      console.log("🔄 Fazendo merge dos dados do pedido...");
      logMergeStats(dadosAtivos, dadosPedido);
    }

    // Fazer merge inteligente dos dados
    dadosFinais = mergePedidoData(dadosAtivos, dadosPedido);

    // Log final para debug (opcional)
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Merge concluído!");
      logMergeStats(dadosAtivos, dadosFinais);
    }
  }

  return (
    <Vendas
      produtos={dadosFinais.produtos}
      user={user}
      categorias={dadosFinais.categorias}
      adicionais={dadosFinais.adicionais}
      pedido={pedidoEditarDTO?.pedido}
      defaultCliente={defaultCliente}
    />
  );
}
