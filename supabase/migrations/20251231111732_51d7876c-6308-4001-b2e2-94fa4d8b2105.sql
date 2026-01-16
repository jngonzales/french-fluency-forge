-- Add RLS policies for systemeio_product_map table (admin management)
DROP POLICY IF EXISTS "Authenticated users can view product map" ON public.systemeio_product_map;
CREATE POLICY "Authenticated users can view product map"
ON public.systemeio_product_map
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert product map" ON public.systemeio_product_map;
CREATE POLICY "Authenticated users can insert product map"
ON public.systemeio_product_map
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update product map" ON public.systemeio_product_map;
CREATE POLICY "Authenticated users can update product map"
ON public.systemeio_product_map
FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete product map" ON public.systemeio_product_map;
CREATE POLICY "Authenticated users can delete product map"
ON public.systemeio_product_map
FOR DELETE
TO authenticated
USING (true);