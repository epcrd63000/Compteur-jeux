import { createClient } from '@/utils/supabase/server'

export default async function Page() {
  const supabase = await createClient()

  // Ensure table name matches the one in your SQL schema
  const { data: groups } = await supabase.from('groups').select()

  return (
    <div>
      <h1>Groupes Supabase</h1>
      <ul>
        {groups?.map((group: any) => (
          <li key={group.id}>{group.name} (Code: {group.code})</li>
        ))}
      </ul>
    </div>
  )
}