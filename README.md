# Uryu Imóveis

Site em HTML/CSS/JavaScript, API Node.js e banco PostgreSQL para VPS. A arte da logo original foi mantida; propostas em `design/` não são aplicadas ao site.

## Executar a prévia local

Node.js 24:

```powershell
npm ci
npm run dev
```

Abra http://127.0.0.1:4287. Sem `PUBLIC_API_URL`, a prévia identifica claramente o catálogo demonstrativo do protótipo. O painel `/admin.html` não simula salvamento: exige API conectada.

## Banco e API na VPS

1. Copie o código para uma pasta exclusiva na VPS, como `/opt/uryu-preview`.
2. Copie `.env.example` para `.env` e configure os valores. A senha em `POSTGRES_PASSWORD` e `DATABASE_URL` deve ser a mesma; codifique caracteres especiais da senha no URL. Gere `SESSION_SECRET` com `openssl rand -hex 32`. Gere o hash administrativo com `npm run admin:password`, em terminal interativo. Nunca use valores de exemplo.
3. Use `docker compose --env-file .env -f deploy/compose.yaml up -d --build`. O PostgreSQL fica na rede interna, sem porta pública. A API escuta somente em `127.0.0.1:3001` na VPS.
4. Configure o proxy HTTPS com o exemplo `deploy/Caddyfile.example`, adaptando à configuração existente da VPS. Não substitua um proxy existente sem inspecioná-lo.
5. Configure `ALLOWED_ORIGINS` com o endereço exato da prévia Vercel. Não use `*`. `TRUST_PROXY=1` pressupõe um único proxy confiável conectado à porta local.
6. Na Vercel, defina `PUBLIC_API_URL` em **Preview** apontando para a API HTTPS de prévia. Esta é uma URL pública, não uma credencial. Reconstrua a prévia.
7. Entre em `/admin.html`. Cadastre as fotos reais e imóveis. A primeira foto é a capa; o anúncio só pode ser publicado com descrição e foto. Notas internas ficam fora da API pública; fotos sem vínculo com imóvel publicado ficam restritas ao painel.

O banco inicia vazio: os imóveis demonstrativos não são importados automaticamente. O login administrativo usa hash scrypt, sessão de até oito horas e limite de tentativas; o token fica apenas em memória no navegador. Recarregar o painel requer novo login. Há um administrador por instalação.

## Aprovação e produção

- Trabalhar em branch `codex/...`. Cada atualização deve gerar um deployment **Preview** com URL própria na Vercel. Nunca executar `vercel --prod` sem aprovação explícita da versão pelo usuário.
- `vercel.json` desativa deploy automático da branch `main`. A publicação em produção é manual e exige a aprovação explícita da versão pelo usuário. A proteção de branch no GitHub pode complementar esse fluxo; não ativar auto merge.
- Após aprovação, criar instalação de produção separada: outro diretório, projeto Docker Compose, banco `uryu_production`, volumes de fotos, segredo de sessão, porta local e hostname de API. Não apontar produção para o banco de prévia. O Compose fornecido é exclusivo de prévia.
- Definir `PUBLIC_API_URL` de produção para a API de produção. O build bloqueia produção com catálogo demonstrativo.
- Dados de imóveis são específicos de cada ambiente: publicação no painel de prévia não publica no domínio. A migração de dados para produção requer revisão e aprovação, além da aprovação do código.
- Associar o domínio à produção na Vercel depois de aprovado. DNS do Registro.br permanece pendente de instruções do usuário.

## Manutenção

Faça backup diário do PostgreSQL com `pg_dump` e do volume de fotos. Guarde fora da VPS e confirme a restauração antes de operar em produção. Evite `docker compose down -v`, pois remove os volumes. Arquivar no painel retira o imóvel do catálogo sem apagar o registro. Fotos removidas do anúncio ficam armazenadas e privadas; a limpeza permanente é uma operação de manutenção separada.

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
