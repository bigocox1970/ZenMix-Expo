// Save mix to database
const saveMix = async () => {
  if (!settings.name) {
    alert('Please enter a name for your mix');
    return;
  }

  try {
    // Get the current user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    console.log(`Creating new meditation mix: ${settings.name}`);

    // Filter tracks that have audio
    const tracksWithAudio = tracks.filter(track => track.audioTrackId && track.url);
    
    if (tracksWithAudio.length === 0) {
      alert('Your mix needs at least one sound to save.');
      return;
    }
    
    // Prepare sanitized tracks data for JSON storage
    const sanitizedTracks = tracksWithAudio.map(track => {
      // Ensure all text values are properly sanitized
      const name = typeof track.name === 'string' ? track.name : String(track.name || '');
      const url = typeof track.url === 'string' ? track.url : String(track.url || '');
      const audioTrackId = track.audioTrackId || '';
      
      return {
        id: track.id,
        name,
        url,
        audioTrackId,
        volume: track.volume || 1,
        loopTime: track.loopTime || 30
      };
    });
    
    // Insert new mix into meditation_mixes
    const { data: newMix, error: mixError } = await supabase
      .from('meditation_mixes')
      .insert({
        name: settings.name,
        duration: settings.duration,
        is_public: settings.isPublic,
        user_id: user.id,
        tracks: sanitizedTracks,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (mixError) {
      console.error('Error creating mix:', mixError);
      throw mixError;
    }

    console.log('Successfully saved meditation mix:', newMix);
    alert(`Mix "${settings.name}" saved!`);

    // Update the URL to include the mix ID if needed
    if (newMix?.id) {
      router.setParams({ mixId: newMix.id });
    }
  } catch (err) {
    console.error('Error saving mix:', err);
    alert('Failed to save mix. Please try again.');
  }
}; 