import { StackHandler } from '@stackframe/stack';
import { stackServerApp } from '@/lib/stack';

export type StackHandlerPageProps = {
  params: Promise<{
    stack?: string[];
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StackHandlerPage(props: StackHandlerPageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  return (
    <StackHandler 
      app={stackServerApp}
      fullPage={true}
      routeProps={{ params, searchParams }} 
    />
  );
}
