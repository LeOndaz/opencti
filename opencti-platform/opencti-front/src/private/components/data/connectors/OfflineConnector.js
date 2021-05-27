/* eslint-disable max-len */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import { createRefetchContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
} from 'formik';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Slide from '@material-ui/core/Slide';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import { interval } from 'rxjs';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import inject18n from '../../../../components/i18n';
import { FIVE_SECONDS } from '../../../../utils/Time';
import { prepareConfig, uuid4 } from '../../../../utils/Functions';
import { commitMutation, MESSAGING$ } from '../../../../relay/environment';
import { connectorResetStateMutation } from './Connector';

const interval$ = interval(FIVE_SECONDS);

const styles = () => ({
  container: {
    margin: 0,
  },
  editButton: {
    position: 'fixed',
    bottom: 30,
    right: 230,
  },
  gridContainer: {
    marginBottom: 20,
  },
  title: {
    float: 'left',
    marginRight: 30,
    textTransform: 'uppercase',
  },
  popover: {
    float: 'right',
    marginTop: '-13px',
  },
  paper: {
    height: '100%',
    minHeight: '100%',
    margin: '10px 0 0 0',
    padding: '15px',
    borderRadius: 6,
  },
  card: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 6,
    position: 'relative',
  },
  chip: {
    height: 30,
    float: 'left',
    margin: '0 10px 10px 0',
    backgroundColor: '#607d8b',
  },
  number: {
    fontWeight: 600,
    fontSize: 18,
  },
  progress: {
    borderRadius: 5,
    height: 10,
  },
});

export const OfflineConnectorModifyMutation = graphql`
    mutation OfflineConnectorModifyMutation($dirName: ID!, $config: JSONString!) {
        modifyOfflineConnector(dirName: $dirName, config: $config)
    }
`;

const Transition = React.forwardRef((props, ref) => (
    <Slide direction="up" ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';

class OfflineConnectorComponent extends Component {
  constructor(props) {
    console.log(props);
    super(props);
    this.state = {
      displayUpdate: false,
    };
  }

  componentDidMount() {
    this.subscription = interval$.subscribe(() => {
      this.props.relay.refetch({ dirName: this.props.match.params.id });
    });
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  handleOpenUpdate() {
    this.setState({ displayUpdate: true });
  }

  handleCloseUpdate() {
    this.setState({ displayUpdate: false });
  }

  // eslint-disable-next-line class-methods-use-this
  handleSubmit(dirName, data) {
    const config = {};
    Object.keys(data).forEach((k) => {
      const [outerKey, innerKey] = k.split('__');

      if (config[outerKey]) {
        config[outerKey][innerKey] = data[k];
      } else {
        config[outerKey] = {};
      }
    });

    commitMutation({
      mutation: OfflineConnectorModifyMutation,
      variables: {
        dirName,
        config,
      },
      onCompleted: () => {
        MESSAGING$.notifySuccess('Config has been updated.');
      },
    });
  }

  render() {
    const {
      classes, t,
      match: {
        params: { id },
      },
      config,
    } = this.props;

    return (<div>
            <div className={classes.container}>
                <div>
                    <Typography
                        variant="h1"
                        gutterBottom={true}
                        classes={{ root: classes.title }}>
                        {config.connector.name}
                    </Typography>
                    <div className="clearfix"/>
                </div>
                <Formik initialValues={prepareConfig(config)} onSubmit={(data) => this.handleSubmit.bind(this, id, data)}>
                    {({
                      isSubmitting, values, setFieldValue, handleChange, handleBlur,
                    }) => <Form>
                        <Grid container={true} spacing={3} classes={{ container: classes.gridContainer }}>
                            {Object.keys(config).map((key, i) => <Grid item={true} xs={12} key={i}
                                                                       style={{ marginBottom: 15, height: '100%' }}>
                                <Typography variant="h4" gutterBottom={true}>
                                    {t(`${key.toUpperCase()}`)}
                                </Typography>
                                <Divider/>
                                <Paper classes={{ root: classes.paper }} elevation={2}>
                                    <Grid container={true} spacing={3}>
                                        {Object.entries(config[key]).map(([innerKey], k) => (
                                            <Grid item={true} xs={12} md={6} lg={4} key={k}>
                                                <TextField name={`${key}__${innerKey}`}
                                                           label={t(innerKey.toUpperCase())}
                                                           variant="outlined"
                                                           value={values[`${key}__${innerKey}`]}
                                                           onChange={handleChange}
                                                           onBlur={handleBlur}
                                                />
                                                {key !== 'opencti' && innerKey.toLowerCase() === 'token'
                                                && <Button style={{ height: '100%' }} variant="outlined" size="small"
                                                           onClick={() => setFieldValue(`${key}__${innerKey}`, uuid4())}>?</Button>}
                                            </Grid>))
                                        }
                                    </Grid>
                                </Paper>
                            </Grid>)}
                        </Grid>
                        <Button type="submit" variant="outlined" disabled={isSubmitting}>
                            Submit
                        </Button>
                    </Form>}
                </Formik>

            </div>
        </div>);
  }
}

OfflineConnectorComponent.propTypes = {
  connector: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
};

export const OfflineConnectorQuery = graphql`
    query OfflineConnectorQuery($dirName: ID!) {
        offlineConnectorConfig(dirName: $dirName)
    }
`;

const OfflineConnector = createRefetchContainer(
  OfflineConnectorComponent,
  {},
  OfflineConnectorQuery,
);

export default compose(inject18n, withStyles(styles))(OfflineConnector);
