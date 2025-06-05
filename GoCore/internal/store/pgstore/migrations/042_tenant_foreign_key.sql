-- Write your migrate up statements here
ALTER TABLE public.outbox_event
  ADD COLUMN tenant_id UUID NOT NULL;
ALTER TABLE public.outbox_event
  ADD CONSTRAINT outbox_event_fk FOREIGN KEY (tenant_id)
    REFERENCES public.tenants(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
    NOT DEFERRABLE;
---- create above / drop below ----
-- migrate down
ALTER TABLE public.outbox_event
  DROP COLUMN tenant_id;

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
