export const shareOnWhatsApp = (message: string) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;

  // Attempt to open in a new tab/window
  window.open(whatsappUrl, '_blank');
};
