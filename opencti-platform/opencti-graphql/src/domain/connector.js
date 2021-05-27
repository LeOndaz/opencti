import { assoc, filter, includes, map, pipe } from 'ramda';
import { createEntity, deleteElementById, listEntities, loadById, patchAttribute } from '../database/middleware';
import { connectorConfig, registerConnectorQueues, unregisterConnector } from '../database/rabbitmq';
import { ENTITY_TYPE_CONNECTOR } from '../schema/internalObject';
import { FunctionalError } from '../config/errors';
import { now, sinceNowInMinutes } from '../utils/format';
import { logApp } from '../config/conf';
import { globalRedis } from '../database/redis';

const childProcess = require('child_process');

const fs = require('fs');
const yml = require('js-yaml');

const fsp = fs.promises;

export const CONNECTOR_INTERNAL_ENRICHMENT = 'INTERNAL_ENRICHMENT'; // Entity types to support (Report, Hash, ...) -> enrich-
export const CONNECTOR_INTERNAL_IMPORT_FILE = 'INTERNAL_IMPORT_FILE'; // Files mime types to support (application/json, ...) -> import-
export const CONNECTOR_INTERNAL_EXPORT_FILE = 'INTERNAL_EXPORT_FILE'; // Files mime types to generate (application/pdf, ...) -> export-

// region utils
const completeConnector = (connector) => {
  if (connector) {
    return pipe(
      assoc('connector_scope', connector.connector_scope ? connector.connector_scope.split(',') : []),
      assoc('config', connectorConfig(connector.id)),
      assoc('active', sinceNowInMinutes(connector.updated_at) < 5)
    )(connector);
  }
  return null;
};
// endregion

// region connectors
export const loadConnectorById = (user, id) => {
  return loadById(user, id, ENTITY_TYPE_CONNECTOR).then((connector) => completeConnector(connector));
};

export const connectors = (user) => {
  return listEntities(user, [ENTITY_TYPE_CONNECTOR], { connectionFormat: false }).then((elements) =>
    map((conn) => completeConnector(conn), elements)
  );
};

export const getConnectorsBaseDir = () => {
  return '/home/leondaz/crime_scene/connectors';
};

export const getIndexFilePath = () => {
  return `${getConnectorsBaseDir()}/index.json`;
};

export const offlineConnectorsDirs = () => {
  const baseDir = getConnectorsBaseDir();

  return fsp
    .readdir(baseDir)
    .then((names) => {
      return names
        .filter((name) => !name.startsWith('.'))
        .filter((name) => fs.lstatSync(`${baseDir}${name}`).isDirectory())
        .map((name) => `${baseDir}${name}`);
    })
    .catch((err) => logApp.error(err));
};

export const indexOfflineConnectors = () => {
  const baseDir = getConnectorsBaseDir();

  return offlineConnectorsDirs()
    .then((dirs) => {
      // const promises = [];
      const index = {};

      dirs.forEach((dir) => {
        const configPath = `${dir}/src/config.yml`;
        const name = dir.split('/').filter(Boolean).pop();
        index[name.toLowerCase()] = configPath;

        // const promise = fsp
        //   .readFile(configPath)
        //   .then((content) => {
        //     const ymlContent = yml.load(content);
        //     index[ymlContent.connector.name] = configPath;
        //   })
        //   .catch((err) => logApp.error(err));
        //
        // promises.push(promise);
      });

      return index;
    })
    .then((index) => fsp.writeFile(`${baseDir}/index.json`, JSON.stringify(index, undefined, 2)))
    .catch((err) => logApp.error(err));
};

export const getOfflineConnectorsIndex = () => {
  const indexPath = getIndexFilePath();
  return fsp.readFile(indexPath).then(JSON.parse).catch(indexOfflineConnectors);
};

export const offlineConnectorConfigByDirName = (user, name) => {
  return getOfflineConnectorsIndex().then((index) => {
    if (!index[name.toLowerCase()]) {
      throw FunctionalError('Connector with specified ID does not exist.');
    }

    return fsp.readFile(index[name]).then(yml.load).then(JSON.stringify);
  });
};

export const readOfflineConnectorConfig = (path) => {
  return fsp.readFile(`${path}/src/config.yml`).then((content) => {
    const ymlContent = yml.load(content);
    return {
      path,
      id: ymlContent.connector.id,
      name: ymlContent.connector.name,
      connector_type: ymlContent.connector.type,
      connector_scope: ymlContent.connector.scope,
    };
  });
};

export const offlineConnectors = (user) => {
  if (user) {
    logApp.info('AUTH');
  }

  return offlineConnectorsDirs()
    .then((dirs) => dirs.map((dir) => readOfflineConnectorConfig(dir)))
    .catch((err) => logApp.error(`ERROR IN OFFLINE CONNECTOR: ${err}`));
};

export const offlineConnectorByDirName = (user, dirName) =>
  offlineConnectorsDirs()
    .then((dirs) =>
      dirs.find((path) => {
        return path.split('/').filter(Boolean).pop() === dirName;
      })
    )
    .then((path) => readOfflineConnectorConfig(path));

export const connectorsFor = async (user, type, scope, onlyAlive = false, onlyAuto = false, onlyContextual = false) => {
  const connects = await connectors(user);
  return pipe(
    filter((c) => c.connector_type === type),
    filter((c) => (onlyAlive ? c.active === true : true)),
    filter((c) => (onlyAuto ? c.auto === true : true)),
    filter((c) => (onlyContextual ? c.only_contextual === true : true)),
    // eslint-disable-next-line prettier/prettier
    filter((c) =>
      scope && c.connector_scope && c.connector_scope.length > 0
        ? includes(
            scope.toLowerCase(),
            map((s) => s.toLowerCase(), c.connector_scope)
          )
        : true
    )
  )(connects);
};

export const connectorsForExport = async (user, scope, onlyAlive = false) => {
  return connectorsFor(user, CONNECTOR_INTERNAL_EXPORT_FILE, scope, onlyAlive);
};

export const connectorsForImport = async (user, scope, onlyAlive = false, onlyAuto = false, onlyContextual = false) => {
  return connectorsFor(user, CONNECTOR_INTERNAL_IMPORT_FILE, scope, onlyAlive, onlyAuto, onlyContextual);
};
// endregion

// region mutations
export const pingConnector = async (user, id, state) => {
  const creation = now();
  const connector = await loadById(user, id, ENTITY_TYPE_CONNECTOR);
  if (!connector) {
    throw FunctionalError('No connector found with the specified ID', { id });
  }
  if (connector.connector_state_reset === true) {
    const statePatch = { connector_state_reset: false };
    await patchAttribute(user, id, ENTITY_TYPE_CONNECTOR, statePatch);
  } else {
    const updatePatch = { updated_at: creation, connector_state: state };
    await patchAttribute(user, id, ENTITY_TYPE_CONNECTOR, updatePatch);
  }
  return loadById(user, id, 'Connector').then((data) => completeConnector(data));
};

export const resetStateConnector = async (user, id) => {
  const patch = { connector_state: '', connector_state_reset: true };
  await patchAttribute(user, id, ENTITY_TYPE_CONNECTOR, patch);
  return loadById(user, id, ENTITY_TYPE_CONNECTOR).then((data) => completeConnector(data));
};

export const registerConnector = async (user, connectorData) => {
  // eslint-disable-next-line camelcase
  const { id, name, type, scope, auto = null, only_contextual = null } = connectorData;
  const connector = await loadById(user, id, ENTITY_TYPE_CONNECTOR);
  // Register queues
  await registerConnectorQueues(id, name, type, scope);
  if (connector) {
    // Simple connector update
    const patch = {
      name,
      updated_at: now(),
      connector_user_id: user.id,
      connector_scope: scope && scope.length > 0 ? scope.join(',') : null,
      auto,
      only_contextual,
    };
    await patchAttribute(user, id, ENTITY_TYPE_CONNECTOR, patch);
    return loadById(user, id, ENTITY_TYPE_CONNECTOR).then((data) => completeConnector(data));
  }
  // Need to create the connector
  const connectorToCreate = {
    internal_id: id,
    name,
    connector_type: type,
    connector_scope: scope && scope.length > 0 ? scope.join(',') : null,
    auto,
    only_contextual,
    connector_user_id: user.id,
  };
  const createdConnector = await createEntity(user, connectorToCreate, ENTITY_TYPE_CONNECTOR);
  // Return the connector
  return completeConnector(createdConnector);
};

export const runOfflineConnector = (user, dirName) => {
  // vul
  return offlineConnectorByDirName(dirName).then((offlineConnector) => {
    const ps = childProcess.spawn(`${offlineConnector.path}/entrypoint.sh`, { detached: true });

    process.on('close', (code) => {
      logApp.warn(`Process with ID: ${ps.pid} closed with: ${code}.`);
    });

    ps.stdout.on('data', () => {
      globalRedis.set(`PID_${offlineConnector.name}`, ps.pid.toString());
    });

    ps.stderr.on('data', (data) => {
      throw FunctionalError(`Process with ID: ${ps.pid} terminated: ${data}`);
    });

    return Promise.resolve(offlineConnector);
  });
};

export const connectorDelete = async (user, connectorId) => {
  // TODO Delete all works for this connector
  await unregisterConnector(connectorId);
  return deleteElementById(user, connectorId, ENTITY_TYPE_CONNECTOR);
};
// endregion

export const offlineConnectorModify = async (user, dirName, config) => {
  const ymlStr = yml.dump(config);

  return fsp.writeFile(`${getConnectorsBaseDir()}${dirName}/src/config.yml`, ymlStr).then(JSON.stringify);
};
