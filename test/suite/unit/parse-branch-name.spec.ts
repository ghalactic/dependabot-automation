import { parseBranchName } from "../../../src/parse-branch-name.js";
import { when } from "../../helper/jest-dsl.js";
import { wrapped } from "../../helper/wrapped.js";

describe("parseBranchName()", () => {
  let dependencies: string[];
  let branch: string;

  when`
    the dependencies are empty
  `(() => {
    beforeEach(() => {
      dependencies = [];
    });

    it("should throw", () => {
      expect(() =>
        parseBranchName(dependencies, "dependabot/nuget/coffee-rails"),
      ).toThrow(
        "Unable to parse Dependabot branch name: Dependency list must not be empty.",
      );
    });
  });

  when`
    the branch does not start with 'dependabot'
  `(() => {
    beforeEach(() => {
      branch = "non/dependabot/branch/name";
    });

    it("should throw", () => {
      expect(() => parseBranchName(["coffee-rails"], branch)).toThrow(
        wrapped`
          Unable to parse Dependabot branch name: Branch name
          "non/dependabot/branch/name" must start with "dependabot".
          `,
      );
    });
  });

  when`
    there is a single dependency with no slashes in the name
  `(() => {
    beforeEach(() => {
      dependencies = ["coffee-rails"];
    });

    when`
      the directory is the root
    `(() => {
      beforeEach(() => {
        branch = "dependabot/nuget/coffee-rails";
      });

      it("should parse the ecosystem and directory", () => {
        expect(parseBranchName(dependencies, branch)).toMatchObject({
          ecosystem: "nuget",
          directory: "/",
        });
      });
    });

    when`
      the directory is not the root
    `(() => {
      beforeEach(() => {
        branch = "dependabot/nuget/api/main/coffee-rails";
      });

      it("should parse the ecosystem and directory", () => {
        expect(parseBranchName(dependencies, branch)).toMatchObject({
          ecosystem: "nuget",
          directory: "/api/main",
        });
      });
    });
  });

  when`
    there is a single dependency with slashes in the name
  `(() => {
    beforeEach(() => {
      dependencies = ["rails/coffee"];
    });

    when`
      the directory is the root
    `(() => {
      beforeEach(() => {
        branch = "dependabot/nuget/rails/coffee";
      });

      it("should parse the ecosystem and directory", () => {
        expect(parseBranchName(dependencies, branch)).toMatchObject({
          ecosystem: "nuget",
          directory: "/",
        });
      });
    });

    when`
      the directory is not the root
    `(() => {
      beforeEach(() => {
        branch = "dependabot/nuget/api/rails/coffee";
      });

      it("should parse the ecosystem and directory", () => {
        expect(parseBranchName(dependencies, branch)).toMatchObject({
          ecosystem: "nuget",
          directory: "/api",
        });
      });
    });
  });

  when`
    there is a single dependency with symbols in its name which are missing from
    the branch name
  `(() => {
    beforeEach(() => {
      dependencies = ["@types/react-dom"];
    });

    when`
      the directory is the root
    `(() => {
      beforeEach(() => {
        branch = "dependabot/npm_and_yarn/@types/react-dom-18.0.11";
      });

      it("should parse the ecosystem and directory", () => {
        expect(parseBranchName(dependencies, branch)).toMatchObject({
          ecosystem: "npm_and_yarn",
          directory: "/",
        });
      });
    });

    when`
      the directory is not the root
    `(() => {
      beforeEach(() => {
        branch = "dependabot/npm_and_yarn/api/types/react-dom-18.0.11";
      });

      it("should parse the ecosystem and directory", () => {
        expect(parseBranchName(dependencies, branch)).toMatchObject({
          ecosystem: "npm_and_yarn",
          directory: "/api",
        });
      });
    });
  });

  when`
    there are multiple dependencies
  `(() => {
    beforeEach(() => {
      dependencies = ["jest", "@types/jest"];
    });

    when`
      the directory is the root
    `(() => {
      beforeEach(() => {
        branch = "dependabot/npm_and_yarn/jest-and-types/jest-29.4.2";
      });

      it("should parse the ecosystem and directory", () => {
        expect(parseBranchName(dependencies, branch)).toMatchObject({
          ecosystem: "npm_and_yarn",
          directory: "/",
        });
      });
    });

    when`
      the directory is not the root
    `(() => {
      beforeEach(() => {
        branch = "dependabot/npm_and_yarn/api/jest-and-types/jest-29.4.2";
      });

      it("should parse the ecosystem and directory", () => {
        expect(parseBranchName(dependencies, branch)).toMatchObject({
          ecosystem: "npm_and_yarn",
          directory: "/api",
        });
      });
    });
  });

  when`
    there are multiple dependencies and the first has symbols in its name which
    are missing from the branch name
  `(() => {
    beforeEach(() => {
      dependencies = ["@types/jest", "jest"];
    });

    when`
      the directory is the root
    `(() => {
      beforeEach(() => {
        branch = "dependabot/npm_and_yarn/jest-and-types/types/jest-29.4.2";
      });

      it("should parse the ecosystem and directory", () => {
        expect(parseBranchName(dependencies, branch)).toMatchObject({
          ecosystem: "npm_and_yarn",
          directory: "/",
        });
      });
    });

    when`
      the directory is not the root
    `(() => {
      beforeEach(() => {
        branch = "dependabot/npm_and_yarn/api/jest-and-types/types/jest-29.4.2";
      });

      it("should parse the ecosystem and directory", () => {
        expect(parseBranchName(dependencies, branch)).toMatchObject({
          ecosystem: "npm_and_yarn",
          directory: "/api",
        });
      });
    });
  });

  when`
    an alternative delimiter is used
  `(() => {
    beforeEach(() => {
      branch = "dependabot|nuget|coffee-rails";
    });

    it("should parse the ecosystem and directory", () => {
      expect(parseBranchName(["coffee-rails"], branch)).toMatchObject({
        ecosystem: "nuget",
        directory: "/",
      });
    });
  });
});
