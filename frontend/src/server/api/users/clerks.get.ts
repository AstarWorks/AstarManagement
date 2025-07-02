export default defineEventHandler(async (event: any) => {
  // Mock data for clerks - in production this would come from backend API
  const clerks = [
    {
      id: '10',
      name: 'Yuki Suzuki',
      email: 'suzuki@asterlaw.jp',
      role: 'CLERK',
      department: 'Administrative',
      active: true
    },
    {
      id: '11',
      name: 'Maki Watanabe', 
      email: 'watanabe@asterlaw.jp',
      role: 'CLERK',
      department: 'Document Processing',
      active: true
    },
    {
      id: '12',
      name: 'Rina Kobayashi',
      email: 'kobayashi@asterlaw.jp',
      role: 'CLERK',
      department: 'Client Relations',
      active: true
    },
    {
      id: '13',
      name: 'Tomoko Ito',
      email: 'ito@asterlaw.jp',
      role: 'CLERK',
      department: 'Research',
      active: false
    }
  ]

  // Filter active clerks and format for select options
  return clerks
    .filter(clerk => clerk.active)
    .map(clerk => ({
      label: clerk.name,
      value: clerk.id,
      description: clerk.department
    }))
})