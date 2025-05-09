-- Write your migrate up statements here
ALTER TABLE public.users
  ADD COLUMN admin INTEGER NOT NULL;

ALTER TABLE public.users
  ADD COLUMN permission_users INTEGER NOT NULL;
---- create above / drop below ----

ALTER TABLE public.users
  DROP COLUMN admin;

ALTER TABLE public.users
  DROP COLUMN permission_users;



-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
