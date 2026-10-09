import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanAnswers, markPaper, rankAmong, weakestTopics } from "./scoring.ts";

/**
 * Students compare these ranks with each other, and a parent reads the score.
 * A marking slip here is an argument, so the rules are pinned down: no
 * negative marking, ties share a rank, and a malformed submission never costs
 * a student the answers they did give.
 */

const PAPER = [
  { id: 1, topic: "Networking", correctIndex: 2, optionCount: 5 },
  { id: 2, topic: "Networking", correctIndex: 0, optionCount: 5 },
  { id: 3, topic: "SQL", correctIndex: 4, optionCount: 5 },
  { id: 4, topic: "Python", correctIndex: 1, optionCount: 5 },
];

test("right, wrong and blank are counted with no negative marking", () => {
  const marked = markPaper(PAPER, { "1": 2, "2": 3, "3": 4 });
  assert.equal(marked.correct, 2);
  assert.equal(marked.wrong, 1);
  assert.equal(marked.unanswered, 1);
  assert.equal(marked.total, 4);
  assert.deepEqual(marked.topicBreakdown.Networking, { correct: 1, total: 2 });
  assert.deepEqual(marked.topicBreakdown.Python, { correct: 0, total: 1 });
});

test("cleanAnswers drops anything that is not an answer to this paper", () => {
  const cleaned = cleanAnswers(
    { "1": 2, "2": 9, "3": -1, "4": 1.5, "99": 0, "x": 1, "__proto__": 1 } as Record<string, unknown>,
    PAPER,
  );
  assert.deepEqual(cleaned, { "1": 2 });
});

test("ties share the better rank", () => {
  assert.deepEqual(rankAmong(41, [45, 41, 30]), { rank: 2, total: 4, percentile: 33 });
});

test("the first sitter is first, and beat nobody to be there", () => {
  assert.deepEqual(rankAmong(12, []), { rank: 1, total: 1, percentile: 100 });
});

test("the top score beats everyone below it", () => {
  assert.deepEqual(rankAmong(50, [10, 20, 30]), { rank: 1, total: 4, percentile: 100 });
});

test("weakest topics come first, and a perfect topic is never listed", () => {
  const weak = weakestTopics({
    Networking: { correct: 4, total: 5 },
    SQL: { correct: 1, total: 4 },
    Python: { correct: 3, total: 3 },
    Logic: { correct: 1, total: 2 },
  });
  assert.deepEqual(
    weak.map((w) => w.topic),
    ["SQL", "Logic", "Networking"],
  );
});
