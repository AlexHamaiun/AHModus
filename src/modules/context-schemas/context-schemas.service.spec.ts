import {ConflictException, NotFoundException} from '@nestjs/common';

import type {IDatabaseService} from '../../infrastructure/database/database.service';
import {PostgresErrorCode} from '../../infrastructure/database/enums';
import {
  ContextSchemaNodeKind,
  ContextSchemaValidationDiagnosticCode,
  ContextSchemaValueType,
} from './enums';
import type {IContextSchemasRepository} from './context-schemas.repository';
import {ContextSchemaValidatorService} from './context-schema-validator.service';
import {ContextSchemasService} from './context-schemas.service';
import type {ContextSchemaDraft, ContextSchemaDefinition, CreateContextSchemaInput} from './types';

describe('ContextSchemasService', () => {
  const createContextSchemaInput = {
    definition: {
      kind: ContextSchemaNodeKind.Object,
      properties: {
        cart: {
          kind: ContextSchemaNodeKind.Object,
          properties: {
            total: {
              kind: ContextSchemaNodeKind.Value,
              valueType: ContextSchemaValueType.Number,
            },
          },
        },
      },
    },
    key: 'checkout-context',
    name: 'Checkout context',
  } satisfies CreateContextSchemaInput;

  const createContextSchemaDraft = (): ContextSchemaDraft => {
    const createdAt = new Date('2026-08-06T00:00:00.000Z');

    return {
      contextSchema: {
        activeVersionId: 'context-schema-version-id',
        archivedAt: null,
        createdAt,
        description: null,
        id: 'context-schema-id',
        key: createContextSchemaInput.key,
        name: createContextSchemaInput.name,
        updatedAt: createdAt,
      },
      version: {
        contextSchemaId: 'context-schema-id',
        createdAt,
        createdBy: null,
        definition: createContextSchemaInput.definition,
        id: 'context-schema-version-id',
        version: 1,
      },
    };
  };

  const createService = (repository: IContextSchemasRepository) => {
    const executeInTransaction = jest.fn((operation: () => Promise<ContextSchemaDraft>) =>
      operation(),
    );
    const databaseService = {executeInTransaction} as unknown as IDatabaseService;
    const service = new ContextSchemasService(
      databaseService,
      repository,
      new ContextSchemaValidatorService(),
    );

    return {executeInTransaction, service};
  };

  it('validates the definition and creates the schema draft in one transaction', async () => {
    const create = jest.fn().mockResolvedValue(createContextSchemaDraft());
    const repository = {create} as unknown as IContextSchemasRepository;
    const {executeInTransaction, service} = createService(repository);

    await expect(service.create(createContextSchemaInput)).resolves.toEqual(
      createContextSchemaDraft(),
    );
    expect(executeInTransaction).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(createContextSchemaInput);
  });

  it('rejects an invalid definition before opening a transaction', async () => {
    const create = jest.fn();
    const repository = {create} as unknown as IContextSchemasRepository;
    const {executeInTransaction, service} = createService(repository);
    const input = {
      ...createContextSchemaInput,
      definition: {
        kind: ContextSchemaNodeKind.Object,
        properties: [],
      } as unknown as ContextSchemaDefinition,
    };

    await expect(service.create(input)).rejects.toMatchObject({
      response: {
        code: ContextSchemaValidationDiagnosticCode.InvalidNode,
        message: 'Object context schema node at "$" must define an object "properties" field.',
      },
    });
    expect(executeInTransaction).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('translates a duplicate key into a conflict response', async () => {
    const create = jest.fn().mockRejectedValue({code: PostgresErrorCode.UniqueViolation});
    const repository = {create} as unknown as IContextSchemasRepository;
    const {service} = createService(repository);

    await expect(service.create(createContextSchemaInput)).rejects.toThrow(ConflictException);
    await expect(service.create(createContextSchemaInput)).rejects.toThrow(
      'Entity "context schema" with key "checkout-context" already exists.',
    );
  });

  it('finds a context schema by key', async () => {
    const contextSchemaDraft = createContextSchemaDraft();
    const findByKey = jest.fn().mockResolvedValue(contextSchemaDraft.contextSchema);
    const repository = {findByKey} as unknown as IContextSchemasRepository;
    const {service} = createService(repository);

    await expect(service.findByKey('checkout-context')).resolves.toEqual(
      contextSchemaDraft.contextSchema,
    );
    expect(findByKey).toHaveBeenCalledWith('checkout-context');
  });

  it('rejects an unknown context schema key', async () => {
    const findByKey = jest.fn().mockResolvedValue(undefined);
    const repository = {findByKey} as unknown as IContextSchemasRepository;
    const {service} = createService(repository);

    await expect(service.findByKey('unknown-context')).rejects.toThrow(NotFoundException);
  });

  it('finds versions by context schema key', async () => {
    const contextSchemaDraft = createContextSchemaDraft();
    const findByKey = jest.fn().mockResolvedValue(contextSchemaDraft.contextSchema);
    const findVersionsByContextSchemaId = jest.fn().mockResolvedValue([contextSchemaDraft.version]);
    const repository = {
      findByKey,
      findVersionsByContextSchemaId,
    } as unknown as IContextSchemasRepository;
    const {service} = createService(repository);

    await expect(service.findVersionsByContextSchemaKey('checkout-context')).resolves.toEqual([
      contextSchemaDraft.version,
    ]);
    expect(findVersionsByContextSchemaId).toHaveBeenCalledWith('context-schema-id');
  });
});
