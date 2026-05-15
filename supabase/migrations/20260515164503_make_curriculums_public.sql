-- Make curriculums bucket public so CVs can be viewed directly
UPDATE storage.buckets SET public = true WHERE id = 'curriculums';
