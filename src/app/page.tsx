import { ListaTarefas } from "@/components/lista-tarefas";
import { appRouter } from "@/server/router";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage() {
  const tarefas = await appRouter.createCaller({}).tarefas.listar();
  return (
    <main>
      <h1>Gerenciador de tarefas</h1>
      <p className="intro">Um lugar simples para organizar suas tarefas.</p>
      <ListaTarefas tarefasIniciais={tarefas} />
    </main>
  );
}
