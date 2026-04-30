import { ParetoCardProps } from './types';
declare const _default: {
    title: string;
    component: (props: ParetoCardProps) => JSX.Element;
    argTypes: {
        width: {
            control: {
                type: string;
                min: number;
                max: number;
                step: number;
            };
        };
        height: {
            control: {
                type: string;
                min: number;
                max: number;
                step: number;
            };
        };
        isDarkMode: {
            control: string;
        };
        headerText: {
            control: string;
        };
        metricLabel: {
            control: string;
        };
        metricUnit: {
            control: string;
        };
        metricGenitive: {
            control: string;
        };
        breakdownTitle: {
            control: string;
        };
        defaultThreshold: {
            control: {
                type: string;
                min: number;
                max: number;
                step: number;
            };
        };
        chartAriaLabel: {
            control: string;
        };
        dataState: {
            control: string;
            options: string[];
        };
        mockModeEnabled: {
            control: string;
        };
        items: {
            control: boolean;
        };
        theme: {
            control: boolean;
        };
    };
    parameters: {
        backgrounds: {
            default: string;
            values: {
                name: string;
                value: string;
            }[];
        };
    };
};
export default _default;
export declare const LightPopulated: any;
export declare const DarkPopulated: any;
export declare const Threshold50: any;
export declare const Threshold95: any;
export declare const Empty: any;
export declare const Loading: any;
export declare const Error: any;
export declare const OnlyPositive: any;
//# sourceMappingURL=ParetoCard.stories.d.ts.map