import { parseCommitMessage } from "../../../src/parse-commit-message.js";
import { indented } from "../../helper/indented.js";
import { when } from "../../helper/jest-dsl.js";

const YAMLFragmentSchemaViolations = [
  [
    "that is not an object",
    indented`
      []
      `,
    indented`
        - must be object
      `,
  ],
  [
    "that is missing the updated-dependencies property",
    indented`
      {}
      `,
    indented`
        - must have required property 'updated-dependencies'
      `,
  ],
  [
    "with an updated-dependencies property that is not an array",
    indented`
      updated-dependencies: null
      `,
    indented`
        - must be array (/updated-dependencies)
      `,
  ],
  [
    "with an updated-dependencies property that contains an item that is not an object",
    indented`
      updated-dependencies:
      - []
      `,
    indented`
        - must be object (/updated-dependencies/0)
      `,
  ],
  [
    "with an updated-dependencies property that contains an item that is missing the dependency-name property",
    indented`
      updated-dependencies:
      - dependency-type: direct:production
      `,
    indented`
        - must have required property 'dependency-name' (/updated-dependencies/0)
      `,
  ],
  [
    "with an updated-dependencies property that contains an item with a dependency-name property that is not a string",
    indented`
      updated-dependencies:
      - dependency-name: {}
        dependency-type: direct:production
      `,
    indented`
        - must be string (/updated-dependencies/0/dependency-name)
      `,
  ],
  [
    "with an updated-dependencies property that contains an item that is missing the dependency-type property",
    indented`
      updated-dependencies:
      - dependency-name: coffee-rails
      `,
    indented`
        - must have required property 'dependency-type' (/updated-dependencies/0)
      `,
  ],
  [
    "with an updated-dependencies property that contains an item with a dependency-type property that is not a string",
    indented`
      updated-dependencies:
      - dependency-name: coffee-rails
        dependency-type: 111
      `,
    indented`
        - must be string (/updated-dependencies/0/dependency-type)
        - must be one of "direct:production", "direct:development", "indirect" (/updated-dependencies/0/dependency-type)
      `,
  ],
  [
    "with an updated-dependencies property that contains an item with a dependency-type property that is not one of the allowed values",
    indented`
      updated-dependencies:
      - dependency-name: coffee-rails
        dependency-type: invalid-type
      `,
    indented`
        - must be one of "direct:production", "direct:development", "indirect" (/updated-dependencies/0/dependency-type)
      `,
  ],
] as const;

describe("parseCommitMessage()", () => {
  let message: string;

  describe("validation", () => {
    when`
      the message does not contain a YAML fragment
    `(() => {
      beforeEach(() => {
        message = "Bumps coffee-rails from 4.0.1 to 4.2.2.";
      });

      it("should throw", () => {
        expect(() => parseCommitMessage(message)).toThrow(
          "Unable to parse Dependabot commit message: YAML fragment not found."
        );
      });
    });

    when`
      the message contains a YAML fragment that is not valid YAML
    `(() => {
      beforeEach(() => {
        message = indented`
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
          "Unable to parse Dependabot commit message: Invalid YAML fragment: Unable to parse YAML:"
        );
      });
    });

    describe.each(YAMLFragmentSchemaViolations)(
      "when the message contains a YAML fragment %s",
      (_description, fragment, expectedErrors) => {
        beforeEach(() => {
          message = indented`
            Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
            - [Release notes](https://github.com/rails/coffee-rails/releases)
            - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
            - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

            ---
            ${fragment}
            ...

            Signed-off-by: dependabot[bot] <support@github.com>
            `;
        });

        it("should throw", () => {
          expect(() => parseCommitMessage(message)).toThrow(
            indented`
              Unable to parse Dependabot commit message: Invalid YAML fragment:
              ${expectedErrors}
              `
          );
        });
      }
    );
  });

  when`
    the message contains a YAML fragment with a single dependency
  `(() => {
    beforeEach(() => {
      message = indented`
        Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
        - [Release notes](https://github.com/rails/coffee-rails/releases)
        - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
        - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

        ---
        updated-dependencies:
        - dependency-name: coffee-rails
          dependency-type: direct:production
        ...

        Signed-off-by: dependabot[bot] <support@github.com>
        `;
    });

    it("should parse the updated dependency", () => {
      expect(parseCommitMessage(message)).toMatchObject({
        updatedDependencies: [
          {
            dependencyName: "coffee-rails",
            dependencyType: "direct:production",
          },
        ],
      });
    });
  });

  when`
    the message contains a YAML fragment with multiple dependencies
  `(() => {
    beforeEach(() => {
      message = indented`
        Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
        - [Release notes](https://github.com/rails/coffee-rails/releases)
        - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
        - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

        ---
        updated-dependencies:
        - dependency-name: coffee-rails
          dependency-type: direct:production
          update-type: version-update:semver-minor
        - dependency-name: coffeescript
          dependency-type: indirect
          update-type: version-update:semver-patch
        ...

        Signed-off-by: dependabot[bot] <support@github.com>
        `;
    });

    it("should parse the updated dependencies", () => {
      expect(parseCommitMessage(message)).toMatchObject({
        updatedDependencies: [
          {
            dependencyName: "coffee-rails",
            dependencyType: "direct:production",
          },
          {
            dependencyName: "coffeescript",
            dependencyType: "indirect",
          },
        ],
      });
    });
  });
});
