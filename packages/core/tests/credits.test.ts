import { describe, expect, test } from "vite-plus/test";
import { creditPairs, splitArtistCredit } from "../src/artists/credits.ts";

describe("splitArtistCredit", () => {
  test.each([
    ["Peso Pluma & Estevan Plazola", ["Peso Pluma", "Estevan Plazola"]],
    ["Peso Pluma\n & \nEstevan Plazola", ["Peso Pluma", "Estevan Plazola"]],
    ["JENNIE & Doechii", ["JENNIE", "Doechii"]],
    ["Jennie feat. Doechii", ["Jennie", "Doechii"]],
    ["Bad Bunny x Jhayco", ["Bad Bunny", "Jhayco"]],
    ["Peso Pluma, Tito Double P & Natanael Cano", ["Peso Pluma", "Tito Double P", "Natanael Cano"]],
    ["Nicki Minaj ft. Drake & Lil Wayne", ["Nicki Minaj", "Drake", "Lil Wayne"]],
    ["Drake & drake", ["Drake"]],
  ])("%s is split", (credit, artists) => expect(splitArtistCredit(credit)).toEqual(artists));

  test.each([
    "Simon & Garfunkel",
    "Earth, Wind & Fire",
    "Tyler, The Creator",
    "Bob Marley & The Wailers",
    "Florence + The Machine",
    "AC/DC",
    "Marina and the Diamonds",
    "Charli XCX",
    "Radiohead",
    "Mumford & Sons",
  ])("%s stays whole", (credit) => expect(splitArtistCredit(credit)).toEqual([credit]));
});

describe("creditPairs", () => {
  test("only joint credits, once each", () => {
    const joint = "Peso Pluma & Natanael Cano";
    expect(creditPairs([joint, "Radiohead", joint])).toEqual([
      [joint, "Peso Pluma"],
      [joint, "Natanael Cano"],
    ]);
  });
});
