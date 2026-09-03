import type { JSXElementConstructor, ReactNode } from "react";

interface CustomProviderProps {
    children: ReactNode;
}

type ProviderComponent = JSXElementConstructor<CustomProviderProps>;

interface ComposeProvidersProps {
    providers: ProviderComponent[];
    children: ReactNode;
}

const ComposeProviders = ({ providers = [], children }: ComposeProvidersProps) => {
    return providers.reduceRight((acc, NextProvider) => {
        return <NextProvider>{acc}</NextProvider>;
    }, children);
};

export default ComposeProviders;
