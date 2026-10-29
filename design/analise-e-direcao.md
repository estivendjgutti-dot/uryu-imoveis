# Uryu Imóveis — análise e direção

Protótipo: https://uryu-imoveissite.vercel.app/
Data: 2026-10-06
Status: análise do protótipo público; código fonte ainda não disponível na pasta.

## Marca
Proposta em design/uryu-logo-conceito.png: kanji 家 (casa/lar), nome Uryu Imóveis, carvão, marfim e oliva. Conceito raster; finalizar em vetor com revisão de traços e legibilidade antes de aplicar. O kanji representa casa, não traduz o nome Uryu.
Fonte: https://www.kanjipedia.jp/kanji/0000675300
Aplicação: marca horizontal compacta, sem cartão claro volumoso; versão clara sobre vídeo e escura sobre fundos claros.

## Achados
- A abertura tem identidade visual consistente, mas linguagem muito abstrata para busca de imóveis.
- Copy mistura exclusividade/alto padrão com compra, locação, comercial e terrenos. Confirmar posicionamento com estoque real.
- Links de categorias e ver todo o portfólio têm destino #. Conhecer leva ao contato geral, sem ficha individual.
- Busca reúne muitos controles; valor não apresenta faixas na inspeção. Priorizar finalidade, localização e preço; demais em filtros adicionais.
- Listagem precisa apresentar área, quartos, vagas, finalidade, preço e código do imóvel.
- Vídeo de aproximadamente 10 s aparece pausado. Navegação até #comprar alterou o tempo do vídeo exibido para 2,43 s; há mecanismo de navegação/scroll associado ao vídeo, mas fluidez contínua e comportamento móvel ainda precisam de validação.
- Confirmar veracidade de desde 2009, fotografia profissional e envio mensal antes de manter promessas.

## Copy proposta
Abertura: Seu próximo endereço começa aqui.
Apoio: Encontre imóveis para comprar ou alugar com orientação próxima em cada etapa da negociação.
Ação principal: Encontrar meu imóvel.
Ação secundária: Falar com um consultor.
Destaques: Imóveis em destaque.
Empresa: Clareza em cada etapa. Cuidado em cada escolha.
Anuncie: Seu imóvel, apresentado a quem procura.
Apoio anuncie: Conte com a Uryu para avaliar, divulgar e acompanhar a negociação do seu imóvel.
Fechamento: Vamos encontrar seu próximo endereço?
A redação final deve refletir região atendida e serviços confirmados.

## Estrutura proposta
1. Cabeçalho compacto: Comprar, Alugar, Anunciar, Sobre, Contato.
2. Abertura com vídeo controlado pelo scroll e busca simplificada.
3. Catálogo e destaques com filtros e fichas individuais.
4. Apresentação da empresa.
5. Anunciar imóvel.
6. Contato e rodapé.
Remover os três cartões solicitados: Consultoria de Interiores, Tour Virtual em 3D e Agenda VIP de Visitas.

## Cadastro e banco
Definir provedor após inspecionar o código. Modelar imóveis, mídias ordenadas e características; usuários administrativos autenticados. Imóvel inclui código, slug, título, descrição, tipo, finalidade, preço, taxas, área, quartos, banheiros, vagas, cidade, bairro, status e destaque. Separar endereço privado da localização pública. Estados: rascunho, publicado, reservado, vendido/alugado e arquivado. Visitantes consultam apenas publicados; administradores cadastram e editam. Fotos em armazenamento de arquivos, referências no banco. Cadastro precisa criar, editar, ordenar imagens e retirar anúncios do catálogo.

## Publicação
Git local já inicializado, sem commits ou remoto. Conectar repositório depois de receber o código.
Mudanças em branch → deploy Preview na Vercel → revisão e aprovação explícita do usuário → produção/domínio.
Não conectar o domínio à branch que recebe atualizações automaticamente. DNS do Registro.br será tratado depois. Manter dados de prévia isolados para que alterações de cadastro em revisão não apareçam em produção.

## Próximo requisito
Receber repositório ou pasta com código fonte e acesso ao projeto Vercel. O URL público permite análise, mas não editar/deployar o projeto existente.

## Atualização — código localizado e marca v2
Origem: C:\Clientes\Imoveis\uryu-site. Arquivos copiados para o workspace deste chat.
Site estático em index.html, catálogo fixo em imoveis.js; sem banco conectado identificado.
Controle de vídeo por scroll já implementado com renderização em canvas e extração de frames.
Logo v2: casa completa com traços inspirados em caligrafia japonesa, sem reproduzir literalmente um kanji. Proposta em uryu-logo-casa-caligrafica-v2.png, ainda não aplicada ao site.
