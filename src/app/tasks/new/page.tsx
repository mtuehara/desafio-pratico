import { CreateTask } from "@/components/create-task";

export default function NovaTarefaPage() {
  return (
    <main>
      <h1>Nova tarefa</h1>
      <p className="intro">Informe um título e, se quiser, uma descrição.</p>
      <CreateTask />
    </main>
  );
}
