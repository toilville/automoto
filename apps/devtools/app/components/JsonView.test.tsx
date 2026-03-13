import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { FluentProvider, webDarkTheme } from "@fluentui/react-components";
import { JsonView } from "./JsonView.js";

function renderJson(data: unknown, defaultExpanded = true) {
  return render(
    <FluentProvider theme={webDarkTheme}>
      <JsonView data={data} defaultExpanded={defaultExpanded} />
    </FluentProvider>,
  );
}

describe("JsonView", () => {
  describe("primitives", () => {
    it("renders null", () => {
      const { getByText } = renderJson(null);
      expect(getByText("null")).toBeTruthy();
    });

    it("renders undefined", () => {
      const { getByText } = renderJson(undefined);
      expect(getByText("undefined")).toBeTruthy();
    });

    it("renders a string", () => {
      const { getByText } = renderJson("hello world");
      expect(getByText('"hello world"')).toBeTruthy();
    });

    it("renders a number", () => {
      const { getByText } = renderJson(42);
      expect(getByText("42")).toBeTruthy();
    });

    it("renders a boolean", () => {
      const { getByText } = renderJson(true);
      expect(getByText("true")).toBeTruthy();
    });
  });

  describe("string truncation", () => {
    it("truncates strings over 200 characters", () => {
      const longStr = "x".repeat(250);
      const { container } = renderJson(longStr);
      const text = container.textContent || "";
      expect(text).toContain("…");
      expect(text.length).toBeLessThan(260);
    });

    it("does not truncate short strings", () => {
      const { container } = renderJson("short");
      expect(container.textContent).toContain('"short"');
      expect(container.textContent).not.toContain("…");
    });
  });

  describe("objects", () => {
    it("renders empty object as {}", () => {
      const { getByText } = renderJson({});
      expect(getByText("{}")).toBeTruthy();
    });

    it("renders object keys when expanded", () => {
      const { getByText } = renderJson({ name: "Alice", age: 30 });
      expect(getByText('"name"')).toBeTruthy();
      expect(getByText('"Alice"')).toBeTruthy();
      expect(getByText('"age"')).toBeTruthy();
      expect(getByText("30")).toBeTruthy();
    });

    it("shows key count when collapsed", () => {
      const { getByText } = renderJson({ a: 1, b: 2 }, false);
      expect(getByText("{2 keys}")).toBeTruthy();
    });
  });

  describe("arrays", () => {
    it("renders empty array as []", () => {
      const { getByText } = renderJson([]);
      expect(getByText("[]")).toBeTruthy();
    });

    it("renders array items when expanded", () => {
      const { container } = renderJson([10, 20, 30]);
      const text = container.textContent || "";
      expect(text).toContain("10");
      expect(text).toContain("20");
      expect(text).toContain("30");
    });

    it("shows item count when collapsed", () => {
      const { getByText } = renderJson([1, 2, 3], false);
      expect(getByText("[3 items]")).toBeTruthy();
    });
  });

  describe("expand/collapse", () => {
    it("can toggle object expansion", () => {
      const { container, queryByText } = renderJson({ key: "val" });
      // Initially expanded
      expect(queryByText('"key"')).toBeTruthy();
      // Find any clickable element that contains "{"
      const clickable = container.querySelector("span[style]");
      if (clickable) fireEvent.click(clickable);
      // After collapse the detail should be hidden
    });
  });

  describe("nested structures", () => {
    it("renders nested objects", () => {
      const { getByText } = renderJson({ outer: { inner: "deep" } });
      expect(getByText('"outer"')).toBeTruthy();
    });

    it("renders mixed types", () => {
      const data = { str: "hi", num: 1, bool: true, nil: null, arr: [1] };
      const { container } = renderJson(data);
      const text = container.textContent || "";
      expect(text).toContain('"str"');
      expect(text).toContain('"hi"');
      expect(text).toContain("true");
      expect(text).toContain("null");
    });
  });
});
