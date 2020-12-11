import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Breadcrumb } from 'semantic-ui-react';
import { Layout } from './Layout';

export default class Breadcrumbs extends React.Component {

  getPath() {
    const { link, path } = this.props;
    if (link) {
      return [link];
    } else {
      return path;
    }
  }

  render() {
    const { active } = this.props;
    return (
      <Layout horizontal center spread>
        <Breadcrumb size="big">
          <Breadcrumb.Section link as={Link} to="/">
            Home
          </Breadcrumb.Section>
          <Breadcrumb.Divider icon="right chevron" />
          {this.getPath().map((link, i) => {
            return (
              <React.Fragment key={i}>
                <Breadcrumb.Section>
                  {link}
                </Breadcrumb.Section>
                <Breadcrumb.Divider icon="right chevron" />
              </React.Fragment>
            );
          })}
          <Breadcrumb.Section active>
            {active}
          </Breadcrumb.Section>
        </Breadcrumb>
        <Layout.Group>
          {this.props.children}
        </Layout.Group>
      </Layout>
    );
  }

}

Breadcrumbs.propTypes = {
  active: PropTypes.node.isRequired,
  link: PropTypes.node,
  path: PropTypes.arrayOf(PropTypes.node),
};

Breadcrumbs.defaultProps = {
  path: [],
};
