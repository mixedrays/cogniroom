import { describe, it, expect } from "vitest";
import { parsePartialJson } from "../parsePartialJson";

describe("parsePartialJson", () => {
  it("parses complete JSON", () => {
    expect(parsePartialJson('{"title":"Hello","count":3}')).toEqual({
      title: "Hello",
      count: 3,
    });
  });

  it("parses complete array", () => {
    expect(parsePartialJson("[1,2,3]")).toEqual([1, 2, 3]);
  });

  it("closes unclosed object", () => {
    expect(parsePartialJson('{"title":"Hello"')).toEqual({ title: "Hello" });
  });

  it("closes unclosed array", () => {
    expect(parsePartialJson('["a","b"')).toEqual(["a", "b"]);
  });

  it("closes unclosed string in value", () => {
    expect(parsePartialJson('{"title":"Hel')).toEqual({ title: "Hel" });
  });

  it("handles trailing comma in object", () => {
    expect(parsePartialJson('{"a":1,"b":2,')).toEqual({ a: 1, b: 2 });
  });

  it("handles trailing comma in array", () => {
    expect(parsePartialJson("[1,2,")).toEqual([1, 2]);
  });

  it("handles incomplete key (no value yet)", () => {
    expect(parsePartialJson('{"a":1,"b')).toEqual({ a: 1 });
  });

  it("handles key with colon but no value", () => {
    expect(parsePartialJson('{"a":1,"b":')).toEqual({ a: 1 });
  });

  it("closes nested structures", () => {
    expect(
      parsePartialJson(
        '{"topics":[{"title":"Ownership","lessons":[{"title":"Intro"'
      )
    ).toEqual({
      topics: [{ title: "Ownership", lessons: [{ title: "Intro" }] }],
    });
  });

  it("handles deeply nested incomplete", () => {
    expect(parsePartialJson('{"a":{"b":{"c":"d"')).toEqual({
      a: { b: { c: "d" } },
    });
  });

  it("handles escaped quotes in strings", () => {
    expect(parsePartialJson('{"text":"say \\"hello\\""')).toEqual({
      text: 'say "hello"',
    });
  });

  it("handles incomplete value after complete entries", () => {
    expect(
      parsePartialJson('{"title":"Rust Basics","topics":[{"name":"Own')
    ).toEqual({
      title: "Rust Basics",
      topics: [{ name: "Own" }],
    });
  });

  it("returns undefined for empty string", () => {
    expect(parsePartialJson("")).toBeUndefined();
  });

  it("returns undefined for whitespace only", () => {
    expect(parsePartialJson("   ")).toBeUndefined();
  });

  it("handles boolean and null values", () => {
    expect(parsePartialJson('{"active":true,"data":null')).toEqual({
      active: true,
      data: null,
    });
  });

  it("handles array of objects", () => {
    expect(parsePartialJson('[{"q":"What is Rust?"},{"q":"What is')).toEqual([
      { q: "What is Rust?" },
      { q: "What is" },
    ]);
  });
});
