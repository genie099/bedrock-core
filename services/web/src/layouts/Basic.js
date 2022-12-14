import React from 'react';

import PageCenter from 'components/PageCenter';
import ConnectionError from 'components/ConnectionError';

export default class BasicLayout extends React.Component {
  render() {
    return (
      <PageCenter>
        <ConnectionError />
        {this.props.children}
      </PageCenter>
    );
  }
}
