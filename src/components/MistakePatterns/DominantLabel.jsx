import { fonts } from '../../theme';
import Tooltip from '../common/Tooltip';

export default function DominantLabel({ dominant, textColor }) {
  if (!dominant) return null;

  return (
    <Tooltip text={`${dominant.percent}% of errors are ${dominant.type}`}>
      <span style={{
        fontFamily: fonts.body,
        fontSize: 9,
        color: textColor,
        opacity: 0.8,
        lineHeight: 1,
        textAlign: 'center',
      }}>
        {dominant.abbreviation}
      </span>
    </Tooltip>
  );
}
