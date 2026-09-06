export const normalizeAttendanceDate = (date: Date): Date => {
  const normalizedDate = new Date(date);

  normalizedDate.setHours(0, 0, 0, 0);

  return normalizedDate;
};
