// js/challenges/phishing.js

// 1. A simple seeded random number generator (Mulberry32)
// This ensures the exact same seed ALWAYS generates the exact same email.
export function getRng(seed) {
  let t = seed += 0x6D2B79F5;
  return function() {
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// 2. Data pools for our generator
const SENDERS = [
  { name: 'SecureBank', legitName: 'SecureBank', badDomain: 'bank-verify-support.com', legitDomain: 'securebank.com' },
  { name: 'DHL Express', legitName: 'DHL Express', badDomain: 'dhl-parcel-fee.top', legitDomain: 'dhl.com' },
  { name: 'Uni Portal', legitName: 'University IT', badDomain: 'student-portal-verify.net', legitDomain: 'university.edu' },
  { name: 'Netflix', legitName: 'Netflix', badDomain: 'netflix-billing-update.com', legitDomain: 'netflix.com' }
];

const SUBJECTS = [
  { text: 'URGENT: Your account will be suspended', bad: true },
  { text: 'Action Required: Verify your identity', bad: true },
  { text: 'Final Notice: Payment failed', bad: true },
  { text: 'Your monthly statement is ready', bad: false },
  { text: 'Welcome to your new account', bad: false }
];

const CTAS = [
  { text: 'Verify Now', badUrl: 'http://secure-login.xyz/auth', goodUrl: 'https://securebank.com/login', bad: true },
  { text: 'Update Payment', badUrl: 'http://billing-update.top/pay', goodUrl: 'https://netflix.com/account', bad: true },
  { text: 'View Account', badUrl: 'http://portal-check.net', goodUrl: 'https://university.edu/portal', bad: false }
];

// 3. The Generator Function
export function generatePhishingChallenge(seed) {
  const rng = getRng(seed);

  // Pick random elements from our arrays
  const sender = SENDERS[Math.floor(rng() * SENDERS.length)];
  const subjectObj = SUBJECTS[Math.floor(rng() * SUBJECTS.length)];
  const cta = CTAS[Math.floor(rng() * CTAS.length)];

  // 15% chance the email is actually legitimate (to keep players on their toes)
  const isPhish = rng() > 0.15; 

  // If it's phishing, use the bad data. If it's legit, use the good data.
  const fromName = isPhish ? sender.name : sender.legitName;
  const fromEmail = isPhish ? `security@${sender.badDomain}` : `support@${sender.legitDomain}`;
  const subject = isPhish ? subjectObj.text : 'Your monthly statement is ready';
  const linkText = isPhish ? cta.text : 'View Account';
  const linkUrl = isPhish ? cta.badUrl : cta.goodUrl;
  const body = isPhish 
    ? 'Dear customer, we detected unusual activity. You must verify your identity immediately to prevent a 24-hour suspension of your account.'
    : 'Hello, your account is in good standing. You can view your recent statements by logging into the portal below.';

  // Determine which indicators are actually suspicious based on the generation
  const answerKey = [];
  if (isPhish) {
    if (sender.badDomain) answerKey.push('sender');
    if (subjectObj.bad) answerKey.push('subject');
    if (cta.bad) answerKey.push('link');
  }

  return {
    seed,
    isPhish,
    email: { fromName, fromEmail, subject, body, linkText, linkUrl },
    answerKey
  };
}