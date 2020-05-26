import { hot } from 'react-hot-loader/root';
import 'theme/semantic.less';

import { Switch, Route, Redirect } from 'react-router-dom';
import React from 'react';

import AuthSwitch from 'components/routes/AuthSwitch';
import Protected from 'components/routes/Protected';

import Docs from './screens/Docs';
import Dashboard from './screens/Dashboard';
import Settings from './screens/Settings';
import Invites from './screens/Invites';
import Users from './screens/Users';
import AcceptInvite from './screens/Auth/AcceptInvite';
import Login from './screens/Auth/Login';
import Shops from './screens/Shops';
import Shop from './screens/Shop';
import Logout from './screens/Auth/Logout';
import ForgotPassword from './screens/Auth/ForgotPassword';
import Signup from './screens/Auth/Signup';
import ResetPassword from './screens/Auth/ResetPassword';

const App = () => (
  <Switch>
    <AuthSwitch path="/" loggedIn={Dashboard} loggedOut={Login} exact />
    <Protected path="/shops" component={Shops} exact />
    <Protected path="/shops/:id" component={Shop} />
    <Protected path="/settings" component={Settings} exact />
    <Protected path="/invites" component={Invites} exact />
    <Protected path="/users" component={Users} exact />
    <Protected path="/docs/:id?" component={Docs} />
    <Route path="/logout" component={Logout} exact />
    <AuthSwitch
      path="/login"
      loggedOut={Login}
      loggedIn={() => <Redirect to="/" />}
      exact
    />
    <AuthSwitch
      path="/signup"
      loggedOut={Signup}
      loggedIn={() => <Redirect to="/" />}
      exact
    />
    <Route path="/accept-invite" component={AcceptInvite} exact />
    <Route path="/forgot-password" component={ForgotPassword} exact />
    <Route path="/reset-password" component={ResetPassword} exact />
  </Switch>
);

export default hot(App);
