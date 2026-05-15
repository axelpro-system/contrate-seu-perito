alter table profiles alter column profile_visible set default true;
update profiles set profile_visible = true
where profile_type = 'PERITO'
  and (profile_visible is null or profile_visible = false)
  and first_name is not null
  and specialty is not null;
