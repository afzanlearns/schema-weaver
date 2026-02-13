import { describe, it, expect } from "vitest";
import { parseSQL } from "@/lib/sql-parser";
import { SAMPLE_SIMPLE, SAMPLE_INLINE_FK, SAMPLE_WORDPRESS } from "@/lib/sample-sql";

describe("SQL Parser", () => {
  describe("Simple Blog schema", () => {
    const result = parseSQL(SAMPLE_SIMPLE);

    it("should parse 3 tables", () => {
      expect(result.tables).toHaveLength(3);
      expect(result.tables.map((t) => t.name)).toEqual(["users", "posts", "comments"]);
    });

    it("should detect primary keys", () => {
      const users = result.tables[0];
      const pkCol = users.columns.find((c) => c.name === "id");
      expect(pkCol?.isPrimaryKey).toBe(true);
    });

    it("should detect foreign keys", () => {
      const posts = result.tables[1];
      const fkCol = posts.columns.find((c) => c.name === "user_id");
      expect(fkCol?.isForeignKey).toBe(true);
      expect(fkCol?.references?.table).toBe("users");
    });

    it("should find relationships", () => {
      expect(result.relationships.length).toBeGreaterThanOrEqual(3);
      const postToUser = result.relationships.find(
        (r) => r.fromTable === "posts" && r.toTable === "users"
      );
      expect(postToUser).toBeDefined();
      expect(postToUser?.onDelete).toBe("CASCADE");
    });

    it("should detect column types and nullable", () => {
      const posts = result.tables[1];
      const body = posts.columns.find((c) => c.name === "body");
      expect(body?.type).toBe("TEXT");
      expect(body?.nullable).toBe(true);

      const title = posts.columns.find((c) => c.name === "title");
      expect(title?.nullable).toBe(false);
    });

    it("should have no errors", () => {
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Inline FK schema", () => {
    const result = parseSQL(SAMPLE_INLINE_FK);

    it("should parse 4 tables", () => {
      expect(result.tables).toHaveLength(4);
    });

    it("should detect inline REFERENCES", () => {
      const employees = result.tables.find((t) => t.name === "employees");
      const deptId = employees?.columns.find((c) => c.name === "department_id");
      expect(deptId?.isForeignKey).toBe(true);
      expect(deptId?.references?.table).toBe("departments");
    });

    it("should detect self-referencing FK", () => {
      const employees = result.tables.find((t) => t.name === "employees");
      const managerId = employees?.columns.find((c) => c.name === "manager_id");
      expect(managerId?.isForeignKey).toBe(true);
      expect(managerId?.references?.table).toBe("employees");
    });

    it("should detect default values", () => {
      const projects = result.tables.find((t) => t.name === "projects");
      const status = projects?.columns.find((c) => c.name === "status");
      expect(status?.defaultValue).toBe("active");
    });
  });

  describe("WordPress-like schema", () => {
    const result = parseSQL(SAMPLE_WORDPRESS);

    it("should parse 5 tables", () => {
      expect(result.tables).toHaveLength(5);
    });

    it("should handle table-level PRIMARY KEY", () => {
      const users = result.tables.find((t) => t.name === "wp_users");
      const id = users?.columns.find((c) => c.name === "ID");
      expect(id?.isPrimaryKey).toBe(true);
    });

    it("should detect relationships", () => {
      const postAuthor = result.relationships.find(
        (r) => r.fromTable === "wp_posts" && r.fromColumn === "post_author"
      );
      expect(postAuthor).toBeDefined();
      expect(postAuthor?.toTable).toBe("wp_users");
    });
  });

  describe("Edge cases", () => {
    it("should handle missing semicolons gracefully", () => {
      const sql = `CREATE TABLE test (id INT PRIMARY KEY, name VARCHAR(50));`;
      const result = parseSQL(sql);
      expect(result.tables).toHaveLength(1);
    });

    it("should return error for empty input", () => {
      const result = parseSQL("");
      expect(result.tables).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle SQL comments", () => {
      const sql = `
        -- This is a comment
        CREATE TABLE test (
          id INT PRIMARY KEY, /* inline comment */
          name VARCHAR(50)
        );
      `;
      const result = parseSQL(sql);
      expect(result.tables).toHaveLength(1);
    });
  });
});
