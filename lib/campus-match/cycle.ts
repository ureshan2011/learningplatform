/**
 * What this cycle of Campus Match is, in one place.
 *
 * Pure and client-safe: the report, the sales page and the console all need the
 * price and the round it covers, and none of them should reach for the dataset
 * to get them.
 *
 * One of these per admission cycle. A new cycle is a new product with a new
 * subject id and a new dataset — never an edit to this one, because a report a
 * student already paid for has to keep printing the round it was built from.
 */

/**
 * The subject id.
 *
 * Reads as the year the student applies and enters university — "Campus Match
 * 2027". It used to be read as the results year too, when results came out in
 * April; the 2026 exam's results are now due before the end of 2026, so the
 * two years no longer match and the id keeps the application year. Never
 * renamed: payments, enrollments and the settings document all key on it.
 * The admission round it forecasts is printed from `ADMISSION_ROUND`.
 */
export const CAMPUS_MATCH_ID = "campus-match-2027";

export const CAMPUS_MATCH_NAME = "Campus Match 2027";

/**
 * The round the forecast is for, as the UGC will print it.
 *
 * Not the same number as the subject id. The UGC's own covers state that a
 * round is based on the A/L examination of the year before its first year —
 * 2025/2026 was based on the 2025 examination — so a student collecting 2026
 * results is applying for admission year 2026/2027. This is the string every
 * screen prints; the id above is only a key.
 */
export const ADMISSION_ROUND = "2026/2027";

/**
 * The year results day falls in — the day this is sold from.
 *
 * 2026, not 2027: the 2026 exam ran in August and the Commissioner General has
 * said results come out before the end of the year. That is about three months
 * earlier than the 2025 exam's results (31 March 2026), so the sale window, the
 * waitlist and the results-day campaign all move forward with it.
 */
export const RESULTS_YEAR = 2026;

/**
 * When results are expected, as the console prints it. Update it the day the
 * Department of Examinations names a date.
 */
export const RESULTS_EXPECTED = "before the end of 2026, most likely December";

/** When the UGC application window is expected — about four weeks after results last time. */
export const APPLICATIONS_EXPECTED = "January 2027";

/** Rs 1,490. The console can edit `product.feeLKR`; this is only the default. */
export const CAMPUS_MATCH_FEE_LKR = 1_490;

/**
 * Long enough to cover results day, the application deadline, selection results
 * and an appeal — the whole arc of one admission cycle.
 */
export const CAMPUS_MATCH_ACCESS_DAYS = 420;

/**
 * How old the newest round may be before the product stops selling itself.
 *
 * The sale window runs from results day to shortly after selection results, so
 * a dataset more than this old means a round has been published that this
 * product does not know about — and the report would quote a cut-off a student
 * could already look up for real.
 */
export const STALE_AFTER_DAYS = 400;
