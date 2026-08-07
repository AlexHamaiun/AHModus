import type {IDatabaseService} from '../../infrastructure/database/database.service';
import {ContextSchemaNodeKind} from '../context-schemas/enums';
import type {IContextSchemasService} from '../context-schemas/context-schemas.service';
import type {ContextSchemaVersion} from '../context-schemas/types';
import {RuleVersionValidationStatus} from './enums';
import type {IRulesRepository} from './rules.repository';
import {RulesService} from './rules.service';
import type {CreateRuleInput, CreateRuleVersionInput, Rule, RuleDraft, RuleVersion} from './types';

describe('RulesService', () => {
  const createService = (
    repository: IRulesRepository,
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
    const service = new RulesService(databaseService, repository, contextSchemasService);

    return {executeInTransaction, service, startPhysicalTransaction};
  };

  it('creates the next pending rule version in one transaction', async () => {
    const createdAt = new Date('2026-08-07T00:00:00.000Z');
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
    } satisfies CreateRuleVersionInput;
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
    const repository = {
      createNextVersion,
      findByKeyForUpdate,
    } as unknown as IRulesRepository;
    const contextSchemasService = {findActiveVersionByKey} as unknown as IContextSchemasService;
    const {executeInTransaction, service, startPhysicalTransaction} = createService(
      repository,
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

  it('creates a rule with the active context schema version in one transaction', async () => {
    const input = {
      contextSchemaKey: 'checkout_context',
      expression: 'cart.total * 0.15',
      key: 'discount',
      name: 'Discount',
    } satisfies CreateRuleInput;
    const contextSchemaVersion = {
      id: 'context-schema-version-id',
    } as ContextSchemaVersion;
    const draft: RuleDraft = {
      rule: {
        activeVersionId: null,
        archivedAt: null,
        createdAt: new Date('2026-08-07T00:00:00.000Z'),
        description: null,
        id: 'rule-id',
        key: input.key,
        name: input.name,
        updatedAt: new Date('2026-08-07T00:00:00.000Z'),
      },
      version: {
        contextSchemaVersionId: contextSchemaVersion.id,
        createdAt: new Date('2026-08-07T00:00:00.000Z'),
        createdBy: null,
        expression: input.expression,
        id: 'rule-version-id',
        publishedAt: null,
        ruleId: 'rule-id',
        validationResult: null,
        validationStatus: RuleVersionValidationStatus.Pending,
        version: 1,
      },
    };
    const create = jest.fn().mockResolvedValue(draft);
    const findActiveVersionByKey = jest.fn().mockResolvedValue(contextSchemaVersion);
    const repository = {create} as unknown as IRulesRepository;
    const contextSchemasService = {findActiveVersionByKey} as unknown as IContextSchemasService;
    const {executeInTransaction, service, startPhysicalTransaction} = createService(
      repository,
      contextSchemasService,
    );

    await expect(service.createRuleByContextSchema(input)).resolves.toEqual(draft);
    expect(executeInTransaction).toHaveBeenCalledTimes(1);
    expect(startPhysicalTransaction).toHaveBeenCalledTimes(1);
    expect(findActiveVersionByKey).toHaveBeenCalledWith(input.contextSchemaKey);
    expect(create).toHaveBeenCalledWith({
      contextSchemaVersionId: contextSchemaVersion.id,
      description: undefined,
      expression: input.expression,
      key: input.key,
      name: input.name,
    });
  });
});
