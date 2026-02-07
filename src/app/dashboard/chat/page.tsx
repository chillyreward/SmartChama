// Helper to fetch audio from our API and play it
const playVoice = async (text: string) => {
  try {
    const response = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) throw new Error("Audio generation failed");

    // Convert the response to a playable audio blob
    const blob = await response.blob();
    const audio = new Audio(URL.createObjectURL(blob));
    audio.play();
  } catch (error) {
    console.error("Voice Playback Error:", error);
  }
};