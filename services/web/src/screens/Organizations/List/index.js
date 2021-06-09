import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Divider, Button, Message } from 'semantic';
import { formatDateTime } from 'utils/date';
import { request } from 'utils/api';
import { screen } from 'helpers';
import {
  Confirm,
  HelpTip,
  Breadcrumbs,
  SearchProvider,
  Layout,
} from 'components';

import Filters from 'modals/Filters';
import EditOrganization from 'modals/EditOrganization';

@screen
export default class OrganizationList extends React.Component {
  onDataNeeded = async (params) => {
    const { category, ...rest } = params;
    return await request({
      method: 'POST',
      path: '/1/organizations/search',
      body: {
        ...rest,
        ...(category && { categories: [category.id] }),
      },
    });
  };

  render() {
    return (
      <SearchProvider onDataNeeded={this.onDataNeeded}>
        {({
          items: organizations,
          getSorted,
          setSort,
          filters,
          setFilters,
          reload,
        }) => {
          return (
            <React.Fragment>
              <Breadcrumbs active="Organizations" />
              <Layout horizontal center spread>
                <h1>Organizations</h1>
                <Layout.Group>
                  <Filters onSave={setFilters} filters={filters}>
                    <Filters.Text name="name" label="Name" />
                  </Filters>
                  <EditOrganization
                    trigger={
                      <Button primary content="New Organization" icon="plus" />
                    }
                    onSave={reload}
                  />
                </Layout.Group>
              </Layout>
              {organizations.length === 0 ? (
                <Message>No organizations created yet</Message>
              ) : (
                <Table celled sortable>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell
                        sorted={getSorted('name')}
                        onClick={() => setSort('name')}>
                        Name
                      </Table.HeaderCell>
                      <Table.HeaderCell
                        onClick={() => setSort('createdAt')}
                        sorted={getSorted('createdAt')}>
                        Created
                        <HelpTip
                          title="Created"
                          text="This is the date and time the organization was created."
                        />
                      </Table.HeaderCell>
                      <Table.HeaderCell textAlign="center">
                        Actions
                      </Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {organizations.map((organization) => {
                      return (
                        <Table.Row key={organization.id}>
                          <Table.Cell>
                            <Link to={`/organizations/${organization.id}`}>
                              {organization.name}
                            </Link>
                          </Table.Cell>
                          <Table.Cell>
                            {formatDateTime(organization.createdAt)}
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            <EditOrganization
                              organization={organization}
                              trigger={<Button basic icon="edit" />}
                              onSave={reload}
                            />
                            <Confirm
                              negative
                              confirmText="Delete"
                              header={`Are you sure you want to delete "${organization.name}"?`}
                              content="All data will be permanently deleted"
                              trigger={<Button basic icon="trash" />}
                              onConfirm={async () => {
                                await request({
                                  method: 'DELETE',
                                  path: `/1/organizations/${organization.id}`,
                                });
                                reload();
                              }}
                            />
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
              )}
            </React.Fragment>
          );
        }}
      </SearchProvider>
    );
  }
}
