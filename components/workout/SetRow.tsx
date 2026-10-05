// U5: state in setRow/useSetRowState; one view per mode in setRow/.
import React from 'react';
import { useSetRowState, type SetRowProps } from './setRow/useSetRowState';
import { SetRowIsometric } from './setRow/SetRowIsometric';
import { SetRowBodyweight } from './setRow/SetRowBodyweight';
import { SetRowStandard } from './setRow/SetRowStandard';
export type { SetRowProps } from './setRow/useSetRowState';

// Main SetRow (memo boundary unchanged; the mode views are plain children).
export const SetRow = React.memo((props: SetRowProps) => {
    const state = useSetRowState(props);
    if (state.isIsometric) return <SetRowIsometric state={state} />;
    if (state.isBodyweight && !state.isCardio) return <SetRowBodyweight state={state} />;
    return <SetRowStandard state={state} />;
});
