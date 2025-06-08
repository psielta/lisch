import React from "react";

interface ErrorCaixaProps {
  error?: string;
}

function ErrorCaixa({ error = "Erro ao carregar o caixa" }: ErrorCaixaProps) {
  return (
    <main className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base font-semibold text-primary">Erro</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground sm:text-7xl">
          Oops!
        </h1>
        <p className="mt-6 text-lg font-medium text-muted-foreground sm:text-xl/8">
          {error}
        </p>
        <div className="mt-10 flex items-center justify-center">
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </main>
  );
}

export default ErrorCaixa;
