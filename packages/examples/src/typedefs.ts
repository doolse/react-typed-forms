import {ArrayControl, FormControl, GroupControl} from "@react-typed-forms/core";

export type MeasurementValueForm = GroupControl<{
    type: FormControl<string>;
    childType: FormControl<MeasurementType>;
    value: FormControl<any>;
    timestamp: FormControl<string>;
    values: ArrayControl<MeasurementValueForm>;
    data: GroupControl<{
        [key in keyof typeof MeasurementType]?: MeasurementValueForm;
    }>;
}>;

export interface MeasurementValue {
    timestamp: string;
    value?: any | undefined;
    type: string;
}


export interface MeasurementFormValue extends MeasurementValue {
    childType: MeasurementType;
    values: MeasurementFormValue[];
    data: { [key in keyof typeof MeasurementType]?: MeasurementFormValue };
}

enum MeasurementType {
    Ok = "OK"
}
