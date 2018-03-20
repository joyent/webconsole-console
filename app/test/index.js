'use strict';

const Fs = require('fs');
const Path = require('path');
const { expect } = require('code');
const { graphql } = require('graphi');
const Hapi = require('hapi');
const Lab = require('lab');
const WebConsole = require('../lib/');
const schema = Fs.readFileSync(Path.join(__dirname, '../lib/schema.graphql'));

const lab = exports.lab = Lab.script();
const { describe, it } = lab;

const register = {
  plugin: WebConsole,
  options: {
    baseUrl: 'http://localhost'
  }
};

describe('WebConsole', () => {
  it('can be registered with hapi', async () => {
    const server = new Hapi.Server();
    await server.register(register);
  });

  it('has a resolver for every query and mutation in the schema', async () => {
    const fields = [];
    const parsed = graphql.parse(schema.toString());
    for (const def of parsed.definitions) {
      if (def.kind !== 'ObjectTypeDefinition' || (def.name.value !== 'Query' && def.name.value !== 'Mutation')) {
        continue;
      }

      for (const field of def.fields) {
        fields.push(field.name.value);
      }
    }

    const server = new Hapi.Server();
    await server.register(register);
    await server.initialize();
    const paths = server.table().map((route) => {
      return route.path.substr(1);
    });

    for (const field of fields) {
      expect(paths).to.contain(field);
    }
  });
});
