-- Create place-images storage bucket for place photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('place-images', 'place-images', true);

-- Allow public read access to place images
CREATE POLICY "Public read access for place images" ON storage.objects 
FOR SELECT USING (bucket_id = 'place-images');

-- Allow authenticated users to upload place images
CREATE POLICY "Authenticated users can upload place images" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'place-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploaded place images
CREATE POLICY "Users can update their own place images" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'place-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'place-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own uploaded place images
CREATE POLICY "Users can delete their own place images" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'place-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);