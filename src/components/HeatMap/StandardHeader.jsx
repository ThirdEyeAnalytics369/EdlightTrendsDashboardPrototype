import { colors, fonts, sizing } from '../../theme';
import { getStandardDescription } from '../../data/dataUtils';
import Tooltip from '../common/Tooltip';

export default function StandardHeader({ standards }) {
  return (
    <div style={{
      display: 'contents',
    }}>
      {/* Empty cell for grade label column */}
      <div style={{ minWidth: 90 }} />

      {/* Empty cell for grade overall column */}
      <div style={{ minWidth: 56 }} />

      {/* Standard code headers */}
      {standards.map(code => (
        <Tooltip key={code} text={`${code}: ${getStandardDescription(code)}`}>
          <div style={{
            textAlign: 'center',
            fontFamily: fonts.body,
            fontSize: 11,
            fontWeight: 500,
            color: colors.gray,
            padding: '4px 2px',
            minWidth: 72,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {code}
          </div>
        </Tooltip>
      ))}
    </div>
  );
}
