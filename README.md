# Gerenciador de tarefas

Desafio prático com Next.js 15, TypeScript e tRPC. A base, a integração tRPC e o CRUD em memória estão implementados. As páginas de tarefas serão adicionadas nas próximas etapas.

## Executar a base

Use Node.js 22.12+, 24.x ou 26+ e npm, conforme a compatibilidade do Vitest. O projeto foi verificado com Node.js 24.13.0 e npm 11.6.2.

```sh
npm ci
npm run dev
```

Abra [localhost:3000](http://localhost:3000). O comando de desenvolvimento usa Turbopack e recarrega a página ao alterar os arquivos.

Para verificar o projeto e executar a versão de produção:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

O `build` deve terminar antes do `start`. `npm ci` instala as versões registradas no `package-lock.json`. A base usa Next.js 15.5.29 e React/React DOM 19.3.1; o TypeScript está configurado em modo estrito.

## Testes

`npm test` executa o Vitest uma vez; `npm run test:watch` acompanha alterações durante o desenvolvimento. Os testes ficam junto dos módulos, com sufixo `.test.ts` ou `.test.tsx`.

A integração verifica o caller do servidor, a comunicação entre o cliente tipado e o adaptador HTTP e uma procedure inexistente, sem depender de um servidor de rede. A consulta `status` está disponível em `/api/trpc/status`.

Os testes unitários cobrem esquemas de entrada, armazenamento isolado, ordenação, cópias defensivas, operações CRUD e erros `BAD_REQUEST` e `NOT_FOUND`. Cada teste cria seu próprio armazenamento. ID e data de criação são preservados na edição.

## Arquivos da base

| Arquivo | Responsabilidade |
| --- | --- |
| `package.json` | Dependências, requisito de Node.js e scripts de desenvolvimento e verificação |
| `package-lock.json` | Versões exatas e integridade das dependências instaladas |
| `tsconfig.json` | Tipagem estrita, integração com Next.js e alias `@/*` para `src/*` |
| `next.config.ts` | Raiz explícita do build e do Turbopack, evitando interferência de lockfiles externos |
| `eslint.config.mjs` | Regras de React, hooks, Next.js e TypeScript, adaptadas ao ESLint 9 |
| `.gitignore` | Exclusão de dependências, arquivos gerados, caches e arquivos locais de ambiente |
| `src/app/layout.tsx` | HTML compartilhado, idioma, metadados e importação dos estilos |
| `src/app/page.tsx` | Página inicial da rota `/`, como componente de servidor |
| `src/app/globals.css` | Estilos básicos com fonte local e largura adaptável |

O Next.js gera `next-env.d.ts` e a pasta `.next/` durante seus comandos. Esses arquivos não são editados manualmente nem versionados. A configuração do Next.js fixa a raiz no diretório do projeto porque um lockfile em uma pasta superior pode causar detecção incorreta da raiz.

### Dependências e auditoria

O `package.json` aplica um override de PostCSS 8.5.32 para o Next.js, que originalmente fixa uma versão antiga. Essa atualização permanece na versão principal 8 e corrige os alertas de PostCSS relatados pelo npm, incluindo [leitura de arquivos por source maps](https://github.com/advisories/GHSA-6g55-p6wh-862q).

Na instalação desta etapa, `npm audit` ainda apontou 14 alertas moderados na cadeia de desenvolvimento do ESLint, originados em [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249). Não foi forçada uma mudança principal de dependência transitiva. O ESLint 9 também está fora de suporte; a configuração do Next.js 15 utilizada declara compatibilidade até essa versão. Essas limitações devem ser reavaliadas ao atualizar a base.

## Escolhas

- **Next.js 15 e App Router:** páginas renderizadas no servidor e componentes cliente para interações. O enunciado cita v15 e também versões recentes; adotamos a versão estável mais recente da linha 15 compatível com as dependências no momento da instalação.
- **TypeScript:** mantém os contratos entre servidor e navegador verificáveis durante o desenvolvimento.
- **tRPC:** expõe consultas e mutações com tipos inferidos do backend, sem duplicar contratos no frontend.
- **TanStack Query:** gerencia consultas, carregamento, erros e atualização da lista após mutações, com a integração do tRPC.
- **Zod:** valida entradas no servidor, inclusive títulos que contenham apenas espaços. A validação do formulário oferece feedback imediato, mas não substitui a validação do backend.
- **Memória do processo:** um `Map` guarda as tarefas, sem banco, ORM ou serviço externo.
- **CSS simples:** atende ao desafio sem acrescentar uma biblioteca de interface.

## Estrutura planejada

As pastas e arquivos abaixo serão criados gradualmente, com explicação individual. `layout.tsx`, `page.tsx` e `globals.css` já existem na base.

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

## Verificação por etapa

A base dispõe de verificação de tipos, lint e build pelos scripts acima. O CRUD terá testes para título vazio, criação, atualização, exclusão e IDs inexistentes. Os fluxos da interface serão verificados conforme forem implementados, incluindo erros e SSR.

## Referências

- [Next.js 15](https://nextjs.org/blog/next-15)
- [tRPC com Next.js App Router](https://trpc.io/docs/client/nextjs/app-router-setup)
- [Integração tRPC com React Query](https://trpc.io/docs/client/react/setup)
