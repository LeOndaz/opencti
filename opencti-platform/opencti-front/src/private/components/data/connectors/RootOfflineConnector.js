import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Route, withRouter } from 'react-router-dom';
import { QueryRenderer } from '../../../../relay/environment';
import OfflineConnector, { OfflineConnectorQuery } from './OfflineConnector';
import Loader from '../../../../components/Loader';
import ErrorNotFound from '../../../../components/ErrorNotFound';

class RootOfflineConnector extends Component {
  render() {
    const {
      match: {
        params: { id },
      },
    } = this.props;
    return (
      <div>
        <QueryRenderer
          query={OfflineConnectorQuery}
          variables={{ dirName: id }}
          render={({ props }) => {
            if (props) {
              if (props.offlineConnectorConfig) {
                return (
                  <div>
                    <Route
                      exact
                      path="/dashboard/data/connectors/offline/:id"
                      render={(routeProps) => (
                        <OfflineConnector
                          {...routeProps}
                          config={JSON.parse(props.offlineConnectorConfig)}
                        />
                      )}
                    />
                  </div>
                );
              }
              return <ErrorNotFound />;
            }
            return <Loader />;
          }}
        />
      </div>
    );
  }
}

RootOfflineConnector.propTypes = {
  children: PropTypes.node,
  match: PropTypes.object,
  me: PropTypes.object,
};

export default withRouter(RootOfflineConnector);
