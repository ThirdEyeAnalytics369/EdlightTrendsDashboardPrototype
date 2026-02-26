import { colors, fonts } from '../../theme';
import { getAbbreviation } from '../../data/dataUtils';
import Tooltip from './Tooltip';

export default function Tag({ misconception }) {
  if (!misconception) return null;

  const abbr = getAbbreviation(misconception);

  return (
    <Tooltip text={misconception}>
      <span style={{
        display: 'inline-block',
        fontFamily: fonts.body,
        fontSize: 10,
        padding: '2px 6px',
        borderRadius: 4,
        backgroundColor: `${colors.purple}18`,
        color: colors.purple,
        whiteSpace: 'nowrap',
        marginRight: 4,
        marginBottom: 2,
      }}>
        {abbr}
      </span>
    </Tooltip>
  );
}
