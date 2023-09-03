const returnJson = (payload) => {
  const json = JSON.stringify(payload);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
};