# Uryu Imóveis

Site em HTML/CSS/JavaScript estático na Vercel, com banco, login e fotos no Supabase. A arte da logo original foi mantida; propostas em `design/` não são aplicadas ao site.

## Executar a prévia local

Node.js 24:

```powershell
npm ci
npm run dev
```

Abra http://127.0.0.1:4287. Sem `PUBLIC_SUPABASE_URL`, a prévia mostra o catálogo demonstrativo. O painel `/admin.html` não simula salvamento: exige o Supabase conectado.

## Banco no Supabase

Projeto Supabase `gzbhynwdrtyjatklipnj` (São Paulo). O esquema está em `supabase/schema.sql`: tabela `properties`, tabela `admins`, bucket público `fotos` e políticas RLS. Visitantes leem só anúncios publicados e nunca a coluna `private_notes`; só usuários em `admins` gravam.

1. Rode `supabase/schema.sql` no SQL Editor do projeto.
2. Crie o usuário em Authentication > Users (Auto Confirm) e insira o id dele em `public.admins`.
3. Defina na Vercel `PUBLIC_SUPABASE_URL` e `PUBLIC_SUPABASE_ANON_KEY` (a chave anon é pública por design; a segurança vem do RLS). Nunca use a `service_role` no site.

A marca d’água é aplicada no navegador (`photos.js`) antes do upload; o bucket nunca recebe a foto original.

## Aprovação e produção

- Trabalhar em branch `codex/...`. Cada atualização deve gerar um deployment **Preview** com URL própria na Vercel. Nunca executar `vercel --prod` sem aprovação explícita da versão pelo usuário.
- `vercel.json` desativa deploy automático da branch `main`. A publicação em produção é manual e exige a aprovação explícita da versão pelo usuário. A proteção de branch no GitHub pode complementar esse fluxo; não ativar auto merge.
- Após aprovação, criar instalação de produção separada: outro diretório, projeto Docker Compose, banco `uryu_production`, volumes de fotos, segredo de sessão, porta local e hostname de API. Não apontar produção para o banco de prévia. O Compose fornecido é exclusivo de prévia.
- Produção usa as variáveis `PUBLIC_SUPABASE_*` do ambiente Production na Vercel. O build bloqueia produção com catálogo demonstrativo.
- Dados de imóveis são específicos de cada ambiente: publicação no painel de prévia não publica no domínio. A migração de dados para produção requer revisão e aprovação, além da aprovação do código.
- Associar o domínio à produção na Vercel depois de aprovado. DNS do Registro.br permanece pendente de instruções do usuário.

## Manutenção

O plano gratuito do Supabase pausa projetos após 7 dias sem uso e não inclui backups automáticos; exporte o banco periodicamente pelo painel. Arquivar no painel retira o imóvel do catálogo sem apagar o registro. Fotos removidas do anúncio ficam armazenadas e privadas; a limpeza permanente é uma operação de manutenção separada.

## Validação

```powershell
npm test
npm run build
```

Os testes verificam autenticação, expiração de sessão, validação e exclusão de campos privados do payload. A conexão PostgreSQL, upload e CRUD precisam ser verificados com a instalação real ou ambiente Docker. A prévia visual não substitui essa validação.

## Arquivos

- `index.html`, `site.css`, `app.js`: site e catálogo.
- `imovel.html`, `imovel.js`: ficha individual e galeria.
- `admin.html`, `admin.js`: painel de cadastro.
- `server/`: API, autenticação, validação e schema PostgreSQL.
- `deploy/`: instalação isolada na VPS.
- `scripts/build.mjs`: gera apenas os arquivos públicos em `dist/`; segredos e backend não são publicados como arquivos estáticos.
