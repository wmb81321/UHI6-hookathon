export async function notifyTelegram(text: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("Telegram credentials not configured, skipping notification");
    return;
  }

  try {
    const base = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      console.error("Failed to send Telegram notification:", await response.text());
    }
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
  }
}
