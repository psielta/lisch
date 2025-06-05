-- Write your migrate up statements here
ALTER TABLE public.outbox_event
  ADD COLUMN user_id UUID NOT NULL;
ALTER TABLE public.outbox_event
  ADD CONSTRAINT outbox_event_fk1 FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
    NOT DEFERRABLE;
---- create above / drop below ----
ALTER TABLE public.outbox_event
  DROP COLUMN user_id;
ALTER TABLE public.outbox_event
  DROP CONSTRAINT outbox_event_fk1;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
