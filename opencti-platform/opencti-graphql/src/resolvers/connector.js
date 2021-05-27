import {
  connectorDelete,
  offlineConnectorByDirName,
  connectors,
  offlineConnectors,
  offlineConnectorModify,
  connectorsForExport,
  connectorsForImport,
  loadConnectorById,
  pingConnector,
  registerConnector,
  runOfflineConnector,
  resetStateConnector,
  offlineConnectorConfigByDirName,
} from '../domain/connector';
import {
  connectorForWork,
  createWork,
  deleteWork,
  reportActionImport,
  updateProcessedTime,
  updateReceivedTime,
  worksForConnector,
  findAll,
} from '../domain/work';
import { findById as findUserById } from '../domain/user';
import { redisGetWork, redisUpdateActionExpectation } from '../database/redis';
import { now } from '../utils/format';

const connectorResolvers = {
  Query: {
    connector: (_, { id }, { user }) => loadConnectorById(user, id),
    connectors: (_, __, { user }) => connectors(user),
    connectorsForExport: (_, __, { user }) => connectorsForExport(user),
    connectorsForImport: (_, __, { user }) => connectorsForImport(user),
    works: (_, args, { user }) => findAll(user, args),
    offlineConnectorConfig: (_, { dirName }, { user }) => offlineConnectorConfigByDirName(user, dirName),
    offlineConnectors: (_, args, { user }) => offlineConnectors(user),
    offlineConnector: (_, { dirName }, { user }) => offlineConnectorByDirName(user, dirName),
  },
  Connector: {
    connector_user: (connector, _, { user }) => findUserById(user, connector.connector_user_id),
    works: (connector, args, { user }) => worksForConnector(connector.id, user, args),
  },
  Work: {
    connector: (work, _, { user }) => connectorForWork(user, work.id),
    user: (work, _, { user }) => findUserById(user, work.user_id),
    tracking: (work) => redisGetWork(work.id),
  },
  Mutation: {
    // Config part
    deleteConnector: (_, { id }, { user }) => connectorDelete(user, id),
    registerConnector: (_, { input }, { user }) => registerConnector(user, input),
    runOfflineConnector: (_, { id }, { user }) => runOfflineConnector(user, id),
    resetStateConnector: (_, { id }, { user }) => resetStateConnector(user, id),
    pingConnector: (_, { id, state }, { user }) => pingConnector(user, id, state),
    modifyOfflineConnector: (_, { dirName, config }, { user }) => offlineConnectorModify(user, dirName, config),
    // Work part
    workAdd: async (_, { connectorId, friendlyName }, { user }) => {
      const connector = await loadConnectorById(user, connectorId);
      return createWork(user, connector, friendlyName, connector.id, { receivedTime: now() });
    },
    workEdit: (_, { id }, { user }) => ({
      delete: () => deleteWork(user, id),
      reportExpectation: ({ error }) => reportActionImport(user, id, error),
      addExpectations: ({ expectations }) => redisUpdateActionExpectation(user, id, expectations),
      toReceived: ({ message }) => updateReceivedTime(user, id, message),
      toProcessed: ({ message, inError }) => updateProcessedTime(user, id, message, inError),
    }),
  },
};

export default connectorResolvers;
