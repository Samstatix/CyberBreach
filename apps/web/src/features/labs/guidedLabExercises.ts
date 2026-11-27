export type LabExerciseId = "web" | "crypto" | "reverse" | "memory" | "forensics" | "osint";
export type GuidedLabExercise = {
  id: LabExerciseId;
  title: string;
  objective: string;
  question: string;
  acceptedAnswers: string[];
  hints: [string, string, string];
  explanation: string;
};
export const guidedLabExercises: GuidedLabExercise[] = [
  { id:"web", title:"Spot the authorization flaw", objective:"Identify why Maya can read an invoice belonging to Ravi.", question:"What server-side check is missing?", acceptedAnswers:["ownership check","object ownership check","authorization check","object-level authorization","access control check"], hints:["The API checks whether Maya is signed in.","Being signed in does not mean Maya owns every invoice.","The server must check whether the requested invoice belongs to Maya."], explanation:"The server needs object-level authorization: authenticate the user, load the requested record, then verify that the user is allowed to access that specific record." },
  { id:"crypto", title:"Separate encoding from encryption", objective:"Recognise what Base64 provides.", question:"Does Base64 provide confidentiality? Answer yes or no.", acceptedAnswers:["no","no it does not","no, it does not"], hints:["Base64 changes how bytes are represented.","Anyone can decode Base64 without a secret key.","It is an encoding format, not encryption."], explanation:"Base64 is encoding, not encryption. It does not hide information or provide confidentiality." },
  { id:"reverse", title:"Inspect before executing", objective:"Choose a safe first step when given an unknown executable.", question:"What should you do first: execute it, or inspect its metadata and hash in an isolated workflow?", acceptedAnswers:["inspect","inspect metadata","inspect metadata and hash","inspect its metadata and hash"], hints:["Do not run an unknown file on your everyday machine.","Start with non-executing observations.","Record metadata and calculate a cryptographic hash."], explanation:"Begin with safe static inspection and evidence recording. Do not execute unknown files on a normal workstation." },
  { id:"memory", title:"Understand a buffer boundary", objective:"Recognise why input length must be checked.", question:"An 8-byte buffer receives 10 bytes. How many bytes are beyond its boundary?", acceptedAnswers:["2","two","2 bytes","two bytes"], hints:["The buffer can hold eight bytes.","Compare the input length with the buffer capacity.","Subtract 8 from 10."], explanation:"Two bytes exceed the buffer boundary. Real software should validate lengths before copying; this simulation does not perform a memory overwrite." },
  { id:"forensics", title:"Triage authentication events", objective:"Distinguish repeated failed attempts from successful and blocked events.", question:"In the sample timeline, which source IP has the most failed attempts?", acceptedAnswers:["203.0.113.24"], hints:["Count only events marked failed.","Do not count successful or blocked events as failed.","Compare the failed-event totals for each source."], explanation:"203.0.113.24 has three failed attempts in this synthetic dataset. A source IP alone does not establish who operated it." },
  { id:"osint", title:"Check independent corroboration", objective:"Distinguish an independent record from a copied repost.", question:"Which source independently corroborates the official event notice: the calendar mirror or the municipal venue register?", acceptedAnswers:["municipal venue register","the municipal venue register","venue register"], hints:["A repost repeats the original claim.","Look for a record created by a separate organisation.","The venue register is maintained by the municipality."], explanation:"The municipal venue register is independent corroboration. The calendar mirror is a repost and should not be counted as a separate source." },
];
export function normalizeLabAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ");
}
export function checkLabAnswer(exercise: GuidedLabExercise, answer: string): boolean {
  const normalized = normalizeLabAnswer(answer);
  return normalized.length > 0 && exercise.acceptedAnswers.some((candidate) => normalizeLabAnswer(candidate) === normalized);
}
export function getLabHint(exercise: GuidedLabExercise, level: number): string {
  return exercise.hints[Math.max(0, Math.min(2, Math.trunc(Number.isFinite(level) ? level : 0)))];
}
