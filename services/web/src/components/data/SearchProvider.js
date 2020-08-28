import React from 'react';
import PropTypes from 'prop-types';
import { pickBy } from 'lodash';
import { Loader, Container, Message, Divider } from 'semantic-ui-react';
import Pagination from 'components/Pagination';

export default class SearchProvider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      items: [],
      error: null,
      meta: {
        total: 0,
      },
      filters: props.filters,
      limit: props.limit,
      page: props.page,
      sort: props.sort,
    };
  }

  componentDidMount() {
    this.fetch();
  }

  componentDidUpdate(lastProps, lastState) {
    const { page, sort, filters } = this.state;
    if (page !== lastState.page || sort !== lastState.sort || filters !== lastState.filters) {
      this.fetch();
    }
  }

  // Events

  onPageChange = (evt, data) => {
    const { activePage } = data;
    this.setState({
      page: activePage,
    });
  };

  // Actions

  fetch = async () => {
    this.setState({
      loading: true,
    });
    try {
      const { page, limit, sort, filters } = this.state;
      const { data, meta } = await this.props.onDataNeeded({
        limit,
        sort,
        skip: (page - 1) * limit,
        ...filters,
      });
      this.setState({
        loading: false,
        items: data,
        meta: Object.assign({}, this.state.meta, meta),
      });
    } catch (err) {
      this.setState({
        loading: false,
        error: err,
      });
    }
  };

  getSorted = (field) => {
    const { sort } = this.state;
    if (field === sort.field) {
      return sort.order === 'asc' ? 'ascending' : 'descending';
    }
  };

  setSort = (field) => {
    const { sort } = this.state;
    let order;
    if (field === sort.field && sort.order === 'asc') {
      order = 'desc';
    } else {
      order = 'asc';
    }
    this.setState({
      sort: {
        field,
        order,
      },
    });
  };

  setFilters = (filters) => {
    this.setState({
      filters: pickBy(filters),
    });
  };

  render() {
    const { loader } = this.props;
    const { loading } = this.state;
    if (loader && loading) {
      return <Loader active>Loading</Loader>;
    }
    return (
      <div>
        {this.renderError()}
        {this.props.children({
          ...this.state,
          reload: this.fetch,
          setSort: this.setSort,
          getSorted: this.getSorted,
          setFilters: this.setFilters,
        })}
        {this.renderPagination()}
      </div>
    );
  }

  renderError() {
    const { error } = this.state;
    if (error) {
      return <Message error content={error.message} />;
    }
  }

  renderPagination() {
    const { pagination } = this.props;
    const { page, meta } = this.state;
    if (pagination && meta.total > meta.limit) {
      return (
        <Container textAlign="center">
          <Divider hidden />
          <Pagination page={page} limit={meta.limit} total={meta.total} onPageChange={this.onPageChange} />
        </Container>
      );
    }
  }
}

SearchProvider.propTypes = {
  children: PropTypes.func.isRequired,
  onDataNeeded: PropTypes.func.isRequired,
  limit: PropTypes.number,
  page: PropTypes.number,
  sort: PropTypes.shape({
    order: PropTypes.string,
    field: PropTypes.string,
  }),
  loader: PropTypes.bool,
  pagination: PropTypes.bool,
};

SearchProvider.defaultProps = {
  page: 1,
  limit: 20,
  sort: {
    order: 'asc',
    field: 'createdAt',
  },
  loader: true,
  pagination: true,
};
