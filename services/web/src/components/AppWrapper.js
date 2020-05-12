import React from 'react';
import { observer, inject } from 'mobx-react';
import { NavLink, Link } from 'react-router-dom';
import { Container, Dropdown, Icon, Menu } from 'semantic-ui-react';
import logoInverted from 'assets/logo.svg';

@inject('me')
@observer
export default class AppWrapper extends React.Component {
  render() {
    const { me } = this.props;
    const { user } = me;
    return (
      <div>
        <Menu inverted fixed="top">
          <Container>
            <Menu.Item as={Link} to="/">
              <img
                style={{ width: '30px' }}
                className="logo"
                src={`${logoInverted}`}
              />
            </Menu.Item>
            {user && (
              <React.Fragment>
                <Menu.Item as={NavLink} to="/shops">
                  Shops
                </Menu.Item>
                <Menu.Menu position="right">
                  <Dropdown
                    className="account"
                    item
                    trigger={
                      <span>
                        <Icon name="user" /> {user.name}
                      </span>
                    }
                  >
                    <Dropdown.Menu>
                      <Dropdown.Item as={Link} to="/settings">
                        Settings
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/docs/getting-started">
                        API Docs
                      </Dropdown.Item>
                      {me.isAdmin() && (
                        <React.Fragment>
                          <Dropdown.Item as={Link} to="/users">
                            Users
                          </Dropdown.Item>
                          <Dropdown.Item as={Link} to="/invites">
                            Invites
                          </Dropdown.Item>
                        </React.Fragment>
                      )}
                      <Dropdown.Item as={Link} to="/logout">
                        Log Out
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Menu.Menu>
              </React.Fragment>
            )}
          </Container>
        </Menu>
        <Container style={{ marginTop: '100px', paddingBottom: '100px' }}>
          {this.props.children}
        </Container>
      </div>
    );
  }
}
