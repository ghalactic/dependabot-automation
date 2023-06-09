import ajvModule, { ErrorObject } from "ajv";
import ajvErrorsModule from "ajv-errors";
import { schema as commitDataSchema } from "./commit-data/schema.js";

// see https://github.com/ajv-validator/ajv/issues/2132
const Ajv = ajvModule.default;
const ajvErrors = ajvErrorsModule.default;

const ajv = ajvErrors(
  new Ajv({
    schemas: [commitDataSchema],
    allErrors: true,
    useDefaults: true,
  }),
);

class ValidateError extends Error {
  public errors: ErrorObject[];

  constructor(message: string, errors: ErrorObject[]) {
    super(message);

    this.errors = errors;
  }
}

export function createValidate<T>(
  schemaId: string,
  label: string,
): (value: unknown) => T {
  return function validate(value) {
    const validator = ajv.getSchema(schemaId);
    if (!validator) throw new Error(`Undefined schema ${schemaId}`);

    if (validator(value)) return value as T;

    const errors = validator.errors ?? [];

    const error = new ValidateError(
      `Invalid ${label}:\n${renderErrors(errors)}`,
      errors,
    );

    throw error;
  };
}

function renderErrors(errors: ErrorObject[]): string {
  return `  - ${errors.map(renderError).join("\n  - ")}\n`;
}

function renderError(error: ErrorObject): string {
  const { instancePath, message } = error;
  const subject = instancePath && ` (${instancePath})`;

  return `${message}${subject}`;
}
