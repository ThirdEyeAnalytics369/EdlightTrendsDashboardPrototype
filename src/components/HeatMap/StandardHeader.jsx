import { colors, fonts } from '../../theme';
import { getStandardDescription, DOMAIN_NAMES } from '../../data/dataUtils';
import Tooltip from '../common/Tooltip';

export default function StandardHeader({ domainGroups }) {
  return (
    <div style={{ display: 'contents' }}>
      {/* Empty cell for grade label column */}
      <div style={{ minWidth: 90 }} />

      {/* Empty cell for grade overall column */}
      <div style={{ minWidth: 56 }} />

      {/* Domain-grouped standard headers with spacers */}
      {domainGroups.map((group, groupIdx) => (
        <div key={group.domain} style={{ display: 'contents' }}>
          {/* Spacer between domain groups */}
          {groupIdx > 0 && (
            <div style={{ width: 16 }} />
          )}

          {/* Standards within this domain */}
          {group.standards.map((code, stdIdx) => (
            <Tooltip key={code} text={`${code}: ${getStandardDescription(code)}`}>
              <div style={{
                textAlign: 'center',
                minWidth: 72,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}>
                {/* Domain label - only on first standard of each group */}
                {stdIdx === 0 && (
                  <Tooltip text={DOMAIN_NAMES[group.domain] || group.domain}>
                    <div style={{
                      fontFamily: fonts.body,
                      fontSize: 10,
                      fontWeight: 600,
                      color: colors.purple,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginBottom: 2,
                      whiteSpace: 'nowrap',
                    }}>
                      {group.domain}
                    </div>
                  </Tooltip>
                )}
                {/* Invisible placeholder to align standards without domain label */}
                {stdIdx !== 0 && (
                  <div style={{ height: 15 }} />
                )}

                {/* Standard code */}
                <div style={{
                  fontFamily: fonts.body,
                  fontSize: 11,
                  fontWeight: 500,
                  color: colors.gray,
                  padding: '2px 2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {code}
                </div>
              </div>
            </Tooltip>
          ))}
        </div>
      ))}
    </div>
  );
}
