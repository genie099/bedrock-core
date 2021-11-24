import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic';

import SearchContext from '../Context';

export default class CheckboxFilter extends React.Component {
  static contextType = SearchContext;

  onChange = (evt, { checked, ...rest }) => {
    this.context.onFilterChange(evt, {
      ...rest,
      value: checked,
    });
  };

  render() {
    const { name, ...rest } = this.props;
    return (
      <Form.Checkbox
        id={name}
        name={name}
        checked={this.context.getFilterValue(name) || false}
        onChange={this.onChange}
        {...rest}
      />
    );
  }
}

CheckboxFilter.propTypes = {
  ...Form.Input.propTypes,
  name: PropTypes.string.isRequired,
};
