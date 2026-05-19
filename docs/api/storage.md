# Storage

Supabase Storage para arquivos (avatares, CVs, anexos de portfólio).

## Buckets

| Bucket          | Visibilidade | Conteúdo                                    | TTL URL assinada |
| --------------- | ------------ | ------------------------------------------- | ---------------- |
| `avatars`       | Público      | Foto de perfil                              | n/a              |
| `portfolio`     | Público      | Imagens/documentos de portfólio do perito   | n/a              |
| `curriculums`   | Privado      | CV, currículo Lattes (PDF)                  | 1h               |
| `documents`     | Privado      | Documentos diversos (suporte, moderação)    | 15min            |

> A divisão acima é a meta. Verifique o estado real no painel Supabase e padronize com a rotação proposta na [decisões/](../decisions/).

## Upload

```ts
const path = `${userId}/${Date.now()}-${file.name}`;
const { error } = await client.storage.from('avatars').upload(path, file, {
  upsert: true,
  contentType: file.type,
  cacheControl: '3600',
});
```

**Diretrizes:**

- `path` deve começar com `<userId>/` para uso em policies (`storage.foldername(name)[1] = auth.uid()::text`).
- `upsert: true` permite substituir; cuidado em buckets com versionamento.
- Validar tamanho e MIME no cliente **e** confiar em políticas de bucket.

## URL pública

```ts
const url = client.storage.from('avatars').getPublicUrl(path).data.publicUrl;
```

## URL assinada (privado)

```ts
const { data, error } = await client.storage.from('curriculums').createSignedUrl(path, 3600); // 1h
const tempUrl = data?.signedUrl;
```

Gerar sob demanda (no momento do clique no botão "Ver CV"), nunca antecipadamente.

## Download

```ts
const { data, error } = await client.storage.from('documents').download(path);
// data é Blob; criar URL.createObjectURL para download
```

## Deleção

```ts
await client.storage.from('avatars').remove([path]);
```

## Policies recomendadas

### Bucket público (`avatars`)

```sql
-- Read público
create policy "Public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

-- Write apenas pelo dono (estrutura: <userId>/...)
create policy "User can write own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "User can update own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "User can delete own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Bucket privado (`curriculums`)

```sql
-- Sem policy de SELECT pública. Acesso só via signed URL ou pelo próprio usuário.
create policy "Owner reads own curriculum" on storage.objects
  for select using (
    bucket_id = 'curriculums'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Limites

- Tamanho máximo padrão: 50 MB por arquivo (configurável por bucket).
- MIME types restritos por bucket (recomendado: imagens em `avatars`, `image/jpeg|png|webp`; PDFs em `curriculums`).

## Convenções de path

```
<bucket>/
  <userId>/
    <yyyy-mm-dd>/<arquivo>.<ext>
```

- Facilita debug (achar arquivos de um usuário).
- Facilita policies por prefixo.
- Facilita expurgo (deletar pasta `<userId>/` em cascata).

## Otimização

- Avatares: resize no cliente antes do upload (≤ 512px, ≤ 200KB).
- Documentos: oferecer compressão de PDF quando aplicável.
- Cache: `cacheControl: '3600'` para públicos.

## Custos

- Storage e bandwidth são cobrados pelo Supabase. Acompanhar via painel.
- Monitorar arquivos órfãos (não referenciados em nenhuma tabela). Considerar job mensal de limpeza.
