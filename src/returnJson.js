const returnJson = (payload) => {
  const json = JSON.stringify(payload);
  const result = ContentService.createTextOutput(json)
  result.setMimeType(ContentService.MimeType.JSON);
  return result;
};