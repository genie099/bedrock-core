import React, { createRef } from 'react';
import AppWrapper from 'components/AppWrapper';
import { Container, Menu, Message, Breadcrumb, Divider, Grid, Sticky, Rail, Ref, Segment } from 'semantic-ui-react';
import { Switch, Route, Link, NavLink } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import StandardPage from './StandardPage';
import PageLoader from 'components/PageLoader';

import GETTING_STARTED_MD from 'docs/GETTING_STARTED.md';
import AUTHENTICATION_MD from 'docs/AUTHENTICATION.md';
import USERS_MD from 'docs/USERS.md';
import { request } from '../../utils/api';

const pages = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    markdown: GETTING_STARTED_MD,
  },
  {
    id: 'authentication',
    name: 'Authentication',
    markdown: AUTHENTICATION_MD,
  },
  {
    id: 'users',
    name: 'Users',
    markdown: USERS_MD,
  },
  {
    id: 'products',
    name: 'Products',
    markdown: GETTING_STARTED_MD,
  },
];

function stateForParams(params) {
  const { id } = params;
  return {
    pageId: id,
    page: id ? pages.find((p) => p.id === id) : pages[0],
  };
}

@inject('me')
@observer
export default class Docs extends React.Component {
  contextRef = createRef();

  constructor(props) {
    super(props);
    this.state = {
      openApi: null,
      loading: true,
      error: null,
      ...stateForParams(this.props.match.params),
    };
  }
  state = {
    loading: true,
    error: null,
  };

  componentDidMount() {
    const { me } = this.props;
    me.fetch().then(() => {});
    request({
      method: 'GET',
      path: '/openapi.json',
    })
      .then((openApi) => {
        this.setState({ loading: false, openApi });
      })
      .catch((error) => {
        this.setState({ error, loading: false });
      });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.id !== this.props.match.params.id) {
      this.setState({
        ...stateForParams(this.props.match.params),
      });
    }
  }

  render() {
    const { page, loading, openApi } = this.state;
    const { me } = this.props;

    if (loading) {
      return <PageLoader />;
    }

    if (!page)
      return (
        <AppWrapper>
          <Container>
            <Message error content="Page not found" />
          </Container>
        </AppWrapper>
      );

    return (
      <AppWrapper>
        <Container>
          <Breadcrumb size="big">
            <Breadcrumb.Section link as={Link} to="/">
              API Docs
            </Breadcrumb.Section>
            <Breadcrumb.Divider icon="right chevron" />
            <Breadcrumb.Section>{page.name}</Breadcrumb.Section>
          </Breadcrumb>
        </Container>
        <Divider hidden />
        <Grid>
          <Grid.Row>
            <Grid.Column width={3}>
              <Sticky offset={100} context={this.contextRef}>
                {this.renderMenu()}
              </Sticky>
            </Grid.Column>
            <Grid.Column width={13}>
              <Ref innerRef={this.contextRef}>
                <Segment basic>
                  <Switch>
                    {pages
                      .map((page) => {
                        return (
                          <Route
                            key={page.id}
                            exact
                            path={`/docs/${page.id}`}
                            component={(props) => <StandardPage {...props} me={me} openApi={openApi} page={page} />}
                          />
                        );
                      })
                      .concat([
                        <Route
                          key="index"
                          exact
                          path={`/docs`}
                          component={(props) => <StandardPage {...props} me={me} openApi={openApi} page={pages[0]} />}
                        />,
                      ])}
                  </Switch>
                </Segment>
              </Ref>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <Divider hidden />
      </AppWrapper>
    );
  }

  renderMenu() {
    const { pageId } = this.state;
    return (
      <Menu fluid pointing secondary vertical>
        {pages.map(({ id, name }) => {
          return <Menu.Item key={id} exact name={name} active={pageId === id} to={`/docs/${id}`} as={NavLink} />;
        })}
      </Menu>
    );
  }
}
