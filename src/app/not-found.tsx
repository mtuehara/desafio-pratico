import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>Página ou tarefa não encontrada</h1>
      <p>O endereço pode estar incorreto ou a tarefa pode ter sido excluída.</p>
      <Link href="/">Voltar para as tarefas</Link>
    </main>
  );
}
