import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

function LoaderCaixa() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 2,
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="body2" color="text.secondary">
        Carregando caixa...
      </Typography>
    </Box>
  );
}

export default LoaderCaixa;
