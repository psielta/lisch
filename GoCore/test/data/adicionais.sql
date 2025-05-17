DO $$
DECLARE
  -- Variáveis para IDs das categorias
  id_cat1 uuid;
  id_cat2 uuid;
  id_cat3 uuid;
  -- Variáveis para IDs dos grupos de adicionais
  id_lanche_add1 uuid;
  id_lanche_add2 uuid;
  id_lanche_add3 uuid;
  id_pizza_add1 uuid;
  id_pizza_add2 uuid;
  id_bebida_add1 uuid;
  -- Variáveis para id_culinaria e id_tenant (ajustar conforme necessário)
  v_id_culinaria integer := 1; -- Ajustar para um id_culinaria válido da tabela culinarias
  v_id_tenant uuid := gen_random_uuid(); -- Ajustar para um id_tenant válido da tabela tenants
BEGIN
  -- 1. INSERIR CATEGORIAS ---------------------------------------------
  -- NOTA: Substituir v_id_culinaria e v_id_tenant por valores reais
  -- id_culinaria deve existir na tabela culinarias
  -- id_tenant deve existir na tabela tenants
  INSERT INTO categorias (
    id, id_tenant, seq_id, id_culinaria, nome, inicio, fim, ativo,
    created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      v_id_tenant,
      nextval('categorias_seq_id_seq'),
      v_id_culinaria,
      'Lanches',
      CURRENT_DATE + '00:00:00'::time,
      CURRENT_DATE + '23:59:59'::time,
      1,
      now(),
      now()
    )
  RETURNING id INTO id_cat1;

  INSERT INTO categorias (
    id, id_tenant, seq_id, id_culinaria, nome, inicio, fim, ativo,
    created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      v_id_tenant,
      nextval('categorias_seq_id_seq'),
      v_id_culinaria,
      'Pizzas',
      CURRENT_DATE + '00:00:00'::time,
      CURRENT_DATE + '23:59:59'::time,
      1,
      now(),
      now()
    )
  RETURNING id INTO id_cat2;

  INSERT INTO categorias (
    id, id_tenant, seq_id, id_culinaria, nome, inicio, fim, ativo,
    created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      v_id_tenant,
      nextval('categorias_seq_id_seq'),
      v_id_culinaria,
      'Bebidas Especiais',
      CURRENT_DATE + '00:00:00'::time,
      CURRENT_DATE + '23:59:59'::time,
      1,
      now(),
      now()
    )
  RETURNING id INTO id_cat3;

  -- 2. INSERIR CATEGORIA_ADICIONAIS -----------------------------------

  -- Categoria 1: Lanches
  INSERT INTO categoria_adicionais (
    id, seq_id, id_categoria, codigo_tipo, nome, selecao,
    minimo, limite, status, created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      nextval('categoria_adicionais_seq_id_seq'),
      id_cat1,
      'MOLHO',
      'Molho Especial',
      'U',
      NULL,
      NULL,
      1,
      now(),
      now()
    )
  RETURNING id INTO id_lanche_add1;

  INSERT INTO categoria_adicionais (
    id, seq_id, id_categoria, codigo_tipo, nome, selecao,
    minimo, limite, status, created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      nextval('categoria_adicionais_seq_id_seq'),
      id_cat1,
      'QUEIJO',
      'Queijo Extra',
      'M',
      NULL,
      3,
      1,
      now(),
      now()
    )
  RETURNING id INTO id_lanche_add2;

  INSERT INTO categoria_adicionais (
    id, seq_id, id_categoria, codigo_tipo, nome, selecao,
    minimo, limite, status, created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      nextval('categoria_adicionais_seq_id_seq'),
      id_cat1,
      'ACRES',
      'Acréscimos',
      'Q',
      0,
      5,
      1,
      now(),
      now()
    )
  RETURNING id INTO id_lanche_add3;

  -- Categoria 2: Pizzas
  INSERT INTO categoria_adicionais (
    id, seq_id, id_categoria, codigo_tipo, nome, selecao,
    minimo, limite, status, created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      nextval('categoria_adicionais_seq_id_seq'),
      id_cat2,
      'BORDA',
      'Tipo de Borda',
      'U',
      NULL,
      NULL,
      1,
      now(),
      now()
    )
  RETURNING id INTO id_pizza_add1;

  INSERT INTO categoria_adicionais (
    id, seq_id, id_categoria, codigo_tipo, nome, selecao,
    minimo, limite, status, created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      nextval('categoria_adicionais_seq_id_seq'),
      id_cat2,
      'ING',
      'Ingredientes',
      'M',
      NULL,
      4,
      1,
      now(),
      now()
    )
  RETURNING id INTO id_pizza_add2;

  -- Categoria 3: Bebidas
  INSERT INTO categoria_adicionais (
    id, seq_id, id_categoria, codigo_tipo, nome, selecao,
    minimo, limite, status, created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      nextval('categoria_adicionais_seq_id_seq'),
      id_cat3,
      'GELO',
      'Gelo Extra',
      'M',
      NULL,
      2,
      1,
      now(),
      now()
    )
  RETURNING id INTO id_bebida_add1;

  -- 3. INSERIR CATEGORIA_ADICIONAL_OPCOES -----------------------------

  -- Opções para “Molho Especial” (lanche_add1)
  INSERT INTO categoria_adicional_opcoes (
    id, seq_id, id_categoria_adicional, codigo, nome, valor,
    status, created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_lanche_add1,
      'KETCH',
      'Ketchup',
      0.50,
      1,
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_lanche_add1,
      'MUST',
      'Mostarda',
      0.50,
      1,
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_lanche_add1,
      'MAY',
      'Maionese',
      0.60,
      1,
      now(),
      now()
    );

  -- Opções para “Queijo Extra” (lanche_add2)
  INSERT INTO categoria_adicional_opcoes (
    id, seq_id, id_categoria_adicional, codigo, nome, valor,
    status, created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_lanche_add2,
      'CHDR',
      'Cheddar',
      2.00,
      1,
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_lanche_add2,
      'MUSS',
      'Mussarela',
      1.50,
      1,
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_lanche_add2,
      'PRMS',
      'Parmesão',
      2.50,
      1,
      now(),
      now()
    );

  -- Opções para “Acréscimos” (lanche_add3)
  INSERT INTO categoria_adicional_opcoes (
    id, seq_id, id_categoria_adicional, codigo, nome, valor,
    status, created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_lanche_add3,
      'BACN',
      'Bacon',
      3.00,
      1,
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_lanche_add3,
      'OVO',
      'Ovo',
      2.00,
      1,
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_lanche_add3,
      'SALC',
      'Salsicha',
      2.50,
      1,
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_lanche_add3,
      'PAT',
      'Páprica',
      0.80,
      1,
      now(),
      now()
    );

  -- Opções para “Tipo de Borda” (pizza_add1)
  INSERT INTO categoria_adicional_opcoes (
    id, seq_id, id_categoria_adicional, codigo, nome, valor,
    status, created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_pizza_add1,
      'CHDR',
      'Cheddar',
      5.00,
      1,
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_pizza_add1,
      'CREM',
      'Catupiry',
      6.50,
      1,
      now(),
      now()
    );

  -- Opções para “Ingredientes” (pizza_add2)
  INSERT INTO categoria_adicional_opcoes (
    id, seq_id, id_categoria_adicional, codigo, nome, valor,
    status, created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_pizza_add2,
      'MILI',
      'Milho',
      3.20,
      1,
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_pizza_add2,
      'BROC',
      'Brócolis',
      4.00,
      1,
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_pizza_add2,
      'ALHO',
      'Alho Frito',
      2.50,
      1,
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_pizza_add2,
      'MANJ',
      'Manjericão',
      2.00,
      1,
      now(),
      now()
    );

  -- Opções para “Gelo Extra” (bebida_add1)
  INSERT INTO categoria_adicional_opcoes (
    id, seq_id, id_categoria_adicional, codigo, nome, valor,
    status, created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_bebida_add1,
      'GEL1',
      '1 cubo',
      0.00,
      1,
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      nextval('categoria_adicional_opcoes_seq_id_seq'),
      id_bebida_add1,
      'GEL2',
      '2 cubos',
      0.00,
      1,
      now(),
      now()
    );
END $$;