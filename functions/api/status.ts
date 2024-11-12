interface Env {
  BACKUP_STATUS: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const statusList = await context.env.BACKUP_STATUS.get('status_list', 'json') || [];
    
    // Filter to keep only last 2 days of status
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const filteredStatus = statusList.filter((status: any) => 
      new Date(status.timestamp) > twoDaysAgo
    );
    
    return new Response(JSON.stringify(filteredStatus), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch status' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};