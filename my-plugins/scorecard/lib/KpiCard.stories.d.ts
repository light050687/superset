import React from 'react';
import { KpiCardProps, KpiViewData, DataState, DetailDataRaw, ComparisonColorScheme } from './types';
declare const _default: {
    title: string;
    component: (props: KpiCardProps) => JSX.Element;
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
        modeCount: {
            control: string;
            options: string[];
        };
        headerText: {
            control: string;
        };
        colorScheme1A: {
            control: string;
            options: string[];
        };
        colorScheme1B: {
            control: string;
            options: string[];
        };
        colorScheme2A: {
            control: string;
            options: string[];
        };
        colorScheme2B: {
            control: string;
            options: string[];
        };
        showDelta1: {
            control: string;
        };
        showDelta2: {
            control: string;
        };
        enableComp1: {
            control: string;
        };
        enableComp2: {
            control: string;
        };
        comp1Label: {
            control: string;
        };
        comp2Label: {
            control: string;
        };
        hierarchyLabelPrimary: {
            control: string;
        };
        hierarchyLabelSecondary: {
            control: string;
        };
        dataState: {
            control: boolean;
        };
        deltaFormat1A: {
            control: boolean;
        };
        deltaFormat2A: {
            control: boolean;
        };
        deltaFormat1B: {
            control: boolean;
        };
        deltaFormat2B: {
            control: boolean;
        };
        detailDataRaw: {
            control: boolean;
        };
        theme: {
            control: boolean;
        };
        formatValueA: {
            control: boolean;
        };
        formatValueB: {
            control: boolean;
        };
        formatDelta: {
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
    decorators: ((Story: React.ComponentType) => import("react/jsx-runtime").JSX.Element)[];
};
export default _default;
/** Revenue card — dual mode, all deltas positive */
export declare const Revenue: {
    args: {
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        deltaFormat1A: import("./types").DeltaFormat;
        deltaFormat2A: import("./types").DeltaFormat;
        deltaFormat1B: import("./types").DeltaFormat;
        deltaFormat2B: import("./types").DeltaFormat;
        detailColFact: string;
        detailColComp1: string;
        detailColDelta1: string;
        detailColComp2: string;
        detailColDelta2: string;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
        detailTopN: number;
        detailPageSize: number;
        formatDelta: (n: number) => string;
        formatComp1A: (n: number) => string;
        formatComp2A: (n: number) => string;
        formatDelta1A: (n: number) => string;
        formatDelta2A: (n: number) => string;
        formatComp1B: (n: number) => string;
        formatComp2B: (n: number) => string;
        formatDelta1B: (n: number) => string;
        formatDelta2B: (n: number) => string;
        formatValueA: (n: number) => string;
        formatValueB: (n: number) => string;
        width: number;
        height: number;
        headerText: string;
        dataState: DataState;
        modeCount: "dual";
        toggleLabelA: string;
        toggleLabelB: string;
        modeAView: KpiViewData;
        modeBView: KpiViewData;
        isDarkMode: boolean;
        theme: {
            borderRadius: number;
            colors: {
                text: {
                    label: string;
                    help: string;
                };
                primary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                secondary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    dark3: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                grayscale: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                error: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                warning: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                alert: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                success: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                info: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
            };
            opacity: {
                light: string;
                mediumLight: string;
                mediumHeavy: string;
                heavy: string;
            };
            typography: {
                families: {
                    sansSerif: string;
                    serif: string;
                    monospace: string;
                };
                weights: {
                    light: number;
                    normal: number;
                    medium: number;
                    bold: number;
                };
                sizes: {
                    xxs: number;
                    xs: number;
                    s: number;
                    m: number;
                    l: number;
                    xl: number;
                    xxl: number;
                };
            };
            zIndex: {
                aboveDashboardCharts: number;
                dropdown: number;
                max: number;
            };
            transitionTiming: number;
            gridUnit: number;
            brandIconMaxWidth: number;
        };
    };
};
/** Revenue card — dark theme */
export declare const RevenueDark: {
    args: {
        isDarkMode: boolean;
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        deltaFormat1A: import("./types").DeltaFormat;
        deltaFormat2A: import("./types").DeltaFormat;
        deltaFormat1B: import("./types").DeltaFormat;
        deltaFormat2B: import("./types").DeltaFormat;
        detailColFact: string;
        detailColComp1: string;
        detailColDelta1: string;
        detailColComp2: string;
        detailColDelta2: string;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
        detailTopN: number;
        detailPageSize: number;
        formatDelta: (n: number) => string;
        formatComp1A: (n: number) => string;
        formatComp2A: (n: number) => string;
        formatDelta1A: (n: number) => string;
        formatDelta2A: (n: number) => string;
        formatComp1B: (n: number) => string;
        formatComp2B: (n: number) => string;
        formatDelta1B: (n: number) => string;
        formatDelta2B: (n: number) => string;
        formatValueA: (n: number) => string;
        formatValueB: (n: number) => string;
        width: number;
        height: number;
        headerText: string;
        dataState: DataState;
        modeCount: "dual";
        toggleLabelA: string;
        toggleLabelB: string;
        modeAView: KpiViewData;
        modeBView: KpiViewData;
        theme: {
            borderRadius: number;
            colors: {
                text: {
                    label: string;
                    help: string;
                };
                primary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                secondary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    dark3: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                grayscale: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                error: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                warning: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                alert: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                success: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                info: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
            };
            opacity: {
                light: string;
                mediumLight: string;
                mediumHeavy: string;
                heavy: string;
            };
            typography: {
                families: {
                    sansSerif: string;
                    serif: string;
                    monospace: string;
                };
                weights: {
                    light: number;
                    normal: number;
                    medium: number;
                    bold: number;
                };
                sizes: {
                    xxs: number;
                    xs: number;
                    s: number;
                    m: number;
                    l: number;
                    xl: number;
                    xxl: number;
                };
            };
            zIndex: {
                aboveDashboardCharts: number;
                dropdown: number;
                max: number;
            };
            transitionTiming: number;
            gridUnit: number;
            brandIconMaxWidth: number;
        };
    };
    parameters: {
        backgrounds: {
            default: string;
        };
    };
};
/** Revenue card — single mode (no toggle) */
export declare const RevenueSingleMode: {
    args: {
        modeCount: "single";
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        deltaFormat1A: import("./types").DeltaFormat;
        deltaFormat2A: import("./types").DeltaFormat;
        deltaFormat1B: import("./types").DeltaFormat;
        deltaFormat2B: import("./types").DeltaFormat;
        detailColFact: string;
        detailColComp1: string;
        detailColDelta1: string;
        detailColComp2: string;
        detailColDelta2: string;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
        detailTopN: number;
        detailPageSize: number;
        formatDelta: (n: number) => string;
        formatComp1A: (n: number) => string;
        formatComp2A: (n: number) => string;
        formatDelta1A: (n: number) => string;
        formatDelta2A: (n: number) => string;
        formatComp1B: (n: number) => string;
        formatComp2B: (n: number) => string;
        formatDelta1B: (n: number) => string;
        formatDelta2B: (n: number) => string;
        formatValueA: (n: number) => string;
        formatValueB: (n: number) => string;
        width: number;
        height: number;
        headerText: string;
        dataState: DataState;
        toggleLabelA: string;
        toggleLabelB: string;
        modeAView: KpiViewData;
        modeBView: KpiViewData;
        isDarkMode: boolean;
        theme: {
            borderRadius: number;
            colors: {
                text: {
                    label: string;
                    help: string;
                };
                primary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                secondary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    dark3: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                grayscale: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                error: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                warning: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                alert: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                success: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                info: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
            };
            opacity: {
                light: string;
                mediumLight: string;
                mediumHeavy: string;
                heavy: string;
            };
            typography: {
                families: {
                    sansSerif: string;
                    serif: string;
                    monospace: string;
                };
                weights: {
                    light: number;
                    normal: number;
                    medium: number;
                    bold: number;
                };
                sizes: {
                    xxs: number;
                    xs: number;
                    s: number;
                    m: number;
                    l: number;
                    xl: number;
                    xxl: number;
                };
            };
            zIndex: {
                aboveDashboardCharts: number;
                dropdown: number;
                max: number;
            };
            transitionTiming: number;
            gridUnit: number;
            brandIconMaxWidth: number;
        };
    };
};
/** Props forwarded from Storybook args to KpiGrid */
interface KpiGridOverrides {
    isDarkMode: boolean;
    withDetail?: boolean;
    colorScheme1A: ComparisonColorScheme;
    colorScheme1B: ComparisonColorScheme;
    colorScheme2A: ComparisonColorScheme;
    colorScheme2B: ComparisonColorScheme;
    enableComp1: boolean;
    enableComp2: boolean;
    comp1Label: string;
    comp2Label: string;
    showDelta1: boolean;
    showDelta2: boolean;
    hierarchyLabelPrimary: string;
    hierarchyLabelSecondary: string;
}
export declare const GridLight: {
    args: {
        isDarkMode: boolean;
        withDetail?: boolean;
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
    };
    render: (args: KpiGridOverrides) => import("react/jsx-runtime").JSX.Element;
    parameters: {
        backgrounds: {
            default: string;
        };
        layout: string;
    };
};
export declare const GridDark: {
    args: {
        isDarkMode: boolean;
        withDetail?: boolean;
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
    };
    render: (args: KpiGridOverrides) => import("react/jsx-runtime").JSX.Element;
    parameters: {
        backgrounds: {
            default: string;
        };
        layout: string;
    };
};
/** Grid with detail — click any card to open drill-down modal */
export declare const GridWithDetailLight: {
    args: {
        withDetail: boolean;
        isDarkMode: boolean;
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
    };
    render: (args: KpiGridOverrides) => import("react/jsx-runtime").JSX.Element;
    parameters: {
        backgrounds: {
            default: string;
        };
        layout: string;
    };
};
/** Grid with detail — dark theme */
export declare const GridWithDetailDark: {
    args: {
        isDarkMode: boolean;
        withDetail: boolean;
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
    };
    render: (args: KpiGridOverrides) => import("react/jsx-runtime").JSX.Element;
    parameters: {
        backgrounds: {
            default: string;
        };
        layout: string;
    };
};
/** Revenue card with detail drill-down — click to open modal */
export declare const RevenueWithDetail: {
    args: {
        detailDataRaw: DetailDataRaw;
        width: number;
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        deltaFormat1A: import("./types").DeltaFormat;
        deltaFormat2A: import("./types").DeltaFormat;
        deltaFormat1B: import("./types").DeltaFormat;
        deltaFormat2B: import("./types").DeltaFormat;
        detailColFact: string;
        detailColComp1: string;
        detailColDelta1: string;
        detailColComp2: string;
        detailColDelta2: string;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
        detailTopN: number;
        detailPageSize: number;
        formatDelta: (n: number) => string;
        formatComp1A: (n: number) => string;
        formatComp2A: (n: number) => string;
        formatDelta1A: (n: number) => string;
        formatDelta2A: (n: number) => string;
        formatComp1B: (n: number) => string;
        formatComp2B: (n: number) => string;
        formatDelta1B: (n: number) => string;
        formatDelta2B: (n: number) => string;
        formatValueA: (n: number) => string;
        formatValueB: (n: number) => string;
        height: number;
        headerText: string;
        dataState: DataState;
        modeCount: "dual";
        toggleLabelA: string;
        toggleLabelB: string;
        modeAView: KpiViewData;
        modeBView: KpiViewData;
        isDarkMode: boolean;
        theme: {
            borderRadius: number;
            colors: {
                text: {
                    label: string;
                    help: string;
                };
                primary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                secondary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    dark3: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                grayscale: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                error: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                warning: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                alert: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                success: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                info: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
            };
            opacity: {
                light: string;
                mediumLight: string;
                mediumHeavy: string;
                heavy: string;
            };
            typography: {
                families: {
                    sansSerif: string;
                    serif: string;
                    monospace: string;
                };
                weights: {
                    light: number;
                    normal: number;
                    medium: number;
                    bold: number;
                };
                sizes: {
                    xxs: number;
                    xs: number;
                    s: number;
                    m: number;
                    l: number;
                    xl: number;
                    xxl: number;
                };
            };
            zIndex: {
                aboveDashboardCharts: number;
                dropdown: number;
                max: number;
            };
            transitionTiming: number;
            gridUnit: number;
            brandIconMaxWidth: number;
        };
    };
};
/** Revenue card with detail — dark theme */
export declare const RevenueWithDetailDark: {
    args: {
        isDarkMode: boolean;
        detailDataRaw: DetailDataRaw;
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        deltaFormat1A: import("./types").DeltaFormat;
        deltaFormat2A: import("./types").DeltaFormat;
        deltaFormat1B: import("./types").DeltaFormat;
        deltaFormat2B: import("./types").DeltaFormat;
        detailColFact: string;
        detailColComp1: string;
        detailColDelta1: string;
        detailColComp2: string;
        detailColDelta2: string;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
        detailTopN: number;
        detailPageSize: number;
        formatDelta: (n: number) => string;
        formatComp1A: (n: number) => string;
        formatComp2A: (n: number) => string;
        formatDelta1A: (n: number) => string;
        formatDelta2A: (n: number) => string;
        formatComp1B: (n: number) => string;
        formatComp2B: (n: number) => string;
        formatDelta1B: (n: number) => string;
        formatDelta2B: (n: number) => string;
        formatValueA: (n: number) => string;
        formatValueB: (n: number) => string;
        width: number;
        height: number;
        headerText: string;
        dataState: DataState;
        modeCount: "dual";
        toggleLabelA: string;
        toggleLabelB: string;
        modeAView: KpiViewData;
        modeBView: KpiViewData;
        theme: {
            borderRadius: number;
            colors: {
                text: {
                    label: string;
                    help: string;
                };
                primary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                secondary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    dark3: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                grayscale: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                error: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                warning: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                alert: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                success: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                info: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
            };
            opacity: {
                light: string;
                mediumLight: string;
                mediumHeavy: string;
                heavy: string;
            };
            typography: {
                families: {
                    sansSerif: string;
                    serif: string;
                    monospace: string;
                };
                weights: {
                    light: number;
                    normal: number;
                    medium: number;
                    bold: number;
                };
                sizes: {
                    xxs: number;
                    xs: number;
                    s: number;
                    m: number;
                    l: number;
                    xl: number;
                    xxl: number;
                };
            };
            zIndex: {
                aboveDashboardCharts: number;
                dropdown: number;
                max: number;
            };
            transitionTiming: number;
            gridUnit: number;
            brandIconMaxWidth: number;
        };
    };
    parameters: {
        backgrounds: {
            default: string;
        };
    };
};
/** Empty state — no data returned from query */
export declare const EmptyState: {
    args: {
        dataState: DataState;
        modeAView: KpiViewData;
        modeBView: KpiViewData;
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        deltaFormat1A: import("./types").DeltaFormat;
        deltaFormat2A: import("./types").DeltaFormat;
        deltaFormat1B: import("./types").DeltaFormat;
        deltaFormat2B: import("./types").DeltaFormat;
        detailColFact: string;
        detailColComp1: string;
        detailColDelta1: string;
        detailColComp2: string;
        detailColDelta2: string;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
        detailTopN: number;
        detailPageSize: number;
        formatDelta: (n: number) => string;
        formatComp1A: (n: number) => string;
        formatComp2A: (n: number) => string;
        formatDelta1A: (n: number) => string;
        formatDelta2A: (n: number) => string;
        formatComp1B: (n: number) => string;
        formatComp2B: (n: number) => string;
        formatDelta1B: (n: number) => string;
        formatDelta2B: (n: number) => string;
        formatValueA: (n: number) => string;
        formatValueB: (n: number) => string;
        width: number;
        height: number;
        headerText: string;
        modeCount: "dual";
        toggleLabelA: string;
        toggleLabelB: string;
        isDarkMode: boolean;
        theme: {
            borderRadius: number;
            colors: {
                text: {
                    label: string;
                    help: string;
                };
                primary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                secondary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    dark3: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                grayscale: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                error: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                warning: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                alert: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                success: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                info: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
            };
            opacity: {
                light: string;
                mediumLight: string;
                mediumHeavy: string;
                heavy: string;
            };
            typography: {
                families: {
                    sansSerif: string;
                    serif: string;
                    monospace: string;
                };
                weights: {
                    light: number;
                    normal: number;
                    medium: number;
                    bold: number;
                };
                sizes: {
                    xxs: number;
                    xs: number;
                    s: number;
                    m: number;
                    l: number;
                    xl: number;
                    xxl: number;
                };
            };
            zIndex: {
                aboveDashboardCharts: number;
                dropdown: number;
                max: number;
            };
            transitionTiming: number;
            gridUnit: number;
            brandIconMaxWidth: number;
        };
    };
};
/** Empty state — dark theme */
export declare const EmptyStateDark: {
    args: {
        isDarkMode: boolean;
        dataState: DataState;
        modeAView: KpiViewData;
        modeBView: KpiViewData;
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        deltaFormat1A: import("./types").DeltaFormat;
        deltaFormat2A: import("./types").DeltaFormat;
        deltaFormat1B: import("./types").DeltaFormat;
        deltaFormat2B: import("./types").DeltaFormat;
        detailColFact: string;
        detailColComp1: string;
        detailColDelta1: string;
        detailColComp2: string;
        detailColDelta2: string;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
        detailTopN: number;
        detailPageSize: number;
        formatDelta: (n: number) => string;
        formatComp1A: (n: number) => string;
        formatComp2A: (n: number) => string;
        formatDelta1A: (n: number) => string;
        formatDelta2A: (n: number) => string;
        formatComp1B: (n: number) => string;
        formatComp2B: (n: number) => string;
        formatDelta1B: (n: number) => string;
        formatDelta2B: (n: number) => string;
        formatValueA: (n: number) => string;
        formatValueB: (n: number) => string;
        width: number;
        height: number;
        headerText: string;
        modeCount: "dual";
        toggleLabelA: string;
        toggleLabelB: string;
        theme: {
            borderRadius: number;
            colors: {
                text: {
                    label: string;
                    help: string;
                };
                primary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                secondary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    dark3: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                grayscale: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                error: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                warning: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                alert: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                success: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                info: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
            };
            opacity: {
                light: string;
                mediumLight: string;
                mediumHeavy: string;
                heavy: string;
            };
            typography: {
                families: {
                    sansSerif: string;
                    serif: string;
                    monospace: string;
                };
                weights: {
                    light: number;
                    normal: number;
                    medium: number;
                    bold: number;
                };
                sizes: {
                    xxs: number;
                    xs: number;
                    s: number;
                    m: number;
                    l: number;
                    xl: number;
                    xxl: number;
                };
            };
            zIndex: {
                aboveDashboardCharts: number;
                dropdown: number;
                max: number;
            };
            transitionTiming: number;
            gridUnit: number;
            brandIconMaxWidth: number;
        };
    };
    parameters: {
        backgrounds: {
            default: string;
        };
    };
};
/** Partial state — Mode A has data, Mode B is zero */
export declare const PartialState: {
    args: {
        dataState: DataState;
        modeBView: KpiViewData;
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        deltaFormat1A: import("./types").DeltaFormat;
        deltaFormat2A: import("./types").DeltaFormat;
        deltaFormat1B: import("./types").DeltaFormat;
        deltaFormat2B: import("./types").DeltaFormat;
        detailColFact: string;
        detailColComp1: string;
        detailColDelta1: string;
        detailColComp2: string;
        detailColDelta2: string;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
        detailTopN: number;
        detailPageSize: number;
        formatDelta: (n: number) => string;
        formatComp1A: (n: number) => string;
        formatComp2A: (n: number) => string;
        formatDelta1A: (n: number) => string;
        formatDelta2A: (n: number) => string;
        formatComp1B: (n: number) => string;
        formatComp2B: (n: number) => string;
        formatDelta1B: (n: number) => string;
        formatDelta2B: (n: number) => string;
        formatValueA: (n: number) => string;
        formatValueB: (n: number) => string;
        width: number;
        height: number;
        headerText: string;
        modeCount: "dual";
        toggleLabelA: string;
        toggleLabelB: string;
        modeAView: KpiViewData;
        isDarkMode: boolean;
        theme: {
            borderRadius: number;
            colors: {
                text: {
                    label: string;
                    help: string;
                };
                primary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                secondary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    dark3: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                grayscale: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                error: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                warning: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                alert: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                success: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                info: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
            };
            opacity: {
                light: string;
                mediumLight: string;
                mediumHeavy: string;
                heavy: string;
            };
            typography: {
                families: {
                    sansSerif: string;
                    serif: string;
                    monospace: string;
                };
                weights: {
                    light: number;
                    normal: number;
                    medium: number;
                    bold: number;
                };
                sizes: {
                    xxs: number;
                    xs: number;
                    s: number;
                    m: number;
                    l: number;
                    xl: number;
                    xxl: number;
                };
            };
            zIndex: {
                aboveDashboardCharts: number;
                dropdown: number;
                max: number;
            };
            transitionTiming: number;
            gridUnit: number;
            brandIconMaxWidth: number;
        };
    };
};
/** Negative values — expenses exceeding budget */
export declare const NegativeValues: {
    args: {
        headerText: string;
        modeAView: {
            value: string;
            subtitle: string;
            comparisons: ({
                label: string;
                value: string;
                delta: string;
                status: "dn";
                type: "comp1";
                rawDiff: number;
                rawRef: number;
            } | {
                label: string;
                value: string;
                delta: string;
                status: "dn";
                type: "comp2";
                rawDiff: number;
                rawRef: number;
            })[];
        };
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        deltaFormat1A: import("./types").DeltaFormat;
        deltaFormat2A: import("./types").DeltaFormat;
        deltaFormat1B: import("./types").DeltaFormat;
        deltaFormat2B: import("./types").DeltaFormat;
        detailColFact: string;
        detailColComp1: string;
        detailColDelta1: string;
        detailColComp2: string;
        detailColDelta2: string;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
        detailTopN: number;
        detailPageSize: number;
        formatDelta: (n: number) => string;
        formatComp1A: (n: number) => string;
        formatComp2A: (n: number) => string;
        formatDelta1A: (n: number) => string;
        formatDelta2A: (n: number) => string;
        formatComp1B: (n: number) => string;
        formatComp2B: (n: number) => string;
        formatDelta1B: (n: number) => string;
        formatDelta2B: (n: number) => string;
        formatValueA: (n: number) => string;
        formatValueB: (n: number) => string;
        width: number;
        height: number;
        dataState: DataState;
        modeCount: "dual";
        toggleLabelA: string;
        toggleLabelB: string;
        modeBView: KpiViewData;
        isDarkMode: boolean;
        theme: {
            borderRadius: number;
            colors: {
                text: {
                    label: string;
                    help: string;
                };
                primary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                secondary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    dark3: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                grayscale: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                error: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                warning: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                alert: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                success: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                info: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
            };
            opacity: {
                light: string;
                mediumLight: string;
                mediumHeavy: string;
                heavy: string;
            };
            typography: {
                families: {
                    sansSerif: string;
                    serif: string;
                    monospace: string;
                };
                weights: {
                    light: number;
                    normal: number;
                    medium: number;
                    bold: number;
                };
                sizes: {
                    xxs: number;
                    xs: number;
                    s: number;
                    m: number;
                    l: number;
                    xl: number;
                    xxl: number;
                };
            };
            zIndex: {
                aboveDashboardCharts: number;
                dropdown: number;
                max: number;
            };
            transitionTiming: number;
            gridUnit: number;
            brandIconMaxWidth: number;
        };
    };
};
/** Long header text — overflow handling */
export declare const LongTitle: {
    args: {
        headerText: string;
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        deltaFormat1A: import("./types").DeltaFormat;
        deltaFormat2A: import("./types").DeltaFormat;
        deltaFormat1B: import("./types").DeltaFormat;
        deltaFormat2B: import("./types").DeltaFormat;
        detailColFact: string;
        detailColComp1: string;
        detailColDelta1: string;
        detailColComp2: string;
        detailColDelta2: string;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
        detailTopN: number;
        detailPageSize: number;
        formatDelta: (n: number) => string;
        formatComp1A: (n: number) => string;
        formatComp2A: (n: number) => string;
        formatDelta1A: (n: number) => string;
        formatDelta2A: (n: number) => string;
        formatComp1B: (n: number) => string;
        formatComp2B: (n: number) => string;
        formatDelta1B: (n: number) => string;
        formatDelta2B: (n: number) => string;
        formatValueA: (n: number) => string;
        formatValueB: (n: number) => string;
        width: number;
        height: number;
        dataState: DataState;
        modeCount: "dual";
        toggleLabelA: string;
        toggleLabelB: string;
        modeAView: KpiViewData;
        modeBView: KpiViewData;
        isDarkMode: boolean;
        theme: {
            borderRadius: number;
            colors: {
                text: {
                    label: string;
                    help: string;
                };
                primary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                secondary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    dark3: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                grayscale: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                error: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                warning: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                alert: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                success: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                info: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
            };
            opacity: {
                light: string;
                mediumLight: string;
                mediumHeavy: string;
                heavy: string;
            };
            typography: {
                families: {
                    sansSerif: string;
                    serif: string;
                    monospace: string;
                };
                weights: {
                    light: number;
                    normal: number;
                    medium: number;
                    bold: number;
                };
                sizes: {
                    xxs: number;
                    xs: number;
                    s: number;
                    m: number;
                    l: number;
                    xl: number;
                    xxl: number;
                };
            };
            zIndex: {
                aboveDashboardCharts: number;
                dropdown: number;
                max: number;
            };
            transitionTiming: number;
            gridUnit: number;
            brandIconMaxWidth: number;
        };
    };
};
/** Single mode — toggle hidden */
export declare const SingleMode: {
    args: {
        modeCount: "single";
        colorScheme1A: ComparisonColorScheme;
        colorScheme1B: ComparisonColorScheme;
        colorScheme2A: ComparisonColorScheme;
        colorScheme2B: ComparisonColorScheme;
        deltaFormat1A: import("./types").DeltaFormat;
        deltaFormat2A: import("./types").DeltaFormat;
        deltaFormat1B: import("./types").DeltaFormat;
        deltaFormat2B: import("./types").DeltaFormat;
        detailColFact: string;
        detailColComp1: string;
        detailColDelta1: string;
        detailColComp2: string;
        detailColDelta2: string;
        enableComp1: boolean;
        enableComp2: boolean;
        comp1Label: string;
        comp2Label: string;
        showDelta1: boolean;
        showDelta2: boolean;
        hierarchyLabelPrimary: string;
        hierarchyLabelSecondary: string;
        detailTopN: number;
        detailPageSize: number;
        formatDelta: (n: number) => string;
        formatComp1A: (n: number) => string;
        formatComp2A: (n: number) => string;
        formatDelta1A: (n: number) => string;
        formatDelta2A: (n: number) => string;
        formatComp1B: (n: number) => string;
        formatComp2B: (n: number) => string;
        formatDelta1B: (n: number) => string;
        formatDelta2B: (n: number) => string;
        formatValueA: (n: number) => string;
        formatValueB: (n: number) => string;
        width: number;
        height: number;
        headerText: string;
        dataState: DataState;
        toggleLabelA: string;
        toggleLabelB: string;
        modeAView: KpiViewData;
        modeBView: KpiViewData;
        isDarkMode: boolean;
        theme: {
            borderRadius: number;
            colors: {
                text: {
                    label: string;
                    help: string;
                };
                primary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                secondary: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    dark3: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                grayscale: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                    light3: string;
                    light4: string;
                    light5: string;
                };
                error: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                warning: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                alert: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                success: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
                info: {
                    base: string;
                    dark1: string;
                    dark2: string;
                    light1: string;
                    light2: string;
                };
            };
            opacity: {
                light: string;
                mediumLight: string;
                mediumHeavy: string;
                heavy: string;
            };
            typography: {
                families: {
                    sansSerif: string;
                    serif: string;
                    monospace: string;
                };
                weights: {
                    light: number;
                    normal: number;
                    medium: number;
                    bold: number;
                };
                sizes: {
                    xxs: number;
                    xs: number;
                    s: number;
                    m: number;
                    l: number;
                    xl: number;
                    xxl: number;
                };
            };
            zIndex: {
                aboveDashboardCharts: number;
                dropdown: number;
                max: number;
            };
            transitionTiming: number;
            gridUnit: number;
            brandIconMaxWidth: number;
        };
    };
};
//# sourceMappingURL=KpiCard.stories.d.ts.map