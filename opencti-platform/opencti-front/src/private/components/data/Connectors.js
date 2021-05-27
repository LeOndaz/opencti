import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import { withStyles } from '@material-ui/core/styles/index';
import inject18n from '../../../components/i18n';
import { QueryRenderer } from '../../../relay/environment';
import WorkersStatus, { workersStatusQuery } from './connectors/WorkersStatus';
import ConnectorsStatus, {
  connectorsStatusQuery,
} from './connectors/ConnectorsStatus';
import Loader from '../../../components/Loader';
import OfflineConnectors, { offlineConnectorsQuery } from './connectors/OfflineConnectors';
import { ConnectorsContext } from './connectors/connectorsContext';

const styles = () => ({
  container: {
    margin: 0,
  },
});

class Connectors extends Component {
  render() {
    const { classes } = this.props;
    return (
      <ConnectorsContext.Provider>
        <div className={classes.container}>
          <QueryRenderer
            query={workersStatusQuery}
            render={({ props }) => {
              if (props) {
                return <WorkersStatus data={props} />;
              }
              return <div> &nbsp; </div>;
            }}
          />

          <QueryRenderer
            query={connectorsStatusQuery}
            render={({ props }) => {
              if (props) {
                return <ConnectorsStatus data={props} />;
              }
              return <Loader />;
            }}
          />

          <br/>
          <QueryRenderer
            query={offlineConnectorsQuery}
            render={({ props }) => {
              if (props) {
                return <OfflineConnectors data={props} />;
              }
              return <div> &nbsp; </div>;
            }}
          />
        </div>
      </ConnectorsContext.Provider>
    );
  }
}

Connectors.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func,
  connectorsStatus: PropTypes.array,
};

export default compose(
  inject18n,
  withStyles(styles, { withTheme: true }),
)(Connectors);
