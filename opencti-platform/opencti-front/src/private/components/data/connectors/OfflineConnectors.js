import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import {
  ascend,
  compose,
  descend,
  prop,
  sortWith,
  // map,
  // assoc,
  // filter,
  // propOr,
} from 'ramda';
import { interval } from 'rxjs';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles/index';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import { createRefetchContainer } from 'react-relay';
import { ArrowDropDown, ArrowDropUp, Extension } from '@material-ui/icons';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import List from '@material-ui/core/List';
import Tooltip from '@material-ui/core/Tooltip';
import { LayersRemove, Delete } from 'mdi-material-ui';
import IconButton from '@material-ui/core/IconButton';
import { Link, withRouter } from 'react-router-dom';
import { FIVE_SECONDS } from '../../../../utils/Time';
// import inject18n from '../../../../components/i18n';
// import { commitMutation, MESSAGING$ } from '../../../../relay/environment';
import Security, { MODULES_MODMANAGE } from '../../../../utils/Security';
import { MESSAGING$, commitMutation } from '../../../../relay/environment';
// import {
//   connectorDeletionMutation,
//   connectorResetStateMutation,
// } from './Connector';
// import ItemBoolean from '../../../../components/ItemBoolean';

const interval$ = interval(FIVE_SECONDS);

const styles = (theme) => ({
  linesContainer: {
    marginTop: 10,
  },
  itemHead: {
    paddingLeft: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    paddingLeft: 10,
    height: 50,
  },
  bodyItem: {
    height: '100%',
    fontSize: 13,
  },
  itemIcon: {
    color: theme.palette.primary.main,
  },
  goIcon: {
    position: 'absolute',
    right: -10,
  },
  inputLabel: {
    float: 'left',
  },
  sortIcon: {
    float: 'left',
    margin: '-5px 0 0 15px',
  },
  icon: {
    color: theme.palette.primary.main,
  },
});

const inlineStylesHeaders = {
  iconSort: {
    position: 'absolute',
    margin: '0 0 0 5px',
    padding: 0,
    top: '0px',
  },
  name: {
    float: 'left',
    width: '35%',
    fontSize: 12,
    fontWeight: '700',
  },
  connector_type: {
    float: 'left',
    width: '20%',
    fontSize: 12,
    fontWeight: '700',
  },
};

const inlineStyles = {
  name: {
    float: 'left',
    width: '35%',
    height: 20,
    whiteSpace: 'nowrap',
    // overflow: 'hidden',
    // textOverflow: 'ellipsis',
  },
  connector_type: {
    float: 'left',
    width: '20%',
    height: 20,
    whiteSpace: 'nowrap',
    // overflow: 'hidden',
    // textOverflow: 'ellipsis',
  },
};

export const connectorRegisterMutation = graphql`
  mutation OfflineConnectorsRegisterMutation($input: RegisterConnectorInput!) {
    registerConnector(input: $input) {
      id
    }
  }
`;

class OfflineConnectorsComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { sortBy: 'name', orderAsc: true };
  }

  componentDidMount() {
    this.subscription = interval$.subscribe(() => {
      this.props.relay.refetch();
    });
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  // // eslint-disable-next-line class-methods-use-this
  // handleResetState(connectorId) {
  //   commitMutation({
  //     mutation: connectorResetStateMutation,
  //     variables: {
  //       id: connectorId,
  //     },
  //     onCompleted: () => {
  //       MESSAGING$.notifySuccess('The connector state has been reset');
  //     },
  //   });
  // }

  handleDelete(connector) {
    commitMutation({
      mutation: connectorRegisterMutation,
      variables: {
        input: {
          ...connector,
        },
      },
      onCompleted: () => {
        MESSAGING$.notifySuccess('The connector has been cleared');
        this.props.history.push('/dashboard/data/connectors');
      },
    });
  }

  reverseBy(field) {
    this.setState({ sortBy: field, orderAsc: !this.state.orderAsc });
  }

  SortHeader(field, label, isSortable) {
    // const { t } = this.props;
    const sortComponent = this.state.orderAsc ? (
      <ArrowDropDown style={inlineStylesHeaders.iconSort} />
    ) : (
      <ArrowDropUp style={inlineStylesHeaders.iconSort} />
    );
    if (isSortable) {
      return (
        <div
          style={inlineStylesHeaders[field]}
          onClick={this.reverseBy.bind(this, field)}
        >
          <span>{label}</span>
          {this.state.sortBy === field ? sortComponent : ''}
        </div>
      );
    }
    return (
      <div style={inlineStylesHeaders[field]}>
        <span>{label}</span>
      </div>
    );
  }

  render() {
    const {
      classes, data,
    } = this.props;
    const { offlineConnectors } = data;
    const sort = sortWith(
      this.state.orderAsc
        ? [ascend(prop(this.state.sortBy))]
        : [descend(prop(this.state.sortBy))],
    );
    const sortedConnectors = sort(offlineConnectors.filter(Boolean));
    return (
      <Card>
        <CardHeader
          avatar={<Extension className={classes.icon} />}
          title={'Offline connectors'}
          style={{ paddingBottom: 0 }}
        />
        <CardContent style={{ paddingTop: 0 }}>
          <List classes={{ root: classes.linesContainer }}>
            <ListItem
              classes={{ root: classes.itemHead }}
              divider={false}
              style={{ paddingTop: 0 }}
            >
              <ListItemIcon>
                <span
                  style={{
                    padding: '0 8px 0 8px',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  #
                </span>
              </ListItemIcon>
              <ListItemText
                primary={
                  <div>
                    {this.SortHeader('name', 'Name', true)}
                    {this.SortHeader('path', 'Path', false)}
                  </div>
                }
              />
              <ListItemSecondaryAction> &nbsp; </ListItemSecondaryAction>
            </ListItem>
            {sortedConnectors.map((connector, i) => (
              <ListItem
                key={i}
                classes={{ root: classes.item }}
                divider={true}
                button={true}
                component={Link}
                to={`/dashboard/data/connectors/offline/${connector.path.split('/').filter(Boolean).pop()}`}
                >
                <ListItemIcon
                  style={{ color: '#f44336' }}
                >
                  <Extension />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <div>
                      <div
                        className={classes.bodyItem}
                        style={inlineStyles.name}
                      >
                        {connector.name}
                      </div>
                      <div
                        className={classes.bodyItem}
                        style={inlineStyles.connector_type}>
                        {connector.path}
                      </div>
                    </div>
                  }
                />
                <ListItemSecondaryAction>
                  <Security needs={[MODULES_MODMANAGE]}>
                    <Tooltip title={'Reset the connector state'}>
                      <IconButton
                        // onClick={this.handleResetState.bind(this, connector.id)}
                        aria-haspopup="true"
                        color="primary"
                      >
                        <LayersRemove />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={'Clear this connector'}>
                      <IconButton
                        onClick={this.handleDelete.bind(this, connector)}
                        aria-haspopup="true"
                        color="primary"
                        disabled={connector.active}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Security>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  }
}

OfflineConnectorsComponent.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func,
  n: PropTypes.func,
  nsdt: PropTypes.func,
  data: PropTypes.object,
  history: PropTypes.object,
};

export const offlineConnectorsQuery = graphql`
    query OfflineConnectorsQuery {
      ...OfflineConnectors_data
    }
`;

const offlineConnectorsStatus = createRefetchContainer(
  OfflineConnectorsComponent,
  {
    data: graphql`
      fragment OfflineConnectors_data on Query {
        offlineConnectors{
          id
          name
          path
          connector_type
          connector_scope
        }
      }`,
  },
  offlineConnectorsQuery,
);

export default compose(
  withRouter,
  withStyles(styles),
)(offlineConnectorsStatus);
