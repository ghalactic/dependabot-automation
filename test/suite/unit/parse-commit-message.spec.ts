import { parseCommitMessage } from "../../../src/parse-commit-message.js";
import { indented } from "../../helper/indented.js";
import { when } from "../../helper/jest-dsl.js";

describe("parseCommitMessage()", () => {
  let message: string;

  describe("validation", () => {
    when`
      the message does not contain YAML fragment data
    `(() => {
      beforeEach(() => {
        message = "Bumps coffee-rails from 4.0.1 to 4.2.2.";
      });

      it("should throw", () => {
        expect(() => parseCommitMessage(message)).toThrow(
          "Unable to parse Dependabot commit message: Commit data not found.",
        );
      });
    });

    when`
      the message contains YAML fragment data that is not valid YAML
    `(() => {
      beforeEach(() => {
        message = indented`
          <commit subject line>

          Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
          - [Release notes](https://github.com/rails/coffee-rails/releases)
          - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
          - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

          ---
          {
          ...

          Signed-off-by: dependabot[bot] <support@github.com>
          `;
      });

      it("should throw", () => {
        expect(() => parseCommitMessage(message)).toThrow(
          "Unable to parse Dependabot commit message: Invalid commit data: Unable to parse YAML:",
        );
      });
    });

    when`
      the message contains YAML fragment data that does not match the schema
    `(() => {
      beforeEach(() => {
        message = indented`
          <commit subject line>

          Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
          - [Release notes](https://github.com/rails/coffee-rails/releases)
          - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
          - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

          ---
          updated-dependencies:
          - dependency-name: {}
            dependency-type: direct:production
          ...

          Signed-off-by: dependabot[bot] <support@github.com>
          `;
      });

      it("should throw", () => {
        expect(() => parseCommitMessage(message)).toThrow(
          indented`
            Unable to parse Dependabot commit message: Invalid commit data:
              - must be string (/updated-dependencies/0/dependency-name)
            `,
        );
      });
    });
  });

  when`
    the message contains a single updated dependency
  `(() => {
    beforeEach(() => {
      message = indented`
        <commit subject line>

        Bumps [@types/react-dom](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/react-dom) from 18.0.10 to 18.0.11.
        - [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
        - [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/react-dom)

        ---
        updated-dependencies:
        - dependency-name: "@types/react-dom"
          dependency-type: direct:development
          update-type: version-update:semver-patch
        ...

        Signed-off-by: dependabot[bot] <support@github.com>
        `;
    });

    it("should parse the updated dependencies", () => {
      expect(parseCommitMessage(message)).toMatchObject({
        updatedDependencies: [
          {
            dependencyName: "@types/react-dom",
            dependencyType: "direct:development",
            updateType: "version-update:semver-patch",
          },
        ],
      });
    });
  });

  when`
    the message contains multiple updated dependencies
  `(() => {
    beforeEach(() => {
      message = indented`
        <commit subject line>

        Bumps [jest](https://github.com/facebook/jest/tree/HEAD/packages/jest) and [@types/jest](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/jest). These dependencies needed to b>

        Updates \`jest\` from 29.3.1 to 29.4.2
        - [Release notes](https://github.com/facebook/jest/releases)
        - [Changelog](https://github.com/facebook/jest/blob/main/CHANGELOG.md)
        - [Commits](https://github.com/facebook/jest/commits/v29.4.2/packages/jest)

        Updates \`@types/jest\` from 29.2.5 to 29.4.0
        - [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
        - [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/jest)

        ---
        updated-dependencies:
        - dependency-name: jest
          dependency-type: direct:development
          update-type: version-update:semver-minor
        - dependency-name: "@types/jest"
          dependency-type: direct:development
          update-type: version-update:semver-minor
        ...

        Signed-off-by: dependabot[bot] <support@github.com>
        `;
    });

    it("should parse the updated dependencies", () => {
      expect(parseCommitMessage(message)).toMatchObject({
        updatedDependencies: [
          {
            dependencyName: "jest",
            dependencyType: "direct:development",
            updateType: "version-update:semver-minor",
          },
          {
            dependencyName: "@types/jest",
            dependencyType: "direct:development",
            updateType: "version-update:semver-minor",
          },
        ],
      });
    });
  });
});
