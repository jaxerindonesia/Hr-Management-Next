function createCodeBase(name: string) {
  const words = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "CBG";
  if (words.length === 1) return words[0].slice(0, 6);
  return words.map((word) => word[0]).join("").slice(0, 6);
}

export async function generateBranchCode(
  name: string,
  codeExists: (code: string) => Promise<boolean>,
) {
  const base = createCodeBase(name);
  let code = base;
  let sequence = 2;

  while (await codeExists(code)) {
    code = `${base}-${sequence}`;
    sequence += 1;
  }

  return code;
}
