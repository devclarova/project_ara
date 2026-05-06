const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://lsjozpktmapfqxqyaarw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzam96cGt0bWFwZnF4cXlhYXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzMxMjYyMCwiZXhwIjoyMDcyODg4NjIwfQ.f5LawdEaTj1ZqoM9DolU04qqWj9SC5LdfxWLrXBjjgI');

(async () => {
  const { data: authUsers, error: authError } = await supabase.auth.admin.getUserById('8671c71e-ed64-4bce-998b-6d5a487219d5');
  console.log('auth.users result:', authError ? authError.message : authUsers.user.id);
  
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id').eq('id', '8671c71e-ed64-4bce-998b-6d5a487219d5');
  console.log('profiles result:', profilesError ? profilesError.message : (profiles.length > 0 ? profiles[0].id : 'Not Found'));
})();
