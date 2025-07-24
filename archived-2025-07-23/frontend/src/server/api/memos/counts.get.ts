// GET /api/memos/counts - Memo counts API endpoint for filter badges

export default defineEventHandler(async () => {
  // Mock data - in real implementation, this would query the database
  const counts = {
    status: {
      draft: 12,
      sent: 45,
      read: 23,
      archived: 8
    },
    priority: {
      low: 15,
      medium: 32,
      high: 18,
      urgent: 6
    },
    recipientType: {
      client: 48,
      court: 12,
      opposing_counsel: 15,
      internal: 13
    },
    total: 88
  }

  return counts
})