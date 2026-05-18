create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, contact_email, profile_type, account_status, profile_visible)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'profile_type', 'PERITO'), 'PENDING', false);
  return new;
exception
  when others then
    raise warning 'handle_new_user: could not create profile for user % (%) — %', new.id, new.email, SQLERRM;
    return new;
end;
$$ language plpgsql security definer;
