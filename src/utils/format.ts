// Number formatting helpers for the Broadsheet redesign.

// Adaptive precision, matching the original app's look:
// ≥1000 grouped 2dp · ≥100 → 2dp · ≥10 → 3dp · ≥1 → 4dp · else 5dp
export function fmtRate(n: number): string {
  if (!isFinite(n)) return "—";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 100) return n.toFixed(2);
  if (n >= 10) return n.toFixed(3);
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(5);
}

// Money result — grouped, fixed decimal places.
export function fmtMoney(n: number, dp = 2): string {
  if (!isFinite(n)) return "0.00";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

// Integer → English words (for the editorial longhand caption).
const ONES = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const TENS = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty",
  "ninety",
];

function chunkWords(n: number): string {
  let s = "";
  if (n >= 100) {
    s += ONES[Math.floor(n / 100)] + " hundred";
    n %= 100;
    if (n) s += " ";
  }
  if (n >= 20) {
    s += TENS[Math.floor(n / 10)];
    n %= 10;
    if (n) s += "-" + ONES[n];
  } else if (n > 0) {
    s += ONES[n];
  }
  return s;
}

export function numberToWords(num: number): string {
  num = Math.floor(num);
  if (num === 0) return "zero";
  const scales = ["", " thousand", " million", " billion"];
  let i = 0;
  let words = "";
  while (num > 0 && i < scales.length) {
    const c = num % 1000;
    if (c) words = chunkWords(c) + scales[i] + (words ? " " + words : "");
    num = Math.floor(num / 1000);
    i++;
  }
  return words.trim();
}
