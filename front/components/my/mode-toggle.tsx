"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button, IconButton, Menu, MenuItem } from "@mui/material";
import { LightMode, DarkMode, Settings } from "@mui/icons-material";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        size="small"
        aria-controls={open ? "theme-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        color="secondary"
      >
        {theme === "dark" ? (
          <>
            <DarkMode sx={{ fontSize: "2.3rem", marginRight: "10px" }} /> Modo
            Escuro
          </>
        ) : (
          <>
            <LightMode sx={{ fontSize: "2.3rem", marginRight: "10px" }} /> Modo
            Claro
          </>
        )}
      </Button>

      <Menu
        anchorEl={anchorEl}
        id="theme-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={() => setTheme("light")}>
          <LightMode sx={{ mr: 1 }} fontSize="small" />
          Tema Claro
        </MenuItem>
        <MenuItem onClick={() => setTheme("dark")}>
          <DarkMode sx={{ mr: 1 }} fontSize="small" />
          Tema Escuro
        </MenuItem>
        <MenuItem onClick={() => setTheme("system")}>
          <Settings sx={{ mr: 1 }} fontSize="small" />
          Tema do Sistema
        </MenuItem>
      </Menu>
    </>
  );
}
