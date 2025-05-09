import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function AlertWarningNoPermission() {
  return (
    <Alert variant="warning">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Atenção</AlertTitle>
      <AlertDescription>
        Você não tem permissão para acessar esta página.
      </AlertDescription>
    </Alert>
  );
}

export default AlertWarningNoPermission;
