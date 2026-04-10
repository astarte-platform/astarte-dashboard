import { Validator, ValidationError, type Schema } from 'jsonschema';
import {
  createErrorHandler,
  getDefaultFormState,
  toErrorList,
  toErrorSchema,
  unwrapErrorHandler,
  validationDataMerge,
} from '@rjsf/utils';
import type {
  CustomValidator,
  ErrorSchema,
  ErrorTransformer,
  FormContextType,
  RJSFSchema,
  RJSFValidationError,
  StrictRJSFSchema,
  UiSchema,
  ValidatorType,
} from '@rjsf/utils';

/**
 * Converts a `jsonschema` ValidationError into the RJSFValidationError shape
 * expected by the rjsf form machinery and user-supplied `transformErrors`
 * callbacks.
 */
function toRJSFValidationErrors(errors: ValidationError[]): RJSFValidationError[] {
  return errors.map((e) => {
    // jsonschema `property` is like "instance", "instance.fieldName", "instance[0].x"
    // Strip the leading "instance" to get the rjsf-style dotted path.
    let property = e.property.replace(/^instance/, '');

    // For `required` errors the failing property is the *parent* object and
    // e.argument is the name of the missing field — mirror what the AJV
    // validator does by appending it.
    if (e.name === 'required' && typeof e.argument === 'string') {
      property = property ? `${property}.${e.argument}` : `.${e.argument}`;
    }

    // Ensure a leading dot so callers can do `error.property === '.fieldName'`
    if (property && !property.startsWith('.') && !property.startsWith('[')) {
      property = `.${property}`;
    }

    const { message } = e;
    const stack = property ? `${property} ${message}`.trim() : message;

    // Keep a minimal `params` bag so that any `transformErrors` callbacks that
    // inspect keyword-specific params (e.g. pattern, required) still work.
    const params: Record<string, unknown> =
      e.argument !== undefined
        ? { [e.name === 'required' ? 'missingProperty' : e.name]: e.argument }
        : {};

    const schemaPath =
      typeof e.schema === 'object'
        ? ((e.schema as Schema).id ?? (e.schema as Schema).$id ?? '')
        : '';

    return {
      name: e.name,
      property: property || '.',
      message,
      params,
      stack,
      schemaPath: schemaPath as string,
    };
  });
}

class EvalFreeValidator<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> implements ValidatorType<T, S, F>
{
  isValid(schema: S, formData: T | undefined, rootSchema: S): boolean {
    try {
      const v = new Validator();
      const rootId =
        ((rootSchema as Record<string, unknown>)?.$id as string | undefined) ??
        ((rootSchema as Record<string, unknown>)?.id as string | undefined);
      if (rootSchema && rootId) {
        v.addSchema(rootSchema as unknown as Schema, rootId);
      }
      const result = v.validate(formData, schema as unknown as Schema);
      return result.valid;
    } catch {
      return false;
    }
  }

  rawValidation<Result = ValidationError>(
    schema: S,
    formData?: T,
  ): { errors?: Result[]; validationError?: Error } {
    try {
      const v = new Validator();
      const result = v.validate(formData, schema as unknown as Schema, { nestedErrors: true });
      return { errors: result.errors as unknown as Result[] };
    } catch (e) {
      return { validationError: e as Error };
    }
  }

  validateFormData(
    formData: T | undefined,
    schema: S,
    customValidate?: CustomValidator<T, S, F>,
    transformErrors?: ErrorTransformer<T, S, F>,
    uiSchema?: UiSchema<T, S, F>,
  ): { errors: RJSFValidationError[]; errorSchema: ErrorSchema<T> } {
    const { errors: rawErrors = [], validationError } = this.rawValidation<ValidationError>(
      schema,
      formData,
    );

    let errors = toRJSFValidationErrors(rawErrors as ValidationError[]);

    if (validationError) {
      errors = [...errors, { stack: validationError.message }];
    }

    if (typeof transformErrors === 'function') {
      errors = transformErrors(errors, uiSchema);
    }

    let errorSchema = toErrorSchema(errors) as ErrorSchema<T>;

    if (validationError) {
      errorSchema = {
        ...errorSchema,
        $schema: { __errors: [validationError.message] } as ErrorSchema<T>,
      };
    }

    if (typeof customValidate !== 'function') {
      return { errors, errorSchema };
    }

    const newFormData = getDefaultFormState(this, schema, formData, schema, true) as T;
    const errorHandler = customValidate(newFormData, createErrorHandler<T>(newFormData), uiSchema);
    const userErrorSchema = unwrapErrorHandler(errorHandler);
    return validationDataMerge({ errors, errorSchema }, userErrorSchema);
  }

  toErrorList(errorSchema?: ErrorSchema<T>, fieldPath: string[] = []): RJSFValidationError[] {
    return toErrorList(errorSchema, fieldPath);
  }
}

const evalFreeValidator = new EvalFreeValidator();
export default evalFreeValidator;
