# Uryu Imóveis — análise do site e plano para o Google

Análise em 15/10/2026. Evidências técnicas: `reports/site-audit-evidence.json`. O diagnóstico do domínio público e o material de apresentação são diferentes: os exemplos fictícios ficam na API de prévia; o domínio público ainda tem zero imóveis reais.

O site já funciona como apresentação institucional e canal de WhatsApp. Para captar visitas pelas buscas de imóveis, falta principalmente um catálogo real e uma estrutura de páginas que o Google consiga descobrir, renderizar e compreender com consistência. Uma página publicada não é garantia de indexação ou posição.

**O que já está funcionando**

- Domínio principal e `www` respondem por HTTPS. Backend e PostgreSQL de produção estão separados da prévia.
- Há catálogo, filtros, ficha de imóvel, galeria e painel com sessão limitada e controle de upload. As notas privadas ficam fora das respostas públicas.
- O login individual `contato@uryuimoveis.com.br` foi criado para a proprietária, sem substituir o acesso técnico existente.
- A marca d’água é gravada antes de salvar cada nova imagem. O sistema não oferece upload público de originais sem marca. Links externos não podem substituir o processamento do painel.
- Os CTAs de atendimento usam o WhatsApp (11) 97050-8331. O painel tem `noindex` e autenticação própria.
- O vídeo do projeto tem aproximadamente 2,24 MB, com avanço vinculado ao scroll e tratamento de movimento reduzido. Isso é uma base favorável, mas não equivale a uma medição de desempenho em celulares reais.

**Prioridades para a próxima revisão**

| Ordem | Entrega proposta | Evidência atual e resultado esperado |
|---|---|---|
| 1 — antes da divulgação | Cadastrar ofertas reais autorizadas | Produção tem zero ofertas. Os 12 anúncios de apresentação são fictícios e não devem ser usados como disponibilidade comercial. |
| 2 — Google técnico | Corrigir `robots.txt` e `sitemap.xml` | Ambos devolvem HTTP 200 com o HTML da home (50.912 bytes, `text/html`), em vez de texto de robots e XML de sitemap. O status 200 sozinho mascara a falha. |
| 3 — Google técnico | Entregar fichas com conteúdo e metadados no HTML inicial | A ficha atual busca o imóvel por JavaScript e recebe uma página-base genérica. Preferir renderização no servidor ou pré-renderização com atualização ao publicar/arquivar um imóvel. |
| 4 — URLs e duplicidade | Definir domínio preferido e canonical | Apex e `www` devolvem 200; a home não tem canonical. Redirecionar a variante secundária e manter canonical coerente. Não canonicalizar fichas diferentes para a home. |
| 5 — status corretos | Retornar 404/410 nas fichas inexistentes ou retiradas, conforme o caso | `/imovel?id=inexistente` responde HTTP 200. A API sabe que o item não existe, mas o status da página não acompanha isso: há risco de soft 404. |
| 6 — medição e descoberta | Verificar propriedade no Search Console e enviar sitemap válido | Não foi acessado o Search Console; não é possível afirmar que inexiste uma propriedade ou que o domínio está ou não indexado. Inspecionar home e fichas reais com a conta autorizada. |
| 7 — SEO local | Revisar e verificar o Perfil da Empresa no Google | Confirmar nome, endereço, telefone, horário, categoria, site e área de atendimento reais. Solicitar avaliações genuínas. Não foi acessada a administração desse perfil. |
| 8 — confiança e conteúdo | Confirmar dados institucionais e atuação | Não encontrei CRECI, política de privacidade nem horários no HTML. Confirmar razão social, responsável, registro profissional, contatos e cidades atendidas antes de publicá-los. |
| 9 — desempenho | Medir e corrigir carregamento móvel | Tailwind roda pelo CDN em tempo de execução e há scripts de animação externos. Compilar CSS, revisar carregamento de JS, imagens responsivas e estratégia do vídeo. Não há pontuação Lighthouse ou dados reais medidos nesta análise. |
| 10 — operação | Backups externos, restauração e monitoramento | Foram criados backups locais antes das alterações. Não foi comprovada rotina externa nem restauração. A VPS estava com 78% do disco ocupado; acompanhar crescimento de mídia e backups. |

**Como preparar as páginas para as buscas**

Cada imóvel real deve ter uma URL estável, título específico, descrição própria, fotos reais, preço, finalidade, tipo, bairro, cidade, área e especificações consistentes. Um identificador em query string não impede indexação por si só; URLs descritivas ajudam leitura e manutenção. O essencial é conteúdo acessível, links rastreáveis e status corretos.

Hoje `#comprar` e `#alugar` são seções da mesma página. Para trabalhar buscas como “kitnet para alugar em Osasco” ou “ponto comercial em Osasco”, criar páginas úteis com ofertas reais e conteúdo específico. Não criar páginas em massa para cidades sem atuação ou catálogo. O texto da home pode destacar Osasco e as regiões realmente atendidas depois da confirmação da empresa.

Adicionar metadados por página: title, description, canonical e Open Graph para compartilhamento no WhatsApp. A home tem um título e uma descrição genéricos; não encontrei Open Graph nem JSON-LD no HTML auditado. Dados estruturados de empresa, como um tipo compatível com `LocalBusiness`, devem corresponder aos dados visíveis e verificados. Não há promessa de resultado enriquecido de imóvel por simplesmente adicionar schema.

Os idiomas atuais usam a mesma URL e preferência local no navegador. Se inglês e espanhol forem uma prioridade comercial real, planejar URLs e conteúdo próprios com hreflang; caso contrário, priorizar o português completo. A nova seção informativa foi preparada em PT/EN/ES, mas textos dos anúncios são conteúdo cadastrado e não tradução automática.

O sitemap deve listar somente URLs canônicas, públicas, válidas e com conteúdo real. Atualizar sua lista ao publicar ou retirar imóveis. A prévia de apresentação contém `noindex` e não deve ser enviada ao Google. `robots.txt` não é mecanismo de segurança, nem substitui autenticação de painel.

**Melhorias no uso do site**

- Separar área do terreno e área construída; na ficha de terreno, “área” representa o lote. Ajustar os detalhes para não mostrar “0 quartos” em galpões, lojas e terrenos.
- Manter preços, condomínio e periodicidade do IPTU explícitos. Em imóveis comerciais, confirmar licenças, zoneamento e condições reais com responsáveis; não apresentar cessão de negócio como simples locação de imóvel.
- Usar de seis a doze fotos documentais nas ofertas reais, cobrindo fachada, ambientes, circulação e pontos relevantes. Os exemplos têm duas imagens geradas apenas para revisar o funcionamento da galeria e a apresentação.
- Acrescentar ampliação acessível da galeria, navegação por teclado e testes em celular. Não bloquear menu de contexto ou seleção como medida contra cópia: isso prejudica o uso e não protege a fotografia.
- Preservar o vídeo por scroll, com fallback estático e opção de movimento reduzido. Medir LCP, INP e CLS antes de decidir por mais animações.
- Avaliar busca por código/palavra-chave, favoritos e compartilhamento da ficha depois de consolidar filtros, cadastro e qualidade dos dados.
- Adicionar troca/recuperação de senha e histórico das alterações em uma próxima etapa. A conta individual atual pode ser desativada administrativamente; suas sessões deixam de ser aceitas.

**Conteúdo e conversão**

“Seu próximo endereço começa aqui” mantém a identidade, mas não explica sozinho a atuação local. Abaixo dele, vale explicitar compra, venda, locação e administração nas regiões confirmadas. Diferenciais devem ser comprováveis: evitar promessas de venda rápida, valorização garantida ou atendimento jurídico que a empresa não tenha organizado.

A seção sobre doação em vida apresenta organização antecipada, possibilidade de usufruto e clareza familiar, com CTA para o WhatsApp. O conteúdo explica limites, custos e necessidade de avaliação individual. Não promete economia de tributos, blindagem patrimonial nem eliminação geral de inventário. Recomenda-se revisão do texto pelo profissional jurídico que atenderá esses casos antes de promover a seção ao domínio público. A imobiliária não é apresentada como substituta de advogado, tabelião ou contador.

O endereço `contato@uryuimoveis.com.br` já é um login do painel, mas isso não significa que receba mensagens. Contratar a caixa postal se a empresa precisa receber e responder e-mails; Resend é uma opção para fluxos de envio da aplicação e não equivale, por si só, a uma caixa postal de uso diário. Confirmar provedor e configurar MX/SPF/DKIM/DMARC de acordo com ele antes de divulgar o endereço como canal ativo.

**Sequência recomendada depois da apresentação**

1. Aprovar visual, categorias, marca d’água e texto de doação na prévia; arquivar os exemplos após o ciclo de revisão.
2. Confirmar dados institucionais e captar/cadastrar as primeiras ofertas reais com fotos autorizadas.
3. Corrigir sitemap/robots, canonical/redirecionamento e páginas de imóveis com metadados e status reais.
4. Verificar Search Console e Perfil da Empresa; enviar sitemap e inspecionar as páginas públicas reais.
5. Medir desempenho móvel e conversões de WhatsApp com uma política de privacidade adequada ao tratamento de dados efetivamente usado.

**Fontes consultadas**

- [Google: processamento de JavaScript e vantagens de renderização no servidor](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
- [Google: descoberta por sitemap, sem garantia de indexação](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview).
- [Google: consolidação de URLs duplicadas](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
- [Google: Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals).
- [Google: presença e classificação local](https://support.google.com/business/answer/7091).
- [Google: dados estruturados de empresas locais](https://developers.google.com/search/docs/appearance/structured-data/local-business).
- [Código Civil: doação, direitos dos herdeiros e usufruto](https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm).
- [Fazenda de SP: doação com reserva de usufruto e ITCMD](https://portal.fazenda.sp.gov.br/servicos/itcmd/Paginas/Doa%C3%A7%C3%A3o-com-reserva-de-usufruto.aspx).

Limites: não houve acesso a Search Console, Perfil da Empresa, Analytics ou métricas de campo. Resultados de busca isolados não confirmam ausência de indexação. Este é um diagnóstico de evidências públicas e do código, não uma promessa de posicionamento ou uma análise jurídica individual.
