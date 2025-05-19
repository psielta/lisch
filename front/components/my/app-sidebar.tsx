"use client";
import React, { useEffect, useRef, useState } from "react";
import LightLogo from "@/public/Light.png";
import DarkLogo from "@/public/Dark.png";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon,
  Logout as LogoutIcon,
  PersonOutline,
  LocationCity,
  Map as MapIcon,
  GroupOutlined,
  LocalShippingOutlined,
  BadgeOutlined,
  HowToRegOutlined,
  PeopleAltOutlined,
  Inventory2Outlined,
  WarehouseOutlined,
} from "@mui/icons-material";
import { usePathname } from "next/navigation";
import Link from "next/link";
import PlaceIcon from "@mui/icons-material/Place";
import Image from "next/image";
import LischLarge from "@/public/LischLarge.gif";
import Lisch from "@/public/Lisch.gif";
import { useAuth, User } from "@/context/auth-context";
import RedeemIcon from "@mui/icons-material/Redeem";
import { getMe } from "@/proxies/users/GetMe";
import ViewTimelineIcon from "@mui/icons-material/ViewTimeline";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import AddCardIcon from "@mui/icons-material/AddCard";
import { useGridApiRef } from "@mui/x-data-grid";
import { ModeToggle } from "./mode-toggle";
/* -------------------------------------------------------------------------- */
/* Configurações gerais                                                       */
/* -------------------------------------------------------------------------- */
const drawerWidth = 260;
const drawerCollapsed = 72; // largura recolhida

/* Itens dos grupos --------------------------------------------------------- */
export const cadastrosItems = [
  { title: "Usuários", url: "/cadastros/usuarios", icon: PersonOutline },
  {
    title: "Categorias de produtos",
    url: "/cadastros/categorias",
    icon: WorkspacesIcon,
  },
  { title: "Produtos", url: "/cadastros/produtos", icon: RedeemIcon },
] as const;

export const movimentoItems = [
  { title: "Pedidos", url: "/movimento/pedido", icon: ViewTimelineIcon },
] as const;
export const financeiroItems = [
  {
    title: "Contas a receber",
    url: "/financeiro/contas-a-receber",
    icon: PriceCheckIcon,
  },
] as const;

export const estoqueItems = [
  { title: "Depósitos", url: "/cadastros/depositos", icon: WarehouseOutlined },
  {
    title: "Movimentações",
    url: "/cadastros/movimentos-estoque",
    icon: ViewTimelineIcon,
  },
  {
    title: "Estoques",
    url: "/cadastros/produto-estoques",
    icon: Inventory2Outlined,
  },
] as const;

function handleVerificaSeUmDosItensEstaNaRotaAtual(
  items: readonly { title: string; url: string; icon: any }[],
  pathname: string
) {
  return items.some((item) => pathname.startsWith(item.url));
}
/* -------------------------------------------------------------------------- */
/* Renderização de itens da lista                                             */
/* -------------------------------------------------------------------------- */
interface RenderMenuItemsProps {
  items: readonly { title: string; url: string; icon: any }[];
  pathname: string;
  collapsed: boolean;
}
function RenderMenuItems({ items, pathname, collapsed }: RenderMenuItemsProps) {
  const isActive = (url: string) => pathname.startsWith(url);

  return (
    <List
      disablePadding
      sx={{
        bgcolor: handleVerificaSeUmDosItensEstaNaRotaAtual(items, pathname)
          ? "transparent"
          : "background.paper",
      }}
    >
      {items.map(({ title, url, icon: Icon }) => {
        const button = (
          <ListItemButton
            component={Link}
            href={url}
            selected={isActive(url)}
            sx={{
              justifyContent: "center",
              minHeight: 44,
              px: 0,
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "& .MuiListItemIcon-root": { color: "primary.contrastText" },
              },
              "&.Mui-selected:hover": { bgcolor: "primary.main" },
              "&:hover:not(.Mui-selected)": { bgcolor: "action.hover" },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: "auto",
                mr: collapsed ? 0 : 2,
                width: collapsed ? "100%" : undefined,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                className={`flex items-center justify-center ${
                  collapsed ? "" : "ml-3"
                }`}
              >
                <Icon />
              </div>
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary={title}
                primaryTypographyProps={{ fontSize: 14 }}
              />
            )}
          </ListItemButton>
        );

        return (
          <ListItem key={url} disablePadding>
            {collapsed ? (
              <Tooltip title={title} placement="right" arrow>
                {button}
              </Tooltip>
            ) : (
              button
            )}
          </ListItem>
        );
      })}
    </List>
  );
}

/* -------------------------------------------------------------------------- */
/* Pequeno wrapper que adiciona tooltip ao título do Accordion                */
/* -------------------------------------------------------------------------- */
interface GroupProps {
  title: string;
  defaultExpanded: boolean;
  collapsed: boolean;
  children: React.ReactNode;
  items: readonly { title: string; url: string; icon: any }[];
  pathname: string;
}

function GroupAccordion({
  title,
  defaultExpanded,
  collapsed,
  children,
  items,
  pathname,
}: GroupProps) {
  const summary = (
    <AccordionSummary
      expandIcon={<ExpandMoreIcon />}
      sx={{
        minHeight: 48,
        "& .MuiAccordionSummary-content": {
          justifyContent: collapsed ? "center" : "flex-start",
        },
        bgcolor: handleVerificaSeUmDosItensEstaNaRotaAtual(items, pathname)
          ? "transparent"
          : "background.paper",
      }}
    >
      {!collapsed && <Typography variant="subtitle2">{title}</Typography>}
    </AccordionSummary>
  );

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      sx={{ bgcolor: "transparent" }}
    >
      {collapsed ? (
        <Tooltip title={title} placement="right" arrow>
          {/* div wrapper para não quebrar o layout do Accordion */}
          <div>{summary}</div>
        </Tooltip>
      ) : (
        summary
      )}
      <AccordionDetails sx={{ p: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
}

/* -------------------------------------------------------------------------- */
/* Componente principal                                                       */
/* -------------------------------------------------------------------------- */
export default function AppSidebarMui() {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  /* Estado de colapso ------------------------------------------------------ */
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapse = () => {
    setCollapsed((v) => !v);
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 320);
  };

  /* Avatar / menu ---------------------------------------------------------- */
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleMenuOpen = (e: React.MouseEvent<HTMLDivElement>) =>
    setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  /* Dialog usuário --------------------------------------------------------- */
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const handleGetMe = async () => {
    try {
      const res = await getMe();
      setUserData(res as User);
      setUserDialogOpen(true);
      handleMenuClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
  };

  const cadastrosActive = cadastrosItems.some((i) =>
    pathname.startsWith(i.url)
  );
  const estoqueActive = estoqueItems.some((i) => pathname.startsWith(i.url));
  const movimentoActive = movimentoItems.some((i) =>
    pathname.startsWith(i.url)
  );
  const financeiroActive = financeiroItems.some((i) =>
    pathname.startsWith(i.url)
  );

  /* ② ouça o evento transitionend */
  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;

    const handle = () => window.dispatchEvent(new Event("resize"));
    el.addEventListener("transitionend", handle);

    /* clean-up */
    return () => el.removeEventListener("transitionend", handle);
  }, [collapsed]); // roda toda vez que muda de estado

  return (
    <>
      {/* BOTÃO COLAPSAR ------------------------------------------------------ */}
      <Tooltip
        title={collapsed ? "Expandir menu" : "Recolher menu"}
        placement="right"
        arrow
      >
        <IconButton
          onClick={toggleCollapse}
          aria-label="alternar sidebar"
          sx={(theme) => ({
            position: "fixed",
            top: 12,
            left: collapsed ? drawerCollapsed - 24 : drawerWidth - 24,
            zIndex: theme.zIndex.drawer + 1,
            bgcolor: "background.paper",
            border: `1px solid ${theme.palette.divider}`,
            transition: "left .3s",
          })}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Tooltip>

      {/* DRAWER -------------------------------------------------------------- */}
      <Drawer
        ref={drawerRef}
        variant="permanent"
        sx={(theme) => ({
          width: collapsed ? drawerCollapsed : drawerWidth,
          flexShrink: 0,
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          "& .MuiDrawer-paper": {
            width: collapsed ? drawerCollapsed : drawerWidth,
            overflowX: "hidden",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        })}
      >
        {/* LOGO ------------------------------------------------------------- */}
        <div className={`flex items-center justify-center h-[9rem]`}>
          {!collapsed ? (
            <Image src={LischLarge} alt="Logo" width={240} height={240} />
          ) : (
            <div>
              <Image src={Lisch} alt="Logo" width={120} height={120} />
            </div>
          )}
        </div>
        <Divider />

        {/* HOME ------------------------------------------------------------- */}
        <List sx={{ py: 0 }}>
          <ListItem disablePadding>
            <Tooltip
              title="Home"
              placement="right"
              arrow
              disableHoverListener={!collapsed}
            >
              <ListItemButton
                component={Link}
                href="/dashboard"
                selected={pathname === "/dashboard"}
                sx={{
                  justifyContent: "center",
                  minHeight: 48,
                  px: 0,
                  py: 0,
                  "& .MuiListItemIcon-root": {
                    minWidth: "auto",
                    mr: collapsed ? 0 : 2,
                    width: collapsed ? "100%" : undefined,
                    display: "flex",
                    justifyContent: "center",
                  },
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "& .MuiListItemIcon-root": {
                      color: "primary.contrastText",
                    },
                  },
                  "&.Mui-selected:hover": { bgcolor: "primary.main" },
                  "&:hover:not(.Mui-selected)": { bgcolor: "action.hover" },
                }}
              >
                <ListItemIcon>
                  <div
                    className={`flex items-center justify-center ${
                      collapsed ? "" : "ml-3"
                    }`}
                  >
                    <HomeIcon />
                  </div>
                </ListItemIcon>
                {!collapsed && <ListItemText primary="Home" />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
        {/* HOME ------------------------------------------------------------- */}
        <List sx={{ py: 0 }}>
          <ListItem disablePadding>
            <Tooltip
              title="Vendas"
              placement="right"
              arrow
              disableHoverListener={!collapsed}
            >
              <ListItemButton
                component={Link}
                href="/vendas"
                selected={pathname === "/vendas"}
                sx={{
                  justifyContent: "center",
                  minHeight: 48,
                  px: 0,
                  py: 0,
                  "& .MuiListItemIcon-root": {
                    minWidth: "auto",
                    mr: collapsed ? 0 : 2,
                    width: collapsed ? "100%" : undefined,
                    display: "flex",
                    justifyContent: "center",
                  },
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "& .MuiListItemIcon-root": {
                      color: "primary.contrastText",
                    },
                  },
                  "&.Mui-selected:hover": { bgcolor: "primary.main" },
                  "&:hover:not(.Mui-selected)": { bgcolor: "action.hover" },
                }}
              >
                <ListItemIcon>
                  <div
                    className={`flex items-center justify-center ${
                      collapsed ? "" : "ml-3"
                    }`}
                  >
                    <ShoppingCartIcon />
                  </div>
                </ListItemIcon>
                {!collapsed && <ListItemText primary="Vendas" />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
        {/* HOME ------------------------------------------------------------- */}
        <List sx={{ py: 0 }}>
          <ListItem disablePadding>
            <Tooltip
              title="Gerenciar Vendas"
              placement="right"
              arrow
              disableHoverListener={!collapsed}
            >
              <ListItemButton
                component={Link}
                href="/gerenciar-vendas"
                selected={pathname === "/gerenciar-vendas"}
                sx={{
                  justifyContent: "center",
                  minHeight: 48,
                  px: 0,
                  py: 0,
                  "& .MuiListItemIcon-root": {
                    minWidth: "auto",
                    mr: collapsed ? 0 : 2,
                    width: collapsed ? "100%" : undefined,
                    display: "flex",
                    justifyContent: "center",
                  },
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "& .MuiListItemIcon-root": {
                      color: "primary.contrastText",
                    },
                  },
                  "&.Mui-selected:hover": { bgcolor: "primary.main" },
                  "&:hover:not(.Mui-selected)": { bgcolor: "action.hover" },
                }}
              >
                <ListItemIcon>
                  <div
                    className={`flex items-center justify-center ${
                      collapsed ? "" : "ml-3"
                    }`}
                  >
                    <ManageHistoryIcon />
                  </div>
                </ListItemIcon>
                {!collapsed && <ListItemText primary="Gerenciar Vendas" />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>

        {/* GRUPO CADASTROS -------------------------------------------------- */}
        <GroupAccordion
          title="Cadastros"
          defaultExpanded={cadastrosActive}
          collapsed={collapsed}
          items={cadastrosItems}
          pathname={pathname}
        >
          <RenderMenuItems
            items={cadastrosItems}
            pathname={pathname}
            collapsed={collapsed}
          />
        </GroupAccordion>

        {/* GRUPO ESTOQUE ---------------------------------------------------- */}
        <GroupAccordion
          title="Controle de Estoque"
          defaultExpanded={estoqueActive}
          collapsed={collapsed}
          items={estoqueItems}
          pathname={pathname}
        >
          <RenderMenuItems
            items={estoqueItems}
            pathname={pathname}
            collapsed={collapsed}
          />
        </GroupAccordion>

        {/* GRUPO MOVIMENTO --------------------------------------------------- */}
        <GroupAccordion
          title="Movimentações"
          defaultExpanded={movimentoActive}
          collapsed={collapsed}
          items={movimentoItems}
          pathname={pathname}
        >
          <RenderMenuItems
            items={movimentoItems}
            pathname={pathname}
            collapsed={collapsed}
          />
        </GroupAccordion>

        {/* GRUPO FINANCEIRO --------------------------------------------------- */}
        <GroupAccordion
          title="Financeiro"
          defaultExpanded={financeiroActive}
          collapsed={collapsed}
          items={financeiroItems}
          pathname={pathname}
        >
          <RenderMenuItems
            items={financeiroItems}
            pathname={pathname}
            collapsed={collapsed}
          />
        </GroupAccordion>

        <Divider sx={{ mt: "auto" }} />

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {/* <MenuItem onClick={handleGetMe}>Minha Conta</MenuItem> */}
          <MenuItem>
            <ModeToggle />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sair da Conta
          </MenuItem>
        </Menu>

        {/* FOOTER ----------------------------------------------------------- */}
        {!collapsed ? (
          <div style={{ padding: 3 }}>
            <ListItem disablePadding>
              <ListItemButton onClick={handleMenuOpen} sx={{ borderRadius: 2 }}>
                <Avatar
                  sx={{
                    width: 47,
                    height: 47,
                    bgcolor: "primary.main",
                    fontSize: 24,
                  }}
                >
                  {user ? user.user_name.charAt(0).toUpperCase() : "!"}
                </Avatar>
                <ListItemText
                  primary={user ? user.user_name : "Sem Conexão"}
                  secondary={user ? "Online" : "Offline"}
                  sx={{ ml: 2 }}
                />
              </ListItemButton>
            </ListItem>
          </div>
        ) : (
          <Tooltip title="Usuário" placement="right" arrow>
            <div style={{ padding: 0 }}>
              <ListItem disablePadding sx={{ p: 0 }}>
                <ListItemButton
                  onClick={handleMenuOpen}
                  sx={{ borderRadius: 2, px: 1.5 }}
                >
                  <Avatar
                    sx={{
                      width: 47,
                      height: 47,
                      bgcolor: "primary.main",
                      fontSize: 24,
                    }}
                  >
                    {user ? user.user_name.charAt(0).toUpperCase() : "!"}
                  </Avatar>
                </ListItemButton>
              </ListItem>
            </div>
          </Tooltip>
        )}
      </Drawer>

      {/* DIALOG USUÁRIO ----------------------------------------------------- */}
      <Dialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Dados do Usuário</DialogTitle>
        <DialogContent>
          {userData && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Campo</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Valor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>{userData.id}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>{userData.user_name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>{userData.email}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Bio</TableCell>
                  <TableCell>{userData.bio}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Criado em</TableCell>
                  <TableCell>
                    {new Date(userData.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Atualizado em</TableCell>
                  <TableCell>
                    {new Date(userData.updated_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
