import assert from "node:assert/strict";
import { test } from "node:test";
import { BASE_POINTS, SPEED_POINTS, buildBoard, optionCounts, scoreAnswers } from "./scoring.ts";

/**
 * The live leaderboard is shown to a whole class at once and students compare
 * it out loud, so a scoring mistake is an argument in the middle of a lesson.
 *
 * `msSinceShown` is the part worth testing hardest: it is reported by the
 * student's own browser, so every case below is a client that could be lying,
 * broken, or simply on a phone whose clock is wrong.
 */

const WINDOW = 45_000;

test("a correct answer at the buzzer still scores the base points", () => {
  const [row] = scoreAnswers([{ uid: "a", choice: 1, msSinceShown: WINDOW }], 1, WINDOW);
  assert.equal(row.correct, true);
  assert.equal(row.points, BASE_POINTS);
});

test("an instant correct answer scores the full speed bonus", () => {
  const [row] = scoreAnswers([{ uid: "a", choice: 1, msSinceShown: 0 }], 1, WINDOW);
  assert.equal(row.points, BASE_POINTS + SPEED_POINTS);
});

test("halfway through the window is half the bonus", () => {
  const [row] = scoreAnswers([{ uid: "a", choice: 2, msSinceShown: WINDOW / 2 }], 2, WINDOW);
  assert.equal(row.points, BASE_POINTS + SPEED_POINTS / 2);
});

test("being fast and wrong is worth nothing", () => {
  const [row] = scoreAnswers([{ uid: "a", choice: 0, msSinceShown: 0 }], 3, WINDOW);
  assert.equal(row.correct, false);
  assert.equal(row.points, 0);
});

test("a negative elapsed time cannot buy more than the full bonus", () => {
  const [row] = scoreAnswers([{ uid: "a", choice: 1, msSinceShown: -60_000 }], 1, WINDOW);
  assert.equal(row.points, BASE_POINTS + SPEED_POINTS);
  assert.equal(row.ms, 0);
});

test("an elapsed time past the window scores no bonus rather than a negative one", () => {
  const [row] = scoreAnswers([{ uid: "a", choice: 1, msSinceShown: 10 * WINDOW }], 1, WINDOW);
  assert.equal(row.points, BASE_POINTS);
});

test("a non-finite elapsed time does not produce NaN points", () => {
  const [row] = scoreAnswers([{ uid: "a", choice: 1, msSinceShown: Number.NaN }], 1, WINDOW);
  assert.equal(Number.isFinite(row.points), true);
  assert.equal(row.points, BASE_POINTS + SPEED_POINTS);
});

test("a zero-length window cannot divide by zero", () => {
  const [row] = scoreAnswers([{ uid: "a", choice: 1, msSinceShown: 0 }], 1, 0);
  assert.equal(row.points, BASE_POINTS);
});

test("the board ranks by points, then by who was quicker", () => {
  const scored = scoreAnswers(
    [
      { uid: "slow", choice: 1, msSinceShown: 40_000 },
      { uid: "quick", choice: 1, msSinceShown: 1_000 },
      { uid: "wrong", choice: 0, msSinceShown: 500 },
      { uid: "middle", choice: 1, msSinceShown: 20_000 },
    ],
    1,
    WINDOW,
  );

  const board = buildBoard(scored, new Map([["quick", "Nimali"]]));

  assert.deepEqual(
    board.map((row) => row.uid),
    ["quick", "middle", "slow"],
    "a wrong answer never appears on the board, however fast it was",
  );
  assert.equal(board[0].rank, 1);
  assert.equal(board[0].name, "Nimali");
  assert.equal(board[1].name, "Student", "a missing name falls back rather than showing a uid");
});

test("the board is capped", () => {
  const scored = scoreAnswers(
    Array.from({ length: 50 }, (_, i) => ({ uid: `u${i}`, choice: 1, msSinceShown: i * 100 })),
    1,
    WINDOW,
  );
  assert.equal(buildBoard(scored, new Map(), 20).length, 20);
});

test("option counts cover every option, including the ones nobody picked", () => {
  const counts = optionCounts(
    [
      { uid: "a", choice: 0, msSinceShown: 0 },
      { uid: "b", choice: 2, msSinceShown: 0 },
      { uid: "c", choice: 2, msSinceShown: 0 },
    ],
    4,
  );
  assert.deepEqual(counts, [1, 0, 2, 0]);
});

test("an out-of-range choice is ignored rather than corrupting the counts", () => {
  const counts = optionCounts(
    [
      { uid: "a", choice: 9, msSinceShown: 0 },
      { uid: "b", choice: -1, msSinceShown: 0 },
      { uid: "c", choice: 1, msSinceShown: 0 },
    ],
    3,
  );
  assert.deepEqual(counts, [0, 1, 0]);
});
