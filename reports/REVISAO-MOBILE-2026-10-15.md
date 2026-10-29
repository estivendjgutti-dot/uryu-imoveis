# Revisão final da experiência mobile — 15/10/2026

## Alterações concluídas na prévia

- Controles de idioma, menu, filtros, paginação e links dos cards com áreas de toque maiores.
- Atalho para explorar o catálogo na abertura, mantendo os contatos comerciais no WhatsApp.
- Filtros ativos visíveis, remoção individual e limpeza direta. Aplicar a busca no celular fecha os filtros avançados e leva aos resultados.
- Catálogo com dois imóveis por página no celular; destaques em trilhos horizontais com contador. Retorno da ficha preserva a busca e a página.
- Menu fecha com Escape e ao tocar fora; navegação por teclado inclui atalho para o catálogo.
- Correção do gesto de deslizar fotos para evitar abertura involuntária da ampliação. Fotos da galeria possuem identificação por posição.
- Uma única chamada para anunciar no encerramento, ligada ao menu, reduzindo repetição e altura da página.
- CSS compilado e minificado no build: cerca de 21 KB antes de compressão HTTP; removido o compilador Tailwind do navegador.
- Imagem da empresa convertida de PNG de 639.206 bytes para WebP de 29.222 bytes, com carregamento adiado e dimensões reservadas.
- Catálogo antigo de demonstração deixa de ser carregado nas páginas conectadas à API. Vídeo continua restrito às telas maiores, com alternativa estática no celular.

## Conferência

- Build local concluído e Vercel Preview compilada com sucesso.
- Oito testes existentes passaram: autenticação, validação, apresentação e processamento da marca d’água.
- Auditoria npm: zero vulnerabilidades reportadas nas dependências instaladas.
- Inspeção responsiva em 320, 390, 768 e 1280 px: sem transbordamento horizontal do documento; trilhos de imóveis rolam dentro do próprio componente.
- Busca por kitnet retornou um resultado; remoção do filtro retornou os 12 exemplos.
- Abertura da ficha, ampliação, troca de foto, fechamento e retorno ao catálogo com filtro preservado conferidos na prévia.
- Menu, paginação, cores mobile e aparência desktop inspecionados no navegador integrado.

Não foi atribuída nota Lighthouse nem medido desempenho em uma rede móvel física. A inspeção responsiva não substitui a conferência final em Safari no iPhone e Chrome no Android.

## Pendências para o lançamento comercial

O relatório `ANALISE-SITE-E-GOOGLE-2026-10-15.md` continua sendo a referência para SEO e operação. Os exemplos e as imagens de IA são somente para apresentação. Antes da publicação comercial, cadastrar ofertas reais, confirmar dados institucionais/CRECI e canal de e-mail e concluir robots/sitemap, canonical, páginas individuais indexáveis e Search Console/Perfil da Empresa. Revisar o conteúdo sobre doação com o profissional responsável. A publicação desta revisão no domínio principal depende da aprovação da prévia.
