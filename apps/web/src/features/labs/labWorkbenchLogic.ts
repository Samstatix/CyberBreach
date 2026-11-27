export type Invoice = { id: string; owner: string; amount: number; description: string };
export type InvoiceResponse = { status: 200 | 403 | 404; message: string; invoice?: Invoice };

const invoices: Invoice[] = [
  { id: "INV-101", owner: "maya", amount: 84, description: "Training equipment reimbursement" },
  { id: "INV-204", owner: "ravi", amount: 215, description: "Conference travel reimbursement" },
];

export function simulateInvoiceRequest(
  invoiceId: string,
  requester: string,
  mode: "vulnerable" | "secure",
): InvoiceResponse {
  const invoice = invoices.find((item) => item.id === invoiceId);
  if (!invoice) return { status: 404, message: "Invoice not found." };
  if (mode === "secure" && invoice.owner !== requester) {
    return { status: 403, message: "Forbidden: this invoice belongs to another account." };
  }
  return { status: 200, message: "Invoice returned by the API.", invoice };
}

export function decodeCaesarCipher(input: string, shift: number): string {
  const normalizedShift = ((Math.trunc(shift) % 26) + 26) % 26;
  return input.replace(/[a-z]/gi, (character) => {
    const base = character === character.toUpperCase() ? 65 : 97;
    return String.fromCharCode(((character.charCodeAt(0) - base - normalizedShift + 26) % 26) + base);
  });
}

export function decodeBase64(input: string): string {
  return atob(input.trim());
}

export type BufferAssessment = {
  status: "safe" | "rejected" | "overflow";
  acceptedBytes: number;
  overwrittenBytes: number;
};

export function assessBuffer(inputLength: number, bufferSize = 8, boundsCheck = true): BufferAssessment {
  const safeLength = Math.max(0, Math.trunc(inputLength));
  const safeSize = Math.max(1, Math.trunc(bufferSize));
  if (boundsCheck && safeLength > safeSize) {
    return { status: "rejected", acceptedBytes: 0, overwrittenBytes: 0 };
  }
  if (safeLength > safeSize) {
    return { status: "overflow", acceptedBytes: safeSize, overwrittenBytes: safeLength - safeSize };
  }
  return { status: "safe", acceptedBytes: safeLength, overwrittenBytes: 0 };
}

export type ForensicEvent = {
  time: string;
  event: string;
  sourceIp: string;
  outcome: "failed" | "success" | "blocked";
};

export const forensicEvents: ForensicEvent[] = [
  { time: "09:02:11", event: "SSH password attempt", sourceIp: "203.0.113.24", outcome: "failed" },
  { time: "09:02:18", event: "SSH password attempt", sourceIp: "203.0.113.24", outcome: "failed" },
  { time: "09:03:04", event: "SSH password attempt", sourceIp: "198.51.100.17", outcome: "failed" },
  { time: "09:04:29", event: "SSH password attempt", sourceIp: "203.0.113.24", outcome: "failed" },
  { time: "09:05:12", event: "Web console sign-in", sourceIp: "192.0.2.44", outcome: "success" },
  { time: "09:06:51", event: "SSH password attempt", sourceIp: "203.0.113.24", outcome: "blocked" },
  { time: "09:08:20", event: "Web console sign-in", sourceIp: "192.0.2.44", outcome: "success" },
];

export function summarizeFailedLogins(events: ForensicEvent[]): Array<{ sourceIp: string; count: number }> {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.outcome === "failed") counts.set(event.sourceIp, (counts.get(event.sourceIp) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([sourceIp, count]) => ({ sourceIp, count }))
    .sort((a, b) => b.count - a.count || a.sourceIp.localeCompare(b.sourceIp));
}
