export const Pill = ({ cls = '', children }) => <span className={'pill ' + cls}>{children}</span>;
// HTML text from the form content (bold, line breaks, links, images) — authored by CASHPOR, not by users
export const Html = ({ as: Tag = 'span', html, ...rest }) => <Tag {...rest} dangerouslySetInnerHTML={{ __html: html ?? '' }} />;
