import { parseCommitData } from "../../../src/parse-commit-data.js";
import { indented } from "../../helper/indented.js";
import { when } from "../../helper/jest-dsl.js";
import { wrapped } from "../../helper/wrapped.js";

const schemaViolations = [
  [
    wrapped`
      is not an object
      `,
    indented`
      []
      `,
    indented`
        - must be object
      `,
  ],
  [
    wrapped`
      is missing the updated-dependencies property
      `,
    indented`
      {}
      `,
    indented`
        - must have required property 'updated-dependencies'
      `,
  ],
  [
    wrapped`
      has an updated-dependencies property that is not an array
      `,
    indented`
      updated-dependencies: null
      `,
    indented`
        - must be array (/updated-dependencies)
      `,
  ],
  [
    wrapped`
      has an updated-dependencies property that contains an item that is not an
      object
      `,
    indented`
      updated-dependencies:
      - []
      `,
    indented`
        - must be object (/updated-dependencies/0)
      `,
  ],
  [
    wrapped`
      has an updated-dependencies property that contains an item that is missing
      the dependency-name property
      `,
    indented`
      updated-dependencies:
      - dependency-type: direct:production
      `,
    indented`
        - must have required property 'dependency-name' (/updated-dependencies/0)
      `,
  ],
  [
    wrapped`
      has an updated-dependencies property that contains an item with a
      dependency-name property that is not a string
      `,
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
    wrapped`
      has an updated-dependencies property that contains an item that is missing
      the dependency-type property
      `,
    indented`
      updated-dependencies:
      - dependency-name: coffee-rails
      `,
    indented`
        - must have required property 'dependency-type' (/updated-dependencies/0)
      `,
  ],
  [
    wrapped`
      has an updated-dependencies property that contains an item with a
      dependency-type property that is not a string
    `,
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
    wrapped`
      has an updated-dependencies property that contains an item with a
      dependency-type property that is not one of the allowed values
      `,
    indented`
      updated-dependencies:
      - dependency-name: coffee-rails
        dependency-type: invalid-type
      `,
    indented`
        - must be one of "direct:production", "direct:development", "indirect" (/updated-dependencies/0/dependency-type)
      `,
  ],
  [
    wrapped`
      has an updated-dependencies property that contains an item with an
      update-type property that is not a string
    `,
    indented`
      updated-dependencies:
      - dependency-name: coffee-rails
        dependency-type: direct:production
        update-type: null
      `,
    indented`
        - must be string (/updated-dependencies/0/update-type)
        - must be one of "version-update:semver-major", "version-update:semver-minor", "version-update:semver-patch" (/updated-dependencies/0/update-type)
      `,
  ],
  [
    wrapped`
      has an updated-dependencies property that contains an item with an
      update-type property that is not one of the allowed values
    `,
    indented`
      updated-dependencies:
      - dependency-name: coffee-rails
        dependency-type: direct:production
        update-type: invalid-type
      `,
    indented`
        - must be one of "version-update:semver-major", "version-update:semver-minor", "version-update:semver-patch" (/updated-dependencies/0/update-type)
      `,
  ],
] as const;

describe("parseCommitData()", () => {
  let yaml: string;

  describe("validation", () => {
    when`
      the commit data is not valid YAML
    `(() => {
      beforeEach(() => {
        yaml = indented`
          {
          `;
      });

      it("should throw", () => {
        expect(() => parseCommitData(yaml)).toThrow(
          "Invalid commit data: Unable to parse YAML:",
        );
      });
    });

    describe.each(schemaViolations)(
      "when the commit data %s",
      (_description, yaml, expectedErrors) => {
        it("should throw", () => {
          expect(() => parseCommitData(yaml)).toThrow(
            indented`
              Invalid commit data:
              ${expectedErrors}
              `,
          );
        });
      },
    );
  });

  when`
    the commit data has a single updated dependency
  `(() => {
    beforeEach(() => {
      yaml = indented`
        updated-dependencies:
        - dependency-name: coffee-rails
          dependency-type: direct:production
        `;
    });

    it("should parse the updated dependency", () => {
      expect(parseCommitData(yaml)).toMatchObject({
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
    the commit data has multiple updated dependencies
  `(() => {
    beforeEach(() => {
      yaml = indented`
        updated-dependencies:
        - dependency-name: coffee-rails
          dependency-type: direct:production
          update-type: version-update:semver-minor
        - dependency-name: coffeescript
          dependency-type: indirect
          update-type: version-update:semver-patch
        `;
    });

    it("should parse the updated dependencies", () => {
      expect(parseCommitData(yaml)).toMatchObject({
        updatedDependencies: [
          {
            dependencyName: "coffee-rails",
            dependencyType: "direct:production",
            updateType: "version-update:semver-minor",
          },
          {
            dependencyName: "coffeescript",
            dependencyType: "indirect",
            updateType: "version-update:semver-patch",
          },
        ],
      });
    });
  });
});
