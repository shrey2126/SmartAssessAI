function skillName(skills) {
  return (skills && skills[0]) || "JavaScript";
}

function pickLanguage(skills) {
  const s = (skills || []).join(" ").toLowerCase();
  if (/\bpython\b/.test(s) || /\bdjango\b/.test(s) || /\bflask\b/.test(s)) return "python";
  if (/\bjava\b/.test(s) && !/\bjavascript\b/.test(s)) return "java";
  return "javascript";
}

function mcq(text, options, correctAnswer, difficulty) {
  return {
    text,
    type: "mcq",
    options,
    correctAnswer,
    difficulty,
    timeLimitSec: 60,
    language: "",
    starterCode: "",
    idealAnswerHint: "",
  };
}

function coding(text, language, starterCode, hint, difficulty) {
  return {
    text,
    type: "coding",
    options: [],
    correctAnswer: "",
    difficulty,
    timeLimitSec: 420,
    language,
    starterCode,
    idealAnswerHint: hint,
  };
}

function fallbackAssessment(title, skills) {
  const skill = skillName(skills);
  const extra = (skills || []).slice(0, 4).join(", ") || skill;
  const lang = pickLanguage(skills);
  const starters = {
    javascript: "function solve(input) {\n  // easy-medium: return the result\n  return input;\n}\n",
    python: "def solve(input):\n    # easy-medium: return the result\n    return input\n",
    java: "class Solution {\n  static Object solve(Object input) {\n    // easy-medium: return the result\n    return input;\n  }\n}\n",
  };
  const mcqs = [
    mcq(
      `In ${title || "this role"}, what is the safest way to handle secrets used by ${skill}?`,
      ["Commit them to git for the team", "Keep them in environment variables or a secret manager", "Put them in frontend source", "Email them to the intern"],
      "Keep them in environment variables or a secret manager",
      "easy"
    ),
    mcq(
      `Which practice most improves reliability when building with ${extra}?`,
      ["Skip tests to ship faster", "Write automated tests for critical paths", "Only test in production", "Disable logging"],
      "Write automated tests for critical paths",
      "easy"
    ),
    mcq(
      `What does HTTP status 400 typically mean for an API used in a ${skill} app?`,
      ["The server is down", "The client sent an invalid request", "Authentication succeeded", "The resource was created"],
      "The client sent an invalid request",
      "easy"
    ),
    mcq(
      `Which Git command creates a new branch from the current HEAD?`,
      ["git clone", "git branch new-feature", "git blame", "git stash drop"],
      "git branch new-feature",
      "easy"
    ),
    mcq(
      `For ${skill}, which statement about arrays/lists is true?`,
      ["They can only store numbers", "Index-based access is typically O(1)", "They cannot be empty", "They replace databases"],
      "Index-based access is typically O(1)",
      "easy"
    ),
    mcq(
      `What is the main benefit of using version control on a ${extra} codebase?`,
      ["It compiles the app", "It tracks history and enables collaboration", "It replaces code review", "It auto-fixes bugs"],
      "It tracks history and enables collaboration",
      "easy"
    ),
    mcq(
      `A ${skill} function should fail when input is missing. What is the most appropriate response?`,
      ["Ignore the error", "Validate input and return a clear error", "Crash the whole server without logs", "Retry forever with no backoff"],
      "Validate input and return a clear error",
      "medium"
    ),
    mcq(
      `Which SQL clause filters rows before grouping?`,
      ["HAVING", "WHERE", "ORDER BY", "LIMIT"],
      "WHERE",
      "medium"
    ),
    mcq(
      `In REST, which method is idempotent and typically used to replace a resource?`,
      ["POST", "PUT", "PATCH only", "CONNECT"],
      "PUT",
      "medium"
    ),
    mcq(
      `When debugging a slow ${skill} feature, what should you do first?`,
      ["Rewrite the entire app", "Measure where time is spent, then fix the hotspot", "Add more CSS", "Delete tests"],
      "Measure where time is spent, then fix the hotspot",
      "medium"
    ),
  ];
  const codingQs = [
    coding(
      `Easy: Write a ${lang} function \`solve(nums)\` that returns the sum of unique numbers in an array. Example: [1, 2, 2, 3] → 6. This is used when aggregating ${skill} metrics.`,
      lang,
      starters[lang] || starters.javascript,
      "Use a set/map to unique the values, then sum. Handle empty input as 0.",
      "easy"
    ),
    coding(
      `Medium: Write a ${lang} function \`solve(text)\` that counts word frequency (lowercase, split on spaces) and returns the most common word. Ties: return the lexicographically smallest word. Relates to parsing logs in ${extra}.`,
      lang,
      starters[lang] || starters.javascript,
      "Normalize case, split, count with a map, then pick max count / min word.",
      "medium"
    ),
  ];
  return { questions: [...mcqs, ...codingQs], mock: true };
}

function publicQuestions(questions) {
  return (questions || []).map((q) => ({
    text: q.text,
    type: q.type,
    options: q.options || [],
    difficulty: q.difficulty || "easy",
    timeLimitSec: q.timeLimitSec || (q.type === "coding" ? 420 : 60),
    language: q.language || "",
    starterCode: q.starterCode || "",
  }));
}

function normalizePack(pack, title, skills) {
  const mcqs = Array.isArray(pack?.mcqs) ? pack.mcqs : [];
  const codingQs = Array.isArray(pack?.coding) ? pack.coding : [];
  if (mcqs.length !== 10 || codingQs.length !== 2) {
    return fallbackAssessment(title, skills);
  }
  const questions = [];
  for (const item of mcqs) {
    const options = Array.isArray(item.options) ? item.options.slice(0, 4) : [];
    while (options.length < 4) options.push(`Option ${options.length + 1}`);
    const correct = options.includes(item.correctAnswer) ? item.correctAnswer : options[0];
    questions.push(
      mcq(String(item.text || "Question"), options, correct, item.difficulty === "medium" ? "medium" : "easy")
    );
  }
  const lang = pickLanguage(skills);
  for (const item of codingQs) {
    questions.push(
      coding(
        String(item.text || "Coding task"),
        item.language || lang,
        item.starterCode || "",
        item.idealAnswerHint || "",
        item.difficulty === "medium" ? "medium" : "easy"
      )
    );
  }
  return { questions, mock: Boolean(pack?.mock) };
}

module.exports = { fallbackAssessment, publicQuestions, normalizePack, pickLanguage };
