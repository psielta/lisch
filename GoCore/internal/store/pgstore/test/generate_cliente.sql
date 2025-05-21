DO $$
DECLARE
    tenant_uuid UUID; -- <<<< SUBSTITUA PELO SEU TENANT_ID
    i INTEGER;
    tipo_pessoa_val CHAR(1);
    cpf_val VARCHAR(11);
    cnpj_val VARCHAR(14);
    nome_val TEXT;
    fantasia_val TEXT;
    email_val TEXT;
    telefone_val VARCHAR(30);
    celular_val VARCHAR(30);
    cep_val VARCHAR(8);
    logradouro_val TEXT;
    numero_val VARCHAR(10);
    complemento_val TEXT;
    bairro_val TEXT;
    cidade_val TEXT;
    uf_val CHAR(2);
    data_nascimento_val DATE;
    rg_val VARCHAR(20);
    ie_val VARCHAR(20);
    im_val VARCHAR(20);
    
    -- Arrays para gerar dados variados
    nomes_masculinos TEXT[] := ARRAY[
        'João Silva', 'Carlos Santos', 'José Oliveira', 'Antonio Souza', 'Francisco Lima',
        'Paulo Costa', 'Pedro Ferreira', 'Luis Rodrigues', 'Marcos Almeida', 'Rafael Barbosa',
        'Daniel Gomes', 'Bruno Ribeiro', 'Eduardo Martins', 'Roberto Carvalho', 'Ricardo Pereira',
        'André Nascimento', 'Felipe Dias', 'Fernando Castro', 'Gabriel Rocha', 'Gustavo Moreira'
    ];
    
    nomes_femininos TEXT[] := ARRAY[
        'Maria Silva', 'Ana Santos', 'Francisca Oliveira', 'Antonia Souza', 'Adriana Lima',
        'Juliana Costa', 'Patricia Ferreira', 'Marcia Rodrigues', 'Denise Almeida', 'Leticia Barbosa',
        'Camila Gomes', 'Fernanda Ribeiro', 'Aline Martins', 'Roberta Carvalho', 'Carla Pereira',
        'Claudia Nascimento', 'Monica Dias', 'Sandra Castro', 'Gabriela Rocha', 'Cristina Moreira'
    ];
    
    empresas TEXT[] := ARRAY[
        'Comercial Nova Era Ltda', 'Distribuidora Central do Brasil', 'Indústria Moderna S/A',
        'Supermercado Bom Preço', 'Farmácia Saúde Total', 'Padaria e Confeitaria Delicias',
        'Auto Peças Rápido', 'Construtora Horizonte', 'Transportadora Expresso',
        'Restaurante Sabor Mineiro', 'Clínica Médica Vida', 'Escola Educação Futuro',
        'Loja de Roupas Fashion', 'Oficina Mecânica Expert', 'Imobiliária Casa Própria',
        'Academia Corpo e Mente', 'Petshop Amigo Fiel', 'Laboratório Exames Precisos',
        'Gráfica Digital Print', 'Consultoria Empresarial Pro'
    ];
    
    cidades TEXT[] := ARRAY[
        'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Brasília',
        'Fortaleza', 'Curitiba', 'Recife', 'Porto Alegre', 'Manaus',
        'Belém', 'Goiânia', 'Guarulhos', 'Campinas', 'São Luís',
        'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 'Teresina'
    ];
    
    ufs CHAR(2)[] := ARRAY[
        'SP', 'RJ', 'MG', 'BA', 'DF',
        'CE', 'PR', 'PE', 'RS', 'AM',
        'PA', 'GO', 'SP', 'SP', 'MA',
        'RJ', 'AL', 'RJ', 'RN', 'PI'
    ];
    
    bairros TEXT[] := ARRAY[
        'Centro', 'Copacabana', 'Ipanema', 'Vila Madalena', 'Jardins',
        'Boa Viagem', 'Meireles', 'Batel', 'Moinhos de Vento', 'Savassi',
        'Leblon', 'Botafogo', 'Pinheiros', 'Moema', 'Vila Olímpia'
    ];
    
    logradouros TEXT[] := ARRAY[
        'Rua das Flores', 'Avenida Brasil', 'Rua São João', 'Avenida Paulista',
        'Rua XV de Novembro', 'Avenida Atlântica', 'Rua da Praia', 'Avenida Central',
        'Rua do Comércio', 'Avenida Presidente Vargas', 'Rua José Bonifácio',
        'Avenida Santos Dumont', 'Rua Barão do Rio Branco', 'Avenida Getúlio Vargas'
    ];
BEGIN
	tenant_uuid := '321d18ff-7ead-431e-83f2-ab66ac210bb4';
    FOR i IN 1..200 LOOP
        -- Determina tipo de pessoa (70% PF, 30% PJ)
        IF random() < 0.7 THEN
            tipo_pessoa_val := 'F';
            -- Gera CPF válido (formato simples para teste)
            cpf_val := LPAD((random() * 99999999999)::bigint::text, 11, '0');
            cnpj_val := NULL;
            
            -- Nome pessoa física
            IF random() < 0.5 THEN
                nome_val := nomes_masculinos[1 + (random() * (array_length(nomes_masculinos, 1) - 1))::int];
            ELSE
                nome_val := nomes_femininos[1 + (random() * (array_length(nomes_femininos, 1) - 1))::int];
            END IF;
            
            fantasia_val := NULL;
            data_nascimento_val := '1960-01-01'::date + (random() * 15000)::int; -- Entre 1960 e ~2000
            rg_val := LPAD((random() * 999999999)::bigint::text, 9, '0');
            ie_val := NULL;
            im_val := NULL;
        ELSE
            tipo_pessoa_val := 'J';
            cpf_val := NULL;
            -- Gera CNPJ válido (formato simples para teste)
            cnpj_val := LPAD((random() * 99999999999999)::bigint::text, 14, '0');
            
            -- Nome empresa
            nome_val := empresas[1 + (random() * (array_length(empresas, 1) - 1))::int];
            fantasia_val := CASE 
                WHEN random() < 0.6 THEN split_part(nome_val, ' ', 1) || ' ' || split_part(nome_val, ' ', 2)
                ELSE NULL 
            END;
            
            data_nascimento_val := NULL;
            rg_val := NULL;
            ie_val := CASE WHEN random() < 0.8 THEN LPAD((random() * 999999999)::bigint::text, 9, '0') ELSE NULL END;
            im_val := CASE WHEN random() < 0.6 THEN LPAD((random() * 999999)::bigint::text, 6, '0') ELSE NULL END;
        END IF;
        
        -- Email (80% dos clientes têm email)
        IF random() < 0.8 THEN
            email_val := lower(replace(split_part(nome_val, ' ', 1), ' ', '')) || 
                        (1000 + (random() * 8999)::int)::text || '@email.com';
        ELSE
            email_val := NULL;
        END IF;
        
        -- Telefones (90% têm pelo menos um)
        IF random() < 0.9 THEN
            telefone_val := '(' || LPAD((11 + (random() * 78)::int)::text, 2, '0') || ')' ||
                           LPAD((2000 + (random() * 7999)::int)::text, 4, '0') || '-' ||
                           LPAD((random() * 9999)::int::text, 4, '0');
        ELSE
            telefone_val := NULL;
        END IF;
        
        IF random() < 0.95 THEN
            celular_val := '(' || LPAD((11 + (random() * 78)::int)::text, 2, '0') || ')9' ||
                          LPAD((1000 + (random() * 8999)::int)::text, 4, '0') || '-' ||
                          LPAD((random() * 9999)::int::text, 4, '0');
        ELSE
            celular_val := NULL;
        END IF;
        
        -- Endereço (85% têm endereço completo)
        IF random() < 0.85 THEN
            cep_val := LPAD((10000000 + (random() * 89999999)::int)::text, 8, '0');
            logradouro_val := logradouros[1 + (random() * (array_length(logradouros, 1) - 1))::int];
            numero_val := (1 + (random() * 9999)::int)::text;
            complemento_val := CASE 
                WHEN random() < 0.3 THEN 'Apto ' || (1 + (random() * 999)::int)::text
                WHEN random() < 0.5 THEN 'Sala ' || (1 + (random() * 99)::int)::text
                ELSE NULL 
            END;
            bairro_val := bairros[1 + (random() * (array_length(bairros, 1) - 1))::int];
            cidade_val := cidades[1 + (random() * (array_length(cidades, 1) - 1))::int];
            uf_val := ufs[1 + (random() * (array_length(ufs, 1) - 1))::int];
        ELSE
            cep_val := NULL;
            logradouro_val := NULL;
            numero_val := NULL;
            complemento_val := NULL;
            bairro_val := NULL;
            cidade_val := NULL;
            uf_val := NULL;
        END IF;
        
        -- Insere o registro
        INSERT INTO public.clientes (
            tenant_id,
            tipo_pessoa,
            nome_razao_social,
            nome_fantasia,
            cpf,
            cnpj,
            rg,
            ie,
            im,
            data_nascimento,
            email,
            telefone,
            celular,
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            uf
        ) VALUES (
            tenant_uuid,
            tipo_pessoa_val,
            nome_val,
            fantasia_val,
            cpf_val,
            cnpj_val,
            rg_val,
            ie_val,
            im_val,
            data_nascimento_val,
            email_val,
            telefone_val,
            celular_val,
            cep_val,
            logradouro_val,
            numero_val,
            complemento_val,
            bairro_val,
            cidade_val,
            uf_val
        );
        
        -- Log progresso a cada 50 registros
        IF i % 50 = 0 THEN
            RAISE NOTICE 'Inseridos % clientes de teste', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Finalizado! Inseridos 200 clientes de teste para o tenant %', tenant_uuid;
END $$;