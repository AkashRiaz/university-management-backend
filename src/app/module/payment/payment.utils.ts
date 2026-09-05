export const generatePaymentTransactionId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PAY-${timestamp}-${random}`;
};

export const parseBkashPaymentDate = (dateString?: string): Date => {
  if (!dateString) {
    return new Date();
  }

  // bKash sometimes returns:
  // 2026-09-05T17:49:14:517 GMT+0600
  //
  // JavaScript expects:
  // 2026-09-05T17:49:14.517 GMT+0600

  const normalizedDate = dateString.replace(
    /(\d{2}:\d{2}:\d{2}):(\d{3})/,
    "$1.$2",
  );

  const parsedDate = new Date(normalizedDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date();
  }

  return parsedDate;
};
