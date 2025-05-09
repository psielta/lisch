import { Typography } from "@mui/material";
import React from "react";

export default function SeparatorForm({ title }: { title: string }) {
  return (
    <div className="mb-5">
      <Typography
        variant="h6"
        gutterBottom
        className="border-b-1 border-primary pb-1"
      >
        {title}
      </Typography>
    </div>
  );
}
