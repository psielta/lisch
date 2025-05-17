-- Insert 500 categories
INSERT INTO public.categorias (
    id_tenant, id_culinaria, nome, descricao, inicio, fim, ativo, opcao_meia, ordem,
    disponivel_domingo, disponivel_segunda, disponivel_terca, disponivel_quarta,
    disponivel_quinta, disponivel_sexta, disponivel_sabado
)
SELECT
    '321d18ff-7ead-431e-83f2-ab66ac210bb4',
    1,
    'Categoria ' || g || ' - ' || (ARRAY['Pizzas', 'Hambúrgueres', 'Sushi', 'Saladas', 'Bebidas', 'Sobremesas', 'Massas', 'Petiscos', 'Sanduíches', 'Veganos'])[floor(random() * 10 + 1)],
    'Descrição da categoria ' || g || ': ' || (ARRAY['Deliciosa', 'Saborosa', 'Fresca', 'Artesanal', 'Premium', 'Caseira', 'Gourmet', 'Rápida', 'Saudável', 'Exótica'])[floor(random() * 10 + 1)],
    '2025-01-01 00:00:00'::timestamp,
    '2025-12-31 23:59:59'::timestamp,
    (random() * 1)::smallint, -- 0 or 1
    (ARRAY['', 'S', 'N'])[floor(random() * 3 + 1)],
    g,
    (random() * 1)::smallint,
    (random() * 1)::smallint,
    (random() * 1)::smallint,
    (random() * 1)::smallint,
    (random() * 1)::smallint,
    (random() * 1)::smallint,
    (random() * 1)::smallint
FROM generate_series(1, 500) g;

-- Insert 2-4 options per category (approx. 1000-2000 options)
INSERT INTO public.categoria_opcoes (
    id_categoria, nome, status
)
SELECT
    c.id,
    (ARRAY['Pequena', 'Média', 'Grande', 'Família', 'Individual', 'Dupla', 'Combo', 'Light'])[floor(random() * 8 + 1)] || ' ' || g2,
    (random() * 1)::smallint
FROM public.categorias c
CROSS JOIN generate_series(1, (2 + floor(random() * 3)::int)) g2; -- 2 to 4 options per category

-- Insert 10,000 products distributed across categories
INSERT INTO public.produtos (
    id_categoria, nome, descricao, codigo_externo, sku, permite_observacao, ordem, imagem_url, status
)
SELECT
    c.id,
    (ARRAY['Pizza', 'Hambúrguer', 'Sushi', 'Salada', 'Refrigerante', 'Sobremesa', 'Massa', 'Petisco', 'Sanduíche', 'Prato Vegano'])[floor(random() * 10 + 1)] || ' ' || g || ' - ' || (ARRAY['Marguerita', 'Cheddar', 'Califórnia', 'Caesar', 'Cola', 'Cheesecake', 'Carbonara', 'Batata Frita', 'Clube', 'Falafel'])[floor(random() * 10 + 1)],
    'Descrição do produto ' || g || ': ' || (ARRAY['Saboroso', 'Fresco', 'Crocante', 'Leve', 'Gelado', 'Doce', 'Cremoso', 'Apimentado', 'Grelhado', 'Natural'])[floor(random() * 10 + 1)],
    'EXT' || lpad(g::text, 6, '0'),
    'SKU' || lpad(g::text, 6, '0'),
    (random() > 0.2), -- 80% true
    g % 100,
    'https://example.com/images/produto_' || g || '.jpg',
    (random() * 1)::smallint
FROM generate_series(1, 10000) g
CROSS JOIN (SELECT id FROM public.categorias ORDER BY random() LIMIT 1) c; -- Random category assignment

-- Insert 1-3 price records per product (approx. 10,000-30,000 prices)
INSERT INTO public.produto_precos (
    id_produto, id_categoria_opcao, codigo_externo_opcao_preco, preco_base, preco_promocional, disponivel
)
SELECT DISTINCT ON (p.id, co.id)
    p.id,
    co.id,
    'PRECO' || lpad(g2::text, 6, '0'),
    (random() * 50 + 10)::numeric(10,2), -- Base price between 10.00 and 60.00
    CASE WHEN random() > 0.7 THEN (random() * 40 + 5)::numeric(10,2) END, -- Promotional price 30% of the time
    (random() * 1)::smallint
FROM public.produtos p
CROSS JOIN generate_series(1, (1 + floor(random() * 3)::int)) g2
JOIN public.categoria_opcoes co ON co.id_categoria = p.id_categoria
WHERE g2 <= (
    SELECT COUNT(*) 
    FROM public.categoria_opcoes co2 
    WHERE co2.id_categoria = p.id_categoria
) -- Limit to the number of available options
ORDER BY p.id, co.id, random();