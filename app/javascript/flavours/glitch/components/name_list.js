import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';

import { injectIntl } from 'react-intl';
import { useCallback } from 'react';

/**
 * Displays a list of accounts as a comma-separated, link-ified list of displaynames.
 */
@injectIntl
export default class NameList extends React.PureComponent {

  static propTypes = {
    intl: PropTypes.object,
    accounts: ImmutablePropTypes.listOf(ImmutablePropTypes.map),
    viewMoreHref: PropTypes.string,
    onAccountClick: PropTypes.func,
    onViewMoreClick: PropTypes.func,
  };

  NameLink = ({ href, onClick, children }) => {
    return (
      <a
        href={href}
        className='status__display-name'
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: children }}
      />
    );
  };

  render() {
    const { NameLink } = this;
    const { accounts, onAccountClick, intl, viewMoreHref, onViewMoreClick } = this.props;

    // render a single name if there is only one account
    if (accounts.size === 1) {
      const handleClick = useCallback((ev) => {
        onAccountClick(accounts.get(0), ev);
      }, [accounts]);

      return (
        <span>
          <NameLink
            href={accounts.get(0).get('url')}
            onClick={handleClick}
          >
            {accounts.get(0).get('display_name_html') || accounts.get(0).get('username')}
          </NameLink>
        </span>
      );
    }

    // turn a list of accounts into a list (max length 3) of labels
    let accountsToIntl;
    if (accounts.size > 3) {
      accountsToIntl = accounts.slice(0, 2).map(acct => acct.get('display_name_html') || acct.get('username'));
      accountsToIntl = accountsToIntl.push(intl.formatMessage({ id: 'status.n_others', defaultMessage: '{n} others' }, { n: accounts.size - 2 }));
    } else {
      accountsToIntl = accounts.map(acct => acct.get('display_name_html') || acct.get('username'));
    }

    // turn the list of labels into an array of parts, with the correct localization
    // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat
    const parts = new Intl.ListFormat(intl.locale, { type: 'conjunction' }).formatToParts(accountsToIntl);

    // linkify the list of labels
    let elementNum = 0;
    return parts.map(({ type, value }) => {
      const currentElement = elementNum;

      // if this is a label, linkify it
      if (type === 'element') {
        elementNum++;

        // special case for the "and others" label
        if (currentElement === 2) {
          return <NameLink href={viewMoreHref} key={accounts.get(currentElement).get('id')} onClick={onViewMoreClick}>{value}</NameLink>;
        }

        let href = accounts.get(currentElement).get('url');
        let handleClick = (ev) => {
          onAccountClick(accounts.get(currentElement), ev);
        };

        // return the linkified label
        return <NameLink href={href} key={accounts.get(currentElement).get('id')} onClick={handleClick}>{value}</NameLink>;
      } else {
        // if this is a separator, just print it out regularly
        return <React.Fragment key={`${accounts.get(currentElement).get('id')}_separator`}>{value}</React.Fragment>;
      }
    });
  }

}
