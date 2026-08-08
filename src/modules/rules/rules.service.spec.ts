import type {IDatabaseService} from '../../infrastructure/database/database.service';
import {ContextSchemaNodeKind} from '../context-schemas/enums';
import type {IContextSchemasService} from '../context-schemas/context-schemas.service';
import type {ContextSchemaVersion} from '../context-schemas/types';
import {RuleVersionValidationStatus} from './enums';
import type {IRulesRepository} from './rules.repository';
import type {IRuleVersionsRepository} from './rule-versions.repository';
import {RulesService} from './rules.service';
import type {
  CreateRuleByContextSchemaInput,
  CreateRuleVersionByContextSchemaInput,
  Rule,
  RuleDraft,
  RuleVersion,
} from './types';

describe('RulesService', () => {
  const createService = (
    rulesRepository: IRulesRepository,
    ruleVersionsRepository: IRuleVersionsRepository,
    contextSchemasService: IContextSchemasService,
  ) => {
    let isTransactionActive = false;
    const startPhysicalTransaction = jest.fn();
    const executeInTransaction = jest.fn(async <TResult>(operation: () => Promise<TResult>) => {
      if (isTransactionActive) {
        return operation();
      }

      startPhysicalTransaction();
      isTransactionActive = true;

      try {
        return await operation();
      } finally {
        isTransactionActive = false;
      }
    });
    const databaseService = {executeInTransaction} as unknown as IDatabaseService;
    const service = new RulesService(
      databaseService,
      rulesRepository,
      ruleVersionsRepository,
      contextSchemasService,
    );

    return {executeInTransaction, service, startPhysicalTransaction};
  };

  it('creates a rule and its first version in one physical transaction', async () => {
    const input = {
      contextSchemaKey: 'checkout_context',
      expression: 'cart.total * 0.15',
      key: 'discount',
      name: 'Discount',
    } satisfies CreateRuleByContextSchemaInput;
    const contextSchemaVersion = {
      id: 'context-schema-version-id',
    } as ContextSchemaVersion;
    const rule: Rule = {
      activeVersionId: null,
      archivedAt: null,
      createdAt: new Date('2026-08-08T00:00:00.000Z'),
      description: null,
      id: 'rule-id',
      key: input.key,
      name: input.name,
      updatedAt: new Date('2026-08-08T00:00:00.000Z'),
    };
    const version: RuleVersion = {
      contextSchemaVersionId: contextSchemaVersion.id,
      createdAt: new Date('2026-08-08T00:00:00.000Z'),
      createdBy: null,
      expression: input.expression,
      id: 'rule-version-id',
      publishedAt: null,
      ruleId: rule.id,
      validationResult: null,
      validationStatus: RuleVersionValidationStatus.Pending,
      version: 1,
    };
    const draft: RuleDraft = {rule, version};
    const create = jest.fn().mockResolvedValue(rule);
    const createNextVersion = jest.fn().mockResolvedValue(version);
    const findActiveVersionByKey = jest.fn().mockResolvedValue(contextSchemaVersion);
    const rulesRepository = {create} as unknown as IRulesRepository;
    const ruleVersionsRepository = {createNextVersion} as unknown as IRuleVersionsRepository;
    const contextSchemasService = {findActiveVersionByKey} as unknown as IContextSchemasService;
    const {executeInTransaction, service, startPhysicalTransaction} = createService(
      rulesRepository,
      ruleVersionsRepository,
      contextSchemasService,
    );

    await expect(service.createByContextSchema(input)).resolves.toEqual(draft);
    expect(executeInTransaction).toHaveBeenCalledTimes(2);
    expect(startPhysicalTransaction).toHaveBeenCalledTimes(1);
    expect(findActiveVersionByKey).toHaveBeenCalledWith(input.contextSchemaKey);
    expect(create).toHaveBeenCalledWith({
      description: undefined,
      key: input.key,
      name: input.name,
    });
    expect(createNextVersion).toHaveBeenCalledWith(rule.id, {
      contextSchemaVersionId: contextSchemaVersion.id,
      expression: input.expression,
    });
  });

  it('creates the next pending rule version in one transaction', async () => {
    const createdAt = new Date('2026-08-08T00:00:00.000Z');
    const rule: Rule = {
      activeVersionId: null,
      archivedAt: null,
      createdAt,
      description: null,
      id: 'rule-id',
      key: 'discount',
      name: 'Discount',
      updatedAt: createdAt,
    };
    const input = {
      contextSchemaKey: 'checkout_context',
      expression: 'cart.total * 0.15',
    } satisfies CreateRuleVersionByContextSchemaInput;
    const contextSchemaVersion: ContextSchemaVersion = {
      contextSchemaId: 'context-schema-id',
      createdAt,
      createdBy: null,
      definition: {
        kind: ContextSchemaNodeKind.Object,
        properties: {},
      },
      id: 'context-schema-version-id',
      version: 1,
    };
    const version: RuleVersion = {
      contextSchemaVersionId: contextSchemaVersion.id,
      createdAt,
      createdBy: null,
      expression: input.expression,
      id: 'rule-version-id',
      publishedAt: null,
      ruleId: rule.id,
      validationResult: null,
      validationStatus: RuleVersionValidationStatus.Pending,
      version: 2,
    };
    const findByKeyForUpdate = jest.fn().mockResolvedValue(rule);
    const createNextVersion = jest.fn().mockResolvedValue(version);
    const findActiveVersionByKey = jest.fn().mockResolvedValue(contextSchemaVersion);
    const rulesRepository = {findByKeyForUpdate} as unknown as IRulesRepository;
    const ruleVersionsRepository = {createNextVersion} as unknown as IRuleVersionsRepository;
    const contextSchemasService = {findActiveVersionByKey} as unknown as IContextSchemasService;
    const {executeInTransaction, service, startPhysicalTransaction} = createService(
      rulesRepository,
      ruleVersionsRepository,
      contextSchemasService,
    );

    await expect(service.createVersionByRuleKey(rule.key, input)).resolves.toEqual(version);
    expect(executeInTransaction).toHaveBeenCalledTimes(1);
    expect(startPhysicalTransaction).toHaveBeenCalledTimes(1);
    expect(findByKeyForUpdate).toHaveBeenCalledWith(rule.key);
    expect(findActiveVersionByKey).toHaveBeenCalledWith(input.contextSchemaKey);
    expect(createNextVersion).toHaveBeenCalledWith(rule.id, {
      contextSchemaVersionId: contextSchemaVersion.id,
      expression: input.expression,
    });
  });
});
