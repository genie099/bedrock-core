import React from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import { session } from 'stores';
import NotFound from 'components/NotFound';
import AuthSwitch from './AuthSwitch';

export default class Protected extends React.Component {

  hasAccess() {
    if (!session.user) {
      return false;
    }
    return this.getRoles().every((role) => {
      return session.hasRole(role);
    });
  }

  getRoles() {
    const { admin, roles } = this.props;
    return admin ? ['admin'] : roles;
  }

  render() {
    const { exact, path, component: Component } = this.props;
    return (
      <AuthSwitch
        exact={exact}
        path={path}
        loggedOut={() => <Redirect to="/" />}
        loggedIn={(props) => this.renderLoggedIn(Component, props)}
      />
    );
  }

  renderLoggedIn(Component, props) {
    if (this.hasAccess()) {
      return <Component {...props} />;
    } else {
      return <NotFound />;
    }
  }
}

Protected.propTypes = {
  admin: PropTypes.bool,
  roles: PropTypes.array,
};

Protected.defaultProps = {
  admin: false,
  roles: [],
};
