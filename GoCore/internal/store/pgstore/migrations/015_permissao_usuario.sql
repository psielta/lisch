-- Write your migrate up statements here
/*export interface User {
  id: string;
  user_name: string;
  email: string;
  bio: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  admin: number;
  permission_users: number | null;
  permission_categoria: number | null;
  permission_produto: number | null;
  permission_adicional: number | null;
}*/

ALTER TABLE users ADD COLUMN permission_categoria INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN permission_produto INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN permission_adicional INTEGER DEFAULT 0;


---- create above / drop below ----
--Migrate down
ALTER TABLE users DROP COLUMN permission_categoria;
ALTER TABLE users DROP COLUMN permission_produto;
ALTER TABLE users DROP COLUMN permission_adicional;

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
