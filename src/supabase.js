import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xajkwhyyackejbtnjndm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhamt3aHl5YWNrZWpidG5qbmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNDc2NzEsImV4cCI6MjA1NjYyMzY3MX0.N0RZZ21VFDIT8yzjbtoZfkottyu7xT2IeAqzGos4IPI'

export const supabase = createClient(supabaseUrl, supabaseKey)