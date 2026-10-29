import { describe, expect, it } from "vitest";
import { frequencyPhrase, hockeyClock, likelihoodWord, signedUsd } from "./format";

describe("plain-language probability", () => {
  it.each([
    [0.64, "about 2 times in 3"],
    [0.5, "about half the time"],
    [0.72, "about 3 times in 4"],
    [0.23, "about 1 time in 4"],
    [0.41, "about 2 times in 5"],
    [0.05, "about 1 time in 20"],
    [0.95, "about 19 times in 20"],
  ])("%f → %s", (p, phrase) => {
    expect(frequencyPhrase(p)).toBe(phrase);
  });

  it("names the likelihood", () => {
    expect(likelihoodWord(0.64)).toBe("Likely");
    expect(likelihoodWord(0.56)).toBe("Leaning yes");
    expect(likelihoodWord(0.5)).toBe("Toss-up");
    expect(likelihoodWord(0.2)).toBe("Unlikely");
  });
});

describe("formatting", () => {
  it("formats signed money with a real minus sign", () => {
    expect(signedUsd(12.4)).toBe("+$12.40");
    expect(signedUsd(-3.1)).toBe("−$3.10");
    expect(signedUsd(0.001)).toBe("$0.00");
  });

  it("shows the hockey clock as time left in the period", () => {
    expect(hockeyClock(240)).toBe("1st · 16:00 left");
    expect(hockeyClock(1495)).toBe("2nd · 15:05 left");
    expect(hockeyClock(3600)).toBe("Final");
  });
});
