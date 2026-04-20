-- Étape 1: Désactiver temporairement RLS pour diagnostiquer
ALTER TABLE public.facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Étape 2: Vérifier que les données existent
SELECT 'Facilities count:' as info, COUNT(*) as count FROM public.facilities;
SELECT 'Bookings count:' as info, COUNT(*) as count FROM public.bookings;
SELECT 'User profiles count:' as info, COUNT(*) as count FROM public.user_profiles;

-- Étape 3: Afficher les facilities
SELECT * FROM public.facilities;

-- Si vous voyez les données ci-dessus, le problème est RLS
-- Si vous ne voyez pas de données, exécutez la partie suivante:

-- Réinsérer les facilities si elles sont manquantes
INSERT INTO public.facilities (name, type, capacity, hourly_rate, is_active) VALUES
('Football Field 1', 'football_field', 14, 50.00, true),
('Football Field 2', 'football_field', 14, 50.00, true),
('Football Field 3', 'football_field', 14, 50.00, true),
('Football Field 4', 'football_field', 14, 50.00, true),
('Football Field 5', 'football_field', 14, 50.00, true),
('Football Field 6', 'football_field', 14, 50.00, true),
('Padel Court 1', 'padel_court', 4, 40.00, true),
('Padel Court 2', 'padel_court', 4, 40.00, true)
ON CONFLICT (name) DO NOTHING;

-- Étape 4: Vérifier votre profil utilisateur
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  up.first_name,
  up.last_name,
  up.is_admin
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE u.email = 'temimi.iyed@gmail.com';

-- Si le profil est NULL, créez-le:
INSERT INTO public.user_profiles (id, first_name, last_name, phone, is_admin, is_restricted)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'first_name', 'Iyed'), 
  COALESCE(raw_user_meta_data->>'last_name', 'Temimi'),
  COALESCE(raw_user_meta_data->>'phone', '+216'),
  true,
  false
FROM auth.users 
WHERE email = 'temimi.iyed@gmail.com'
ON CONFLICT (id) DO UPDATE
SET is_admin = true,
    updated_at = NOW();

-- IMPORTANT: Après avoir vérifié que tout fonctionne,
-- vous pouvez réactiver RLS avec les bonnes policies:

-- Réactiver RLS
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Anyone can view active facilities" ON public.facilities;
DROP POLICY IF EXISTS "Everyone can view active facilities" ON public.facilities;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;

-- Créer les nouvelles policies (plus permissives)
CREATE POLICY "Public read facilities" ON public.facilities
  FOR SELECT USING (true);

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Test final
SELECT 'Test facilities:' as test, COUNT(*) as count FROM public.facilities WHERE is_active = true;
