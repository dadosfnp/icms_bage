# ICMS em Bagé — publicação no Render

Versão independente e estática da página de Bagé. Não há banco de dados nem servidor próprio: o Render compila o projeto Vite e publica a pasta `dist` em sua CDN.

## Teste local

```bash
corepack enable
pnpm install
pnpm run dev
```

## Build local

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
```

## Publicação com `render.yaml`

1. Crie um repositório no GitHub, GitLab ou Bitbucket.
2. Coloque o conteúdo desta pasta na raiz do repositório.
3. No Render, escolha **New > Blueprint**.
4. Conecte o repositório e mantenha `render.yaml` como Blueprint Path.
5. Confirme a criação do serviço estático.

## Publicação manual no painel do Render

- Tipo: **Static Site**
- Build Command: `corepack enable && pnpm install --frozen-lockfile && pnpm run build`
- Publish Directory: `dist`
- Start Command: não se aplica; deixe o campo vazio.
- Variáveis de ambiente: nenhuma obrigatória.

Cada push na branch vinculada dispara uma nova publicação automaticamente.
