interface IRuleVersionValidationDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly path?: readonly string[];
}

interface IRuleVersionValidationResult {
  readonly diagnostics: readonly IRuleVersionValidationDiagnostic[];
  readonly isValid: boolean;
}

export {type IRuleVersionValidationDiagnostic, type IRuleVersionValidationResult};
