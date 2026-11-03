"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main>
      <h1>Não foi possível carregar esta página</h1>
      <p role="alert">Ocorreu um erro. Tente novamente em instantes.</p>
      <button onClick={reset}>Tentar novamente</button>
    </main>
  );
}
