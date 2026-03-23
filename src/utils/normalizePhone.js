export function normalizePhone(value) {
  return String(value || '').replace(/^\+91/, '').trim();
}

export default normalizePhone;
