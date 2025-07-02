export default defineEventHandler(async (event: any) => {
  // Mock data for lawyers - in production this would come from backend API
  const lawyers = [
    {
      id: '1',
      name: 'Takeshi Yamamoto',
      email: 'yamamoto@asterlaw.jp',
      role: 'LAWYER',
      specializations: ['Corporate Law', 'Contract Law'],
      active: true
    },
    {
      id: '2', 
      name: 'Kenji Nakamura',
      email: 'nakamura@asterlaw.jp',
      role: 'LAWYER',
      specializations: ['Litigation', 'Criminal Defense'],
      active: true
    },
    {
      id: '3',
      name: 'Hiroshi Tanaka',
      email: 'tanaka@asterlaw.jp', 
      role: 'LAWYER',
      specializations: ['Family Law', 'Real Estate'],
      active: true
    },
    {
      id: '4',
      name: 'Akira Sato',
      email: 'sato@asterlaw.jp',
      role: 'LAWYER', 
      specializations: ['Intellectual Property', 'Technology Law'],
      active: false
    }
  ]

  // Filter active lawyers and format for select options
  return lawyers
    .filter(lawyer => lawyer.active)
    .map(lawyer => ({
      label: lawyer.name,
      value: lawyer.id,
      description: lawyer.specializations.join(', ')
    }))
})