interface Env {
  SETTINGS: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const settings = await context.request.json();
    await context.env.SETTINGS.put('backup_settings', JSON.stringify(settings));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to save settings' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};