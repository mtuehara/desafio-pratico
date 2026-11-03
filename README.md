# Gerenciador de tarefas

Desafio prático com Next.js 15, TypeScript e tRPC. Esta primeira etapa documenta a arquitetura; a aplicação ainda não foi implementada.

## Escolhas

- **Next.js 15 e App Router:** páginas renderizadas no servidor e componentes cliente para interações. O enunciado cita v15 e também versões recentes; adotamos a versão estável mais recente da linha 15 compatível com as dependências no momento da instalação.
- **TypeScript:** mantém os contratos entre servidor e navegador verificáveis durante o desenvolvimento.
- **tRPC:** expõe consultas e mutações com tipos inferidos do backend, sem duplicar contratos no frontend.
- **TanStack Query:** gerencia consultas, carregamento, erros e atualização da lista após mutações, com a integração do tRPC.
- **Zod:** valida entradas no servidor, inclusive títulos que contenham apenas espaços. A validação do formulário oferece feedback imediato, mas não substitui a validação do backend.
- **Memória do processo:** um `Map` guarda as tarefas, sem banco, ORM ou serviço externo.
- **CSS simples:** atende ao desafio sem acrescentar uma biblioteca de interface.

## Estrutura planejada

As pastas e arquivos abaixo serão criados gradualmente, com explicação individual.

```text
src/
  app/
    api/trpc/[trpc]/route.ts    # Adaptador HTTP do tRPC para o App Router
    tarefas/nova/page.tsx      # Página de criação
    tarefas/[id]/editar/page.tsx # Página de edição
    globals.css               # Estilos globais e estados visuais
    layout.tsx                # Estrutura compartilhada e providers
    page.tsx                  # Listagem com carregamento inicial no servidor
  components/
    lista-tarefas.tsx          # Lista interativa, exclusão e feedback
    formulario-tarefa.tsx      # Formulário compartilhado por criação e edição
  server/
    trpc.ts                   # Inicialização do tRPC e procedures públicas
    router.ts                 # Composição do router e exportação de AppRouter
    routers/tarefas.ts        # Consultas, mutações e erros de domínio
    tarefas-store.ts          # Armazenamento em memória e operações de acesso
  shared/
    tarefa.ts                 # Esquemas de entrada e tipo de tarefa
  trpc/
    client.tsx                # Cliente tipado e providers para o navegador
```

`server/` não deve ser importado como código executável por componentes cliente. O cliente usa apenas o tipo do router e contratos compartilhados. Não há necessidade inicial de camadas de services, interfaces de repositório ou injeção de dependências.

## Modelo e contratos planejados

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | `string` | UUID gerado no servidor, imutável |
| `titulo` | `string` | Obrigatório, após remoção de espaços nas extremidades |
| `descricao` | `string`, opcional | Texto opcional |
| `dataCriacao` | `number` | Timestamp Unix em milissegundos, gerado no servidor, imutável |

O timestamp numérico passa por JSON sem um serializador adicional. A interface formata a data explicitamente para evitar diferenças de fuso na hidratação.

| Procedure | Tipo | Responsabilidade |
| --- | --- | --- |
| `tarefas.listar` | query | Retornar tarefas em ordem de criação, com desempate por ID |
| `tarefas.obter` | query | Buscar uma tarefa para a edição |
| `tarefas.criar` | mutation | Validar a entrada, gerar ID e data e guardar a tarefa |
| `tarefas.atualizar` | mutation | Receber ID, título e descrição e substituir os campos editáveis |
| `tarefas.deletar` | mutation | Remover a tarefa pelo ID |

`obter`, `atualizar` e `deletar` retornam `NOT_FOUND` se o ID não existir. Entradas inválidas retornam `BAD_REQUEST`. O cliente mostra mensagens compreensíveis e bloqueia envios repetidos enquanto uma operação está pendente.

## Fluxo de renderização e atualização

1. A página inicial executa a consulta tRPC diretamente no servidor, via caller. A renderização será dinâmica para que o build não congele a lista.
2. O resultado inicial é entregue ao componente cliente, permitindo que o HTML já contenha as tarefas.
3. No navegador, o cliente tRPC usa `/api/trpc` para consultas e mutações.
4. Após uma mutação bem-sucedida, a consulta é invalidada para buscar a lista atual. Criação e edição retornam à listagem com feedback de sucesso.
5. Falhas preservam o formulário ou a lista atual e apresentam uma mensagem. Listagem vazia e carregamento têm estados próprios.

## Limites do armazenamento

Os dados desaparecem ao reiniciar o processo. Instâncias diferentes não compartilham memória: a demonstração deve rodar em um único processo Node.js. Durante o desenvolvimento, o armazenamento poderá usar uma referência em `globalThis` para suportar recargas de módulos no mesmo processo. Isso não oferece persistência nem compartilhamento entre processos.

Não há autenticação: todas as tarefas pertencem à lista compartilhada do desafio. Banco de dados e contas de usuário ficam fora do escopo.

## Plano de branches

Cada linha é um item independente. As branches seguintes partem da etapa anterior consolidada, preservando suas dependências; a integração será feita quando solicitada.

| Branch | Entrega |
| --- | --- |
| `codex/00-arquitetura` | Regras de colaboração e arquitetura documentada |
| `codex/01-base-next` | Projeto Next.js 15, TypeScript, lint e página inicial mínima |
| `codex/02-integracao-trpc` | Rota HTTP, router mínimo e providers, com verificação de comunicação |
| `codex/03-crud-tarefas` | Modelo, armazenamento, procedures e testes de validação e erros |
| `codex/04-listagem-ssr` | Listagem dinâmica renderizada no servidor e estado vazio |
| `codex/05-exclusao` | Exclusão pela lista, carregamento e feedback |
| `codex/06-criacao` | Formulário, validação e criação com feedback |
| `codex/07-edicao` | Reutilização do formulário e tratamento de tarefa inexistente |
| `codex/08-infinite-scroll` | Bônus: paginação por cursor e carregamento incremental |
| `codex/09-documentacao` | Instruções finais de execução e revisão dos fluxos |

Para o bônus, `listar` ganhará paginação por cursor com ordem estável. A primeira página continuará sendo carregada no servidor. Um `IntersectionObserver` solicitará a página seguinte, respeitando estados de carregamento e fim da lista; um botão permitirá tentar novamente após falhas.

## Verificação por etapa

A base terá verificação de tipos, lint e build. O CRUD terá testes para título vazio, criação, atualização, exclusão e IDs inexistentes. Os fluxos da interface serão verificados conforme forem implementados, incluindo erros e SSR. Os comandos de instalação e execução serão documentados junto com a base executável.

## Referências

- [Next.js 15](https://nextjs.org/blog/next-15)
- [tRPC com Next.js App Router](https://trpc.io/docs/client/nextjs/app-router-setup)
- [Integração tRPC com React Query](https://trpc.io/docs/client/react/setup)
